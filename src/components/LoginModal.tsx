import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginModalProps {
 onLoginSuccess: (user: UserType, token: string) => void;
 isStitchLight?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
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

 if (data.token) {
 localStorage.setItem('bakandeya_token', data.token);
 document.cookie = `bakandeya_token=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
 }

 onLoginSuccess(data.user, data.token);
 } catch (err: any) {
 setError(err.message || 'Error al conectar con el servidor.');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b] text-neutral-100 animate-in fade-in duration-300">
 <div className="w-full max-w-sm space-y-7 relative z-10 flex flex-col items-center">
 
 {/* Soft Golden Background Ambient Glow */}
 <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#f2ca50]/15 rounded-full blur-[90px] pointer-events-none" />

 {/* --- BRANDING LOGO & TYPOGRAPHY --- */}
 <div className="relative group cursor-pointer flex flex-col items-center justify-center">
 <img 
 src="/bandmanager_logo.jpeg" 
 alt="BANDMANAGER.ai - IA Agéntica para tu Banda" 
 className="w-64 h-auto sm:w-72 drop-shadow-[0_15px_35px_rgba(242,202,80,0.25)] group-hover:scale-102 transition-transform rounded-2xl -[#f2ca50]/20"
 referrerPolicy="no-referrer"
 />
 </div>

 {/* --- ERROR ALERT --- */}
 {error && (
 <div className="w-full p-3 bg-rose-500/10 -rose-500/30 rounded-2xl text-xs text-rose-400 flex items-center gap-2 animate-in fade-in duration-200">
 <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
 <span>{error}</span>
 </div>
 )}

 {/* --- MINIMALIST FORM --- */}
 <form onSubmit={handleSubmit} className="w-full space-y-3.5">
 {/* User Input */}
 <div className="relative flex items-center">
 <User className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
 <input
 type="text"
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 placeholder="Usuario"
 className="w-full pl-11 pr-4 py-3 bg-[#131317]/90 -neutral-800/90 focus:-[#f2ca50] rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
 required
 />
 </div>

 {/* Password Input */}
 <div className="relative flex items-center">
 <Lock className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
 <input
 type={showPassword ? 'text' : 'password'}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="Contraseña"
 className="w-full pl-11 pr-11 py-3 bg-[#131317]/90 -neutral-800/90 focus:-[#f2ca50] rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
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

 {/* Golden Login Button */}
 <button
 type="submit"
 disabled={loading}
 className="w-full py-3.5 px-4 mt-2 rounded-2xl bg-gradient-to-r from-[#f5cf5e] via-[#e8be48] to-[#d6a82e] hover:brightness-110 text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-[#f2ca50]/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer font-sans"
 >
 {loading ? (
 <span className="flex items-center gap-2">
 <span className="w-4 h-4 -neutral-950 -transparent rounded-full animate-spin" />
 <span>Entrando...</span>
 </span>
 ) : (
 <span>Entrar</span>
 )}
 </button>
 </form>

 {/* --- FOOTER TAGLINE --- */}
 <div className="text-center pt-3 -neutral-800/60 mt-1 w-full space-y-1.5">
 <p className="text-xs sm:text-sm font-sans font-medium text-neutral-300 leading-snug">
 Tú concéntrate en la música. <br />
 <span className="text-[#f2ca50] font-bold">Tu Manager IA llena los escenarios.</span>
 </p>
 <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">
 Booking • Promoción • Agentes Autónomos 24/7
 </p>
 </div>

 </div>
 </div>
 );
};


