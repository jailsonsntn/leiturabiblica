import React, { useState, useEffect } from 'react';
import { User, UserProgress, CustomPlanConfig } from '../../types';
import { READING_PLANS } from '../../constants';
import { BIBLE_BOOKS } from '../../services/contentService'; // Need access to book list
import { 
  User as UserIcon, 
  Mail, 
  Bell, 
  LogOut, 
  Save, 
  Camera, 
  ChevronRight,
  Shield,
  Moon,
  Sun,
  Calendar,
  Book,
  Clock
} from 'lucide-react';

interface SettingsViewProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  progress: UserProgress;
  onUpdatePlanStart: (date: string) => void;
  onUpdateSelectedPlan: (planId: string) => void;
  onUpdateCustomConfig: (config: CustomPlanConfig) => Promise<void>;
  onPlanChange: (planId: string, days: number, bookName?: string) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  user, 
  onLogout, 
  onUpdateUser, 
  isDarkMode, 
  toggleTheme,
  progress,
  onUpdatePlanStart,
  onUpdateSelectedPlan,
  onUpdateCustomConfig,
  onPlanChange
}) => {
  const [name, setName] = useState(user.name);
  const [notificationTime, setNotificationTime] = useState('07:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Custom Plan States
  const [customBook, setCustomBook] = useState('Gênesis');
  const [customDays, setCustomDays] = useState(30);

  // Load settings from props on mount or when progress changes
  useEffect(() => {
    const savedTime = localStorage.getItem('leitura_anual_notif_time');
    const savedEnabled = localStorage.getItem('leitura_anual_notif_enabled') === 'true';
    
    if (savedTime) setNotificationTime(savedTime);
    
    // Sync local state with global progress
    if (progress.customPlanConfig) {
      setCustomBook(progress.customPlanConfig.bookName);
      setCustomDays(progress.customPlanConfig.days);
    } else {
      // Fallback: If no custom config exists yet, assume default days for current plan
      const currentPlan = READING_PLANS.find(p => p.id === progress.selectedPlanId);
      if (currentPlan) {
        setCustomDays(currentPlan.days || 30);
      }
    }

    if ('Notification' in window) {
      if (Notification.permission === 'granted' && savedEnabled) {
        setNotificationsEnabled(true);
      } else {
        setNotificationsEnabled(false);
      }
    }
  }, [progress.customPlanConfig, progress.selectedPlanId]); 

  const handleSaveProfile = async () => {
    // 1. Update user name
    onUpdateUser({ ...user, name });

    // 2. Save Plan Config (Apply duration override for ANY plan)
    const config: CustomPlanConfig = {
      bookName: customBook, // Used if plan is 'custom', ignored otherwise
      days: parseInt(customDays.toString(), 10) || 30
    };
    
    // Update config using the atomic handler passed from App
    await onUpdateCustomConfig(config);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setNotificationTime(newTime);
    localStorage.setItem('leitura_anual_notif_time', newTime);
  };

  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      alert("Seu navegador ou dispositivo não suporta notificações web.");
      return;
    }

    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('leitura_anual_notif_enabled', 'true');
        try {
          new Notification("Leitura Anual", {
            body: `Lembretes ativados para às ${notificationTime}.`,
            icon: '/icon.png' 
          });
        } catch (error) {}
      } else if (permission === 'denied') {
        alert("As notificações estão bloqueadas nas configurações do seu navegador/celular.");
        setNotificationsEnabled(false);
        localStorage.setItem('leitura_anual_notif_enabled', 'false');
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('leitura_anual_notif_enabled', 'false');
    }
  };

  return (
    <div className="pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      <div className="px-2">
         <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Ajustes</h2>
         <p className="text-gray-500 dark:text-slate-400 text-sm">Gerencie seu perfil e preferências</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full opacity-50 -mr-8 -mt-8 pointer-events-none" />
        
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl font-bold border-4 border-white dark:border-slate-700 shadow-lg overflow-hidden">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors">
              <Camera size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-3 font-medium uppercase tracking-wide">Membro desde 2026</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-1">Nome Completo</label>
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900 transition-all">
              <UserIcon size={18} className="text-gray-400" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-slate-200 text-sm font-medium placeholder-gray-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-1">E-mail</label>
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 opacity-70">
              <Mail size={18} className="text-gray-400" />
              <input 
                type="email" 
                value={user.email}
                disabled
                className="flex-1 bg-transparent border-none outline-none text-gray-600 dark:text-slate-400 text-sm font-medium"
              />
              <span className="text-xs bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-full">Fixo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Settings */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-700 dark:text-slate-300 px-2">Configuração do Plano</h3>
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
           
           {/* Seleção do Plano */}
           <div className="p-4 border-b border-gray-50 dark:border-slate-800">
             <div className="flex items-center gap-3 mb-3">
                 <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Book size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">Tipo de Plano</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-500">
                      Escolha qual parte da Bíblia deseja ler.
                    </p>
                 </div>
              </div>
              <select 
                value={progress.selectedPlanId || 'whole_bible'}
                onChange={(e) => {
                  const newPlanId = e.target.value;
                  const newPlan = READING_PLANS.find(p => p.id === newPlanId);
                  
                  // Use atomic handler from App.tsx
                  if (newPlan) {
                    const defaultDays = newPlan.days || 30;
                    // Force update local state immediately for visual feedback
                    setCustomDays(defaultDays); 
                    // Call atomic update
                    onPlanChange(newPlanId, defaultDays, customBook);
                  }
                }}
                className="w-full bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none"
              >
                {READING_PLANS.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.label} {plan.id !== 'custom' && `(${plan.days} dias)`}
                  </option>
                ))}
              </select>
           </div>

           {/* Seleção de Livro (Apenas para Customizado) */}
           {progress.selectedPlanId === 'custom' && (
             <div className="p-4 border-b border-gray-50 dark:border-slate-800 bg-blue-50/50 dark:bg-slate-800/50 animate-in slide-in-from-top-2">
               <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Livro</label>
               <select 
                  value={customBook}
                  onChange={(e) => setCustomBook(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
               >
                 {BIBLE_BOOKS.map(book => (
                   <option key={book.name} value={book.name}>{book.name} ({book.chapters} caps)</option>
                 ))}
               </select>
             </div>
           )}

           {/* Configuração de Duração (Para TODOS os planos) */}
           <div className="p-4 border-b border-gray-50 dark:border-slate-800 animate-in slide-in-from-top-2">
             <div className="flex items-center gap-2 mb-1">
               <Clock size={14} className="text-gray-400" />
               <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Duração (Dias)</label>
             </div>
             <input 
               type="number"
               min="1"
               max="365"
               value={customDays}
               onChange={(e) => setCustomDays(parseInt(e.target.value))}
               className="w-full bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
             />
             <p className="text-[10px] text-gray-400 mt-1">
               Você pode personalizar o tempo de leitura deste plano.
             </p>
           </div>

           {/* Data de Início */}
           <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                    <Calendar size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">Data de Início</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-500">
                      Dia 1 do plano selecionado.
                    </p>
                 </div>
              </div>
              <input 
                type="date" 
                value={progress.planStartDate}
                onChange={(e) => onUpdatePlanStart(e.target.value)}
                className="bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-green-100 outline-none"
              />
           </div>
           
           <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 flex gap-2">
             <div className="min-w-[4px] bg-yellow-400 rounded-full" />
             <p className="text-[10px] text-yellow-700 dark:text-yellow-500 leading-tight">
               Ao mudar o plano, a data de início é redefinida para hoje.
               <br/>
               <span className="font-bold">* Clique em "Salvar Perfil" para aplicar as alterações de duração.</span>
             </p>
           </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-700 dark:text-slate-300 px-2">Preferências</h3>
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
           {/* Notificações */}
           <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-slate-800">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                    <Bell size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">Lembrete Diário</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-500">
                      {notificationsEnabled ? `Ativo às ${notificationTime}` : 'Toque para ativar'}
                    </p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <input 
                   type="time" 
                   value={notificationTime}
                   onChange={handleTimeChange}
                   disabled={!notificationsEnabled}
                   className="text-sm bg-gray-50 dark:bg-slate-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-blue-300 disabled:opacity-50"
                 />
                 <button 
                   onClick={handleToggleNotifications}
                   className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'}`}
                 >
                   <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notificationsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                 </button>
              </div>
           </div>

           {/* Tema */}
           <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                    {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">Modo Escuro</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-500">{isDarkMode ? 'Ativado' : 'Desativado'}</p>
                 </div>
              </div>
               <button 
                   onClick={toggleTheme}
                   className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-purple-600' : 'bg-gray-300 dark:bg-slate-700'}`}
                 >
                   <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                 </button>
           </div>
        </div>
      </div>

      <button 
        onClick={handleSaveProfile}
        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
          isSaved 
            ? 'bg-green-500 text-white shadow-green-200 dark:shadow-none' 
            : 'bg-blue-600 text-white shadow-blue-200 dark:shadow-none hover:bg-blue-700'
        }`}
      >
        {isSaved ? <span className="flex items-center gap-1">Salvo com sucesso!</span> : <><Save size={16} /> Salvar Perfil</>}
      </button>

      {/* Account Actions */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-700 dark:text-slate-300 px-2">Conta</h3>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden divide-y divide-gray-50 dark:divide-slate-800 transition-colors">
           <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                 <Shield size={18} className="text-gray-400" />
                 <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Privacidade e Termos</span>
              </div>
              <ChevronRight size={16} className="text-gray-300 dark:text-slate-600" />
           </button>
           <button 
             onClick={onLogout}
             className="w-full p-4 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
           >
              <LogOut size={18} />
              <span className="text-sm font-bold">Sair da Conta</span>
           </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-slate-600 pt-4">
        Leitura Anual v1.6.5
      </p>

    </div>
  );
};