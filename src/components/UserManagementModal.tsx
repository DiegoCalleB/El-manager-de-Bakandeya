import React, { useState } from 'react';
import { Users, UserPlus, Key, Trash2, Shield, Music, X, Check, AlertCircle, Edit2, Sparkles, RefreshCw } from 'lucide-react';
import { User, UserRole } from '../types';

interface UserManagementModalProps {
 currentUser: User;
 users: User[];
 onClose: () => void;
 onRefreshUsers: () => void;
 isStitchLight?: boolean;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
 currentUser,
 users,
 onClose,
 onRefreshUsers,
 isStitchLight
}) => {
 const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
 
 // New user form state
 const [newUsername, setNewUsername] = useState('');
 const [newName, setNewName] = useState('');
 const [newPassword, setNewPassword] = useState('');
 const [newRole, setNewRole] = useState<UserRole>('member');
 const [newInstrument, setNewInstrument] = useState('');
 const [newAvatarColor, setNewAvatarColor] = useState('#3b82f6');

 // Change password state
 const [editingUserId, setEditingUserId] = useState<string | null>(null);
 const [changePasswordValue, setChangePasswordValue] = useState('');

 // Status feedback
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

 const handleCreateUser = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newUsername.trim() || !newName.trim() || !newPassword) {
 setError('Por favor, completa usuario, nombre real y contraseña.');
 return;
 }

 setLoading(true);
 setError(null);
 setSuccessMsg(null);

 try {
 const response = await fetch('/api/users', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 username: newUsername.trim(),
 name: newName.trim(),
 password: newPassword,
 role: newRole,
 instrument: newInstrument.trim(),
 avatarColor: newAvatarColor
 })
 });

 const data = await response.json();

 if (!response.ok) {
 throw new Error(data.error || 'Error al crear usuario');
 }

 setSuccessMsg(`¡Usuario @${data.username} creado con éxito!`);
 setNewUsername('');
 setNewName('');
 setNewPassword('');
 setNewInstrument('');
 onRefreshUsers();
 setActiveTab('list');
 } catch (err: any) {
 setError(err.message || 'Error en el servidor');
 } finally {
 setLoading(false);
 }
 };

 const handleChangeRole = async (userId: string, newRole: UserRole, username: string) => {
 setLoading(true);
 setError(null);
 setSuccessMsg(null);

 try {
 const response = await fetch(`/api/users/${userId}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ role: newRole })
 });

 const data = await response.json();

 if (!response.ok) {
 throw new Error(data.error || 'Error al actualizar el rol');
 }

 setSuccessMsg(`Rol cambiado a ${newRole === 'leader' ? 'Admin / Mánager' : 'Miembro (Músico)'} para @${username}`);
 onRefreshUsers();
 } catch (err: any) {
 setError(err.message || 'Error al actualizar rol');
 } finally {
 setLoading(false);
 }
 };

 const handleChangePassword = async (userId: string) => {
 if (!changePasswordValue || changePasswordValue.trim().length < 3) {
 setError('La nueva contraseña debe tener al menos 3 caracteres.');
 return;
 }

 setLoading(true);
 setError(null);
 setSuccessMsg(null);

 try {
 const response = await fetch(`/api/users/${userId}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ newPassword: changePasswordValue.trim() })
 });

 const data = await response.json();

 if (!response.ok) {
 throw new Error(data.error || 'Error al actualizar contraseña');
 }

 setSuccessMsg(`Contraseña actualizada para @${data.username}`);
 setEditingUserId(null);
 setChangePasswordValue('');
 onRefreshUsers();
 } catch (err: any) {
 setError(err.message || 'Error en el servidor');
 } finally {
 setLoading(false);
 }
 };

 const handleDeleteUser = async (userId: string, username: string) => {
 if (!window.confirm(`¿Estás seguro de eliminar el acceso para @${username}?`)) {
 return;
 }

 setLoading(true);
 setError(null);
 setSuccessMsg(null);

 try {
 const response = await fetch(`/api/users/${userId}`, {
 method: 'DELETE'
 });

 const data = await response.json();

 if (!response.ok) {
 throw new Error(data.error || 'Error al eliminar usuario');
 }

 setSuccessMsg(`Usuario @${username} eliminado correctamente.`);
 onRefreshUsers();
 } catch (err: any) {
 setError(err.message || 'Error al eliminar');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
 <div 
 className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
 isStitchLight 
 ? 'bg-white -slate-200 text-slate-800' 
 : 'bg-neutral-900 -neutral-800 text-neutral-100'
 }`}
 >
 {/* Modal Header */}
 <div className={`px-6 py-4 flex justify-between items-center ${
 isStitchLight ? '-slate-200 bg-slate-50' : '-neutral-800 bg-neutral-950/60'
 }`}>
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-xl bg-indigo-500/10 -indigo-500/20 text-indigo-400 flex items-center justify-center">
 <Users className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold font-display uppercase tracking-wider text-base flex items-center gap-2">
 <span>Gestión de Miembros de la Banda</span>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 -indigo-500/30">
 Panel Admin
 </span>
 </h3>
 <p className="text-[11px] text-neutral-400 font-mono">
 Crea cuentas, administra roles y gestiona contraseñas para el equipo
 </p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Tab Selection */}
 <div className={`px-6 pt-3 flex gap-2 ${
 isStitchLight ? '-slate-200 bg-slate-50/50' : '-neutral-800/80 bg-neutral-900/40'
 }`}>
 <button
 onClick={() => { setActiveTab('list'); setError(null); setSuccessMsg(null); }}
 className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 ${
 activeTab === 'list'
 ? '-indigo-400 text-indigo-400'
 : '-transparent text-neutral-400 hover:text-neutral-200'
 }`}
 >
 <Users className="w-3.5 h-3.5" />
 <span>Lista de Miembros ({users.length})</span>
 </button>
 <button
 onClick={() => { setActiveTab('create'); setError(null); setSuccessMsg(null); }}
 className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 ${
 activeTab === 'create'
 ? '-indigo-400 text-indigo-400'
 : '-transparent text-neutral-400 hover:text-neutral-200'
 }`}
 >
 <UserPlus className="w-3.5 h-3.5" />
 <span>+ Nuevo Músico</span>
 </button>
 </div>

 {/* Messages */}
 <div className="px-6 pt-3">
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
 </div>

 {/* Tab Body */}
 <div className="p-6 overflow-y-auto flex-1 space-y-4">
 {activeTab === 'list' ? (
 <div className="space-y-3">
 {users.map((u) => {
 const isLeader = u.role === 'leader';
 const isSelf = u.id === currentUser.id;
 const isEditingThisUser = editingUserId === u.id;

 return (
 <div
 key={u.id}
 className={`p-4 rounded-xl transition-all ${
 isStitchLight 
 ? 'bg-slate-50 -slate-200/80 hover:-slate-300' 
 : 'bg-neutral-950/60 -neutral-800/80 hover:-neutral-700/80'
 }`}
 >
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <div
 className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner uppercase font-mono text-sm shrink-0"
 style={{ backgroundColor: u.avatarColor || '#10b981' }}
 >
 {u.name.slice(0, 2)}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <strong className="font-bold text-sm font-sans">{u.name}</strong>
 <span className="text-xs text-neutral-400 font-mono">@{u.username}</span>
 {isLeader ? (
 <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-[#d1b375]/15 text-[#d1b375] -amber-500/30 flex items-center gap-1">
 <Shield className="w-2.5 h-2.5" />
 <span>Admin</span>
 </span>
 ) : (
 <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-sky-500/15 text-sky-400 -blue-500/30">
 Miembro
 </span>
 )}
 {isSelf && (
 <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-[#10b981]/15 text-[#10b981]">
 Tú
 </span>
 )}
 </div>
 <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
 <span className="flex items-center gap-1">
 <Music className="w-3 h-3 text-emerald-400" />
 <span>{u.instrument || 'Músico'}</span>
 </span>
 </div>
 </div>
 </div>

 {/* User Actions */}
 <div className="flex flex-wrap items-center gap-2">
 {/* Role Select Dropdown */}
 <select
 value={u.role || 'member'}
 onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole, u.username)}
 disabled={loading || isSelf}
 title={isSelf ?"No puedes cambiar tu propio rol desde aquí" :"Cambiar rol del usuario"}
 className={`px-2 py-1.5 rounded-lg text-xs font-mono font-bold outline-none cursor-pointer transition-all ${
 u.role === 'leader'
 ? 'bg-[#d1b375]/15 text-[#d1b375] -amber-500/40 hover:bg-amber-500/25'
 : 'bg-neutral-900 text-blue-300 -blue-500/30 hover:bg-neutral-800'
 } ${isSelf ? 'opacity-70 cursor-not-allowed' : ''}`}
 >
 <option value="member" className="bg-neutral-900 text-neutral-200">Rol: Miembro</option>
 <option value="leader" className="bg-neutral-900 text-amber-300">Rol: Admin</option>
 </select>

 <button
 type="button"
 onClick={() => {
 if (isEditingThisUser) {
 setEditingUserId(null);
 } else {
 setEditingUserId(u.id);
 setChangePasswordValue('');
 }
 }}
 className="px-2.5 py-1.5 rounded-lg -neutral-700/80 text-xs font-mono hover:bg-neutral-800 text-neutral-300 transition-colors flex items-center gap-1 cursor-pointer"
 >
 <Key className="w-3 h-3 text-amber-400" />
 <span>{isEditingThisUser ? 'Cancelar' : 'Contraseña'}</span>
 </button>

 {!isSelf && (
 <button
 type="button"
 onClick={() => handleDeleteUser(u.id, u.username)}
 className="p-1.5 rounded-lg -rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
 title="Eliminar usuario"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>

 {/* Quick Password Reset Subform */}
 {isEditingThisUser && (
 <div className="mt-3 pt-3 -neutral-800/80 flex items-center gap-2 animate-in fade-in duration-200">
 <input
 type="text"
 value={changePasswordValue}
 onChange={(e) => setChangePasswordValue(e.target.value)}
 placeholder="Nueva contraseña secreta..."
 className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-mono outline-none ${
 isStitchLight ? 'bg-white -slate-200' : 'bg-neutral-900 -neutral-700'
 }`}
 />
 <button
 type="button"
 onClick={() => handleChangePassword(u.id)}
 disabled={loading}
 className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors flex items-center gap-1"
 >
 <Check className="w-3.5 h-3.5" />
 <span>Guardar</span>
 </button>
 </div>
 )}
 </div>
 );
 })}
 </div>
 ) : (
 /* Create User Form */
 <form onSubmit={handleCreateUser} className="space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-1">
 <label className="text-xs font-mono font-semibold text-neutral-400">
 Usuario (para login) *
 </label>
 <input
 type="text"
 value={newUsername}
 onChange={(e) => setNewUsername(e.target.value)}
 placeholder="Ej: pablo, carlos, ana"
 className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-800'
 }`}
 required
 />
 </div>

 <div className="space-y-1">
 <label className="text-xs font-mono font-semibold text-neutral-400">
 Nombre Completo *
 </label>
 <input
 type="text"
 value={newName}
 onChange={(e) => setNewName(e.target.value)}
 placeholder="Ej: Pablo (Violín / Sintetizador)"
 className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-800'
 }`}
 required
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-1">
 <label className="text-xs font-mono font-semibold text-neutral-400">
 Contraseña Inicial *
 </label>
 <input
 type="text"
 value={newPassword}
 onChange={(e) => setNewPassword(e.target.value)}
 placeholder="Contraseña del usuario"
 className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-800'
 }`}
 required
 />
 </div>

 <div className="space-y-1">
 <label className="text-xs font-mono font-semibold text-neutral-400">
 Rol en la App
 </label>
 <select
 value={newRole}
 onChange={(e) => setNewRole(e.target.value as UserRole)}
 className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-800'
 }`}
 >
 <option value="member">Miembro de Banda (Músico)</option>
 <option value="leader">Admin / Dirección de Banda</option>
 </select>
 </div>
 </div>

 <div className="space-y-1">
 <label className="text-xs font-mono font-semibold text-neutral-400">
 Instrumento / Puesto
 </label>
 <input
 type="text"
 value={newInstrument}
 onChange={(e) => setNewInstrument(e.target.value)}
 placeholder="Ej: Violín, Percusión, Batería, Sintetizador, Técnico de Sonido"
 className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-800'
 }`}
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-mono font-semibold text-neutral-400">
 Color Identificador
 </label>
 <div className="flex items-center gap-2">
 {colors.map((c) => (
 <button
 key={c}
 type="button"
 onClick={() => setNewAvatarColor(c)}
 className={`w-7 h-7 rounded-full transition-transform ${
 newAvatarColor === c ? 'scale-110 -white ring-2 ring-emerald-500' : '-transparent opacity-75 hover:opacity-100'
 }`}
 style={{ backgroundColor: c }}
 />
 ))}
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-md shadow-amber-500/10 active:scale-98"
 >
 {loading ? (
 <span>Creando miembro...</span>
 ) : (
 <>
 <UserPlus className="w-4 h-4" />
 <span>Crear e Inscribir Nuevo Miembro</span>
 </>
 )}
 </button>
 </form>
 )}
 </div>

 {/* Modal Footer */}
 <div className={`px-6 py-3 text-right ${
 isStitchLight ? '-slate-200 bg-slate-50' : '-neutral-800 bg-neutral-950/60'
 }`}>
 <button
 onClick={onClose}
 className="px-4 py-1.5 rounded-lg text-xs font-mono -neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
 >
 Cerrar Panel
 </button>
 </div>
 </div>
 </div>
 );
};
