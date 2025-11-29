import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, Circle, Share2, 
  Edit3, Save, BookOpen, Check, Trophy, 
  Trash2, X, Bold, Italic, List, Clock, Calendar,
  ExternalLink, Youtube, Play
} from 'lucide-react';
import { DailyEntry, UserProgress } from '../../types';
import { PastoralChat } from '../Shared/PastoralChat';

interface TodayViewProps {
  entry: DailyEntry;
  progress: UserProgress;
  userName: string;
  currentPlanDayRaw: number; // Raw calculation of plan day (can be negative)
  totalPlanDays: number; // Total days in current plan
  onToggleComplete: (id: number) => void;
  onSaveNote: (id: number, note: string) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({ 
  entry, 
  progress,
  userName, 
  currentPlanDayRaw,
  totalPlanDays,
  onToggleComplete, 
  onSaveNote 
}) => {
  const isDayCompleted = progress.completedIds.includes(entry.id);
  const existingNote = progress.notes[entry.id] || '';
  
  // Note State
  const [note, setNote] = useState(existingNote);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [checkedChapters, setCheckedChapters] = useState<number[]>([]);

  // Pre-start or Post-end check
  const isPreStart = currentPlanDayRaw < 1;
  const isPostEnd = currentPlanDayRaw > totalPlanDays;

  // Sync state when entry changes
  useEffect(() => {
    if (isDayCompleted) {
      setCheckedChapters(entry.chaptersToRead);
    } else {
      const currentChecksAreValid = checkedChapters.every(c => entry.chaptersToRead.includes(c));
      
      if (!currentChecksAreValid || checkedChapters.length === entry.chaptersToRead.length) {
         setCheckedChapters([]);
      }
    }
    setNote(progress.notes[entry.id] || '');
    setIsEditingNote(false);
    setShowDeleteConfirm(false);
    setShareFeedback(false);
  }, [entry.id, isDayCompleted, progress.notes, entry.readingPlanRange, entry.chaptersToRead.length]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (isEditingNote && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [note, isEditingNote]);

  const handleNoteSave = () => {
    onSaveNote(entry.id, note);
    setIsEditingNote(false);
  };

  const handleNoteDelete = () => {
    setNote('');
    onSaveNote(entry.id, '');
    setIsEditingNote(false);
    setShowDeleteConfirm(false);
  };

  const handleShare = async () => {
    const shareText = `Estou lendo ${entry.bookName} no dia ${entry.id} da minha jornada bíblica! 📖✨`;
    const shareData = {
      title: 'Leitura Anual',
      text: shareText,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 3000);
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  const insertFormatting = (type: 'bold' | 'italic' | 'list' | 'time') => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = note;
    let newText = '';
    let newCursorPos = end;

    switch (type) {
      case 'bold':
        newText = text.substring(0, start) + `**${text.substring(start, end)}**` + text.substring(end);
        newCursorPos = end + 2; 
        break;
      case 'italic':
        newText = text.substring(0, start) + `_${text.substring(start, end)}_` + text.substring(end);
        newCursorPos = end + 1;
        break;
      case 'list':
        const isStartOfLine = start === 0 || text[start - 1] === '\n';
        const prefix = isStartOfLine ? '• ' : '\n• ';
        newText = text.substring(0, start) + prefix + text.substring(end);
        newCursorPos = start + prefix.length;
        break;
      case 'time':
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ';
        newText = text.substring(0, start) + `[${timeStr}] ` + text.substring(end);
        newCursorPos = start + timeStr.length + 3;
        break;
    }

    setNote(newText);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const toggleChapter = (chapter: number) => {
    if (isDayCompleted) return;

    let newChecked;
    if (checkedChapters.includes(chapter)) {
      newChecked = checkedChapters.filter(c => c !== chapter);
    } else {
      newChecked = [...checkedChapters, chapter];
    }
    setCheckedChapters(newChecked);
  };

  const validCompletedCount = progress.completedIds.filter(id => id <= totalPlanDays).length;
  const planProgress = Math.min(100, Math.max(0, Math.round((validCompletedCount / totalPlanDays) * 100)));
  const firstName = userName.split(' ')[0];

  // UI for Pre-Start
  if (isPreStart) {
    const daysToStart = Math.abs(currentPlanDayRaw) + 1;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in zoom-in duration-500">
         <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-500">
           <Calendar size={64} strokeWidth={1.5} />
         </div>
         <div>
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Preparado?</h2>
           <p className="text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
             Seu plano de leitura está configurado para iniciar em <strong className="text-blue-600 dark:text-blue-400">{daysToStart} dia{daysToStart > 1 ? 's' : ''}</strong>.
           </p>
         </div>
         <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm w-full max-w-xs">
           <p className="text-xs text-gray-400 uppercase font-bold mb-2">Primeira Leitura</p>
           <h3 className="font-bold text-lg text-gray-800 dark:text-slate-200">Dia 1</h3>
         </div>
      </div>
    );
  }

  // UI for Post-End (Plan Completed)
  if (isPostEnd) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in zoom-in duration-500">
         <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-full text-green-500">
           <Trophy size={64} strokeWidth={1.5} />
         </div>
         <div>
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Parabéns!</h2>
           <p className="text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
             Você concluiu o período do seu plano de leitura atual.
           </p>
         </div>
         <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm w-full max-w-xs">
           <p className="text-xs text-gray-400 uppercase font-bold mb-2">Progresso Final</p>
           <h3 className="font-bold text-lg text-gray-800 dark:text-slate-200">{planProgress}% Concluído</h3>
         </div>
      </div>
    );
  }

