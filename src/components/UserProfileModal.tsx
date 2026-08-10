import React, { useState } from 'react';
import { User as UserIcon, Key, Music, Check, AlertCircle, X, Shield, Lock, Palette, Users, FileSpreadsheet, Download, Database, Type, Mail, HardDrive, Unlink, ExternalLink, Loader2, Guitar, Upload, Camera } from 'lucide-react';
import { User, ThemeName, GoogleOAuthConfig } from '../types';
import { THEMES } from '../utils/theme';
import { FONT_PRESETS, FontPresetKey, applyFontPreset, getStoredFontPreset } from '../utils/typography';
import { googleSignIn, logout } from '../utils/gmail';
import { uploadFileToServer } from '../utils/audioStorage';
import { getAuthHeaders } from '../services/api';

interface UserProfileModalProps {
 currentUser: User;
 onClose: () => void;
 onUpdateUser: (updatedUser: User) => void;
 isStitchLight?: boolean;
 isAdmin?: boolean;
 onOpenBandManagement?: () => void;
 currentTheme?: ThemeName;
 onThemeChange?: (theme: ThemeName) => void;
 currentFont?: FontPresetKey;
 onFontChange?: (font: FontPresetKey) => void;
 epkConfig?: any;
 onUpdateEpkConfig?: (newConfig: any) => Promise<any> | void;
 activeBandName?: string;
 onRefreshData?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
 currentUser,
 onClose,
 onUpdateUser,
 isStitchLight,
 isAdmin,
 onOpenBandManagement,
 currentTheme,
 onThemeChange,
 currentFont,
 onFontChange,
 epkConfig,
 onUpdateEpkConfig,
 activeBandName,
 onRefreshData
}) => {
 const [name, setName] = useState(currentUser.name || '');
 const [instrument, setInstrument] = useState(currentUser.instrument || '');
 const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || '#10b981');
 const [bandLogoUrl, setBandLogoUrl] = useState<string>(epkConfig?.logoUrl || '');
 const [logoImgError, setLogoImgError] = useState(false);
 const [uploadingLogo, setUploadingLogo] = useState(false);
 
 // Password change state
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');

 const handleLogoChangeInProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploadingLogo(true);
  setError(null);
  setSuccessMsg(null);
  try {
   const userBandId = currentUser.band_id || 'band-bakandeya';
   const url = await uploadFileToServer(file, { bandId: userBandId, category: 'logo' });
   setBandLogoUrl(url);

   const updatedEpk = { ...epkConfig, logoUrl: url };
   if (onUpdateEpkConfig) {
    await onUpdateEpkConfig(updatedEpk);
   } else {
    const authHeaders = getAuthHeaders() as Record<string, string>;
    await fetch('/api/epk', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json', ...authHeaders },
     body: JSON.stringify({ logoUrl: url, bandId: userBandId })
    });
   }
   if (onRefreshData) onRefreshData();
   setSuccessMsg('¡Logo del proyecto actualizado con éxito!');
  } catch (err: any) {
   console.error('Error uploading band logo in profile:', err);
   setError('Error al subir el logo de la banda.');
  } finally {
   setUploadingLogo(false);
  }
 };

 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [successMsg, setSuccessMsg] = useState<string | null>(null);

 // Google OAuth state
 const [oauthLoading, setOauthLoading] = useState(false);
 const [googleOAuthState, setGoogleOAuthState] = useState<GoogleOAuthConfig | null>(
 currentUser.googleOAuth || null
 );

 const handleConnectGoogleOAuth = async () => {
 setOauthLoading(true);
 setError(null);
 setSuccessMsg(null);
 try {
 const res = await googleSignIn();
 const googleData: GoogleOAuthConfig = {
 connected: true,
 email: res.user?.email || '',
 displayName: res.user?.displayName || res.user?.email || '',
 photoURL: res.user?.photoURL || '',
 accessToken: res.accessToken,
 scopes: [
 'https://www.googleapis.com/auth/gmail.readonly',
 'https://www.googleapis.com/auth/gmail.compose',
 'https://www.googleapis.com/auth/gmail.send',
 'https://www.googleapis.com/auth/drive.readonly'
 ],
 connectedAt: new Date().toISOString()
 };

 setGoogleOAuthState(googleData);

 const token = localStorage.getItem('bakandeya_token');
 const updateRes = await fetch(`/api/users/${currentUser.id}`, {
 method: 'PUT',
 headers: {
 'Content-Type': 'application/json',
 ...(token ? { Authorization: `Bearer ${token}` } : {})
 },
 body: JSON.stringify({ googleOAuth: googleData })
 });

 if (updateRes.ok) {
 const updatedUser = await updateRes.json();
 onUpdateUser(updatedUser);
 setSuccessMsg(`¡Cuenta Google (${googleData.email}) conectada con OAuth 2.0 para Gmail y Drive!`);
 } else {
 setSuccessMsg(`Cuenta Google autenticada: ${googleData.email}`);
 }
 } catch (err: any) {
 console.error("Error connecting Google OAuth:", err);
 setError(err.message || 'Error al conectar con Google OAuth.');
 } finally {
 setOauthLoading(false);
 }
 };

 const handleDisconnectGoogleOAuth = async () => {
 setOauthLoading(true);
 try {
 await logout();
 const disconnectedState: GoogleOAuthConfig = { connected: false };
 setGoogleOAuthState(disconnectedState);

 const token = localStorage.getItem('bakandeya_token');
 const updateRes = await fetch(`/api/users/${currentUser.id}`, {
 method: 'PUT',
 headers: {
 'Content-Type': 'application/json',
 ...(token ? { Authorization: `Bearer ${token}` } : {})
 },
 body: JSON.stringify({ googleOAuth: disconnectedState })
 });

 if (updateRes.ok) {
 const updatedUser = await updateRes.json();
 onUpdateUser(updatedUser);
 }
 setSuccessMsg('Conexión con Google revocada.');
 } catch (err: any) {
 setError(err.message || 'Error al desconectar de Google.');
 } finally {
 setOauthLoading(false);
 }
 };

 const colors = [
 '#10b981', // Emerald
 '#3b82f6', // Blue
 '#ec4899', // Pink
 '#f59e0b', // Amber
 '#8b5cf6', // Purple
 '#06b6d4', // Cyan
 '#f97316', // Orange
 '#ef4444' // Red
 ];

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError(null);
 setSuccessMsg(null);

 if (newPassword && newPassword !== confirmPassword) {
 setError('Las contraseñas no coinciden. Por favor verifícalas.');
 return;
 }

 if (newPassword && newPassword.length < 3) {
 setError('La nueva contraseña debe tener al menos 3 caracteres.');
 return;
 }

 setLoading(true);

 try {
 const token = localStorage.getItem('bakandeya_token');
 const response = await fetch(`/api/users/${currentUser.id}`, {
 method: 'PUT',
 headers: {
  'Content-Type': 'application/json',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
 },
 body: JSON.stringify({
 name: name.trim(),
 instrument: instrument.trim(),
 avatarColor,
 ...(newPassword ? { newPassword: newPassword.trim() } : {})
 })
 });

 const data = await response.json();

 if (!response.ok) {
 throw new Error(data.error || 'Error al actualizar el perfil');
 }

 setSuccessMsg('¡Perfil y contraseña actualizados correctamente!');
 setNewPassword('');
 setConfirmPassword('');
 onUpdateUser(data);
 setTimeout(() => {
 onClose();
 }, 1200);
 } catch (err: any) {
 setError(err.message || 'Error en el servidor');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
 <div 
 className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
 isStitchLight 
 ? 'bg-white -slate-200 text-slate-800' 
 : 'bg-neutral-900 -neutral-800 text-neutral-100'
 }`}
 >
 {/* Modal Header */}
 <div className={`px-6 py-4 flex justify-between items-center ${
 isStitchLight ? '-slate-200 bg-slate-50' : '-neutral-800 bg-neutral-950/60'
 }`}>
 <div className="flex items-center gap-3">
 <div 
 className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner uppercase font-mono text-sm shrink-0"
 style={{ backgroundColor: avatarColor }}
 >
 {name.slice(0, 2) || 'BK'}
 </div>
 <div>
 <h3 className="font-bold font-display uppercase tracking-wider text-sm flex items-center gap-2">
 <span>Mi Perfil & Contraseña</span>
 </h3>
 <p className="text-[11px] text-neutral-400 font-mono">
 @{currentUser.username} • {isAdmin ? 'Administrador' : 'Músico'}
 </p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Form Body */}
 <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
 {error && (
 <div className="p-3 bg-rose-500/10 -rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{error}</span>
 </div>
 )}

 {successMsg && (
 <div className="p-3 bg-emerald-500/10 -emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
 <Check className="w-4 h-4 shrink-0" />
 <span>{successMsg}</span>
 </div>
 )}

 <div className="space-y-1">
 <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center gap-1.5">
 <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
 <span>Nombre Completo / Apodo</span>
 </label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 placeholder="Tu nombre..."
 className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-800 focus:-emerald-500/50'
 }`}
 required
 />
 </div>

 <div className="space-y-1">
 <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center gap-1.5">
 <Music className="w-3.5 h-3.5 text-emerald-400" />
 <span>Instrumento / Puesto</span>
 </label>
 <input
 type="text"
 value={instrument}
 onChange={(e) => setInstrument(e.target.value)}
 placeholder="Ej: Violín, Percusión, Batería, Técnico de Sonido"
 className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-800 focus:-emerald-500/50'
 }`}
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center gap-1.5">
 <Palette className="w-3.5 h-3.5 text-emerald-400" />
 <span>Color de Avatar</span>
 </label>
 <div className="flex items-center gap-2 pt-0.5">
 {colors.map((c) => (
 <button
 key={c}
 type="button"
 onClick={() => setAvatarColor(c)}
 className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
 avatarColor === c ? 'scale-110 -white ring-2 ring-emerald-500' : '-transparent opacity-75 hover:opacity-100'
 }`}
 style={{ backgroundColor: c }}
 />
 ))}
 </div>
 </div>

 {/* Active Band Logo Edit Section (Netflix Profile Style) */}
 <div className="space-y-2 pt-2 border-t border-neutral-800/80">
 <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <Camera className="w-3.5 h-3.5 text-amber-400" />
 <span>Logo de tu Banda / Proyecto Musical</span>
 </span>
 <span className="text-[10px] text-amber-400/80 font-normal font-mono">Editar Avatar</span>
 </label>

 <div className={`p-3 rounded-xl flex items-center justify-between gap-3 ${
 isStitchLight ? 'bg-slate-50 border border-slate-200' : 'bg-neutral-950 border border-neutral-800'
 }`}>
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-700 overflow-hidden flex items-center justify-center p-1 shrink-0 relative group">
 {bandLogoUrl && !logoImgError ? (
 <img src={bandLogoUrl} alt="Logo Banda" onError={() => setLogoImgError(true)} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
 ) : (
 <Guitar className="w-6 h-6 text-amber-400" />
 )}
 </div>
 <div>
 <p className="text-xs font-bold text-white">{activeBandName || currentUser.bandName || 'Tu Banda'}</p>
 <p className="text-[10px] text-neutral-400 font-mono">Avatar / Logo oficial de la banda</p>
 </div>
 </div>

 <label className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95">
 {uploadingLogo ? (
 <>
 <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
 <span>Subiendo...</span>
 </>
 ) : (
 <>
 <Upload className="w-3.5 h-3.5" />
 <span>Cambiar Logo</span>
 </>
 )}
 <input
 type="file"
 accept="image/*"
 className="hidden"
 disabled={uploadingLogo}
 onChange={handleLogoChangeInProfile}
 />
 </label>
 </div>
 </div>

 {/* Theme Selection */}
 {onThemeChange && (
 <div className="space-y-2 pt-2 -neutral-800/80">
 <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <Palette className="w-3.5 h-3.5 text-amber-400" />
 <span>Tema Visual de la Aplicación</span>
 </span>
 <span className="text-[10px] text-amber-400/80 font-normal font-mono">Selección Directa</span>
 </label>
 
 <div className="grid grid-cols-2 gap-2 pt-1">
 {Object.entries(THEMES).map(([key, t]) => {
 const isSelected = currentTheme === key;
 return (
 <button
 key={key}
 type="button"
 onClick={() => onThemeChange(key as ThemeName)}
 className={`p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
 isSelected
 ? isStitchLight
 ? 'bg-indigo-50 -indigo-600 ring-1 ring-indigo-500/20 text-indigo-900 font-bold'
 : 'bg-amber-500/10 -amber-500 ring-1 ring-amber-500/20 text-amber-300 font-bold'
 : isStitchLight
 ? 'bg-slate-50 -slate-200 text-slate-700 hover:bg-slate-100'
 : 'bg-neutral-950 -neutral-800 text-neutral-300 hover:-neutral-700'
 }`}
 >
 <span className="text-[11px] font-mono tracking-tight font-semibold truncate">
 {t.name}
 </span>
 {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
 </button>
 );
 })}
 </div>
 </div>
 )}

 {/* Typography / Font Selection */}
 {onFontChange && (
 <div className="space-y-2 pt-2 -neutral-800/80">
 <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <Type className="w-3.5 h-3.5 text-emerald-400" />
 <span>Estilo de Fuente & Tipografía</span>
 </span>
 <span className="text-[10px] text-emerald-400/80 font-normal font-mono">Suave o Intensa</span>
 </label>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
 {FONT_PRESETS.map((p) => {
 const isSelected = currentFont === p.id;
 return (
 <button
 key={p.id}
 type="button"
 onClick={() => onFontChange(p.id)}
 className={`p-2 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
 isSelected
 ? isStitchLight
 ? 'bg-indigo-50 -indigo-600 ring-1 ring-indigo-500/20 text-indigo-900 font-bold'
 : 'bg-emerald-500/10 -emerald-500 ring-1 ring-emerald-500/20 text-emerald-300 font-bold'
 : isStitchLight
 ? 'bg-slate-50 -slate-200 text-slate-700 hover:bg-slate-100'
 : 'bg-neutral-950 -neutral-800 text-neutral-300 hover:-neutral-700'
 }`}
 >
 <div className="flex items-center justify-between gap-1 w-full">
 <span className="text-[11px] font-bold truncate" style={{ fontFamily: p.displayFont }}>
 {p.name}
 </span>
 {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
 </div>
 <span className="text-[9.5px] font-mono opacity-75 truncate">
 {p.subtitle}
 </span>
 </button>
 );
 })}
 </div>
 </div>
 )}

 <div className="pt-2 -neutral-800/80 space-y-3">
 <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
 <Key className="w-4 h-4" />
 <span>Cambiar Contraseña</span>
 </div>

 <div className="space-y-1">
 <label className="text-[11px] font-mono text-neutral-400">
 Nueva Contraseña Secreta
 </label>
 <input
 type="password"
 value={newPassword}
 onChange={(e) => setNewPassword(e.target.value)}
 placeholder="Dejar en blanco para mantener la actual..."
 className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-800 focus:-amber-500/50'
 }`}
 />
 </div>

 {newPassword.length > 0 && (
 <div className="space-y-1 animate-in fade-in duration-200">
 <label className="text-[11px] font-mono text-neutral-400">
 Confirmar Nueva Contraseña
 </label>
 <input
 type="password"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 placeholder="Repite la nueva contraseña..."
 className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-800 focus:-amber-500/50'
 }`}
 />
 </div>
 )}
 </div>

 {/* Admin Band Management Section inside Profile */}
 {isAdmin && onOpenBandManagement && (
 <div className="pt-2 -neutral-800/80 space-y-2">
 <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <Shield className="w-3.5 h-3.5 text-indigo-400" />
 <span>Administración de la Banda</span>
 </span>
 <span className="text-[10px] text-indigo-400 font-mono font-bold">Solo Admins</span>
 </label>

 <button
 type="button"
 onClick={() => {
 onClose();
 onOpenBandManagement();
 }}
 className={`w-full p-3 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
 isStitchLight
 ? 'bg-indigo-50 -indigo-200 hover:bg-sky-500/15 text-sky-400'
 : 'bg-indigo-950/30 -indigo-500/30 hover:-indigo-500/60 text-indigo-200'
 }`}
 >
 <div className="flex items-center gap-2.5">
 <Users className="w-4 h-4 text-indigo-400 shrink-0" />
 <div>
 <div className="text-xs font-bold font-mono">Gestión de la Banda</div>
 <div className="text-[10px] opacity-75 font-sans">Crear nuevos músicos, cambiar sus contraseñas y permisos</div>
 </div>
 </div>
 <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 -indigo-500/30">Abrir &rarr;</span>
 </button>
 </div>
 )}

 {/* Google OAuth 2.0 Integration Section (Gmail & Google Drive) */}
 <div className="pt-3 -neutral-800/80 space-y-2">
 <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <Mail className="w-3.5 h-3.5 text-sky-400" />
 <span>Conexión Google OAuth 2.0 (Gmail & Drive)</span>
 </span>
 <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
 googleOAuthState?.connected ? 'bg-emerald-500/15 text-emerald-400 -emerald-500/30' : 'bg-neutral-800 text-neutral-400'
 }`}>
 {googleOAuthState?.connected ? 'OAuth Activo' : 'No Conectado'}
 </span>
 </label>

 <div className={`p-3.5 rounded-xl text-xs space-y-3 ${
 isStitchLight ? 'bg-slate-50 -slate-200 text-slate-800' : 'bg-neutral-900/90 -neutral-800 text-neutral-200'
 }`}>
 {googleOAuthState?.connected ? (
 <div className="space-y-2.5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 {googleOAuthState.photoURL ? (
 <img src={googleOAuthState.photoURL} alt="Google Avatar" className="w-8 h-8 rounded-full ring-2 ring-emerald-500/40" />
 ) : (
 <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
 G
 </div>
 )}
 <div>
 <p className="font-bold text-xs">{googleOAuthState.displayName || googleOAuthState.email}</p>
 <p className="text-[10.5px] font-mono text-neutral-400 truncate max-w-[200px]">{googleOAuthState.email}</p>
 </div>
 </div>
 <button
 type="button"
 onClick={handleDisconnectGoogleOAuth}
 disabled={oauthLoading}
 className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono"
 title="Desconectar cuenta Google"
 >
 <Unlink className="w-3.5 h-3.5" />
 <span>Desconectar</span>
 </button>
 </div>

 <div className="pt-2 -neutral-800/60 grid grid-cols-2 gap-1.5 text-[10px] font-mono text-neutral-400">
 <div className="flex items-center gap-1 text-emerald-400">
 <Check className="w-3 h-3" />
 <span>Gmail: Lectura/Borradores</span>
 </div>
 <div className="flex items-center gap-1 text-emerald-400">
 <Check className="w-3 h-3" />
 <span>Gmail: Envíos Directos</span>
 </div>
 <div className="flex items-center gap-1 text-emerald-400">
 <Check className="w-3 h-3" />
 <span>Google Drive: Lectura</span>
 </div>
 <div className="flex items-center gap-1 text-sky-400">
 <HardDrive className="w-3 h-3" />
 <span>Tokens Seguros</span>
 </div>
 </div>
 </div>
 ) : (
 <div className="space-y-2">
 <p className="text-[11px] text-neutral-300 leading-relaxed">
 Autoriza a la aplicación y a los agentes de IA (Lector, Redactor, Enviador) a gestionar los emails de booking e inspeccionar dossiers de Google Drive.
 </p>
 <button
 type="button"
 onClick={handleConnectGoogleOAuth}
 disabled={oauthLoading}
 className="w-full py-2 px-3 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 -sky-500/30 text-sky-300 font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
 >
 {oauthLoading ? (
 <>
 <Loader2 className="w-3.5 h-3.5 animate-spin" />
 <span>Autenticando en Google...</span>
 </>
 ) : (
 <>
 <Mail className="w-3.5 h-3.5 text-sky-400" />
 <span>Conectar con Google OAuth 2.0 (Gmail & Drive)</span>
 </>
 )}
 </button>
 </div>
 )}
 </div>
 </div>

 {/* Database & Google Sheets / Excel Section */}
 <div className="pt-3 -neutral-800/80 space-y-2">
 <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <Database className="w-3.5 h-3.5 text-emerald-400" />
 <span>Base de Datos de la Banda</span>
 </span>
 <span className="text-[10px] text-emerald-400 font-mono font-bold">Conectado</span>
 </label>

 <div className={`p-3 rounded-xl text-xs font-sans ${
 isStitchLight ? 'bg-slate-50 -slate-200 text-slate-700' : 'bg-neutral-900/80 -neutral-800 text-neutral-300'
 }`}>
 <div className="flex items-start gap-2">
 <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
 <p className="font-medium text-[11px]">
 Todos los datos de la app están vinculados dinámicamente con Google Sheets en tiempo real.
 </p>
 </div>
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-lg active:scale-98 ${
 isStitchLight
 ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
 : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
 }`}
 >
 {loading ? (
 <span>Guardando cambios...</span>
 ) : (
 <>
 <Check className="w-4 h-4" />
 <span>Guardar Cambios de Perfil</span>
 </>
 )}
 </button>
 </form>

 {/* Modal Footer */}
 <div className={`px-6 py-3 flex justify-between items-center ${
 isStitchLight ? '-slate-200 bg-slate-50' : '-neutral-800 bg-neutral-950/60'
 }`}>
 {isAdmin && onOpenBandManagement ? (
 <button
 onClick={() => {
 onClose();
 onOpenBandManagement();
 }}
 className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
 >
 <Shield className="w-3 h-3" />
 <span>Gestión de la Banda</span>
 </button>
 ) : (
 <span className="text-[10px] font-mono text-neutral-500">Bakandeya Manager v2.0</span>
 )}

 <button
 onClick={onClose}
 className="px-4 py-1.5 rounded-lg text-xs font-mono -neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
 >
 Cerrar
 </button>
 </div>
 </div>
 </div>
 );
};
