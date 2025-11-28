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

const getGuestKey = (userId: string) => `leitura_anual_guest_${userId}`;

// Helper for fire-and-forget background synchronization
// This ensures the UI doesn't wait for the network
const runBackgroundSync = (syncFn: () => Promise<void>) => {
  syncFn().catch(err => console.error("Background sync error:", err));
};

// Robustness helper: Ensure profile exists before adding entries
// This handles cases where the signup trigger might have failed or lagged
const ensureProfileExists = async (userId: string) => {
  const { data } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (!data) {
     // Create a skeleton profile if missing
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

  // 2. SERVER MODE (SUPABASE)
  try {
    // Parallel loading for speed
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

  } catch (e) {
    console.error("Failed to load progress from Supabase", e);
    // Fallback to default if load fails, preventing crash
    return DEFAULT_PROGRESS;
  }
};

export const updatePlanStartDate = async (currentProgress: UserProgress, newDate: string, userId: string): Promise<UserProgress> => {
  // Optimistic update
  const newProgress = { ...currentProgress, planStartDate: newDate };
  
  if (userId.startsWith('guest_')) {
    localStorage.setItem(getGuestKey(userId), JSON.stringify(newProgress));
    return newProgress;
  }

  // Background Sync
  runBackgroundSync(async () => {
    await ensureProfileExists(userId);
    await supabase.from('profiles').upsert({ id: userId, plan_start_date: newDate }, { onConflict: 'id' });
  });

  return newProgress;
};

export const updateSelectedPlan = async (currentProgress: UserProgress, planId: string, userId: string): Promise<UserProgress> => {
  // Optimistic update
  const newProgress = { ...currentProgress, selectedPlanId: planId };
  
  if (userId.startsWith('guest_')) {
    localStorage.setItem(getGuestKey(userId), JSON.stringify(newProgress));
    return newProgress;
  }

  // Background Sync
  runBackgroundSync(async () => {
    await ensureProfileExists(userId);
    await supabase.from('profiles').upsert({ id: userId, selected_plan_id: planId }, { onConflict: 'id' });
  });

  return newProgress;
};

export const toggleDayCompletion = async (currentProgress: UserProgress, dayId: number, userId: string): Promise<UserProgress> => {
  // 1. Calculate new state locally
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

  // 2. Persist Guest Mode
  if (userId.startsWith('guest_')) {
    localStorage.setItem(getGuestKey(userId), JSON.stringify(updatedProgress));
    return updatedProgress;
  }

  // 3. Background Sync (Server Mode)
  runBackgroundSync(async () => {
    await ensureProfileExists(userId);

    if (isCompleted) {
      // Unmarking: use update to set null
      await supabase.from('user_daily_entries')
        .update({ completed_at: null })
        .eq('user_id', userId)
        .eq('day_id', dayId);
    } else {
      // Marking: use upsert
      await supabase.from('user_daily_entries').upsert({
        user_id: userId,
        day_id: dayId,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id, day_id' });
    }

    // Update profile stats
    await supabase.from('profiles').upsert({ id: userId, streak: newStreak }, { onConflict: 'id' });

    // Insert new badges
    if (badgesToInsert.length > 0) {
      await supabase.from('user_badges').upsert(
        badgesToInsert.map(bid => ({ user_id: userId, badge_id: bid })),
        { onConflict: 'user_id, badge_id' }
      );
    }
  });

  // Return immediately for instant UI update
  return updatedProgress;
};

export const saveDayNote = async (currentProgress: UserProgress, dayId: number, note: string, userId: string): Promise<UserProgress> => {
  // Optimistic update
  const newProgress = {
    ...currentProgress,
    notes: {
      ...currentProgress.notes,
      [dayId]: note
    }
  };

  if (userId.startsWith('guest_')) {
    localStorage.setItem(getGuestKey(userId), JSON.stringify(newProgress));
    return newProgress;
  }

  // Background Sync
  runBackgroundSync(async () => {
    await ensureProfileExists(userId);
    
    const { data: existing } = await supabase
      .from('user_daily_entries')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('day_id', dayId)
      .maybeSingle();

    await supabase.from('user_daily_entries').upsert({
      user_id: userId,
      day_id: dayId,
      note: note,
      completed_at: existing?.completed_at || null 
    }, { onConflict: 'user_id, day_id' });
  });

  return newProgress;
};

export const deleteDayNote = async (currentProgress: UserProgress, dayId: number, userId: string): Promise<UserProgress> => {
  // Optimistic update
  const newNotes = { ...currentProgress.notes };
  delete newNotes[dayId];

  const newProgress = { ...currentProgress, notes: newNotes };

  if (userId.startsWith('guest_')) {
    localStorage.setItem(getGuestKey(userId), JSON.stringify(newProgress));
    return newProgress;
  }

  // Background Sync
  runBackgroundSync(async () => {
    await ensureProfileExists(userId);

    const { data: existing } = await supabase
      .from('user_daily_entries')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('day_id', dayId)
      .maybeSingle();

    await supabase.from('user_daily_entries').upsert({
      user_id: userId,
      day_id: dayId,
      note: null,
      completed_at: existing?.completed_at || null
    }, { onConflict: 'user_id, day_id' });
  });

  return newProgress;
};