  // Normal Flow
  return (
    <div className="pb-40 animate-in fade-in duration-500 space-y-6">
      
      {/* 1. Header Personalizado */}
      <div className="flex items-center justify-between px-1 pt-2">
        <div>
           <h2 className="text-xl font-bold text-gray-800 dark:text-white">
             Olá, {firstName}
           </h2>
           <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
             Hoje é o dia <span className="font-bold text-blue-600 dark:text-blue-400">{entry.id}</span>. Vamos continuar?
           </p>
        </div>
        <div className="text-right">
           <div className="w-12 h-12 rounded-full border-4 border-gray-100 dark:border-slate-800 flex items-center justify-center relative">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{planProgress}%</span>
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  className="stroke-[#2C6BA6] dark:stroke-blue-500 opacity-20"
                  strokeWidth="3"
                  strokeDasharray={`${planProgress}, 100`}
                />
                 <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  className="stroke-[#2C6BA6] dark:stroke-blue-500"
                  strokeWidth="3"
                  strokeDasharray={`${planProgress}, 100`}
                  strokeLinecap="round"
                />
              </svg>
           </div>
        </div>
      </div>

      {/* 2. CARD PRINCIPAL DE LEITURA */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-blue-900/5 dark:shadow-none border border-blue-50 dark:border-slate-800 relative overflow-hidden transition-colors">
         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full opacity-50 -mr-8 -mt-8" />
         
         <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="bg-blue-600 dark:bg-blue-700 text-white p-3 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide mb-0.5">Leitura de Hoje</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                      {entry.bookName}
                    </h3>
                  </div>
               </div>
               {isDayCompleted && (
                 <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-in zoom-in">
                   <Trophy size={12} /> Completo
                 </div>
               )}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium ml-1">
                Capítulos para ler:
              </p>
              
              {/* Scrollable container to prevent overlap on large chapter counts */}
              <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex flex-wrap gap-3">
                  {entry.chaptersToRead.map((chapter) => {
                    const isChecked = checkedChapters.includes(chapter);
                    return (
                      <button
                        key={chapter}
                        onClick={() => toggleChapter(chapter)}
                        className={`
                          group relative flex items-center gap-3 pl-4 pr-5 py-3 rounded-xl border-2 transition-all duration-300
                          ${isChecked 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none' 
                            : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-slate-700'
                          }
                        `}
                      >
                        <div className={`
                          w-6 h-6 rounded-full border flex items-center justify-center transition-colors
                          ${isChecked ? 'bg-white border-white' : 'border-gray-300 dark:border-slate-500 group-hover:border-blue-300'}
                        `}>
                          {isChecked && <Check size={14} className="text-blue-600" strokeWidth={3} />}
                        </div>
                        <span className="text-lg font-bold">
                          {chapter}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => onToggleComplete(entry.id)}
                className={`
                  w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-base transition-all transform active:scale-95 shadow-lg
                  ${isDayCompleted 
                    ? 'bg-emerald-500 text-white shadow-emerald-200 dark:shadow-none' 
                    : checkedChapters.length === entry.chaptersToRead.length
                      ? 'bg-[#2C6BA6] text-white shadow-blue-200 dark:shadow-none animate-pulse' 
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }
                `}
              >
                {isDayCompleted ? (
                  <>
                    <CheckCircle size={24} />
                    <span>Dia Concluído!</span>
                  </>
                ) : (
                  <>
                    <Circle size={24} />
                    <span>{checkedChapters.length === entry.chaptersToRead.length ? 'Finalizar Dia' : 'Marcar Dia como Lido'}</span>
                  </>
                )}
              </button>
            </div>
         </div>
      </div>

      {/* 3. CARD DE INSPIRAÇÃO E NOTAS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
        
        <div className="relative h-40 w-full">
            <img 
              src={entry.imageUrl} 
              alt="Imagem do versículo" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white max-w-[80%]">
                <p className="text-xs font-bold text-orange-400 uppercase mb-1">Versículo Chave</p>
                <p className="text-sm font-serif italic leading-relaxed text-gray-100">
                  "{entry.verseText}"
                </p>
                <p className="text-xs font-bold mt-2 text-white">— {entry.verseReference}</p>
            </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
             <h4 className="text-sm font-bold text-gray-900 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
               Reflexão do Dia
             </h4>
             <p className="text-gray-600 dark:text-slate-400 leading-relaxed text-sm">
               {entry.devotional}
             </p>
          </div>

          <PastoralChat verseText={entry.verseText} verseReference={entry.verseReference} />

          <hr className="border-gray-100 dark:border-slate-800" />

          {/* LINK PARA MÚSICA (SEM PLAYER) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-800 dark:text-white">
               <Youtube size={16} className="text-red-600" />
               <h4 className="text-sm font-bold uppercase tracking-wide">Trilha Sonora</h4>
            </div>
            
            <a 
              href={entry.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-100 dark:hover:border-red-900/30 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-500 group-hover:scale-110 transition-transform">
                    <Play size={20} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {entry.playlistTitle}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Ouvir no YouTube
                    </p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-gray-400 group-hover:text-red-500 transition-colors" />
              </div>
            </a>
          </div>

          <hr className="border-gray-100 dark:border-slate-800" />

          {/* EDITOR DE NOTAS */}
          <div className="bg-yellow-50/50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/20 overflow-hidden transition-all duration-300">
            {isEditingNote ? (
              <div className="flex flex-col">
                {/* Toolbar */}
                <div className="flex items-center justify-between p-2 border-b border-yellow-100 dark:border-yellow-900/20 bg-yellow-50 dark:bg-yellow-900/20">
                   <div className="flex gap-1">
                      <button onClick={() => insertFormatting('bold')} className="p-2 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-800/30 rounded" title="Negrito">
                        <Bold size={16} />
                      </button>
                      <button onClick={() => insertFormatting('italic')} className="p-2 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-800/30 rounded" title="Itálico">
                        <Italic size={16} />
                      </button>
                      <button onClick={() => insertFormatting('list')} className="p-2 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-800/30 rounded" title="Lista">
                        <List size={16} />
                      </button>
                      <div className="w-px h-6 bg-yellow-200 dark:bg-yellow-800 mx-1 self-center" />
                      <button onClick={() => insertFormatting('time')} className="p-2 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-800/30 rounded" title="Hora atual">
                        <Clock size={16} />
                      </button>
                   </div>
                   
                   {showDeleteConfirm ? (
                     <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                       <span className="text-xs text-red-600 dark:text-red-400 font-bold">Apagar?</span>
                       <button onClick={handleNoteDelete} className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md hover:bg-red-200"><Check size={14} /></button>
                       <button onClick={() => setShowDeleteConfirm(false)} className="p-1.5 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-md hover:bg-gray-300"><X size={14} /></button>
                       <button onClick={() => setShowDeleteConfirm(false)} className="p-1.5 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-md hover:bg-gray-300"><X size={14} /></button>
                     </div>
                   ) : (
                     <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                        <Trash2 size={16} />
                     </button>
                   )}
                </div>

                <textarea
                  ref={textareaRef}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-transparent border-none p-4 text-sm text-gray-800 dark:text-slate-200 focus:ring-0 resize-none min-h-[120px] leading-relaxed"
                  placeholder="O que Deus falou ao seu coração hoje?"
                  autoFocus
                />
                
                <div className="flex justify-end gap-2 p-3 bg-white/50 dark:bg-slate-900/20">
                   <button 
                     onClick={() => {
                       setNote(existingNote); // Revert
                       setIsEditingNote(false);
                       setShowDeleteConfirm(false);
                     }}
                     className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                   >
                     Cancelar
                   </button>
                   <button 
                     onClick={handleNoteSave}
                     className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                   >
                     <Save size={14} />
                     Salvar Nota
                   </button>
                </div>
              </div>
            ) : (
              // Modo de Visualização
              <div 
                className="p-4 cursor-pointer group hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                onClick={() => setIsEditingNote(true)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase flex items-center gap-1">
                    <Edit3 size={12} /> Diário Espiritual
                  </span>
                  <span className="text-[10px] text-yellow-600/60 dark:text-yellow-500/50 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    Toque para editar
                  </span>
                </div>
                
                {note ? (
                  <div className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {note}
                  </div>
                ) : (
                  <p className="text-sm text-yellow-700/40 dark:text-yellow-500/40 italic">
                    Toque aqui para anotar suas orações, aprendizados ou gratidão do dia...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 text-center pb-4">
        <button 
          onClick={handleShare}
          className={`
            text-xs font-medium flex items-center justify-center gap-2 mx-auto transition-all py-2 px-4 rounded-full 
            ${shareFeedback 
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
              : 'text-blue-600/60 dark:text-blue-400/60 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
            }
          `}
        >
          {shareFeedback ? <Check size={14} /> : <Share2 size={14} />}
          {shareFeedback ? 'Copiado!' : 'Compartilhar Progresso'}
        </button>
      </div>
    </div>
  );
};