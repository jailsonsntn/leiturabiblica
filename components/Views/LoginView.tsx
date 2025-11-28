import React, { useState } from 'react';
import { BookOpen, User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface LoginViewProps {
  onLogin: (session: any) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (authError) throw authError;

      setSuccessMsg('Conta criada! Verifique seu e-mail se necessário, ou aguarde o login.');
      
      // Auto-login handles via session listener in App.tsx generally, 
      // but signUp might sign in automatically depending on config.
      if (data.session) {
        onLogin(data.session);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.session) {
        onLogin(data.session);
      }
    } catch (err: any) {
      setError('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center px-6 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-orange-50 dark:bg-orange-900/20 rounded-full blur-3xl opacity-60" />

      {/* Main Login Card */}
      <div className="z-10 w-full max-w-sm text-center space-y-8 animate-in fade-in zoom-in duration-700">
        
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl shadow-blue-200 dark:shadow-none mb-2">
            <BookOpen size={48} color="white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Jornada da Palavra
            </h1>
            <p className="text-blue-600 dark:text-blue-400 font-bold text-xs mt-2 uppercase tracking-widest">
              Transforme sua vida em 365 dias
            </p>
            <p className="text-gray-500 dark:text-slate-400 mt-3 text-sm max-w-[280px] mx-auto leading-relaxed">
              Mergulhe na sabedoria eterna de Gênesis a Apocalipse e renove suas forças diariamente.
            </p>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-1 rounded-xl flex border border-gray-100 dark:border-slate-800">
          <button 
            onClick={() => !loading && setIsRegistering(false)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isRegistering ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
          >
            Entrar
          </button>
          <button 
            onClick={() => !loading && setIsRegistering(true)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isRegistering ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
          >
            Cadastrar
          </button>
        </div>

        <form className="space-y-4 pt-2 text-left" onSubmit={isRegistering ? handleRegister : handleLogin}>
           
           {isRegistering && (
             <div className="space-y-1 animate-in slide-in-from-left-4 fade-in duration-300">
               <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-1">Nome Completo</label>
               <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Seu nome" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-blue-200 dark:focus:border-blue-900 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all outline-none text-sm dark:text-white"
                    required={isRegistering}
                  />
               </div>
             </div>
           )}

           <div className="space-y-1">
             <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-1">E-mail</label>
             <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="email" 
                  placeholder="exemplo@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-blue-200 dark:focus:border-blue-900 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all outline-none text-sm dark:text-white"
                  required
                />
             </div>
           </div>

           <div className="space-y-1">
             <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-1">Senha</label>
             <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="********" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-blue-200 dark:focus:border-blue-900 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all outline-none text-sm dark:text-white"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
             </div>
           </div>

           {isRegistering && (
             <div className="space-y-1 animate-in slide-in-from-right-4 fade-in duration-300">
               <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-1">Confirmar Senha</label>
               <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="********" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-blue-200 dark:focus:border-blue-900 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all outline-none text-sm dark:text-white"
                    required={isRegistering}
                  />
               </div>
             </div>
           )}
           
           {error && (
             <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2 animate-in fade-in">
               <AlertTriangle size={16} />
               {error}
             </div>
           )}

           {successMsg && (
             <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-center gap-2 animate-in fade-in">
               <CheckCircle size={16} />
               {successMsg}
             </div>
           )}

           <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#2C6BA6] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-[#20558a] transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
           >
              {loading ? 'Conectando...' : (isRegistering ? 'Criar Conta e Entrar' : 'Acessar Jornada')}
              {!loading && <ArrowRight size={18} />}
           </button>
        </form>

        <p className="text-xs text-gray-400 dark:text-slate-600 mt-8 max-w-xs mx-auto leading-relaxed">
           Seus dados são salvos na nuvem de forma segura para você acessar de qualquer dispositivo.
        </p>
      </div>
    </div>
  );
};