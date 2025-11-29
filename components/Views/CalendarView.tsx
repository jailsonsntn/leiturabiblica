import React, { useState, useEffect } from 'react';
import { UserProgress } from '../../types';
import { Check, Calendar as CalendarIcon, BookOpen, ChevronLeft, ChevronRight, Library, ArrowRight } from 'lucide-react';
import { getEntryForDay, getPlanDayFromDate, BIBLE_BOOKS, getEntryForDay as getEntryContent } from '../../services/contentService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { READING_PLANS } from '../../constants';

interface CalendarViewProps {
  progress: UserProgress;
  totalDays: number;
  onSelectBook: (bookName: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ progress, totalDays, onSelectBook }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'books'>('calendar');

  const handlePrevMonth = () => setViewDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setViewDate(prev => addMonths(prev, 1));

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const monthNameRaw = format(viewDate, 'MMMM yyyy', { locale: ptBR });
  const currentMonthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1);

  // Calcula % geral do plano atual
  const validCompletedIds = progress.completedIds.filter(id => id <= totalDays);
  const percentage = Math.round((validCompletedIds.length / totalDays) * 100);
  const displayPercentage = Math.min(100, Math.max(0, percentage));

  useEffect(() => {
    if (viewMode === 'calendar') {
        const today = new Date();
        if (today.getMonth() === viewDate.getMonth() && today.getFullYear() === viewDate.getFullYear()) {
           const todayId = `calendar-day-${today.getDate()}`;
           const el = document.getElementById(todayId);
           if (el) {
             el.scrollIntoView({ behavior: 'smooth', block: 'center' });
           }
        }
    }
  }, [viewDate, viewMode]);

  // Lógica corrigida para "Meus Livros"
  const getActiveBooks = () => {
    const bookSet = new Set<string>();

    // 1. Adicionar livros do plano ATUAL
    const activePlanId = progress.selectedPlanId;
    
    if (activePlanId === 'custom' && progress.customPlanConfig) {
        bookSet.add(progress.customPlanConfig.bookName);
    } else {
        const fixedPlan = READING_PLANS.find(p => p.id === activePlanId);
        if (fixedPlan) {
            const books = fixedPlan.books.length > 0 ? fixedPlan.books : BIBLE_BOOKS.map(b => b.name);
            books.forEach(b => bookSet.add(b));
        }
    }

    // 2. Adicionar livros do HISTÓRICO (allProgress)
    // Isso garante que livros de planos antigos apareçam na lista
    if (progress.allProgress) {
        Object.keys(progress.allProgress).forEach(key => {
            // Verifica chaves de planos customizados ex: "custom_Gênesis"
            if (key.startsWith('custom_')) {
                const bookName = key.replace('custom_', '');
                // Valida se o nome é um livro real da Bíblia
                if (BIBLE_BOOKS.some(b => b.name === bookName)) {
                    bookSet.add(bookName);
                }
            }
        });
    }

    // Retorna objetos dos livros filtrados
    return BIBLE_BOOKS.filter(b => bookSet.has(b.name));
  };

  const getBookProgress = (bookName: string) => {
    const bookData = BIBLE_BOOKS.find(b => b.name === bookName);
    if (!bookData) return 0;

    // Cenário 1: O livro faz parte do plano ATUAL e ATIVO
    const isCurrentCustom = progress.selectedPlanId === 'custom' && progress.customPlanConfig?.bookName === bookName;
    
    if (isCurrentCustom) {
        const totalDuration = progress.customPlanConfig?.days || 30;
        const readCount = progress.completedIds.length;
        return Math.min(100, Math.round((readCount / totalDuration) * 100));
    }

    // Cenário 2: O livro está no histórico (Plano Customizado Antigo)
    const historyKey = `custom_${bookName}`;
    const historyIds = progress.allProgress?.[historyKey];

    if (historyIds && historyIds.length > 0) {
        return Math.min(100, Math.round((historyIds.length / bookData.chapters) * 100));
    }

    // Cenário 3: Livro parte de um plano fixo atual
    if (!isCurrentCustom && progress.selectedPlanId !== 'custom') {
        const activePlan = READING_PLANS.find(p => p.id === progress.selectedPlanId);
        if (activePlan && (activePlan.books.length === 0 || activePlan.books.includes(bookName))) {
             let chaptersRead = 0;
             const relevantIds = progress.completedIds.filter(id => id <= activePlan.days);
             relevantIds.forEach(dayId => {
                 const entry = getEntryContent(dayId, undefined, progress.selectedPlanId);
                 if (entry.bookName === bookName) {
                     chaptersRead += entry.chaptersToRead.length;
                 }
             });
             return Math.min(100, Math.round((chaptersRead / bookData.chapters) * 100));
        }
    }

    return 0;
  };

  const activeBooks = getActiveBooks();

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

      {/* Tabs */}
      <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-xl flex mx-2">
        <button 
          onClick={() => setViewMode('calendar')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
        >
          <CalendarIcon size={16} /> Visão Mensal
        </button>
        <button 
          onClick={() => setViewMode('books')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${viewMode === 'books' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
        >
          <Library size={16} /> Meus Livros
        </button>
      </div>

      {viewMode === 'calendar' ? (
        /* Seção Mês Atual */
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

            <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {daysInMonth.map((dateObj) => {
                const planDay = getPlanDayFromDate(dateObj, progress.planStartDate);
                const isPlanActive = planDay >= 1 && planDay <= totalDays;
                
                const entry = isPlanActive ? getEntryForDay(planDay, undefined, progress.selectedPlanId, progress.customPlanConfig) : null;
                
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
                    <div className="flex flex-col items-center min-w-[3rem]">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">{format(dateObj, 'EEE', { locale: ptBR }).replace('.', '')}</span>
                    <span className={`text-xl font-bold ${isCompleted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-slate-300'}`}>
                        {format(dateObj, 'dd')}
                    </span>
                    </div>

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
      ) : (
        /* Seção Meus Livros */
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors animate-in fade-in">
            <div className="p-4 border-b border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">Meus Livros</h3>
                </div>
            </div>
            
            {activeBooks.length === 0 ? (
                <div className="p-8 text-center text-gray-400 dark:text-slate-500">
                    <p>Nenhum progresso registrado ainda.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {activeBooks.map(book => {
                        const bookProgress = getBookProgress(book.name);
                        const isBookCompleted = bookProgress >= 100;

                        return (
                            <button 
                                key={book.name} 
                                onClick={() => onSelectBook(book.name)}
                                className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group flex items-center justify-between"
                            >
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`font-bold ${isBookCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-slate-200'}`}>
                                            {book.name}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isBookCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                                            {bookProgress}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${isBookCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                            style={{ width: `${bookProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{book.chapters} capítulos</p>
                                </div>
                                <div className="pl-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                                    <ArrowRight size={18} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
      )}
      
    </div>
  );
};