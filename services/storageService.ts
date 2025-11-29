
import { UserProgress, CustomPlanConfig } from '../types';
import { ACHIEVEMENT_BADGES } from '../constants';
import { supabase } from './supabaseClient';

const DEFAULT_PROGRESS: UserProgress = {
  completedIds: [],
  allProgress: {},
  notes: {},
  lastAccessDate: null,
  streak: 0,
  unlockedBadges: [],
  planStartDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
  selectedPlanId: 'whole_bible',
  // customPlanConfig defaults to undefined
};

// --- Helper Functions ---

const calculateStreak = (completedIds: number[]): number => {
  if (completedIds.length === 0) return 0;
  const sortedIds = [...completedIds].sort((a, b) => a - b);
  let currentStreak = 1;
  for (let i = sortedIds.length - 1; i > 0; i--) {
    if (sortedIds[i] === sortedIds[i-1] + 1) {
      currentStreak++;
    } else {
      break; 
    }
  }
  return currentStreak;
};

// Generates a unique key for the current plan context
// e.g. "whole_bible", "custom_Gênesis", "custom_Ester"
export const getContextKey = (planId: string, customConfig?: CustomPlanConfig): string => {
  if (planId === 'custom' && customConfig) {
    return `custom_${customConfig.bookName}`;
  }
  return planId;
};

// Keys for LocalStorage
const getGuestKey = (userId: string) => `leitura_anual_guest_${userId}`;
const getAuthCacheKey = (userId: string) => `leitura_anual_auth_cache_${userId}`;

// Helper for fire-and-forget background synchronization
const runBackgroundSync = (syncFn: () => Promise<void>) => {
  syncFn().catch(err => console.error("Background sync error:", err));
};

// Helper: Timeout promise
const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms));

// Robustness helper: Ensure profile exists before adding entries
const ensureProfileExists = async (userId: string) => {
  const { data } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (!data) {
     await supabase.from('profiles').upsert({ 
       id: userId, 
       updated_at: new Date().toISOString()
     }, { onConflict: 'id' });
  }
};

// --- Sync Functions ---

export const loadProgress = async (userId: string): Promise<UserProgress> => {
  // 1. GUEST MODE (OFFLINE)
  if (userId.startsWith('guest_')) {
    try {
      const stored = localStorage.getItem(getGuestKey(userId));
      if (stored) {
        return { ...DEFAULT_PROGRESS, ...JSON.parse(stored) };
      }
      return DEFAULT_PROGRESS;
    } catch (e) {
      console.error("Error loading guest data", e);
      return DEFAULT_PROGRESS;
    }
  }

  // 2. AUTHENTICATED USER (LOCAL-FIRST HYBRID)
  const cacheKey = getAuthCacheKey(userId);
  let localData: UserProgress | null = null;
  
  // Try load from local cache first
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      localData = JSON.parse(cached);
    }
  } catch (e) {
    console.warn("Error reading local auth cache", e);
  }

  // Function to fetch from Supabase
  const fetchFromSupabase = async (): Promise<UserProgress> => {
    const [profileResult, entriesResult, badgesResult] = await Promise.all([
      // Added custom_plan_config to selection
      supabase.from('profiles').select('plan_start_date, selected_plan_id, streak, custom_plan_config').eq('id', userId).maybeSingle(),
      // Fetch context_key to separate progress
      supabase.from('user_daily_entries').select('day_id, completed_at, note, context_key').eq('user_id', userId),
      supabase.from('user_badges').select('badge_id').eq('user_id', userId)
    ]);

    const { data: profile } = profileResult;
    const { data: entries } = entriesResult;
    const { data: badges } = badgesResult;

    // Process entries into separate contexts
    const allProgress: Record<string, number[]> = {};
    const notes: Record<number, string> = {};

    entries?.forEach(e => {
      // Handle Notes
      if (e.note) notes[e.day_id] = e.note;

      // Handle Progress Context
      // If context_key is missing (legacy data), assume 'whole_bible' or current plan
      const ctx = e.context_key || 'whole_bible';
      
      if (e.completed_at) {
        if (!allProgress[ctx]) allProgress[ctx] = [];
        allProgress[ctx].push(e.day_id);
      }
    });

    const unlockedBadges = badges?.map(b => b.badge_id) || [];

    // Prioritize SQL data for custom plan, fallback to local cache or local storage backup
    let customPlanConfig = profile?.custom_plan_config;
    
    if (!customPlanConfig && localData?.customPlanConfig) {
        customPlanConfig = localData.customPlanConfig;
    }
    
    if (!customPlanConfig && localStorage.getItem(`custom_plan_${userId}`)) {
       try {
         customPlanConfig = JSON.parse(localStorage.getItem(`custom_plan_${userId}`) || '{}');
       } catch (e) {}
    }

    // Determine current active context
    const selectedPlanId = profile?.selected_plan_id || DEFAULT_PROGRESS.selectedPlanId;
    const currentContextKey = getContextKey(selectedPlanId, customPlanConfig);
    const completedIds = allProgress[currentContextKey] || [];

    return {
      completedIds,
      allProgress,
      notes,
      lastAccessDate: new Date().toISOString(),
      streak: profile?.streak || calculateStreak(completedIds),
      unlockedBadges,
      planStartDate: profile?.plan_start_date || DEFAULT_PROGRESS.planStartDate,
      selectedPlanId,
      customPlanConfig
    };
  };

  try {
    if (localData) {
      try {
        const serverData = await Promise.race([
          fetchFromSupabase(),
          timeoutPromise(3000) // 3s timeout
        ]) as UserProgress;
        
        localStorage.setItem(cacheKey, JSON.stringify(serverData));
        return serverData;
      } catch (err) {
        console.log("Server slow/offline. Using local cache.");
        runBackgroundSync(async () => {
           try {
             const fresh = await fetchFromSupabase();
             localStorage.setItem(cacheKey, JSON.stringify(fresh));
           } catch(e) { console.error("Background refresh failed", e); }
        });
        return localData;
      }
    } else {
      const serverData = await fetchFromSupabase();
      localStorage.setItem(cacheKey, JSON.stringify(serverData));
      return serverData;
    }
  } catch (e) {
    console.error("Failed to load progress from Supabase", e);
    return localData || DEFAULT_PROGRESS;
  }
};

