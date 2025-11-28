import React, { useState, useEffect } from 'react';
import { UserProgress } from '../../types';
import { Check, Calendar as CalendarIcon, BookOpen, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { getEntryForDay, getPlanDayFromDate } from '../../services/contentService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDayOfYear, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarViewProps {
  progress: UserProgress;
  totalDays: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ progress, totalDays }) => {
  // Initialize viewDate to current real-world date
  const [viewDate, setViewDate] = useState(new Date());

  const handlePrevMonth = () => setViewDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setViewDate(prev => addMonths(prev, 1));

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Capitalize first letter of month
  const monthNameRaw = format(viewDate, 'MMMM yyyy', { locale: ptBR });
  const currentMonthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1);

  // Calculate percentage based on current Plan's Total Days (not fixed 365)
  // Filter completed IDs that are within the current plan's range
  const validCompletedIds = progress.completedIds.filter(id => id <= totalDays);
  const completedCount = validCompletedIds.length;
  const percentage = Math.round((completedCount / totalDays) * 100);
  const displayPercentage = Math.min(100, Math.max(0, percentage)); // Clamp

  // Scroll to current day on mount if it's in the view
  useEffect(() => {
    const today = new Date();
    // Only scroll if we are looking at the current month
    if (today.getMonth() === viewDate.getMonth() && today.getFullYear() === viewDate.getFullYear()) {
       const todayId = `calendar-day-${today.getDate()}`;
       const el = document.getElementById(todayId);
       if (el) {
         el.scrollIntoView({ behavior: 'smooth', block: 'center' });
       }
    }
  }, [viewDate]);

  return (
    <div className="pb-32 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header da Jornada */}
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Sua Jornada</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Plano: Início {format(new Date(progress.planStartDate), 'dd/MM/yyyy')}</p>
        </div>
        <div className="text-right">
           <div className="flex items-baseline justify-end gap-1">
             <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{displayPercentage}%</span>
             <span className="text-xs text-gray-400 dark:text-slate-500 font-medium uppercase">Concluído</span>
           </div>
           <div className="w-24 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden ml-auto">
              <div 
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-1000" 
                style={{ width: `${displayPercentage}%` }}
              />
           </div>
        </div>
      </div>

      {/* Seção Mês Atual */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
        
        {/* Navigation Header */}
        <div className="p-4 border-b border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-slate-400">
             <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-gray-800 dark:text-white text-lg capitalize">{currentMonthName}</h3>
          </div>

          <button onClick={handleNextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-slate-400">
             <ChevronRight size={20} />
          </button>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto">
          {daysInMonth.map((dateObj) => {
            // Determine Plan Day based on Plan Start Date
            const planDay = getPlanDayFromDate(dateObj, progress.planStartDate);
            
            // Validate if day is within CURRENT plan range (e.g., 1-90 for Gospels)
            const isPlanActive = planDay >= 1 && planDay <= totalDays;
            
            // Only fetch entry if active to save resources/logic
            // We pass the selected plan ID indirectly because getEntryForDay handles it, 
            // but here we are iterating dates. 
            // NOTE: To display correct content, we need to pass the planId. 
            // However, getEntryForDay is imported directly. We need to pass the planId 
            // from props or state. CalendarView needs to know the planId.
            // Correction: getEntryForDay expects planId. We must use progress.selectedPlanId
            const entry = isPlanActive ? getEntryForDay(planDay, undefined, progress.selectedPlanId) : null;
            
            const isCompleted = isPlanActive && progress.completedIds.includes(planDay);
            const hasNote = isPlanActive && !!progress.notes[planDay];

            return (
              <div 
                key={dateObj.toISOString()} 
                id={`calendar-day-${dateObj.getDate()}`}
                className={`
                  flex items-center gap-4 p-4 transition-colors
                  ${isCompleted ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}
                  ${!isPlanActive ? 'opacity-50 grayscale' : ''}
                `}
              >
                {/* Data do Calendário */}
                <div className="flex flex-col items-center min-w-[3rem]">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">{format(dateObj, 'EEE', { locale: ptBR }).replace('.', '')}</span>
                  <span className={`text-xl font-bold ${isCompleted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-slate-300'}`}>
                    {format(dateObj, 'dd')}
                  </span>
                </div>

                {/* Conteúdo de Leitura */}
                <div className="flex-1">
                  {isPlanActive && entry ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen size={14} className={isCompleted ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'} />
                        <span className={`font-semibold text-sm ${isCompleted ? 'text-gray-800 dark:text-slate-200' : 'text-gray-600 dark:text-slate-400'}`}>
                          {entry.readingPlanRange}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 truncate max-w-[180px]">
                        {entry.bookName} • Dia {planDay}
                      </p>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 dark:text-slate-600 italic">
                         {planDay < 1 ? "Aguardando início do plano" : "Plano Concluído!"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status */}
                {isPlanActive && (
                  <div className="flex flex-col items-end gap-1">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                      ${isCompleted 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                        : 'border-gray-200 dark:border-slate-700 text-transparent'
                      }
                    `}>
                      <Check size={16} strokeWidth={3} />
                    </div>
                    {hasNote && (
                      <span className="text-[10px] text-orange-500 dark:text-orange-400 font-medium px-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-full">
                        Nota
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
};