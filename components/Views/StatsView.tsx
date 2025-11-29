import React from 'react';
import { UserProgress } from '../../types';
import { ACHIEVEMENT_BADGES } from '../../constants';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { Star, Flame, Award, Crown, Lock } from 'lucide-react';

interface StatsViewProps {
  progress: UserProgress;
  totalDays: number;
}

export const StatsView: React.FC<StatsViewProps> = ({ progress, totalDays }) => {
  const data = [
    { name: 'Seg', lidos: 1 },
    { name: 'Ter', lidos: 1 },
    { name: 'Qua', lidos: 0 },
    { name: 'Qui', lidos: 1 },
    { name: 'Sex', lidos: 1 },
    { name: 'Sab', lidos: 0 },
    { name: 'Dom', lidos: 0 },
  ];

  const getIcon = (iconName: string, size: number, color: string) => {
    switch (iconName) {
      case 'star': return <Star size={size} color={color} fill={color} />;
      case 'flame': return <Flame size={size} color={color} fill={color} />;
      case 'crown': return <Crown size={size} color={color} fill={color} />;
      case 'award': return <Award size={size} color={color} fill={color} />;
      default: return <Star size={size} color={color} />;
    }
  };

  // Calculate percentage based on active plan total days
  const validCompletedCount = progress.completedIds.filter(id => id <= totalDays).length;
  const percentage = Math.round((validCompletedCount / totalDays) * 100);
  const displayPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="pb-32 space-y-6 animate-in fade-in duration-500">
       <div className="px-2">
         <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Estatísticas</h2>
         <p className="text-gray-500 dark:text-slate-400 text-sm">Acompanhe seu crescimento</p>
       </div>

       {/* Progresso do Plano Geral */}
       <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-6 shadow-lg shadow-blue-900/10 text-white relative overflow-hidden">
          <div className="relative z-10">
             <div className="flex justify-between items-end mb-2">
               <h3 className="font-bold text-blue-100 text-sm uppercase tracking-wide">Progresso do Plano</h3>
               <span className="font-bold text-3xl">{displayPercentage}%</span>
             </div>
             <div className="w-full h-2 bg-blue-900/30 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-white/90 rounded-full transition-all duration-1000 ease-out"
                 style={{ width: `${displayPercentage}%` }}
               />
             </div>
             <p className="text-xs text-blue-200 mt-2 text-right">
               {validCompletedCount} de {totalDays} dias concluídos
             </p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
       </div>
       
       {/* Cards de Resumo */}
       <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
             <p className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase mb-1">Total Lido</p>
             <div className="flex items-baseline gap-1">
               <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{validCompletedCount}</p>
               <span className="text-xs text-blue-400 font-medium">capítulos</span>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
             <p className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase mb-1">Sequência</p>
             <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-orange-500 dark:text-orange-400">{progress.streak}</p>
                <span className="text-xs text-orange-400 font-medium">dias</span>
             </div>
          </div>
       </div>

       {/* Seção de Conquistas (Badges) */}
       <div className="space-y-3">
         <h3 className="font-bold text-gray-700 dark:text-slate-300 px-2">Conquistas</h3>
         <div className="grid grid-cols-2 gap-3">
            {ACHIEVEMENT_BADGES.map((badge) => {
              const isUnlocked = progress.unlockedBadges.includes(badge.id);
              
              return (
                <div 
                  key={badge.id}
                  className={`
                    relative p-4 rounded-2xl border transition-all duration-300
                    ${isUnlocked 
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-orange-100 dark:border-orange-900/30 shadow-sm' 
                      : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 opacity-70 grayscale'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-full ${isUnlocked ? 'bg-white dark:bg-slate-900 shadow-sm' : 'bg-gray-200 dark:bg-slate-700'}`}>
                      {getIcon(badge.iconName, 20, isUnlocked ? '#f59e0b' : '#9ca3af')}
                    </div>
                    {isUnlocked ? (
                      <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                        Conquistado
                      </span>
                    ) : (
                      <Lock size={14} className="text-gray-400 dark:text-slate-500" />
                    )}
                  </div>
                  
                  <h4 className={`font-bold text-sm ${isUnlocked ? 'text-gray-800 dark:text-slate-200' : 'text-gray-500 dark:text-slate-500'}`}>
                    {badge.label}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-500 mt-1 leading-tight">
                    {badge.description}
                  </p>

                  {/* Progress Bar for Locked Items */}
                  {!isUnlocked && (
                    <div className="mt-3 h-1.5 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (progress.streak / badge.daysRequired) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
         </div>
       </div>

       {/* Gráfico */}
       <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
          <h3 className="font-bold text-gray-700 dark:text-slate-300 mb-6">Atividade Semanal</h3>
          
          {/* Wrapper explícito para garantir dimensões corretas para o Recharts */}
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  dy={10}
                />
                <Tooltip 
                  cursor={{fill: 'var(--tw-prose-invert-bg)', radius: 8}}
                  contentStyle={{
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#1e293b'
                  }}
                />
                <Bar 
                  dataKey="lidos" 
                  fill="#2C6BA6" 
                  radius={[6, 6, 6, 6]} 
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
       </div>
    </div>
  );
};