const persistDual = (userId: string, data: UserProgress) => {
  if (userId.startsWith('guest_')) {
    localStorage.setItem(getGuestKey(userId), JSON.stringify(data));
  } else {
    localStorage.setItem(getAuthCacheKey(userId), JSON.stringify(data));
  }
};

export const updatePlanStartDate = async (currentProgress: UserProgress, newDate: string, userId: string): Promise<UserProgress> => {
  const newProgress = { ...currentProgress, planStartDate: newDate };
  persistDual(userId, newProgress);

  if (!userId.startsWith('guest_')) {
    runBackgroundSync(async () => {
      await ensureProfileExists(userId);
      await supabase.from('profiles').upsert({ id: userId, plan_start_date: newDate }, { onConflict: 'id' });
    });
  }

  return newProgress;
};

export const updateSelectedPlan = async (currentProgress: UserProgress, planId: string, userId: string): Promise<UserProgress> => {
  const newProgress = { ...currentProgress, selectedPlanId: planId };
  
  // Switch visual progress to new plan context
  const newContextKey = getContextKey(planId, currentProgress.customPlanConfig);
  newProgress.completedIds = currentProgress.allProgress[newContextKey] || [];

  persistDual(userId, newProgress);

  if (!userId.startsWith('guest_')) {
    runBackgroundSync(async () => {
      await ensureProfileExists(userId);
      await supabase.from('profiles').upsert({ id: userId, selected_plan_id: planId }, { onConflict: 'id' });
    });
  }

  return newProgress;
};

export const updateCustomPlanConfig = async (currentProgress: UserProgress, config: CustomPlanConfig, userId: string): Promise<UserProgress> => {
  const newProgress = { ...currentProgress, customPlanConfig: config };
  
  // IMPORTANT: Switch visual progress to new BOOK context
  // e.g. switching from custom_Gênesis to custom_Ester
  const newContextKey = getContextKey('custom', config);
  newProgress.completedIds = currentProgress.allProgress[newContextKey] || [];

  persistDual(userId, newProgress);
  
  localStorage.setItem(`custom_plan_${userId}`, JSON.stringify(config));

  if (!userId.startsWith('guest_')) {
    runBackgroundSync(async () => {
      await ensureProfileExists(userId);
      await supabase.from('profiles').update({ custom_plan_config: config }).eq('id', userId);
    });
  }
  
  return newProgress;
};

