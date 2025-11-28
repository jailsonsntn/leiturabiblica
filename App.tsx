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

  // Auth & Data Loading
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn("Session check warning:", error.message);
        }
        
        if (mounted && session) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata.name || 'Leitor',
            photoUrl: session.user.user_metadata.avatar_url
          });
          
          try {
            const data = await loadProgress(session.user.id);
            if (mounted) setProgress(data);
          } catch (progressError) {
            console.error("Error loading progress:", progressError);
          }
        }
      } catch (err) {
        console.error("Unexpected auth initialization error:", err);
      } finally {
        if (mounted) setLoading(false);
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
        // Reload progress on auth change
        const data = await loadProgress(session.user.id);
        if (mounted) setProgress(data);
      } else {
        setUser(null);
        setProgress(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView(ViewState.HOME);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    // Update local state
    setUser(updatedUser);
    // Update Supabase
    if (user) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-gray-500 animate-pulse">Carregando sua jornada...</p>
      </div>
    );
  }

  if (!user || !progress) {
    return <LoginView onLogin={() => {}} />;
  }

  // Calculate the plan day
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
            onToggleComplete={handleToggleComplete}
            onSaveNote={handleSaveNote}
          />
        );
      case ViewState.CALENDAR:
        return <CalendarView progress={progress} totalDays={currentPlan.days} />;
      case ViewState.STATS:
        return <StatsView progress={progress} />;
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