import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, Rehearsal, Concert, SocialPost, Payment, Message, ThemeName, ThemeColors, SocialMetric, User } from './types';
import { THEMES } from './utils/theme';
import Dashboard from './components/Dashboard';
import BookingCRM from './components/BookingCRM';
import BandCRM from './components/BandCRM';
import CalendarView from './components/CalendarView';
import ReelsCenter from './components/ReelsCenter';
import Finanzas from './components/Finanzas';
import TourManager from './components/TourManager';
import RepertorioSetlists from './components/RepertorioSetlists';
import Chatbot from './components/Chatbot';
import GithubWorkflowTracker from './components/GithubWorkflowTracker';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { UserProfileModal } from './components/UserProfileModal';
import { FontSelectorModal } from './components/FontSelectorModal';
import { FontPresetKey, applyFontPreset, getStoredFontPreset } from './utils/typography';
import { 
 Menu, Music, Sparkles, LogOut, ShieldAlert, Users, Shield, UserCheck,
 Table, FileCheck, CheckSquare, MessageSquareCode, RefreshCw,
 Settings, Key, Github, X, CalendarRange, Bot, Flame, Video, FileSpreadsheet, Coins, Disc3, Radio, Building2, Type, Truck
} from 'lucide-react';

export default function App() {
 const [currentUser, setCurrentUser] = useState<User | null>(() => {
 const savedUser = localStorage.getItem('bakandeya_user');
 return savedUser ? JSON.parse(savedUser) : null;
 });
 const [authToken, setAuthToken] = useState<string | null>(() => {
 return localStorage.getItem('bakandeya_token') || null;
 });
 const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
 return !!localStorage.getItem('bakandeya_token') || localStorage.getItem('bakandeya_logged_in') === 'true';
 });
 const [bandUsers, setBandUsers] = useState<User[]>([]);
 const [showUserManagementModal, setShowUserManagementModal] = useState(false);
 const [showUserProfileModal, setShowUserProfileModal] = useState(false);

 // Active View State mapping directly to the Stitch Design doc
 const [currentView, setCurrentView] = useState<'resumen' | 'booking' | 'medios' | 'bandas' | 'calendario' | 'reels' | 'repertorio' | 'finanzas' | 'chat' | 'giras'>('resumen');
 const [bookingOptions, setBookingOptions] = useState<{
 sectionTab?: 'salas' | 'medios';
 statusFilter?: LeadStatus | 'todos';
 selectedLeadId?: string;
 selectedEventId?: string;
 selectedDate?: string;
 }>({});

 const handleNavigate = (
 view: 'resumen' | 'booking' | 'medios' | 'bandas' | 'calendario' | 'reels' | 'repertorio' | 'finanzas' | 'chat',
 options?: {
 sectionTab?: 'salas' | 'medios';
 statusFilter?: LeadStatus | 'todos';
 selectedLeadId?: string;
 selectedEventId?: string;
 selectedDate?: string;
 }
 ) => {
 setCurrentView(view);
 if (options) {
 setBookingOptions(options);
 } else if (view === 'medios') {
 setBookingOptions({ sectionTab: 'medios', statusFilter: 'todos' });
 } else if (view === 'booking') {
 setBookingOptions({ sectionTab: 'salas', statusFilter: 'todos' });
 } else {
 setBookingOptions({});
 }
 };

 // Application Data States
 const [leads, setLeads] = useState<Lead[]>([]);
 const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
 const [tours, setTours] = useState<any[]>([]);
 const [concerts, setConcerts] = useState<Concert[]>([]);
 const [posts, setPosts] = useState<SocialPost[]>([]);
 const [payments, setPayments] = useState<Payment[]>([]);
 const [messages, setMessages] = useState<Message[]>([]);
 const [metrics, setMetrics] = useState<SocialMetric[]>([]);

 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 const [isLoading, setIsLoading] = useState(true);
 const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('syncing');

 // Admin check: Any user with role 'leader' is an Admin
 const isAdmin = Boolean(
 currentUser &&
 currentUser.role === 'leader'
 );

 // Redirect non-admins away from finanzas if they end up there
 useEffect(() => {
 if (!isAdmin && (currentView as string) === 'finanzas') {
 setCurrentView('resumen');
 }
 }, [isAdmin, currentView]);

 // Verify token on mount if present
 useEffect(() => {
 if (authToken) {
 fetch('/api/auth/me', {
 headers: { Authorization: `Bearer ${authToken}` }
 })
 .then(res => {
 if (!res.ok) throw new Error('Sesión no válida');
 return res.json();
 })
 .then(data => {
 setCurrentUser(data.user);
 localStorage.setItem('bakandeya_user', JSON.stringify(data.user));
 setIsLoggedIn(true);
 })
 .catch(() => {
 setCurrentUser(null);
 setAuthToken(null);
 setIsLoggedIn(false);
 localStorage.removeItem('bakandeya_token');
 localStorage.removeItem('bakandeya_user');
 });
 }
 }, [authToken]);

 // Active Theme State
 const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
 return (localStorage.getItem('bakandeya_theme') as ThemeName) || 'indie_velvet';
 });

 // Active Font State
 const [currentFont, setCurrentFont] = useState<FontPresetKey>(getStoredFontPreset);
 const [showFontModal, setShowFontModal] = useState(false);

 useEffect(() => {
 applyFontPreset(currentFont);
 }, [currentFont]);

 const handleFontChange = (newFont: FontPresetKey) => {
 setCurrentFont(newFont);
 applyFontPreset(newFont);
 };

 // GitHub Settings State
 const [showGithubSettings, setShowGithubSettings] = useState(false);
 const [githubPat, setGithubPat] = useState(() => localStorage.getItem('bakandeya_github_pat') || '');
 const [githubOwner, setGithubOwner] = useState(() => localStorage.getItem('bakandeya_github_owner') || 'DiegoCalleB');
 const [githubRepo, setGithubRepo] = useState(() => localStorage.getItem('bakandeya_github_repo') || 'bakandeya-agent-manager');
 const [githubRef, setGithubRef] = useState(() => localStorage.getItem('bakandeya_github_ref') || 'main');

 // Google Sheets check state
 const [showSheetsModal, setShowSheetsModal] = useState(false);
 const [sheetsLoading, setSheetsLoading] = useState(false);
 const [sheetsStatus, setSheetsStatus] = useState<any>(null);

 const checkGoogleSheets = async () => {
 setSheetsLoading(true);
 setShowSheetsModal(true);
 setSheetsStatus(null);
 try {
 const res = await fetch('/api/check-sheets');
 const data = await res.json();
 setSheetsStatus(data);
 } catch (error) {
 console.error("Error verifying Google Sheets:", error);
 setSheetsStatus({
 configured: false,
 error:"No se pudo comunicar con el servidor para verificar las hojas de cálculo."
 });
 } finally {
 setSheetsLoading(false);
 }
 };

 useEffect(() => {
 const handleRefUpdate = () => {
 setGithubRef(localStorage.getItem('bakandeya_github_ref') || 'main');
 };
 const handleAgentCompleted = () => {
 console.log("[App] Agente de GitHub completado. Refrescando datos de Google Sheets...");
 fetchState();
 };
 window.addEventListener('github-ref-updated', handleRefUpdate);
 window.addEventListener('github-agent-completed', handleAgentCompleted);
 return () => {
 window.removeEventListener('github-ref-updated', handleRefUpdate);
 window.removeEventListener('github-agent-completed', handleAgentCompleted);
 };
 }, []);

 const colors: ThemeColors = THEMES[currentTheme];

 // Fetch full state from full-stack Express API with automatic retry
 const fetchState = async (retryCount = 0) => {
 setSyncStatus('syncing');
 try {
 const res = await fetch('/api/state');
 if (!res.ok) throw new Error(`API Error: ${res.status}`);
 const data = await res.json();
 
 setLeads(data.leads || []);
 setRehearsals(data.rehearsals || []);
 setConcerts(data.concerts || []);
 setPosts(data.posts || []);
 setPayments(data.payments || []);
 setMessages(data.messages || []);
 setMetrics(data.metrics || []);
 setBandUsers(data.users || []);
 setSyncStatus('synced');
 } catch (e) {
 console.warn(`Error syncing state (attempt ${retryCount + 1}):`, e);
 if (retryCount < 2) {
 // Retry after delay to handle server wake-up
 setTimeout(() => {
 fetchState(retryCount + 1);
 }, 1500);
 } else {
 console.error('Error syncing state, offline or waking up:', e);
 setSyncStatus('error');
 }
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 if (isLoggedIn) {
 fetchState();
 }
 }, [isLoggedIn]);

 // Persist Theme Selection
 const handleThemeChange = (theme: ThemeName) => {
 setCurrentTheme(theme);
 localStorage.setItem('bakandeya_theme', theme);
 };

 const handleLoginSuccess = (user: User, token: string) => {
 setCurrentUser(user);
 setAuthToken(token);
 localStorage.setItem('bakandeya_token', token);
 localStorage.setItem('bakandeya_user', JSON.stringify(user));
 localStorage.setItem('bakandeya_logged_in', 'true');
 setIsLoggedIn(true);
 fetchState();
 };

 const handleLogout = async () => {
 if (authToken) {
 try {
 await fetch('/api/auth/logout', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ token: authToken })
 });
 } catch (e) {
 console.error(e);
 }
 }
 setCurrentUser(null);
 setAuthToken(null);
 setIsLoggedIn(false);
 localStorage.removeItem('bakandeya_token');
 localStorage.removeItem('bakandeya_user');
 localStorage.removeItem('bakandeya_logged_in');
 };

 const getAuthHeaders = () => {
 const token = localStorage.getItem('bakandeya_token') || authToken;
 return {
 'Content-Type': 'application/json',
 ...(token ? { 'Authorization': `Bearer ${token}` } : {})
 };
 };

 // REST API UPDATE OPERATIONS
 const handleUpdateLead = async (id: string, updatedFields: Partial<Lead>, expectedStatus?: string) => {
 setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updatedFields } : l));
 try {
 const res = await fetch(`/api/leads/${id}`, {
 method: 'PUT',
 headers: getAuthHeaders(),
 body: JSON.stringify({ ...updatedFields, expectedStatus })
 });
 if (res.status === 409) {
 const data = await res.json();
 alert(data.error || 'Conflicto de sincronización con Google Sheets. Los datos han cambiado en paralelo.');
 fetchState();
 return;
 }
 if (!res.ok) {
 const data = await res.json().catch(() => ({}));
 throw new Error(data.error || `HTTP ${res.status}`);
 }
 } catch (e) {
 console.error('Error saving lead updates, reverting:', e);
 fetchState();
 }
 };

 const handleUpdateRehearsal = async (id: string, updatedFields: Partial<Rehearsal>) => {
 setRehearsals(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
 try {
 const res = await fetch(`/api/rehearsals/${id}`, {
 method: 'PUT',
 headers: getAuthHeaders(),
 body: JSON.stringify(updatedFields)
 });
 if (!res.ok) throw new Error();
 } catch (e) {
 console.error('Error saving rehearsal updates:', e);
 fetchState();
 }
 };

 const handleUpdateConcert = async (id: string, updatedFields: Partial<Concert>) => {
 setConcerts(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
 try {
 const res = await fetch(`/api/concerts/${id}`, {
 method: 'PUT',
 headers: getAuthHeaders(),
 body: JSON.stringify(updatedFields)
 });
 if (!res.ok) throw new Error();
 } catch (e) {
 console.error('Error saving concert updates:', e);
 fetchState();
 }
 };

 // REST API ADD CREATION OPERATIONS
 const handleAddLead = async (newLead: Lead) => {
 setLeads(prev => [...prev, newLead]);
 try {
 const res = await fetch('/api/leads', {
 method: 'POST',
 headers: getAuthHeaders(),
 body: JSON.stringify(newLead)
 });
 if (!res.ok) throw new Error();
 } catch (e) {
 console.error('Error adding lead:', e);
 fetchState();
 }
 };

 const handleAddRehearsal = async (reh: Rehearsal) => {
 setRehearsals(prev => [...prev, reh]);
 try {
 const res = await fetch('/api/rehearsals', {
 method: 'POST',
 headers: getAuthHeaders(),
 body: JSON.stringify(reh)
 });
 if (!res.ok) throw new Error();
 } catch (e) {
 console.error('Error adding rehearsal:', e);
 fetchState();
 }
 };

 const handleAddConcert = async (concert: Concert) => {
 setConcerts(prev => [...prev, concert]);
 try {
 const res = await fetch('/api/concerts', {
 method: 'POST',
 headers: getAuthHeaders(),
 body: JSON.stringify(concert)
 });
 if (!res.ok) throw new Error();
 } catch (e) {
 console.error('Error adding concert:', e);
 fetchState();
 }
 };

 const handleAddPost = async (post: SocialPost) => {
 setPosts(prev => [...prev, post]);
 try {
 const res = await fetch('/api/posts', {
 method: 'POST',
 headers: getAuthHeaders(),
 body: JSON.stringify(post)
 });
 if (!res.ok) throw new Error();
 } catch (e) {
 console.error('Error adding social post:', e);
 fetchState();
 }
 };

 const handleUpdatePost = async (id: string, updatedFields: Partial<SocialPost>) => {
 setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
 try {
 const res = await fetch(`/api/posts/${id}`, {
 method: 'PUT',
 headers: getAuthHeaders(),
 body: JSON.stringify(updatedFields)
 });
 if (!res.ok) throw new Error();
 } catch (e) {
 console.error('Error updating social post:', e);
 fetchState();
 }
 };

 const handleAddMetric = async (metric: SocialMetric) => {
 setMetrics(prev => [...prev, metric]);
 try {
 const res = await fetch('/api/metrics', {
 method: 'POST',
 headers: getAuthHeaders(),
 body: JSON.stringify(metric)
 });
 if (!res.ok) throw new Error();
 } catch (e) {
 console.error('Error adding metric:', e);
 fetchState();
 }
 };

 const handleUpdateMetric = async (id: string, updatedFields: Partial<SocialMetric>) => {
 setMetrics(prev => prev.map(m => m.id === id ? { ...m, ...updatedFields } : m));
 try {
 const res = await fetch(`/api/metrics/${id}`, {
 method: 'PUT',
 headers: getAuthHeaders(),
 body: JSON.stringify(updatedFields)
 });
 if (!res.ok) throw new Error();
 } catch (e) {
 console.error('Error updating metric:', e);
 fetchState();
 }
 };

 const handleDeleteMetric = async (id: string) => {
 setMetrics(prev => prev.filter(m => m.id !== id));
 try {
 const res = await fetch(`/api/metrics/${id}`, {
 method: 'DELETE',
 headers: getAuthHeaders()
 });
 if (!res.ok) throw new Error();
 } catch (e) {
 console.error('Error deleting metric:', e);
 fetchState();
 }
 };

 const handleAddPayment = async (pay: Payment) => {
 setPayments(prev => [...prev, pay]);
 try {
 const res = await fetch('/api/payments', {
 method: 'POST',
 headers: getAuthHeaders(),
 body: JSON.stringify(pay)
 });
 if (!res.ok) throw new Error();
 } catch (e) {
 console.error('Error adding payment:', e);
 fetchState();
 }
 };

 const handleUpdatePayment = async (id: string, updatedFields: Partial<Payment>) => {
 setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
 try {
 const res = await fetch(`/api/payments/${id}`, {
 method: 'PUT',
 headers: getAuthHeaders(),
 body: JSON.stringify(updatedFields)
 });
 if (!res.ok) throw new Error();
 } catch (e) {
 console.error('Error updating payment:', e);
 fetchState();
 }
 };

 const handleSaveGithubSettings = (e: React.FormEvent) => {
 e.preventDefault();
 localStorage.setItem('bakandeya_github_pat', githubPat);
 localStorage.setItem('bakandeya_github_owner', githubOwner);
 localStorage.setItem('bakandeya_github_repo', githubRepo);
 localStorage.setItem('bakandeya_github_ref', githubRef);
 setShowGithubSettings(false);
 alert('¡Configuración de GitHub guardada con éxito! Ahora el chatbot y los disparadores usarán estas credenciales de forma segura.');
 };

 // Auth Screen Render
 if (!isLoggedIn) {
 return (
 <LoginModal 
 onLoginSuccess={handleLoginSuccess}
 isStitchLight={currentTheme === 'stitch_light'}
 />
 );
 }

 return (
 <div 
 className={`min-h-screen ${colors.bg} flex flex-col md:flex-row transition-colors duration-500 font-sans w-full max-w-[100vw] overflow-x-hidden`}
 >
 {/* LEFT SIDEBAR */}
 {/* MOBILE TOP BAR */}
 <header className="md:hidden flex flex-col bg-[#121110] -[#22211F] sticky top-0 z-30 shrink-0">
 {/* Top Brand & Menu Row */}
 <div className="flex items-center justify-between px-4 pt-3 pb-2">
 <div className="flex items-center gap-3">
 <img 
 src="/logo_bakandeya.jpg" 
 alt="Bakandeya Logo" 
 className="w-8 h-8 object-cover rounded-lg -neutral-700/80 shrink-0"
 referrerPolicy="no-referrer"
 />
 <div className="flex flex-col">
 <div className="flex items-center gap-2">
 <h1 className="text-sm font-bold font-display tracking-wider uppercase text-zinc-100 leading-none">
 BAKANDEYA
 </h1>
 <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${syncStatus === 'synced' ? 'bg-emerald-400/20' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-zinc-400 animate-pulse'}`} />
 </div>
 <span className="text-[10px] text-[#9a9591] font-sans mt-0.5">Banda activa</span>
 </div>
 </div>
 <button
 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
 className="p-2 text-neutral-300 hover:text-white rounded-lg bg-[#1A1918] -[#22211F] cursor-pointer active:scale-95 transition-all"
 aria-label="Menu"
 >
 {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
 </button>
 </div>

 {/* Horizontal Quick Tabs Bar */}
 <div className="flex items-center gap-1.5 px-3 pb-2.5 overflow-x-auto no-scrollbar scroll-smooth">
 {(() => {
 const isMedio = (l: Lead) => {
 if (!l.tipo) return false;
 const s = String(l.tipo).trim().toLowerCase();
 return s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc');
 };
 const isBanda = (l: Lead) => {
 if (!l.tipo) return false;
 const s = String(l.tipo).trim().toLowerCase();
 return s === 'grupo' || s.includes('grup') || s.includes('banda') || s.includes('artist') || s.includes('musico') || s.includes('músico');
 };
 return [
 { id: 'resumen', label: 'Resumen', icon: Table },
 { id: 'booking', label: 'Booking', icon: Building2, badge: leads.filter(l => !isMedio(l) && !isBanda(l)).length },
 { id: 'medios', label: 'Medios', icon: Radio, badge: leads.filter(l => isMedio(l)).length },
 { id: 'calendario', label: 'Calendario', icon: CalendarRange, badge: (() => {
 const today = new Date().toISOString().split('T')[0];
 return [...concerts, ...rehearsals].filter(e => (e as any).fecha >= today).length;
 })() },
 { id: 'bandas', label: 'Bandas', icon: Users },
 { id: 'giras', label: 'Giras', icon: Truck },
 { id: 'reels', label: 'Reels', icon: Video },
 { id: 'repertorio', label: 'Temas', icon: Disc3 },
 ...(isAdmin ? [{ id: 'finanzas', label: 'Finanzas', icon: Coins }] : []),
 ];
 })().map((item) => {
 const isSelected = currentView === item.id;
 const IconComp = item.icon;
 return (
 <button
 key={`top-tab-${item.id}`}
 onClick={() => handleNavigate(item.id as any)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-95 ${
 isSelected
 ? 'bg-zinc-800 text-zinc-100 -zinc-700 font-bold shadow-xs'
 : 'bg-[#1A1918] text-neutral-300 -[#22211F] hover:bg-[#22211F] hover:text-white'
 }`}
 >
 <IconComp className="w-3.5 h-3.5 shrink-0" />
 <span>{item.label}</span>
 {item.badge !== undefined && item.badge > 0 && (
 <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
 isSelected ? 'bg-zinc-700 text-zinc-300' : 'bg-[#2b2927] text-zinc-400'
 }`}>
 {item.badge}
 </span>
 )}
 </button>
 );
 })}
 </div>
 </header>

 {/* MOBILE SLIDE-OVER DRAWER */}
 {isMobileMenuOpen && (
 <div className="md:hidden fixed inset-0 z-50 flex">
 {/* Backdrop */}
 <div 
 className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
 onClick={() => setIsMobileMenuOpen(false)}
 />
 {/* Drawer panel */}
 <div className="relative w-[280px] max-w-[85vw] bg-[#121110] -[#22211F] flex flex-col h-full z-10 overflow-y-auto shadow-2xl">
 {/* Drawer Header */}
 <div className="p-4 flex items-center justify-between -[#22211F]/50 bg-gradient-to-b from-[#1A1918] to-[#121110]">
 <div className="flex items-center gap-2.5">
 <img 
 src="/logo_bakandeya.jpg" 
 alt="Bakandeya Logo" 
 className="w-10 h-10 object-cover rounded-xl -neutral-700/80 shrink-0"
 referrerPolicy="no-referrer"
 />
 <div className="flex flex-col">
 <h1 className="text-base font-bold font-display tracking-wider uppercase text-zinc-100 leading-none">
 BAKANDEYA
 </h1>
 <div className="flex items-center gap-1.5 mt-1">
 <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${syncStatus === 'synced' ? 'bg-emerald-400/20' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-zinc-400 animate-pulse'}`} />
 <span className="text-[10px] font-sans text-[#9a9591]">Banda activa</span>
 </div>
 </div>
 </div>
 <button
 onClick={() => setIsMobileMenuOpen(false)}
 className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-[#22211F] cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Drawer Nav */}
 <nav className="flex flex-col gap-1 px-3 pt-3 flex-1">
 {(() => {
 const isMedio = (l: Lead) => {
 if (!l.tipo) return false;
 const s = String(l.tipo).trim().toLowerCase();
 return s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc');
 };
 const isBanda = (l: Lead) => {
 if (!l.tipo) return false;
 const s = String(l.tipo).trim().toLowerCase();
 return s === 'grupo' || s.includes('grup') || s.includes('banda') || s.includes('artist') || s.includes('musico') || s.includes('músico');
 };
 return [
 { id: 'resumen', label: 'Resumen', icon: Table },
 { id: 'booking', label: 'Booking Salas', icon: Building2, badge: leads.filter(l => !isMedio(l) && !isBanda(l)).length },
 { id: 'medios', label: 'Medios y Prensa', icon: Radio, badge: leads.filter(l => isMedio(l)).length },
 { id: 'bandas', label: 'Bandas Amigas', icon: Users },
 { id: 'calendario', label: 'Calendario', icon: CalendarRange, badge: (() => {
 const today = new Date().toISOString().split('T')[0];
 return [...concerts, ...rehearsals].filter(e => (e as any).fecha >= today).length;
 })() },
 { id: 'giras', label: 'Tour Manager', icon: Truck },
 { id: 'reels', label: 'Reels Center', icon: Video },
 { id: 'repertorio', label: 'Repertorio', icon: Disc3 },
 ...(isAdmin ? [{ id: 'finanzas', label: 'Finanzas', icon: Coins }] : []),
 ];
 })().map((item) => {
 const isSelected = currentView === item.id;
 const IconComp = item.icon;
 return (
 <button
 key={`mob-nav-${item.id}`}
 onClick={() => handleNavigate(item.id as any)}
 className={`flex items-center justify-between py-3 px-3.5 rounded-xl text-sm font-sans transition-colors cursor-pointer ${
 isSelected 
 ? 'bg-zinc-800/80 text-zinc-100 font-bold -zinc-700'
 : 'text-neutral-300 hover:bg-[#22211f] hover:text-white'
 }`}
 >
 <div className="flex items-center gap-3">
 <IconComp className="w-4 h-4 shrink-0" />
 <span className="whitespace-nowrap">{item.label}</span>
 </div>
 {item.badge !== undefined && (
 <span className={`text-xs px-2 py-0.5 rounded-md font-sans font-bold ${
 isSelected ? 'bg-zinc-700 text-zinc-300' : 'bg-[#22211F] text-neutral-400'
 }`}>
 {item.badge}
 </span>
 )}
 </button>
 );
 })}
 </nav>

 {/* Drawer User Footer */}
 <div className="p-4 mt-auto -[#22211F]/50">
 {currentUser && (
 <button 
 onClick={() => { setShowUserProfileModal(true); setIsMobileMenuOpen(false); }}
 className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-[#22211F] transition-colors cursor-pointer text-left -transparent hover:-[#333130] mb-4"
 >
 <div 
 className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[#121110] text-xs font-sans shrink-0 uppercase"
 style={{ backgroundColor: currentUser.avatarColor || '#eab308' }}
 >
 {currentUser.name.slice(0, 2)}
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-[13px] font-bold font-sans text-zinc-100 truncate">
 {currentUser.name}
 </span>
 <span className="text-[11px] font-sans text-[#9a9591] truncate">
 {isAdmin ? 'Mánager' : currentUser.instrument || 'Músico'}
 </span>
 </div>
 </button>
 )}
 <div className="flex items-center justify-between px-2">
 <div className="flex items-center gap-2">
 <img 
 src="/logo_bandmanager_symbol.svg" 
 alt="BandManager.ai" 
 className="w-7 h-7 object-contain shrink-0 transition-all cursor-pointer"
 referrerPolicy="no-referrer"
 />
 <div className="flex flex-col text-left">
 <span className="text-[9px] font-bold font-display tracking-wider text-neutral-400 uppercase leading-none">
 BANDMANAGER<span className="text-neutral-500 font-sans lowercase text-[8px]">.ai</span>
 </span>
 </div>
 </div>
 <button
 onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
 className="p-1.5 text-neutral-500 hover:text-rose-300 rounded-lg hover:bg-[#22211F] transition-colors cursor-pointer"
 title="Cerrar Sesión"
 >
 <LogOut className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 <aside className="hidden md:flex w-[240px] shrink-0 bg-[#121110] -[#22211F] flex-col h-screen sticky top-0 overflow-y-auto">
 
 {/* Brand Header */}
 <div className="p-6 flex flex-col gap-4 items-center text-center -[#22211F]/50 bg-gradient-to-b from-[#1A1918] to-[#121110]">
 <img 
 src="/logo_bakandeya.jpg" 
 alt="Bakandeya Logo" 
 className="w-40 h-40 xl:w-48 xl:h-48 object-cover rounded-2xl shadow-xl shadow-black/50 -[#333130] shrink-0"
 referrerPolicy="no-referrer"
 />
 <div className="flex flex-col items-center">
 <h1 className="text-[22px] font-black font-display tracking-widest uppercase text-zinc-100 leading-none">
 BAKANDEYA
 </h1>
 <div className="flex items-center justify-center gap-2 mt-3 bg-[#1A1918] px-3 py-1.5 rounded-full -[#333130] shadow-inner">
 <span className={`w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor] ${syncStatus === 'synced' ? 'bg-emerald-400/20 text-[#73c991]/20' : syncStatus === 'error' ? 'bg-rose-500/15 text-rose-400' : 'bg-zinc-400 text-zinc-400 animate-pulse'}`} />
 <span className="text-[10px] font-sans text-[#9a9591] uppercase tracking-wider font-bold">Banda activa</span>
 </div>
 </div>
 </div>

 {/* Navigation */}
 <nav className="flex flex-col gap-0.5 px-3 pt-2 flex-1">
 {(() => {
 const isMedio = (l: Lead) => {
 if (!l.tipo) return false;
 const s = String(l.tipo).trim().toLowerCase();
 return s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc');
 };
 const isBanda = (l: Lead) => {
 if (!l.tipo) return false;
 const s = String(l.tipo).trim().toLowerCase();
 return s === 'grupo' || s.includes('grup') || s.includes('banda') || s.includes('artist') || s.includes('musico') || s.includes('músico');
 };

 return [
 { id: 'resumen', label: 'Resumen', icon: Table },
 { id: 'booking', label: 'Booking Salas', icon: Building2, badge: leads.filter(l => !isMedio(l) && !isBanda(l)).length },
 { id: 'medios', label: 'Medios y Prensa', icon: Radio, badge: leads.filter(l => isMedio(l)).length },
 { id: 'bandas', label: 'Bandas Amigas', icon: Users },
 { id: 'calendario', label: 'Calendario', icon: CalendarRange, badge: (() => {
 const today = new Date().toISOString().split('T')[0];
 return [...concerts, ...rehearsals].filter(e => (e as any).fecha >= today).length;
 })() },
 { id: 'giras', label: 'Tour Manager', icon: Truck },
 { id: 'reels', label: 'Reels Center', icon: Video },
 { id: 'repertorio', label: 'Repertorio', icon: Disc3 },
 ...(isAdmin ? [{ id: 'finanzas', label: 'Finanzas', icon: Coins }] : []),
 ];
 })().map((item) => {
 const isSelected = currentView === item.id;
 const IconComp = item.icon;
 
 return (
 <button
 id={`nav-btn-${item.id}`}
 key={item.id}
 onClick={() => handleNavigate(item.id as any)}
 className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-[13px] font-sans transition-colors cursor-pointer ${
 isSelected 
 ? 'bg-zinc-800/80 text-zinc-100 font-bold -zinc-700'
 : 'text-neutral-300 hover:bg-[#22211f] hover:text-white'
 }`}
 >
 <div className="flex items-center gap-3">
 <IconComp className="w-4 h-4 shrink-0" />
 <span className="whitespace-nowrap">{item.label}</span>
 </div>
 {item.badge !== undefined && (
 <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-bold ${
 isSelected ? 'text-zinc-300' : 'text-neutral-400'
 }`}>
 {item.badge}
 </span>
 )}
 </button>
 );
 })}
 </nav>

 {/* Bottom User Profile */}
 <div className="p-4 mt-auto -[#22211F]/50">
 {currentUser && (
 <button 
 onClick={() => setShowUserProfileModal(true)}
 className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-[#22211F] transition-colors cursor-pointer text-left -transparent hover:-[#333130] mb-4"
 >
 <div 
 className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[#121110] text-xs font-sans shrink-0 uppercase"
 style={{ backgroundColor: currentUser.avatarColor || '#eab308' }}
 >
 {currentUser.name.slice(0, 2)}
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-[13px] font-bold font-sans text-zinc-100 truncate">
 {currentUser.name}
 </span>
 <span className="text-[11px] font-sans text-[#9a9591] truncate">
 {isAdmin ? 'Mánager' : currentUser.instrument || 'Músico'}
 </span>
 </div>
 </button>
 )}

 <div className="flex items-center justify-between px-2">
 <div className="flex items-center gap-2">
 <img 
 src="/logo_bandmanager_symbol.svg" 
 alt="BandManager.ai" 
 className="w-7 h-7 object-contain shrink-0 transition-all cursor-pointer"
 referrerPolicy="no-referrer"
 />
 <div className="flex flex-col text-left">
 <span className="text-[9px] font-bold font-display tracking-wider text-neutral-400 uppercase leading-none">
 BANDMANAGER<span className="text-neutral-500 font-sans lowercase text-[8px]">.ai</span>
 </span>
 </div>
 </div>
 <button
 onClick={handleLogout}
 className="p-1.5 text-neutral-500 hover:text-rose-300 rounded-lg hover:bg-[#22211F] transition-colors cursor-pointer"
 title="Cerrar Sesión"
 >
 <LogOut className="w-4 h-4" />
 </button>
 </div>
 </div>
 </aside>

 {/* Main Content Area */}
 <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A] p-3 sm:p-5 md:p-8">
 {/* Sync warning if backend fails */}
 {syncStatus === 'error' && (
 <div className="mb-4 p-3 bg-rose-500/10 -rose-500/20 rounded-lg text-rose-300 text-xs flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
 <div className="flex gap-2 items-center">
 <ShieldAlert className="w-5 h-5 text-rose-300 shrink-0" />
 <span>
 <strong>Modo Simulación Activo:</strong> No se pudo conectar con el servidor Express backend local. Los cambios actuales se almacenarán temporalmente en memoria.
 </span>
 </div>
 <button
 onClick={fetchState}
 className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 -rose-500/20 text-rose-300 font-mono text-[10px] rounded-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
 >
 Reintentar Conexión
 </button>
 </div>
 )}

 {/* Dynamic Views */}
 <div className="flex-1 h-full min-h-[500px] flex flex-col">
 {isLoading ? (
 <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
 <RefreshCw className="w-8 h-8 animate-spin text-[#f2ca50]" />
 <p className="text-xs text-neutral-400 font-mono">Cargando base de datos Bakandeya...</p>
 </div>
 ) : (
 <>
 {currentView === 'resumen' && (
 <Dashboard 
 leads={leads} 
 colors={colors}
 onUpdateLead={handleUpdateLead}
 onAddLead={handleAddLead}
 metrics={metrics}
 concerts={concerts}
 rehearsals={rehearsals}
 onNavigate={handleNavigate}
 />
 )}
 {(currentView === 'booking' || currentView === 'medios') && (
 <BookingCRM 
 leads={leads} 
 colors={colors}
 onUpdateLead={handleUpdateLead}
 onAddLead={handleAddLead}
 initialSection={bookingOptions.sectionTab || (currentView === 'medios' ? 'medios' : 'salas')}
 initialStatusFilter={bookingOptions.statusFilter || 'todos'}
 initialSelectedLeadId={bookingOptions.selectedLeadId}
 />
 )}
 {currentView === 'bandas' && (
 <BandCRM 
 colors={colors}
 leads={leads}
 onAddLead={handleAddLead}
 onUpdateLead={handleUpdateLead}
 />
 )}
 {currentView === 'calendario' && (
 <CalendarView 
 colors={colors}
 rehearsals={rehearsals}
 concerts={concerts}
 onUpdateRehearsal={handleUpdateRehearsal}
 onUpdateConcert={handleUpdateConcert}
 onAddRehearsal={handleAddRehearsal}
 onAddConcert={handleAddConcert}
 initialSelectedEventId={bookingOptions.selectedEventId}
 initialSelectedDate={bookingOptions.selectedDate}
 />
 )}
 {currentView === 'reels' && (
 <ReelsCenter 
 colors={colors}
 posts={posts}
 onAddPost={handleAddPost}
 onUpdatePost={handleUpdatePost}
 metrics={metrics}
 onAddMetric={handleAddMetric}
 onUpdateMetric={handleUpdateMetric}
 onDeleteMetric={handleDeleteMetric}
 />
 )}
 {currentView === 'repertorio' && (
 <RepertorioSetlists 
 colors={colors}
 concerts={concerts}
 rehearsals={rehearsals}
 onUpdateConcert={handleUpdateConcert}
 onUpdateRehearsal={handleUpdateRehearsal}
 />
 )}
 {currentView === 'finanzas' && (
 isAdmin ? (
 <Finanzas 
 colors={colors}
 payments={payments}
 onAddPayment={handleAddPayment}
 onUpdatePayment={handleUpdatePayment}
 />
 ) : (
 <div className={`p-8 rounded-2xl text-center space-y-3 ${colors.card} `}>
 <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
 <h3 className="text-sm font-mono font-bold text-rose-300 uppercase tracking-wider">Acceso Restringido</h3>
 <p className="text-xs text-neutral-400 max-w-md mx-auto">
 El apartado de Finanzas es confidencial y solo está accesible para los administradores de la banda (José y Diego).
 </p>
 </div>
 )
 )}
 {currentView === 'chat' && (
 <Chatbot
 colors={colors}
 leads={leads}
 rehearsals={rehearsals}
 concerts={concerts}
 onUpdateLead={handleUpdateLead}
 onAddRehearsal={handleAddRehearsal}
 onAddConcert={handleAddConcert}
 
 />
 )}
 {currentView === 'giras' && (
 <TourManager
 colors={colors}
 tours={tours}
 concerts={concerts}
 onSaveTour={(tour) => {
 const existingIndex = tours.findIndex(t => t.id === tour.id);
 if (existingIndex >= 0) {
 const newTours = [...tours];
 newTours[existingIndex] = tour;
 setTours(newTours);
 } else {
 setTours([tour, ...tours]);
 }
 }}
 onDeleteTour={(id) => {
 setTours(tours.filter(t => t.id !== id));
 }}
 />
 )}
 </>
 )}
 </div>
 </main>

 {/* GitHub Actions Settings Modal */}
 {showGithubSettings && (
 <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
 <div className={`w-full max-w-xl rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 ${
 currentTheme === 'stitch_light' 
 ? 'bg-white -slate-200 text-slate-800' 
 : 'bg-[#1c1b1b] -[#f2ca50]/30 text-neutral-100'
 }`}>
 <div className={`absolute top-0 right-0 w-40 h-40 xl:w-48 xl:h-48 rounded-full blur-3xl pointer-events-none ${
 currentTheme === 'stitch_light' ? 'bg-indigo-500/5' : 'bg-[#f2ca50]/5'
 }`} />
 
 <div className="flex items-start justify-between">
 <div className="space-y-1">
 <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-bold ${
 currentTheme === 'stitch_light'
 ? 'bg-indigo-50 -indigo-100 text-indigo-600'
 : 'bg-[#f2ca50]/10 -[#f2ca50]/20 text-[#f2ca50]'
 }`}>
 <Github className="w-3 h-3" /> GitHub Actions Integración
 </div>
 <h3 className={`text-lg font-black tracking-wider uppercase font-display ${
 currentTheme === 'stitch_light' ? 'text-slate-900' : 'text-neutral-100'
 }`}>CONFIGURAR AGENTES PYTHON</h3>
 </div>
 <button 
 onClick={() => setShowGithubSettings(false)}
 className={`p-1 rounded-lg transition-colors active:scale-95 ${
 currentTheme === 'stitch_light'
 ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
 : 'hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300'
 }`}
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <p className={`text-xs leading-relaxed ${
 currentTheme === 'stitch_light' ? 'text-slate-500' : 'text-neutral-400'
 }`}>
 Los agentes de Bakandeya (**Scout**, **Scout Descubridor**, **Redactor**, **Enviador** y **Lector de bandeja**) corren de forma independiente usando tareas de Python en GitHub Actions. Configura aquí tus claves de acceso para poder despertarlos y lanzarlos en directo desde el chatbot de este panel de control.
 </p>

 <form onSubmit={handleSaveGithubSettings} className="space-y-4 font-sans">
 <div className="space-y-1.5">
 <label className={`block text-[10px] uppercase font-mono tracking-wider ${
 currentTheme === 'stitch_light' ? 'text-slate-500' : 'text-neutral-400'
 }`}>
 GitHub Personal Access Token (PAT)
 </label>
 <div className="relative">
 <span className={`absolute inset-y-0 left-0 pl-3 flex items-center ${
 currentTheme === 'stitch_light' ? 'text-slate-400' : 'text-neutral-600'
 }`}>
 <Key className="w-4 h-4" />
 </span>
 <input
 type="password"
 value={githubPat}
 onChange={(e) => setGithubPat(e.target.value)}
 placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
 className={`w-full rounded-lg pl-9 pr-3 py-2 text-xs font-mono focus:outline-none ${
 currentTheme === 'stitch_light'
 ? 'bg-slate-50 -slate-200 text-slate-800 focus:-indigo-500 placeholder:text-slate-300'
 : 'bg-neutral-950 -neutral-800 text-neutral-100 focus:-[#f2ca50] placeholder:text-neutral-800'
 }`}
 />
 </div>
 </div>

 <div className="grid grid-cols-3 gap-3">
 <div className="space-y-1.5">
 <label className={`block text-[10px] uppercase font-mono tracking-wider ${
 currentTheme === 'stitch_light' ? 'text-slate-500' : 'text-neutral-400'
 }`}>
 Propietario (Owner)
 </label>
 <input
 type="text"
 required
 value={githubOwner}
 onChange={(e) => setGithubOwner(e.target.value)}
 placeholder="DiegoCalleB"
 className={`w-full rounded-lg px-2.5 py-2 text-xs font-mono focus:outline-none ${
 currentTheme === 'stitch_light'
 ? 'bg-slate-50 -slate-200 text-slate-800 focus:-indigo-500'
 : 'bg-neutral-950 -neutral-800 text-neutral-100 focus:-[#f2ca50]'
 }`}
 />
 </div>
 <div className="space-y-1.5 col-span-1">
 <label className={`block text-[10px] uppercase font-mono tracking-wider ${
 currentTheme === 'stitch_light' ? 'text-slate-500' : 'text-neutral-400'
 }`}>
 Repositorio (Repo)
 </label>
 <input
 type="text"
 required
 value={githubRepo}
 onChange={(e) => setGithubRepo(e.target.value)}
 placeholder="bakandeya-agent-manager"
 className={`w-full rounded-lg px-2.5 py-2 text-xs font-mono focus:outline-none ${
 currentTheme === 'stitch_light'
 ? 'bg-slate-50 -slate-200 text-slate-800 focus:-indigo-500'
 : 'bg-neutral-950 -neutral-800 text-neutral-100 focus:-[#f2ca50]'
 }`}
 />
 </div>
 <div className="space-y-1.5 col-span-1">
 <label className={`block text-[10px] uppercase font-mono tracking-wider ${
 currentTheme === 'stitch_light' ? 'text-slate-500' : 'text-neutral-400'
 }`}>
 Rama / Ref (Branch)
 </label>
 <input
 type="text"
 required
 value={githubRef}
 onChange={(e) => setGithubRef(e.target.value)}
 placeholder="main"
 className={`w-full rounded-lg px-2.5 py-2 text-xs font-mono focus:outline-none ${
 currentTheme === 'stitch_light'
 ? 'bg-slate-50 -slate-200 text-slate-800 focus:-indigo-500'
 : 'bg-neutral-950 -neutral-800 text-neutral-100 focus:-[#f2ca50]'
 }`}
 />
 </div>
 </div>

 <div className={`p-3 rounded-xl flex gap-2.5 items-start ${
 currentTheme === 'stitch_light'
 ? 'bg-slate-50 -slate-200'
 : 'bg-neutral-950 -neutral-800'
 }`}>
 <ShieldAlert className={`w-4 h-4 mt-0.5 shrink-0 ${
 currentTheme === 'stitch_light' ? 'text-indigo-600' : 'text-[#f2ca50]'
 }`} />
 <p className={`text-[10px] leading-relaxed font-mono ${
 currentTheme === 'stitch_light' ? 'text-slate-500' : 'text-neutral-400'
 }`}>
 <strong>Seguridad Local:</strong> Tus credenciales se guardan de forma segura temporal en el almacenamiento local de tu propio navegador (<code className={
 currentTheme === 'stitch_light' ? 'text-indigo-600 font-bold' : 'text-[#f2ca50] font-mono'
 }>localStorage</code>). Nunca se guardan de forma permanente en servidores de terceros ni viajan públicamente.
 </p>
 </div>

 <div className="flex gap-3 pt-2">
 <button
 type="button"
 onClick={() => {
 setGithubPat('');
 setGithubOwner('DiegoCalleB');
 setGithubRepo('bakandeya-agent-manager');
 setGithubRef('main');
 localStorage.removeItem('bakandeya_github_pat');
 localStorage.setItem('bakandeya_github_owner', 'DiegoCalleB');
 localStorage.setItem('bakandeya_github_repo', 'bakandeya-agent-manager');
 localStorage.setItem('bakandeya_github_ref', 'main');
 setShowGithubSettings(false);
 // Dispatch custom event to notify state of ref update
 window.dispatchEvent(new Event('github-ref-updated'));
 alert('Se han borrado los tokens del almacenamiento local.');
 }}
 className={`px-4 py-2 font-mono text-xs rounded-lg transition-all cursor-pointer active:scale-95 ${
 currentTheme === 'stitch_light'
 ? 'bg-slate-50 hover:bg-slate-100 -slate-200 text-slate-500 hover:text-slate-700'
 : 'bg-neutral-950 hover:bg-neutral-800 -neutral-800 hover:-neutral-700 text-neutral-400 hover:text-neutral-200'
 }`}
 >
 Limpiar Claves
 </button>
 <button
 type="submit"
 className={`flex-1 py-2 font-mono font-bold text-xs tracking-wider uppercase rounded-lg transition-all cursor-pointer text-center active:scale-95 ${
 currentTheme === 'stitch_light'
 ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/10'
 : 'bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00] shadow-lg shadow-[#f2ca50]/10'
 }`}
 >
 Guardar Configuración
 </button>
 </div>
 </form>

 {/* Workflow Action runs and Agent activity tracker */}
 <GithubWorkflowTracker
 githubPat={githubPat}
 githubOwner={githubOwner}
 githubRepo={githubRepo}
 githubRef={githubRef}
 colors={colors}
 currentTheme={currentTheme}
 />
 </div>
 </div>
 )}

 {/* Google Sheets Verification Modal */}
 {showSheetsModal && (
 <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
 <div className={`w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden ${
 currentTheme === 'stitch_light' 
 ? 'bg-white -slate-200 text-slate-800' 
 : 'bg-[#121111] -neutral-800 text-neutral-100'
 }`}>
 <div className="flex items-start justify-between">
 <div className="space-y-1">
 <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-bold bg-emerald-400/20/10 -[#73c991]/20/20 text-[#73c991]/20">
 <FileSpreadsheet className="w-3 h-3" /> Estado Google Sheets
 </div>
 <h3 className={`text-lg font-black tracking-wider uppercase font-display ${
 currentTheme === 'stitch_light' ? 'text-slate-900' : 'text-neutral-100'
 }`}>Verificar Conexión</h3>
 </div>
 <button 
 onClick={() => setShowSheetsModal(false)}
 className={`p-1 rounded-lg transition-colors active:scale-95 ${
 currentTheme === 'stitch_light'
 ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
 : 'hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300'
 }`}
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {sheetsLoading ? (
 <div className="flex flex-col items-center justify-center py-8 gap-3">
 <RefreshCw className="w-8 h-8 animate-spin text-[#73c991]/20" />
 <p className="text-xs font-mono text-neutral-400">Consultando hojas en Google Sheets...</p>
 </div>
 ) : sheetsStatus ? (
 <div className="space-y-4">
 {!sheetsStatus.configured ? (
 <div className="p-3.5 bg-rose-500/10 -rose-500/20 rounded-xl space-y-2">
 <p className="text-xs font-bold text-rose-300 font-mono">⚠️ No Configurado</p>
 <p className="text-[11px] leading-relaxed text-rose-300 font-mono">
 {sheetsStatus.error ||"Las variables de credenciales de Google o SPREADSHEET_ID no están presentes en el entorno."}
 </p>
 </div>
 ) : sheetsStatus.error ? (
 <div className="p-3.5 bg-rose-500/10 -rose-500/20 rounded-xl space-y-2">
 <p className="text-xs font-bold text-rose-300 font-mono">⚠️ Error de Autenticación</p>
 <p className="text-[11px] leading-relaxed text-rose-300 font-mono">
 {sheetsStatus.error}
 </p>
 <p className="text-[9px] leading-normal text-neutral-500 font-mono pt-1">
 Comprueba que el archivo de credenciales de Google Service Account sea válido, y que hayas compartido tu hoja con el email de tu Service Account con permisos de"Editor".
 </p>
 </div>
 ) : (
 <div className="space-y-4 font-mono">
 <div className={`p-3 rounded-xl text-[10px] ${
 currentTheme === 'stitch_light' ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-800'
 }`}>
 <p className="text-neutral-500 uppercase tracking-widest text-[9px] mb-1">ID del Spreadsheet</p>
 <p className="font-mono text-neutral-400 truncate">{sheetsStatus.spreadsheetId}</p>
 </div>

 <div className="space-y-2">
 <p className="text-neutral-500 uppercase tracking-widest text-[9px]">Pestañas Requeridas</p>
 
 <div className="space-y-1.5">
 {[
 { key: 'leads', name: 'leads', desc: 'Directorio de salas, medios y contactos' },
 { key: 'ensayos', name: 'ensayos', desc: 'Historial de ensayos' },
 { key: 'conciertos', name: 'conciertos', desc: 'Historial de conciertos' }
 ].map(tab => {
 const exists = sheetsStatus.status[tab.key];
 const wasCreated = (sheetsStatus.created || []).includes(tab.key);

 return (
 <div 
 key={tab.key}
 className={`flex items-center justify-between p-2.5 rounded-xl ${
 exists 
 ? 'bg-emerald-400/20/5 -[#73c991]/20/10' 
 : 'bg-rose-500/5 -rose-500/10'
 }`}
 >
 <div className="min-w-0">
 <p className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
 <span>{tab.name}</span>
 {wasCreated && (
 <span className="text-[8px] font-bold text-[#f2ca50] bg-[#f2ca50]/10 px-1.5 py-0.5 rounded -[#f2ca50]/20">
 ¡CREADA!
 </span>
 )}
 </p>
 <p className="text-[9px] text-neutral-500 leading-none mt-1">{tab.desc}</p>
 </div>

 <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
 exists 
 ? 'bg-emerald-400/20/10 text-[#73c991]/20 -[#73c991]/20/20' 
 : 'bg-rose-500/15 text-rose-400 -rose-500/20'
 }`}>
 {exists ? 'Conectado' : 'Faltante'}
 </span>
 </div>
 );
 })}
 </div>
 </div>

 <p className="text-[9px] leading-relaxed text-neutral-500 text-center italic pt-2">
 Todas las acciones de guardar ensayos y conciertos sincronizan automáticamente de forma directa a sus correspondientes pestañas.
 </p>
 </div>
 )}

 <div className="flex gap-2.5 pt-2">
 <button
 onClick={checkGoogleSheets}
 className={`flex-1 py-2 font-mono text-xs font-bold rounded-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] text-center ${
 currentTheme === 'stitch_light'
 ? 'bg-slate-50 -slate-200 text-slate-700 hover:bg-slate-100'
 : 'bg-neutral-900 -neutral-800 text-neutral-300 hover:bg-neutral-800'
 }`}
 >
 Volver a comprobar
 </button>
 <button
 onClick={() => setShowSheetsModal(false)}
 className={`flex-1 py-2 font-mono text-xs font-bold rounded-lg transition-all cursor-pointer text-center hover:scale-[1.02] active:scale-[0.98] ${
 currentTheme === 'stitch_light'
 ? 'bg-indigo-600 text-white hover:bg-indigo-700'
 : 'bg-emerald-400/20 text-neutral-950 font-black hover:bg-emerald-400/20'
 }`}
 >
 Cerrar panel
 </button>
 </div>
 </div>
 ) : null}
 </div>
 </div>
 )}

 {/* User Management Modal for Band Leader */}
 {showUserManagementModal && isAdmin && (
 <UserManagementModal
 currentUser={currentUser}
 users={bandUsers}
 onClose={() => setShowUserManagementModal(false)}
 onRefreshUsers={fetchState}
 isStitchLight={currentTheme === 'stitch_light'}
 />
 )}

 {/* User Profile & Password Change Modal for All Users */}
 {showUserProfileModal && currentUser && (
 <UserProfileModal
 currentUser={currentUser}
 onClose={() => setShowUserProfileModal(false)}
 onUpdateUser={(updated) => {
 setCurrentUser(updated);
 localStorage.setItem('bakandeya_user', JSON.stringify(updated));
 fetchState();
 }}
 isStitchLight={currentTheme === 'stitch_light'}
 isAdmin={isAdmin}
 onOpenBandManagement={() => setShowUserManagementModal(true)}
 currentTheme={currentTheme}
 onThemeChange={handleThemeChange}
 currentFont={currentFont}
 onFontChange={handleFontChange}
 />
 )}

 {/* Font Selector Modal */}
 {showFontModal && (
 <FontSelectorModal
 onClose={() => setShowFontModal(false)}
 isStitchLight={currentTheme === 'stitch_light'}
 currentFont={currentFont}
 onSelectFont={(f) => {
 handleFontChange(f);
 }}
 />
 )}

 </div>
 );
}
