import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Music, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginModalProps {
  onLoginSuccess: (user: UserType, token: string) => void;
  isStitchLight?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, isStitchLight }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fallo en la autenticación');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden transition-all ${
          isStitchLight 
            ? 'bg-white border-slate-200 text-slate-800' 
            : 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-emerald-950/20'
        }`}
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-700/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-2">
            <img 
              src="/logo_bakandeya.jpg" 
              alt="Bakandeya Logo" 
              className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-amber-600/40 ring-4 ring-amber-600/15"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-wide uppercase">
            Bakandeya <span className="text-amber-500">Management</span>
          </h2>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold font-mono text-neutral-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-500" />
              <span>Usuario</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: Jon, Jose, Elyar, Raúl"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                isStitchLight
                  ? 'bg-slate-50 border-slate-200 focus:border-amber-600 text-slate-800'
                  : 'bg-neutral-950 border-neutral-800 focus:border-amber-500/80 text-neutral-100'
              }`}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold font-mono text-neutral-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Contraseña</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña secreta"
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm outline-none transition-all ${
                  isStitchLight
                    ? 'bg-slate-50 border-slate-200 focus:border-amber-600 text-slate-800'
                    : 'bg-neutral-950 border-neutral-800 focus:border-amber-500/80 text-neutral-100'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-stone-950 font-bold text-sm transition-all shadow-lg shadow-amber-900/30 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                <span>Iniciando sesión...</span>
              </span>
            ) : (
              <span>Entrar al Management Hub</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
