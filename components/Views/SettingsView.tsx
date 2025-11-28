import React, { useState, useEffect } from 'react';
import { User, UserProgress } from '../../types';
import { READING_PLANS } from '../../constants';
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
  Book
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
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  user, 
  onLogout, 
  onUpdateUser, 
  isDarkMode, 
  toggleTheme,
  progress,
  onUpdatePlanStart,
  onUpdateSelectedPlan
}) => {
  const [name, setName] = useState(user.name);
  const [notificationTime, setNotificationTime] = useState('07:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load notification settings from storage on mount
  useEffect(() => {
    const savedTime = localStorage.getItem('leitura_anual_notif_time');
    const savedEnabled = localStorage.getItem('leitura_anual_notif_enabled') === 'true';
    
    if (savedTime) setNotificationTime(savedTime);
    
    // Check actual browser permission status to sync UI
    if ('Notification' in window) {
      if (Notification.permission === 'granted' && savedEnabled) {
        setNotificationsEnabled(true);
      } else {
        setNotificationsEnabled(false);
      }
    }
  }, []);

  const handleSaveProfile = () => {
    onUpdateUser({ ...user, name });
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
      // Turning ON
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('leitura_anual_notif_enabled', 'true');
        
        // Send test notification
        try {
          new Notification("Leitura Anual", {
            body: `Lembretes ativados para às ${notificationTime}.`,
            icon: '/icon.png' // Fallback icon path
          });
        } catch (error) {
          console.log("Notificação enviada (simulada)");
        }
      } else if (permission === 'denied') {
        alert("As notificações estão bloqueadas nas configurações do seu navegador/celular. Por favor, habilite manualmente para receber os lembretes.");
        setNotificationsEnabled(false);
        localStorage.setItem('leitura_anual_notif_enabled', 'false');
      }
    } else {
      // Turning OFF
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

      {/* Plan Settings - Updated */}
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
                onChange={(e) => onUpdateSelectedPlan(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none"
              >
                {READING_PLANS.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.label} ({plan.days} dias)
                  </option>
                ))}
              </select>
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
               As alterações no plano são salvas automaticamente. Seu progresso marcado (check) é mantido por número de dia (ex: Dia 1), mas o conteúdo mudará se trocar de plano.
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
        Leitura Anual v1.3.1 (Planos Bíblicos)
      </p>

    </div>
  );
};