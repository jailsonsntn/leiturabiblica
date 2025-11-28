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

// --- Sync Functions ---

export const loadProgress = async (userId: string): Promise<UserProgress> => {
  try {
    // Execute all requests in parallel to avoid waterfalls and reduce loading time
    const [profileResult, entriesResult, badgesResult] = await Promise.all([
      // 1. Fetch Profile Settings
      supabase
        .from('profiles')
        .select('plan_start_date, selected_plan_id, streak')
        .eq('id', userId)
        .maybeSingle(),

      // 2. Fetch Entries (Completed Days & Notes)
      supabase
        .from('user_daily_entries')
        .select('day_id, completed_at, note')
        .eq('user_id', userId),

      // 3. Fetch Badges
      supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId)
    ]);

    const { data: profile, error: profileError } = profileResult;
    const { data: entries, error: entriesError } = entriesResult;
    const { data: badges, error: badgesError } = badgesResult;

    if (profileError) console.warn("Error fetching profile:", profileError.message);
    if (entriesError) console.warn("Error fetching entries:", entriesError.message);
    if (badgesError) console.warn("Error fetching badges:", badgesError.message);

    // transform to local shape
    const completedIds = entries?.filter(e => e.completed_at).map(e => e.day_id) || [];
    const notes: Record<number, string> = {};
    entries?.forEach(e => {
      if (e.note) notes[e.day_id] = e.note;
    });
    const unlockedBadges = badges?.map(b => b.badge_id) || [];

    return {
      completedIds,
      notes,
      lastAccessDate: new Date().toISOString(), // Just for session tracking
      streak: profile?.streak || calculateStreak(completedIds),
      unlockedBadges,
      planStartDate: profile?.plan_start_date || DEFAULT_PROGRESS.planStartDate,
      selectedPlanId: profile?.selected_plan_id || DEFAULT_PROGRESS.selectedPlanId
    };

  } catch (e) {
    console.error("Failed to load progress from Supabase", e);
    // Return default to prevent app crash, allowing retry or partial functionality
    return DEFAULT_PROGRESS;
  }
};

export const updatePlanStartDate = async (currentProgress: UserProgress, newDate: string, userId: string): Promise<UserProgress> => {
  const newProgress = { ...currentProgress, planStartDate: newDate };
  
  // Upsert to handle case where profile row might be missing
  await supabase
    .from('profiles')
    .upsert({ id: userId, plan_start_date: newDate }, { onConflict: 'id' });

  return newProgress;
};

export const updateSelectedPlan = async (currentProgress: UserProgress, planId: string, userId: string): Promise<UserProgress> => {
  const newProgress = { ...currentProgress, selectedPlanId: planId };
  
  await supabase
    .from('profiles')
    .upsert({ id: userId, selected_plan_id: planId }, { onConflict: 'id' });

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

  try {
    // 1. Update Entry
    if (isCompleted) {
      // Use UPDATE to set null, because row MUST exist to be completed
      await supabase.from('user_daily_entries')
        .update({ completed_at: null })
        .eq('user_id', userId)
        .eq('day_id', dayId);
    } else {
      // Use UPSERT for new completion
      await supabase.from('user_daily_entries').upsert({
        user_id: userId,
        day_id: dayId,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id, day_id' });
    }

    // 2. Update Profile Streak (Safe upsert)
    await supabase.from('profiles').upsert({ id: userId, streak: newStreak }, { onConflict: 'id' });

    // 3. Insert Badges
    if (badgesToInsert.length > 0) {
      await supabase.from('user_badges').upsert(
        badgesToInsert.map(bid => ({ user_id: userId, badge_id: bid })),
        { onConflict: 'user_id, badge_id' }
      );
    }
  } catch (err) {
      console.error("Error syncing completion:", err);
  }

  return {
    ...currentProgress,
    completedIds: newCompletedIds,
    streak: newStreak,
    unlockedBadges: newUnlockedBadges
  };
};

export const saveDayNote = async (currentProgress: UserProgress, dayId: number, note: string, userId: string): Promise<UserProgress> => {
  const newProgress = {
    ...currentProgress,
    notes: {
      ...currentProgress.notes,
      [dayId]: note
    }
  };

  const { data: existing } = await supabase
    .from('user_daily_entries')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('day_id', dayId)
    .single();

  await supabase.from('user_daily_entries').upsert({
    user_id: userId,
    day_id: dayId,
    note: note,
    completed_at: existing?.completed_at || null 
  }, { onConflict: 'user_id, day_id' });

  return newProgress;
};

export const deleteDayNote = async (currentProgress: UserProgress, dayId: number, userId: string): Promise<UserProgress> => {
  const newNotes = { ...currentProgress.notes };
  delete newNotes[dayId];

  // We set note to null in DB
  const { data: existing } = await supabase
    .from('user_daily_entries')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('day_id', dayId)
    .single();

  // If no entry exists, nothing to delete, but safe to upsert null note
  await supabase.from('user_daily_entries').upsert({
    user_id: userId,
    day_id: dayId,
    note: null,
    completed_at: existing?.completed_at || null
  }, { onConflict: 'user_id, day_id' });

  return {
    ...currentProgress,
    notes: newNotes
  };
};