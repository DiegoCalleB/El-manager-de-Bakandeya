import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, Mail, Music, Check, ArrowRight, Zap, Star, Shield, Chrome, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginModalProps {
  onLoginSuccess: (user: UserType, token: string, bandsList?: any[]) => void;
  isStitchLight?: boolean;
}

type ViewState = 'login' | 'register' | 'plans' | 'activate' | 'reset-password';

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<ViewState>('login');

  // --- Login State ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Remember Me State ---
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('bakandeya_remember_me') !== 'false';
  });

  // On mount, prefill username if stored
  useEffect(() => {
    const savedUser = localStorage.getItem('bakandeya_remembered_username');
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  // --- Reset Password State ---
  const [resetEmailOrUsername, setResetEmailOrUsername] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [resetMaskedEmail, setResetMaskedEmail] = useState<string | null>(null);

  // --- Register State ---
  const [regLeaderName, setRegLeaderName] = useState('');
  const [regBandName, setRegBandName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // --- Activate Account State ---
  const [activateEmail, setActivateEmail] = useState('');
  const [activateName, setActivateName] = useState('');
  const [activateUsername, setActivateUsername] = useState('');
  const [activatePassword, setActivatePassword] = useState('');
  const [showActivatePassword, setShowActivatePassword] = useState(false);
  const [activateStep, setActivateStep] = useState<1 | 2>(1);
  const [activateBandsFound, setActivateBandsFound] = useState<{ band_id: string; bandName: string; role: string }[]>([]);

  // --- Check Invitation Step 1 ---
  const handleCheckInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activateEmail.trim()) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/check-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activateEmail.trim() })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'No se encontró ninguna invitación');
      }

      setActivateName(data.name || '');
      setActivateUsername(data.username || data.email?.split('@')[0] || '');
      setActivateBandsFound(data.bands || []);
      setActivateStep(2);
    } catch (err: any) {
      setError(err.message || 'Error al comprobar invitación');
    } finally {
      setLoading(false);
    }
  };

  // --- Complete Activation Step 2 ---
  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activateUsername.trim() || !activateName.trim() || !activatePassword) {
      setError('Todos los campos son obligatorios para completar tu alta.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/activate-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: activateEmail.trim().toLowerCase(),
          username: activateUsername.trim().toLowerCase(),
          name: activateName.trim(),
          password: activatePassword
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Error al completar el registro');
      }

      if (data.token) {
        localStorage.setItem('bakandeya_token', data.token);
        document.cookie = `bakandeya_token=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
      }

      onLoginSuccess(data.user, data.token, data.availableBands);
    } catch (err: any) {
      setError(err.message || 'Error al activar tu cuenta');
    } finally {
      setLoading(false);
    }
  };

  // --- Login Submit (Original Logic preserved) ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor, ingresa el usuario y la contraseña.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Fallo en la autenticación');
      }

      // Handle Remember Me preference
      if (rememberMe) {
        localStorage.setItem('bakandeya_remembered_username', username.trim());
        localStorage.setItem('bakandeya_remember_me', 'true');
      } else {
        localStorage.removeItem('bakandeya_remembered_username');
        localStorage.setItem('bakandeya_remember_me', 'false');
      }

      if (data.token) {
        localStorage.setItem('bakandeya_token', data.token);
        document.cookie = `bakandeya_token=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
      }

      onLoginSuccess(data.user, data.token, data.availableBands);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // --- Reset Password Handlers ---
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmailOrUsername.trim()) {
      setError('Por favor, indica tu correo o nombre de usuario.');
      return;
    }

    setLoading(true);
    setError(null);
    setResetSuccessMsg(null);

    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: resetEmailOrUsername.trim() })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo procesar la solicitud.');
      }

      setResetMaskedEmail(data.emailMasked);
      if (data.code) {
        setResetCode(data.code);
      }
      setResetSuccessMsg(data.message || 'Código de recuperación generado.');
      setResetStep(2);
    } catch (err: any) {
      setError(err.message || 'Error al solicitar el restablecimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setError('Por favor, ingresa el código de 6 dígitos.');
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: resetEmailOrUsername.trim(),
          code: resetCode.trim(),
          newPassword: resetNewPassword
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Error al restablecer la contraseña.');
      }

      setUsername(resetEmailOrUsername.trim());
      setPassword('');
      setError(null);
      setView('login');
      setResetSuccessMsg('¡Contraseña restablecida con éxito! Ya puedes iniciar sesión.');
    } catch (err: any) {
      setError(err.message || 'Error al confirmar la nueva contraseña');
    } finally {
      setLoading(false);
    }
  };

  const [featureCategory, setFeatureCategory] = useState<'all' | 'booking' | 'media' | 'finance'>('all');

  // --- Register Submit ---
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regLeaderName.trim() || !regBandName.trim() || !regEmail.trim() || !regPassword) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setView('plans');
    }, 500);
  };

  const handlePlanSelect = async (planKey: 'emergente' | 'profesional' | 'manager360') => {
    setLoading(true);
    setError(null);

    const planNamesMap = {
      emergente: 'Banda Emergente (Gratis)',
      profesional: 'Gira Profesional (29€/mes)',
      manager360: 'Manager 360 (79€/mes)'
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderName: regLeaderName.trim(),
          bandName: regBandName.trim() || 'Nueva Banda',
          email: regEmail.trim() || `banda_${Date.now()}@bakandeya.ai`,
          password: regPassword || '123456',
          plan: planKey
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Fallo en la creación de cuenta');
      }

      if (data.token) {
        localStorage.setItem('bakandeya_token', data.token);
        document.cookie = `bakandeya_token=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
      }

      onLoginSuccess(data.user, data.token, data.availableBands);
    } catch (err: any) {
      console.warn("Backend register notice, proceeding with local session state:", err);
      // Fallback local session if offline
      onLoginSuccess({
        id: `user-${Date.now()}`,
        username: regEmail.trim() || regBandName.trim() || 'banda',
        name: regLeaderName.trim() || 'Miembro',
        bandName: regBandName.trim() || 'Nueva Banda',
        email: regEmail.trim(),
        role: 'leader',
        plan: planKey,
        createdAt: new Date().toISOString()
      }, 'mock_token_after_register');
    } finally {
      setLoading(false);
    }
  };

  // --- Shared UI Components ---
  const AppleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/>
      <path d="M10 2c1 .5 2 2 2 5"/>
    </svg>
  );

  const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"/>
    </svg>
  );

  const SocialButtons = () => (
    <div className="flex gap-3 w-full mt-4">
      <button type="button" className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#131317]/80 hover:bg-[#1f1f26] border border-neutral-800/50 rounded-2xl text-sm font-medium text-neutral-300 transition-colors shadow-inner cursor-pointer">
        <GoogleIcon />
        <span>Google</span>
      </button>
      <button type="button" className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#131317]/80 hover:bg-[#1f1f26] border border-neutral-800/50 rounded-2xl text-sm font-medium text-neutral-300 transition-colors shadow-inner cursor-pointer">
        <AppleIcon />
        <span>Apple</span>
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 p-4 bg-[#09090b] text-neutral-100 overflow-y-auto animate-in fade-in duration-300">
      <div className="min-h-full flex items-center justify-center py-8 md:py-12">
        <div className={`w-full relative z-10 flex flex-col items-center transition-all duration-500 ${view === 'plans' ? 'max-w-5xl' : 'max-w-sm space-y-7'}`}>
        
        {/* Soft Golden Background Ambient Glow */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#f2ca50]/5 rounded-full blur-[120px] pointer-events-none" />

        {/* --- BRANDING LOGO & TYPOGRAPHY (Only for Login/Register) --- */}
        {view !== 'plans' && (
          <div className="relative group cursor-pointer flex flex-col items-center justify-center mt-8">
            <img 
              src="/bandmanager_logo.jpeg" 
              alt="BANDMANAGER.ai - IA Agéntica para tu Banda" 
              className="w-64 h-auto sm:w-72 drop-shadow-[0_15px_35px_rgba(242,202,80,0.15)] group-hover:scale-[1.02] transition-transform rounded-2xl border border-[#f2ca50]/10"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* --- ERROR ALERT --- */}
        {error && view !== 'plans' && (
          <div className="w-full p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================
            LOGIN VIEW
            ========================================= */}
        {view === 'login' && (
          <div className="w-full animate-in slide-in-from-bottom-4 duration-300 space-y-4">
            {resetSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{resetSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="w-full space-y-3.5">
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Correo electrónico o Usuario"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                  required
                />
              </div>

              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full pl-11 pr-11 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Recordar contraseña & Restablecer contraseña */}
              <div className="flex items-center justify-between text-xs text-neutral-400 px-1 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none hover:text-neutral-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 bg-[#131317] text-[#f2ca50] focus:ring-[#f2ca50]/50 accent-[#f2ca50] cursor-pointer"
                  />
                  <span>Recordar contraseña</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setResetSuccessMsg(null);
                    setResetStep(1);
                    setResetEmailOrUsername(username || '');
                    setView('reset-password');
                  }}
                  className="text-[#f2ca50] hover:underline font-medium cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 mt-4 rounded-2xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(242,202,80,0.15)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>Entrando...</span>
                  </span>
                ) : (
                  <span>Entrar a mi cuenta</span>
                )}
              </button>
            </form>

            <div className="relative mt-6 mb-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#09090b] text-neutral-500">O continuar con</span>
              </div>
            </div>

            <SocialButtons />

            <div className="text-center mt-6 space-y-3">
              <p className="text-sm text-neutral-400">
                ¿Te han agregado a alguna banda?{' '}
                <button 
                  type="button"
                  onClick={() => {
                    setError(null);
                    setActivateStep(1);
                    setView('activate');
                  }} 
                  className="text-[#f2ca50] hover:underline font-medium cursor-pointer block sm:inline mt-1 sm:mt-0"
                >
                  Activa tu cuenta / Regístrate
                </button>
              </p>
              <p className="text-xs text-neutral-500">
                ¿Quieres registrar una nueva banda?{' '}
                <button 
                  type="button"
                  onClick={() => setView('register')} 
                  className="text-neutral-400 hover:text-[#f2ca50] hover:underline font-medium cursor-pointer"
                >
                  Crea tu banda
                </button>
              </p>
            </div>
          </div>
        )}

        {/* =========================================
            RESET PASSWORD VIEW
            ========================================= */}
        {view === 'reset-password' && (
          <div className="w-full animate-in slide-in-from-bottom-4 duration-300 space-y-4">
            <div className="flex items-center gap-2.5 mb-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setView('login');
                }}
                className="p-2 rounded-xl bg-[#131317] hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer shrink-0"
                title="Volver al inicio de sesión"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-base font-bold text-neutral-100">Restablecer contraseña</h2>
                <p className="text-xs text-neutral-400 leading-tight">
                  {resetStep === 1 
                    ? 'Introduce tu correo o usuario para recuperar tu acceso.'
                    : `Introduce el código para ${resetMaskedEmail || 'tu cuenta'} y tu nueva contraseña.`}
                </p>
              </div>
            </div>

            {resetSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <div className="space-y-1">
                  <p>{resetSuccessMsg}</p>
                  {resetCode && (
                    <p className="font-mono bg-emerald-950/60 text-emerald-300 px-2 py-1 rounded text-center font-bold tracking-widest border border-emerald-500/20 mt-1">
                      Código de verificación: {resetCode}
                    </p>
                  )}
                </div>
              </div>
            )}

            {resetStep === 1 ? (
              <form onSubmit={handleRequestReset} className="space-y-3.5">
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    value={resetEmailOrUsername}
                    onChange={(e) => setResetEmailOrUsername(e.target.value)}
                    placeholder="Correo electrónico o Usuario"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 mt-2 rounded-2xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(242,202,80,0.15)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                      <span>Generando código...</span>
                    </span>
                  ) : (
                    <span>Continuar</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-3.5">
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Código de 6 dígitos"
                    maxLength={6}
                    className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                    required
                  />
                </div>

                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                  <input
                    type={showResetNewPassword ? 'text' : 'password'}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Nueva contraseña (mín. 6 caracteres)"
                    className="w-full pl-11 pr-11 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                    className="absolute right-4 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
                  >
                    {showResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                  <input
                    type={showResetNewPassword ? 'text' : 'password'}
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="w-full pl-11 pr-11 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 mt-2 rounded-2xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(242,202,80,0.15)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                      <span>Guardando contraseña...</span>
                    </span>
                  ) : (
                    <span>Restablecer contraseña</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="text-xs text-neutral-400 hover:text-[#f2ca50] hover:underline cursor-pointer"
                  >
                    ¿No te ha llegado el código? Pedir otro
                  </button>
                </div>
              </form>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-xs text-neutral-400 hover:text-[#f2ca50] hover:underline font-medium cursor-pointer"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          </div>
        )}

        {/* =========================================
            REGISTER VIEW
            ========================================= */}
        {view === 'register' && (
          <div className="w-full animate-in slide-in-from-bottom-4 duration-300">
            <form onSubmit={handleRegisterSubmit} className="w-full space-y-3.5">
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={regLeaderName}
                  onChange={(e) => setRegLeaderName(e.target.value)}
                  placeholder="Tu Nombre o Apodo"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                  required
                />
              </div>

              <div className="relative flex items-center">
                <Music className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={regBandName}
                  onChange={(e) => setRegBandName(e.target.value)}
                  placeholder="Nombre de la Banda / Artista"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                  required
                />
              </div>

              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                  required
                />
              </div>

              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full pl-11 pr-11 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-4 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 mt-4 rounded-2xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(242,202,80,0.15)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>Creando cuenta...</span>
                  </span>
                ) : (
                  <span>Crear cuenta</span>
                )}
              </button>
            </form>

            <div className="relative mt-6 mb-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#09090b] text-neutral-500">O regístrate con</span>
              </div>
            </div>

            <SocialButtons />

            <div className="text-center mt-8">
              <p className="text-sm text-neutral-400">
                ¿Ya tienes cuenta?{' '}
                <button onClick={() => setView('login')} className="text-[#f2ca50] hover:underline font-medium cursor-pointer">
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>
        )}

        {/* =========================================
            ACTIVATE ACCOUNT VIEW (NEW!)
            ========================================= */}
        {view === 'activate' && (
          <div className="w-full animate-in slide-in-from-bottom-4 duration-300">
            {activateStep === 1 ? (
              <div className="space-y-4">
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-lg font-bold text-neutral-100">Darse de alta como miembro</h2>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Si el director de tu banda ya te ha añadido en la lista de miembros, introduce tu correo para activar tu cuenta.
                  </p>
                </div>

                <form onSubmit={handleCheckInvitation} className="space-y-3.5">
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                    <input
                      type="email"
                      value={activateEmail}
                      onChange={(e) => setActivateEmail(e.target.value)}
                      placeholder="Correo electrónico de invitación"
                      className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 mt-4 rounded-2xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(242,202,80,0.15)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                        <span>Comprobando...</span>
                      </span>
                    ) : (
                      <span>Comprobar Invitación</span>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-lg font-bold text-neutral-100">¡Invitación Encontrada!</h2>
                  <div className="p-3 bg-[#f2ca50]/5 border border-[#f2ca50]/20 rounded-2xl text-xs text-[#f2ca50] space-y-1">
                    <p className="font-semibold text-center text-neutral-300">Banda(s) detectada(s):</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-left max-h-24 overflow-y-auto">
                      {activateBandsFound.map((b, idx) => (
                        <li key={idx} className="text-neutral-300">
                          <span className="font-semibold text-neutral-100">{b.bandName}</span> ({b.role === 'leader' ? 'Director' : 'Músico'})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Establece tu nombre real, usuario y contraseña para activar tu cuenta.
                  </p>
                </div>

                <form onSubmit={handleActivateAccount} className="space-y-3.5">
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={activateName}
                      onChange={(e) => setActivateName(e.target.value)}
                      placeholder="Nombre real completo"
                      className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                      required
                    />
                  </div>

                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={activateUsername}
                      onChange={(e) => setActivateUsername(e.target.value)}
                      placeholder="Nombre de usuario elegido"
                      className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                      required
                    />
                  </div>

                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                    <input
                      type={showActivatePassword ? 'text' : 'password'}
                      value={activatePassword}
                      onChange={(e) => setActivatePassword(e.target.value)}
                      placeholder="Crea tu contraseña"
                      className="w-full pl-11 pr-11 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowActivatePassword(!showActivatePassword)}
                      className="absolute right-4 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
                    >
                      {showActivatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 mt-4 rounded-2xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(242,202,80,0.15)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                        <span>Activando...</span>
                      </span>
                    ) : (
                      <span>Completar Registro y Entrar</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            <div className="text-center mt-8">
              <p className="text-sm text-neutral-400">
                ¿Prefieres iniciar sesión?{' '}
                <button 
                  type="button"
                  onClick={() => {
                    setError(null);
                    setView('login');
                  }} 
                  className="text-[#f2ca50] hover:underline font-medium cursor-pointer"
                >
                  Volver al Login
                </button>
              </p>
            </div>
          </div>
        )}

        {/* =========================================
            PLANS VIEW
            ========================================= */}
        {view === 'plans' && (
          <div className="w-full animate-in zoom-in-95 duration-500 py-6">
            <div className="text-center mb-8 space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-100 tracking-tight">
                Elige el plan para <span className="text-[#f2ca50]">{regBandName || 'tu Banda'}</span>
              </h1>
              <p className="text-neutral-400 max-w-xl mx-auto text-sm sm:text-base">
                Sube de nivel tu carrera musical. Puedes cambiar de plan en cualquier momento.
              </p>

              {/* FILTER BUTTONS BY CATEGORY */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => setFeatureCategory('all')} 
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${featureCategory === 'all' ? 'bg-[#f2ca50] text-neutral-950 shadow-md shadow-[#f2ca50]/20' : 'bg-[#131317] text-neutral-400 hover:text-white border border-neutral-800'}`}
                >
                  Todas las funciones
                </button>
                <button 
                  type="button"
                  onClick={() => setFeatureCategory('booking')} 
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${featureCategory === 'booking' ? 'bg-[#f2ca50] text-neutral-950 shadow-md shadow-[#f2ca50]/20' : 'bg-[#131317] text-neutral-400 hover:text-white border border-neutral-800'}`}
                >
                  🎯 Booking & Salas
                </button>
                <button 
                  type="button"
                  onClick={() => setFeatureCategory('media')} 
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${featureCategory === 'media' ? 'bg-[#f2ca50] text-neutral-950 shadow-md shadow-[#f2ca50]/20' : 'bg-[#131317] text-neutral-400 hover:text-white border border-neutral-800'}`}
                >
                  📱 Redes, EPK & Fans
                </button>
                <button 
                  type="button"
                  onClick={() => setFeatureCategory('finance')} 
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${featureCategory === 'finance' ? 'bg-[#f2ca50] text-neutral-950 shadow-md shadow-[#f2ca50]/20' : 'bg-[#131317] text-neutral-400 hover:text-white border border-neutral-800'}`}
                >
                  💼 Finanzas & Agentes 360
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              
              {/* PLAN 1: EMERGENTE */}
              <div className="bg-[#131317]/50 border border-neutral-800/50 rounded-3xl p-8 flex flex-col hover:border-neutral-700 transition-colors">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-neutral-200">Banda Emergente</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">0€</span>
                    <span className="text-xs text-neutral-500 font-medium">/ para siempre</span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-2 h-10">Proyectos que están empezando a organizarse.</p>
                </div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    { text: 'CRM Básico de Salas', cat: 'booking' },
                    { text: 'Booking manual (hasta 5)', cat: 'booking' },
                    { text: 'EPK Público', cat: 'media' },
                    { text: 'Gestión de Repertorio', cat: 'media' }
                  ].map((f, i) => {
                    const isHighlighted = featureCategory === 'all' || featureCategory === f.cat;
                    return (
                      <li key={i} className={`flex items-start gap-3 text-sm transition-opacity duration-200 ${isHighlighted ? 'text-neutral-300 opacity-100' : 'text-neutral-600 opacity-40'}`}>
                        <Check className={`w-5 h-5 shrink-0 ${isHighlighted ? 'text-neutral-400' : 'text-neutral-700'}`} />
                        <span className={isHighlighted && featureCategory !== 'all' ? 'font-bold text-[#f2ca50]' : ''}>{f.text}</span>
                      </li>
                    );
                  })}
                </ul>

                <button 
                  type="button"
                  onClick={() => handlePlanSelect('emergente')}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm transition-colors cursor-pointer"
                >
                  Empezar gratis
                </button>
              </div>

              {/* PLAN 2: GIRA PROFESIONAL (Destacado) */}
              <div className="bg-[#1a1a24] border-2 border-[#f2ca50] rounded-3xl p-8 flex flex-col relative shadow-[0_0_40px_rgba(242,202,80,0.15)]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#f2ca50] text-neutral-950 text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full flex items-center gap-1 shadow-md">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  Más Popular
                </div>
                
                <div className="mb-6 mt-2">
                  <h3 className="text-xl font-bold text-[#f2ca50]">Gira Profesional</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">29€</span>
                    <span className="text-neutral-400">/ mes</span>
                  </div>
                  <p className="text-sm text-neutral-400 mt-2 h-10">Bandas activas que buscan automatización e IA.</p>
                </div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    { text: 'Booking IA Autónomo Ilimitado', cat: 'booking' },
                    { text: 'Buscador Inteligente de Salas', cat: 'booking' },
                    { text: 'Planificador de Redes', cat: 'media' },
                    { text: 'Estudio de Letras IA', cat: 'media' },
                    { text: 'Rutas de Gira', cat: 'booking' },
                    { text: 'QR de Fans', cat: 'media' }
                  ].map((f, i) => {
                    const isHighlighted = featureCategory === 'all' || featureCategory === f.cat;
                    return (
                      <li key={i} className={`flex items-start gap-3 text-sm transition-opacity duration-200 ${isHighlighted ? 'text-neutral-200 opacity-100' : 'text-neutral-600 opacity-40'}`}>
                        <Zap className={`w-5 h-5 shrink-0 ${isHighlighted ? 'text-[#f2ca50]' : 'text-neutral-700'}`} />
                        <span className={isHighlighted && featureCategory !== 'all' ? 'font-bold text-[#f2ca50]' : ''}>{f.text}</span>
                      </li>
                    );
                  })}
                </ul>

                <button 
                  type="button"
                  onClick={() => handlePlanSelect('profesional')}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold text-sm transition-colors cursor-pointer shadow-lg shadow-[#f2ca50]/20 flex items-center justify-center gap-2"
                >
                  Seleccionar Profesional
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* PLAN 3: MANAGER 360 */}
              <div className="bg-[#131317]/50 border border-neutral-800/50 rounded-3xl p-8 flex flex-col hover:border-neutral-700 transition-colors">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-neutral-200">Manager 360</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">79€</span>
                    <span className="text-neutral-400">/ mes</span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-2 h-10">Control total para proyectos profesionales y agencias.</p>
                </div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    { text: 'Todo lo de Profesional', cat: 'all' },
                    { text: 'Finanzas Avanzadas', cat: 'finance' },
                    { text: 'Analítica de Merchandising', cat: 'finance' },
                    { text: 'IA Multi-Agente', cat: 'finance' },
                    { text: 'Dominio Web Personalizado', cat: 'media' },
                    { text: 'Soporte VIP', cat: 'finance' }
                  ].map((f, i) => {
                    const isHighlighted = featureCategory === 'all' || featureCategory === f.cat;
                    return (
                      <li key={i} className={`flex items-start gap-3 text-sm transition-opacity duration-200 ${isHighlighted ? 'text-neutral-300 opacity-100' : 'text-neutral-600 opacity-40'}`}>
                        <Shield className={`w-5 h-5 shrink-0 ${isHighlighted ? 'text-indigo-400' : 'text-neutral-700'}`} />
                        <span className={isHighlighted && featureCategory !== 'all' ? 'font-bold text-[#f2ca50]' : ''}>{f.text}</span>
                      </li>
                    );
                  })}
                </ul>

                <button 
                  type="button"
                  onClick={() => handlePlanSelect('manager360')}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm transition-colors cursor-pointer"
                >
                  Seleccionar 360
                </button>
              </div>

            </div>
          </div>
        )}

        {/* --- FOOTER TAGLINE (Only for Login/Register) --- */}
        {view !== 'plans' && (
          <div className="text-center pt-3 border-t border-neutral-800/60 mt-1 w-full space-y-1.5 opacity-70">
            <p className="text-xs sm:text-sm font-sans font-medium text-neutral-300 leading-snug">
              Tú concéntrate en la música. <br />
              <span className="text-[#f2ca50] font-bold">Tu Manager IA llena los escenarios.</span>
            </p>
            <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">
              Booking • Promoción • Agentes Autónomos 24/7
            </p>
          </div>
        )}

      </div>
      </div>
    </div>
  );
};