export const toggleDayCompletion = async (currentProgress: UserProgress, dayId: number, userId: string): Promise<UserProgress> => {
  const currentContextKey = getContextKey(currentProgress.selectedPlanId, currentProgress.customPlanConfig);
  
  const isCompleted = currentProgress.completedIds.includes(dayId);
  let newCompletedIds: number[];
  
  if (isCompleted) {
    newCompletedIds = currentProgress.completedIds.filter(id => id !== dayId);
  } else {
    newCompletedIds = [...currentProgress.completedIds, dayId];
  }

  // Update All Progress Map
  const newAllProgress = { ...currentProgress.allProgress };
  newAllProgress[currentContextKey] = newCompletedIds;

  const newStreak = calculateStreak(newCompletedIds);
  const newUnlockedBadges = [...currentProgress.unlockedBadges];
  const badgesToInsert: string[] = [];

  ACHIEVEMENT_BADGES.forEach(badge => {
    if (newStreak >= badge.daysRequired && !newUnlockedBadges.includes(badge.id)) {
      newUnlockedBadges.push(badge.id);
      badgesToInsert.push(badge.id);
    }
  });

  const updatedProgress = {
    ...currentProgress,
    completedIds: newCompletedIds,
    allProgress: newAllProgress,
    streak: newStreak,
    unlockedBadges: newUnlockedBadges
  };

  persistDual(userId, updatedProgress);

  if (!userId.startsWith('guest_')) {
    runBackgroundSync(async () => {
      await ensureProfileExists(userId);

      if (isCompleted) {
        await supabase.from('user_daily_entries')
          .update({ completed_at: null })
          .eq('user_id', userId)
          .eq('day_id', dayId)
          .eq('context_key', currentContextKey); // Specific context delete
      } else {
        await supabase.from('user_daily_entries').upsert({
          user_id: userId,
          day_id: dayId,
          context_key: currentContextKey, // Save with context
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id, day_id, context_key' }); // Ensure unique index exists in DB
      }

      await supabase.from('profiles').upsert({ id: userId, streak: newStreak }, { onConflict: 'id' });

      if (badgesToInsert.length > 0) {
        await supabase.from('user_badges').upsert(
          badgesToInsert.map(bid => ({ user_id: userId, badge_id: bid })),
          { onConflict: 'user_id, badge_id' }
        );
      }
    });
  }

  return updatedProgress;
};

export const saveDayNote = async (currentProgress: UserProgress, dayId: number, note: string, userId: string): Promise<UserProgress> => {
  const currentContextKey = getContextKey(currentProgress.selectedPlanId, currentProgress.customPlanConfig);
  
  const newProgress = {
    ...currentProgress,
    notes: {
      ...currentProgress.notes,
      [dayId]: note
    }
  };

  persistDual(userId, newProgress);

  if (!userId.startsWith('guest_')) {
    runBackgroundSync(async () => {
      await ensureProfileExists(userId);
      // Notes are loosely coupled to context for now, but we save context_key just in case
      const { data: existing } = await supabase.from('user_daily_entries')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('day_id', dayId)
        .eq('context_key', currentContextKey)
        .maybeSingle();
        
      await supabase.from('user_daily_entries').upsert({
        user_id: userId,
        day_id: dayId,
        context_key: currentContextKey,
        note: note,
        completed_at: existing?.completed_at || null 
      }, { onConflict: 'user_id, day_id, context_key' });
    });
  }

  return newProgress;
};

export const deleteDayNote = async (currentProgress: UserProgress, dayId: number, userId: string): Promise<UserProgress> => {
  const currentContextKey = getContextKey(currentProgress.selectedPlanId, currentProgress.customPlanConfig);
  
  const newNotes = { ...currentProgress.notes };
  delete newNotes[dayId];
  const newProgress = { ...currentProgress, notes: newNotes };

  persistDual(userId, newProgress);

  if (!userId.startsWith('guest_')) {
    runBackgroundSync(async () => {
      await ensureProfileExists(userId);
      const { data: existing } = await supabase.from('user_daily_entries')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('day_id', dayId)
        .eq('context_key', currentContextKey)
        .maybeSingle();
        
      await supabase.from('user_daily_entries').upsert({
        user_id: userId,
        day_id: dayId,
        context_key: currentContextKey,
        note: null,
        completed_at: existing?.completed_at || null
      }, { onConflict: 'user_id, day_id, context_key' });
    });
  }

  return newProgress;
};
