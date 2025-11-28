import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertTriangle, ArrowLeft, WifiOff } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface LoginViewProps {
  onLogin: (session: any) => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showGuestOption, setShowGuestOption] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const withTimeout = (promise: Promise<any>, ms = 30000): Promise<any> => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), ms)
      ),
    ]);
  };

  const clearMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    clearMessages();
  };

  const handleGuestLogin = () => {
    // Check if we have a previous guest ID
    let guestId = localStorage.getItem('leitura_anual_last_guest_id');
    if (!guestId) {
        guestId = `guest_${Date.now()}`;
        localStorage.setItem('leitura_anual_last_guest_id', guestId);
    }

    const mockSession = {
        user: {
            id: guestId,
            email: 'convidado@offline',
            user_metadata: { 
                name: 'Visitante',
                avatar_url: null 
            }
        }
    };
    onLogin(mockSession);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
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

    if (!name.trim()) {
      setError('Por favor, informe seu nome.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        })
      );

      if (authError) throw authError;

      if (isMounted.current) {
        if (data.session) {
          onLogin(data.session);
        } else {
          setSuccessMsg('Conta criada com sucesso! Se necessário, verifique seu e-mail para confirmar o cadastro.');
          setTimeout(() => {
             if (isMounted.current) switchMode('login');
          }, 3000);
        }
      }
    } catch (err: any) {
      if (isMounted.current) {
        setShowGuestOption(true);
        if (err.message === 'TIMEOUT') {
           setError('O servidor está demorando para responder.');
        } else {
           setError(err.message || 'Erro ao criar conta.');
        }
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const { data, error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        })
      );

      if (authError) throw authError;

      if (isMounted.current && data.session) {
        onLogin(data.session);
      }
    } catch (err: any) {
      if (isMounted.current) {
        setShowGuestOption(true);
        if (err.message === 'TIMEOUT') {
           setError('O servidor está demorando para responder.');
        } else {
           setError('E-mail ou senha incorretos.');
        }
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const { error: resetError } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
      );

      if (resetError) throw resetError;

      if (isMounted.current) {
        setSuccessMsg('Instruções de recuperação enviadas para o seu e-mail.');
      }
    } catch (err: any) {
      if (isMounted.current) {
        if (err.message === 'TIMEOUT') {
           setError('O tempo limite foi atingido. Tente novamente.');
        } else {
           setError(err.message || 'Erro ao enviar e-mail de recuperação.');
        }
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center px-6 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-orange-50 dark:bg-orange-900/20 rounded-full blur-3xl opacity-60" />

      {/* Main Login Card */}
      <div className="z-10 w-full max-w-sm text-center space-y-6 animate-in fade-in zoom-in duration-700">
        
        <div className="flex flex-col items-center gap-4 mb-6">
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
          </div>
        </div>

        {/* Auth Tabs */}
        {mode !== 'forgot_password' && (
          <div className="bg-gray-100 dark:bg-slate-900 p-1 rounded-xl flex">
            <button 
              onClick={() => !loading && switchMode('login')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => !loading && switchMode('register')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
            >
              Criar Conta
            </button>
          </div>
        )}

        <form className="space-y-4 pt-2 text-left" onSubmit={
          mode === 'login' ? handleLogin : 
          mode === 'register' ? handleRegister : 
          handleForgotPassword
        }>
           
           {/* Header for Forgot Password Mode */}
           {mode === 'forgot_password' && (
             <div className="flex items-center gap-2 mb-4">
               <button 
                type="button" 
                onClick={() => switchMode('login')}
                className="p-2 -ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
               >
                 <ArrowLeft size={20} />
               </button>
               <h3 className="font-bold text-gray-800 dark:text-white">Recuperar Senha</h3>
             </div>
           )}

           {mode === 'register' && (
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
                    required={mode === 'register'}
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

           {mode !== 'forgot_password' && (
             <div className="space-y-1">
               <div className="flex justify-between items-center ml-1">
                 <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Senha</label>
                 {mode === 'login' && (
                   <button 
                    type="button" 
                    onClick={() => switchMode('forgot_password')}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                   >
                     Esqueci a senha
                   </button>
                 )}
               </div>
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
           )}

           {mode === 'register' && (
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
                    required={mode === 'register'}
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
              className="w-full bg-[#2C6BA6] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-[#20558a] transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
           >
              {loading ? 'Processando...' : (
                mode === 'login' ? 'Acessar Jornada' : 
                mode === 'register' ? 'Criar Conta e Entrar' : 'Enviar E-mail'
              )}
              {!loading && mode !== 'forgot_password' && <ArrowRight size={18} />}
           </button>
        </form>

        {(showGuestOption || error) && (
          <button 
            onClick={handleGuestLogin}
            className="w-full py-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2"
          >
            <WifiOff size={16} />
            Continuar como Convidado (Offline)
          </button>
        )}

        <p className="text-xs text-gray-400 dark:text-slate-600 mt-8 max-w-xs mx-auto leading-relaxed">
           Seus dados são salvos na nuvem de forma segura.
        </p>
      </div>
    </div>
  );
};