import { UserProgress } from '../types';
import { ACHIEVEMENT_BADGES } from '../constants';
import { supabase } from './supabaseClient';

const DEFAULT_PROGRESS: UserProgress = {
  completedIds: [],
  notes: {},
  lastAccessDate: null,
  streak: 0,
  unlockedBadges: [],
  planStartDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
  selectedPlanId: 'whole_bible'
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
      supabase.from('profiles').select('plan_start_date, selected_plan_id, streak').eq('id', userId).maybeSingle(),
      supabase.from('user_daily_entries').select('day_id, completed_at, note').eq('user_id', userId),
      supabase.from('user_badges').select('badge_id').eq('user_id', userId)
    ]);

    const { data: profile } = profileResult;
    const { data: entries } = entriesResult;
    const { data: badges } = badgesResult;

    const completedIds = entries?.filter(e => e.completed_at).map(e => e.day_id) || [];
    const notes: Record<number, string> = {};
    entries?.forEach(e => {
      if (e.note) notes[e.day_id] = e.note;
    });
    const unlockedBadges = badges?.map(b => b.badge_id) || [];

    return {
      completedIds,
      notes,
      lastAccessDate: new Date().toISOString(),
      streak: profile?.streak || calculateStreak(completedIds),
      unlockedBadges,
      planStartDate: profile?.plan_start_date || DEFAULT_PROGRESS.planStartDate,
      selectedPlanId: profile?.selected_plan_id || DEFAULT_PROGRESS.selectedPlanId
    };
  };

  try {
    // RACE: Try to get data from server within 2 seconds. 
    // If it's slow (Cold Start), fall back to local data immediately to prevent blocking UI.
    // If no local data exists, we MUST wait for server (or return default).
    
    if (localData) {
      // We have local data. Race server vs timeout.
      try {
        const serverData = await Promise.race([
          fetchFromSupabase(),
          timeoutPromise(2000) // 2s timeout for "Instant" feel
        ]) as UserProgress;
        
        // Server won and was fast. Update cache and return.
        localStorage.setItem(cacheKey, JSON.stringify(serverData));
        return serverData;
      } catch (err) {
        // Timeout or Error. Return local data immediately.
        // But kick off a background sync to update cache later? 
        // For simplicity in this architecture, we just return local data now.
        // The next action user takes will trigger a sync.
        console.log("Server slow/offline. Using local cache.");
        
        // Optionally trigger background refresh
        runBackgroundSync(async () => {
           try {
             const fresh = await fetchFromSupabase();
             localStorage.setItem(cacheKey, JSON.stringify(fresh));
           } catch(e) { console.error("Background refresh failed", e); }
        });

        return localData;
      }
    } else {
      // No local data (First login on this device). Must wait for server.
      const serverData = await fetchFromSupabase();
      localStorage.setItem(cacheKey, JSON.stringify(serverData));
      return serverData;
    }

  } catch (e) {
    console.error("Failed to load progress from Supabase", e);
    // Ultimate fallback
    return localData || DEFAULT_PROGRESS;
  }
};

// --- Update Functions (Dual Write: Local + Background Remote) ---

const persistDual = (userId: string, data: UserProgress) => {
  // 1. Local Write
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
  persistDual(userId, newProgress);

  if (!userId.startsWith('guest_')) {
    runBackgroundSync(async () => {
      await ensureProfileExists(userId);
      await supabase.from('profiles').upsert({ id: userId, selected_plan_id: planId }, { onConflict: 'id' });
    });
  }

  return newProgress;
};

export const toggleDayCompletion = async (currentProgress: UserProgress, dayId: number, userId: string): Promise<UserProgress> => {
  const isCompleted = currentProgress.completedIds.includes(dayId);
  let newCompletedIds: number[];
  
  if (isCompleted) {
    newCompletedIds = currentProgress.completedIds.filter(id => id !== dayId);
  } else {
    newCompletedIds = [...currentProgress.completedIds, dayId];
  }

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
          .eq('day_id', dayId);
      } else {
        await supabase.from('user_daily_entries').upsert({
          user_id: userId,
          day_id: dayId,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id, day_id' });
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
      const { data: existing } = await supabase.from('user_daily_entries').select('completed_at').eq('user_id', userId).eq('day_id', dayId).maybeSingle();
      await supabase.from('user_daily_entries').upsert({
        user_id: userId,
        day_id: dayId,
        note: note,
        completed_at: existing?.completed_at || null 
      }, { onConflict: 'user_id, day_id' });
    });
  }

  return newProgress;
};

export const deleteDayNote = async (currentProgress: UserProgress, dayId: number, userId: string): Promise<UserProgress> => {
  const newNotes = { ...currentProgress.notes };
  delete newNotes[dayId];
  const newProgress = { ...currentProgress, notes: newNotes };

  persistDual(userId, newProgress);

  if (!userId.startsWith('guest_')) {
    runBackgroundSync(async () => {
      await ensureProfileExists(userId);
      const { data: existing } = await supabase.from('user_daily_entries').select('completed_at').eq('user_id', userId).eq('day_id', dayId).maybeSingle();
      await supabase.from('user_daily_entries').upsert({
        user_id: userId,
        day_id: dayId,
        note: null,
        completed_at: existing?.completed_at || null
      }, { onConflict: 'user_id, day_id' });
    });
  }

  return newProgress;
};