import React, { useState, useEffect } from 'react';
import { Header } from './components/Layout/Header';
import { BottomNav } from './components/Layout/BottomNav';
import { TodayView } from './components/Views/TodayView';
import { CalendarView } from './components/Views/CalendarView';
import { StatsView } from './components/Views/StatsView';
import { LoginView } from './components/Views/LoginView';
import { SettingsView } from './components/Views/SettingsView';
import { ViewState, UserProgress, User } from './types';
import { READING_PLANS } from './constants';
import { getEntryForDay, getPlanDayFromDate } from './services/contentService';
import { loadProgress, toggleDayCompletion, saveDayNote, deleteDayNote, updatePlanStartDate, updateSelectedPlan } from './services/storageService';
import { supabase } from './services/supabaseClient';
import { Loader2 } from 'lucide-react';

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutos

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('leitura_anual_theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('leitura_anual_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('leitura_anual_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Monitor de Atividade para Timeout de 30min
  useEffect(() => {
    const updateActivityTimestamp = () => {
      if (user) {
        localStorage.setItem('leitura_anual_last_active', Date.now().toString());
      }
    };

    window.addEventListener('mousemove', updateActivityTimestamp);
    window.addEventListener('keydown', updateActivityTimestamp);
    window.addEventListener('click', updateActivityTimestamp);
    window.addEventListener('touchstart', updateActivityTimestamp);
    window.addEventListener('scroll', updateActivityTimestamp);

    return () => {
      window.removeEventListener('mousemove', updateActivityTimestamp);
      window.removeEventListener('keydown', updateActivityTimestamp);
      window.removeEventListener('click', updateActivityTimestamp);
      window.removeEventListener('touchstart', updateActivityTimestamp);
      window.removeEventListener('scroll', updateActivityTimestamp);
    };
  }, [user]);

  // Helper to clear corrupted auth data specifically
  const clearAuthCache = () => {
    console.warn("Performing selective cache cleanup...");
    // Only remove supabase tokens that might be bloated
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase.auth.token')) {
        localStorage.removeItem(key);
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView(ViewState.HOME);
    localStorage.removeItem('leitura_anual_last_guest_id'); 
    localStorage.removeItem('leitura_anual_last_active');
  };

  // Auth & Data Loading
  useEffect(() => {
    let mounted = true;

    // Safety timeout - Self-healing if things get stuck
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Initial load timeout (20s). Checking state...");
        
        // If we have a user but loading is stuck, just release the UI
        if (user) {
          setLoading(false);
        } else {
          // If no user and stuck, maybe cache is corrupt. Try to clear and reset.
          // clearAuthCache(); // Don't aggressive clear, just stop loading
          setLoading(false); 
        }
      }
    }, 20000); 

    const initSession = async () => {
      const lastActiveStr = localStorage.getItem('leitura_anual_last_active');
      if (lastActiveStr) {
        const lastActiveTime = parseInt(lastActiveStr, 10);
        const now = Date.now();
        if (now - lastActiveTime > INACTIVITY_LIMIT_MS) {
          console.log("Session expired due to inactivity.");
          await handleLogout();
          if (mounted) setLoading(false);
          return;
        }
      }
      localStorage.setItem('leitura_anual_last_active', Date.now().toString());

      try {
        // 1. Supabase Session Check
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted && session) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata.name || 'Leitor',
            photoUrl: session.user.user_metadata.avatar_url
          });
          
          // Now using the optimized local-first loadProgress
          try {
            const data = await loadProgress(session.user.id);
            if (mounted) setProgress(data);
          } catch (progressError) {
            console.error("Error loading progress:", progressError);
          }
          if (mounted) setLoading(false);
          return; 
        }

        // 2. Guest Session Check
        const guestId = localStorage.getItem('leitura_anual_last_guest_id');
        if (mounted && guestId) {
          setUser({
            id: guestId,
            email: 'convidado@offline',
            name: 'Visitante',
            photoUrl: undefined
          });
          const data = await loadProgress(guestId);
          if (mounted) setProgress(data);
          if (mounted) setLoading(false);
          return;
        }

      } catch (err) {
        console.error("Auth init error:", err);
        // If there is a critical JSON error in localstorage (the 2KB issue), clear it
        if (err instanceof Error && err.name === 'SyntaxError') {
          clearAuthCache();
        }
      } finally {
        if (mounted) setLoading(false);
        clearTimeout(safetyTimer);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      if (session) {
         setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.name || 'Leitor',
          photoUrl: session.user.user_metadata.avatar_url
        });
        localStorage.setItem('leitura_anual_last_active', Date.now().toString());
        
        const data = await loadProgress(session.user.id);
        if (mounted) setProgress(data);
      } 
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    if (user && !user.id.startsWith('guest_')) {
      await supabase.from('profiles').update({ name: updatedUser.name }).eq('id', user.id);
    }
  };

  const handleUpdatePlanStart = async (newDate: string) => {
    if (!progress || !user) return;
    const newProgress = await updatePlanStartDate(progress, newDate, user.id);
    setProgress(newProgress);
  };

  const handleUpdateSelectedPlan = async (planId: string) => {
    if (!progress || !user) return;
    const newProgress = await updateSelectedPlan(progress, planId, user.id);
    setProgress(newProgress);
  };

  const handleToggleComplete = async (id: number) => {
    if (!progress || !user) return;
    const newProgress = await toggleDayCompletion(progress, id, user.id);
    setProgress(newProgress);
  };

  const handleSaveNote = async (id: number, note: string) => {
    if (!progress || !user) return;
    let newProgress;
    if (!note) {
      newProgress = await deleteDayNote(progress, id, user.id);
    } else {
      newProgress = await saveDayNote(progress, id, note, user.id);
    }
    setProgress(newProgress);
  };

  const handleLogin = async (session: any) => {
    setLoading(true);
    const currentUser = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata.name || 'Leitor',
        photoUrl: session.user.user_metadata.avatar_url
    };
    setUser(currentUser);
    localStorage.setItem('leitura_anual_last_active', Date.now().toString());
    
    try {
        const data = await loadProgress(session.user.id);
        setProgress(data);
    } catch (error) {
        console.error("Manual login progress load failed", error);
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-gray-500 animate-pulse">Carregando sua jornada...</p>
      </div>
    );
  }

  if (!user || !progress) {
    return <LoginView onLogin={handleLogin} />;
  }

  const today = new Date();
  const currentPlanDay = getPlanDayFromDate(today, progress.planStartDate);
  const activePlanId = progress.selectedPlanId || 'whole_bible';
  const todayEntry = getEntryForDay(currentPlanDay, progress.planStartDate, activePlanId);
  const currentPlan = READING_PLANS.find(p => p.id === activePlanId) || READING_PLANS[0];

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return (
          <TodayView 
            entry={todayEntry} 
            progress={progress}
            userName={user.name}
            currentPlanDayRaw={currentPlanDay}
            totalPlanDays={currentPlan.days}
            onToggleComplete={handleToggleComplete}
            onSaveNote={handleSaveNote}
          />
        );
      case ViewState.CALENDAR:
        return <CalendarView progress={progress} totalDays={currentPlan.days} />;
      case ViewState.STATS:
        return <StatsView progress={progress} totalDays={currentPlan.days} />;
      case ViewState.SETTINGS:
        return (
          <SettingsView 
            user={user} 
            onLogout={handleLogout} 
            onUpdateUser={handleUpdateUser}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            progress={progress}
            onUpdatePlanStart={handleUpdatePlanStart}
            onUpdateSelectedPlan={handleUpdateSelectedPlan}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFB] text-slate-800 dark:bg-slate-950 dark:text-slate-200 font-sans selection:bg-blue-100 dark:selection:bg-blue-900 transition-colors duration-300">
      <Header />
      <main className="max-w-md mx-auto px-6 pt-6">
        {renderView()}
      </main>
      <BottomNav currentView={currentView} setView={setCurrentView} />
    </div>
  );
};

export default App;