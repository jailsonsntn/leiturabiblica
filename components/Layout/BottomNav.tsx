import React from 'react';
import { Home, Calendar, BarChart2, Settings } from 'lucide-react';
import { ViewState } from '../../types';
import { COLORS } from '../../constants';

interface BottomNavProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: ViewState.HOME, icon: Home, label: 'Hoje' },
    { id: ViewState.CALENDAR, icon: Calendar, label: 'Jornada' },
    { id: ViewState.STATS, icon: BarChart2, label: 'Progresso' },
    { id: ViewState.SETTINGS, icon: Settings, label: 'Ajustes' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe pt-2 px-6 transition-colors duration-300">
      <div className="max-w-md mx-auto flex justify-between items-center pb-4">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="flex flex-col items-center gap-1 min-w-[64px]"
            >
              <item.icon
                size={24}
                className={`transition-colors duration-300 ${isActive ? 'text-[#2C6BA6] dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span 
                className={`text-[10px] font-medium transition-all duration-300 ${
                  isActive 
                    ? 'opacity-100 text-[#2C6BA6] dark:text-blue-400' 
                    : 'opacity-60 text-slate-400 dark:text-slate-600'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};