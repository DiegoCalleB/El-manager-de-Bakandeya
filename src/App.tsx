import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, Rehearsal, Concert, SocialPost, Payment, Message, ThemeName, ThemeColors, SocialMetric, User, Fan } from './types';
import { THEMES } from './utils/theme';
import { useAuth } from './hooks/useAuth';
import { useAppData } from './hooks/useAppData';
import { api } from './services/api';
import Dashboard from './components/Dashboard';
import BookingCRM from './components/BookingCRM';
import BandCRM from './components/BandCRM';
import CalendarView from './components/CalendarView';
import ReelsCenter from './components/ReelsCenter';
import Finanzas from './components/Finanzas';
import TourManager from './components/TourManager';
import RepertorioSetlists from './components/RepertorioSetlists';
import Merchan from './components/Merchan';
import Chatbot from './components/Chatbot';
import GithubWorkflowTracker from './components/GithubWorkflowTracker';
import EPKManager from './components/EPKManager';
import ErrorBoundary from './components/ErrorBoundary';
import FansPanel from './components/FansPanel';
import FansLanding from './components/FansLanding';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { UserProfileModal } from './components/UserProfileModal';
import { FontSelectorModal } from './components/FontSelectorModal';
import { MetronomeModal } from './components/MetronomeModal';
import { FontPresetKey, applyFontPreset, getStoredFontPreset } from './utils/typography';
import { 
  Menu, Music, Sparkles, LogOut, ShieldAlert, Users, Shield, UserCheck,
  Table, FileCheck, CheckSquare, MessageSquareCode, RefreshCw, Clock,
  Settings, Key, Github, X, CalendarRange, Bot, Guitar, Flame, Video, FileSpreadsheet, Coins, Disc3, Radio, Building2, Type, Truck, BookOpen, Heart
} from 'lucide-react';

export default function App() {
  // Authentication Custom Hook
  const {
    currentUser,
    authToken,
    isLoggedIn,
    isAdmin,
    availableBands,
    setCurrentUser,
    handleLoginSuccess,
    handleSwitchBand,
    handleLogout
  } = useAuth();

  // Application Data & Sync Custom Hook
  const {
    leads,
    rehearsals,
    tours,
    concerts,
    posts,
    payments,
    messages,
    metrics,
    bandUsers,
    fans,
    epkConfig,
    isLoading,
    syncStatus,
    fetchState,
    handleUpdateEpkConfig,
    handleUpdateLead,
    handleUpdateRehearsal,
    handleUpdateConcert,
    handleAddLead,
    handleAddRehearsal,
    handleAddConcert,
    handleAddPost,
    handleUpdatePost,
    handleAddMetric,
    handleUpdateMetric,
    handleDeleteMetric,
    handleAddPayment,
    handleUpdatePayment,
    handleSaveTour,
    handleDeleteTour,
    handleAddFan,
    handleDeleteFan,
    handleUpdateIncentive
  } = useAppData(isLoggedIn, currentUser?.band_id);

  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);

  // Active View State mapping directly to the Stitch Design doc
  const [currentView, setCurrentView] = useState<'resumen' | 'booking' | 'medios' | 'bandas' | 'calendario' | 'reels' | 'repertorio' | 'finanzas' | 'chat' | 'giras' | 'merchan' | 'epk' | 'fans'>('resumen');
  const [bookingOptions, setBookingOptions] = useState<{
    sectionTab?: 'salas' | 'medios';
    statusFilter?: LeadStatus | 'todos';
    selectedLeadId?: string;
    selectedEventId?: string;
    selectedDate?: string;
  }>({});

  const handleNavigate = (
    view: 'resumen' | 'booking' | 'medios' | 'bandas' | 'calendario' | 'reels' | 'repertorio' | 'finanzas' | 'chat' | 'giras' | 'merchan' | 'epk' | 'fans',
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showMetronomeModal, setShowMetronomeModal] = useState(false);

  // Redirect non-admins away from finanzas if they end up there
  useEffect(() => {
    if (!isAdmin && (currentView as string) === 'finanzas') {
      setCurrentView('resumen');
    }
  }, [isAdmin, currentView]);

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
      const data = await api.checkSheets();
      setSheetsStatus(data);
    } catch (error) {
      console.error("Error verifying Google Sheets:", error);
      setSheetsStatus({
        configured: false,
        error: "No se pudo comunicar con el servidor para verificar las hojas de cálculo."
      });
    } finally {
      setSheetsLoading(false);
    }
  };

  useEffect(() => {
    const handleRefUpdate = () => {
      setGithubRef(localStorage.getItem('bakandeya_github_ref') || 'main');
    };
    window.addEventListener('github-ref-updated', handleRefUpdate);
    return () => {
      window.removeEventListener('github-ref-updated', handleRefUpdate);
    };
  }, []);

  const colors: ThemeColors = THEMES[currentTheme];

  // Persist Theme Selection
  const handleThemeChange = (theme: ThemeName) => {
    setCurrentTheme(theme);
    localStorage.setItem('bakandeya_theme', theme);
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

 // Fans Landing Route
 if (window.location.pathname !== '/' && window.location.pathname !== '') {
 return <FansLanding />;
 }

 // Auth Screen Render
 if (!isLoggedIn) {
 return (
 <LoginModal 
 onLoginSuccess={handleLoginSuccess}
 isStitchLight={currentTheme === 'stitch_light'}
 />
 );
 }

  const currentActiveBandName = currentUser?.bandName || currentUser?.name || 'BAKANDEYA';
  const currentActiveBandLogo = (currentUser?.band_id === 'band-bakandeya' || currentUser?.band_id === 'reg-bakandeya')
    ? '/logo_bakandeya_bueno_sin_fondo.png'
    : (epkConfig?.logoUrl || '');

 return (
 <div 
 className={`min-h-screen ${colors.bg} flex flex-col md:flex-row transition-colors duration-500 font-sans w-full max-w-[100vw] overflow-clip`}
 >
 {/* LEFT SIDEBAR */}
 {/* MOBILE TOP BAR */}
 <header className="md:hidden flex flex-col bg-[#121110] border-[#22211F] sticky top-0 z-30 shrink-0">
 {/* Top Brand & Menu Row */}
 <div className="flex items-center justify-between px-4 pt-3 pb-2">
 <div className="flex items-center gap-3">
 {currentActiveBandLogo ? (
 <img 
 src={currentActiveBandLogo} 
 alt="Logo" 
 className="w-12 h-12 object-contain p-1 bg-neutral-950/90 rounded-xl border border-amber-500/50 shadow-md shrink-0"
 referrerPolicy="no-referrer"
 />
 ) : (
 <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
 {currentActiveBandName[0]?.toUpperCase() || 'B'}
 </div>
 )}
 <div className="flex flex-col">
 <div className="flex items-center gap-2">
 <h1 className="text-sm font-bold font-display tracking-wider uppercase text-zinc-100 leading-none">
 {currentActiveBandName}
 </h1>
 <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${syncStatus === 'synced' ? 'bg-emerald-400/20' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-zinc-400 animate-pulse'}`} />
 </div>
 <span className="text-[10px] text-[#9a9591] font-sans mt-0.5">Banda activa</span>
 </div>
 </div>
 <button
 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
 className="p-2 text-neutral-300 hover:text-white rounded-lg bg-[#1A1918] border-[#22211F] cursor-pointer active:scale-95 transition-all"
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
 { id: 'epk', label: 'Dossier (EPK)', icon: BookOpen },
 { id: 'fans', label: 'Base de Fans', icon: Heart },
 { id: 'reels', label: 'Reels', icon: Video },
 { id: 'repertorio', label: 'Temas', icon: Disc3 },
 { id: 'chat', label: 'Agente AI', icon: Guitar },
 ...(isAdmin ? [{ id: 'finanzas', label: 'Finanzas', icon: Coins }, { id: 'merchan', label: 'Merchan', icon: Sparkles }] : []),
 ];
 })().map((item) => {
 const isSelected = currentView === item.id;
 const IconComp = item.icon;
 return (
 <button
 key={`top-tab-${item.id}`}
 onClick={() => handleNavigate(item.id as any)}
 className={`flex items-center gap-2 px-3.5 py-2 md:px-3 md:py-1.5 rounded-full text-sm md:text-xs font-semibold md:font-normal font-sans whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-95 ${
 isSelected
 ? 'bg-zinc-800 text-zinc-100 border-zinc-700 font-bold shadow-xs'
 : 'bg-[#1A1918] text-neutral-300 border-[#22211F] hover:bg-[#22211F] hover:text-white'
 }`}
 >
 <IconComp className="w-4 h-4 md:w-3.5 md:h-3.5 shrink-0" />
 <span>{item.label}</span>
 {item.badge !== undefined && item.badge > 0 && (
 <span className={`text-xs md:text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
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
 <div className="relative w-[280px] max-w-[85vw] bg-[#121110] border-[#22211F] flex flex-col h-full z-10 overflow-y-auto shadow-2xl">
 {/* Drawer Header */}
 <div className="p-4 flex items-center justify-between border-[#22211F]/50 bg-gradient-to-b from-[#1A1918] to-[#121110]">
 <div className="flex items-center gap-2.5">
 {currentActiveBandLogo ? (
 <img 
 src={currentActiveBandLogo} 
 alt="Logo" 
 className="w-14 h-14 object-contain p-1 bg-neutral-950/90 rounded-xl border border-amber-500/50 shadow-md shrink-0"
 referrerPolicy="no-referrer"
 />
 ) : (
 <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
 {currentActiveBandName[0]?.toUpperCase() || 'B'}
 </div>
 )}
 <div className="flex flex-col">
 <h1 className="text-base font-bold font-display tracking-wider uppercase text-zinc-100 leading-none">
 {currentActiveBandName}
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
 { id: 'epk', label: 'Dossier (EPK)', icon: BookOpen },
 { id: 'fans', label: 'Base de Fans', icon: Heart },
 { id: 'reels', label: 'Reels Center', icon: Video },
 { id: 'repertorio', label: 'Repertorio', icon: Disc3 },
 { id: 'chat', label: 'Agente Mánager', icon: Guitar },
 ...(isAdmin ? [{ id: 'finanzas', label: 'Finanzas', icon: Coins }, { id: 'merchan', label: 'Merchan', icon: Sparkles }] : []),
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
 ? 'bg-zinc-800/80 text-zinc-100 font-bold border-zinc-700'
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
 <div className="p-4 mt-auto border-[#22211F]/50">
 {currentUser && (
  <div className="flex flex-col gap-2 mb-4 p-2.5 rounded-xl bg-[#1A1918] border border-[#22211F]">
   <div 
    onClick={() => { setShowUserProfileModal(true); setIsMobileMenuOpen(false); }}
    className="flex items-center gap-3 w-full cursor-pointer text-left group"
   >
    <div 
     className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[#121110] text-xs font-sans shrink-0 uppercase transition-transform group-hover:scale-105"
     style={{ backgroundColor: currentUser.avatarColor || '#eab308' }}
    >
     {currentUser.name ? currentUser.name.slice(0, 2) : 'US'}
    </div>
    <div className="flex flex-col min-w-0 flex-1">
     <span className="text-[12px] font-bold font-sans text-zinc-100 truncate">
      {currentUser.name}
     </span>
     <span className="text-[10px] font-mono text-[#9a9591] truncate" title={currentUser.email || currentUser.username}>
      {currentUser.email || currentUser.username}
     </span>
    </div>
   </div>

   {/* Band Switcher Dropdown */}
   {availableBands && availableBands.length > 1 && (
    <div className="mt-2 pt-2 border-t border-[#22211F]/60 flex flex-col gap-1">
     <label className="text-[9px] font-mono uppercase tracking-wider text-[#9a9591]">
      Mis Bandas
     </label>
     <div className="relative">
      <select
       value={currentUser.band_id}
       onChange={async (e) => {
        const selectedBandId = e.target.value;
        if (selectedBandId && selectedBandId !== currentUser.band_id) {
         try {
          await handleSwitchBand(selectedBandId);
          setIsMobileMenuOpen(false);
         } catch (err) {
          console.error("Error switching band:", err);
         }
        }
       }}
       className="w-full bg-[#121110] text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg border border-[#333130] focus:border-amber-500/50 focus:outline-none transition-colors cursor-pointer appearance-none pr-8"
      >
       {availableBands.map((b) => (
        <option key={`mob-switch-band-${b.band_id}`} value={b.band_id}>
         {b.bandName}
        </option>
       ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-[#9a9591]">
       <RefreshCw className="w-3 h-3 animate-pulse" />
      </div>
     </div>
    </div>
   )}
  </div>
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

 <aside className="hidden md:flex w-[240px] shrink-0 bg-[#121110] border-[#22211F] flex-col h-screen sticky top-0 overflow-y-auto">
 
 {/* Brand Header */}
 <div className="p-6 flex flex-col gap-4 items-center text-center border-[#22211F]/50 bg-gradient-to-b from-[#1A1918] to-[#121110]">
 {currentActiveBandLogo ? (
 <img 
 src={currentActiveBandLogo} 
 alt="Logo" 
 className="w-40 h-40 xl:w-48 xl:h-48 object-cover rounded-2xl shadow-xl shadow-black/50 border-[#333130] shrink-0"
 referrerPolicy="no-referrer"
 />
 ) : (
 <div className="w-40 h-40 xl:w-48 xl:h-48 rounded-2xl shadow-xl shadow-black/50 border-[#333130] bg-[#1A1918] flex flex-col items-center justify-center text-amber-400 gap-2 p-4 shrink-0">
 <Guitar className="w-16 h-16 opacity-80" />
 <span className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-widest text-center">
 {currentActiveBandName}
 </span>
 </div>
 )}
 <div className="flex flex-col items-center">
 <h1 className="text-[22px] font-black font-display tracking-widest uppercase text-zinc-100 leading-none">
 {currentActiveBandName}
 </h1>
 <div className="flex items-center justify-center gap-2 mt-3 bg-[#1A1918] px-3 py-1.5 rounded-full border-[#333130] shadow-inner">
 <span className={`w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor] ${syncStatus === 'synced' ? 'bg-emerald-400/20 text-[#73c991]/20' : syncStatus === 'error' ? 'bg-rose-500/15 text-rose-400' : 'bg-zinc-400 text-zinc-400 animate-pulse'}`} />
 <span className="text-[10px] font-sans text-[#9a9591] uppercase tracking-wider font-bold">Banda activa</span>
 </div>
 </div>
 </div>

 {/* Metronome Pro Quick Launcher */}
 <div className="px-3 pt-2 pb-1">
 <button
 onClick={() => setShowMetronomeModal(true)}
 className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-300 transition-all cursor-pointer group active:scale-95 shadow-xs"
 title="Abrir Metrónomo WebAudio Pro"
 >
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
 <Clock className="w-4 h-4" />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-xs font-bold font-sans">Metrónomo Pro</span>
 <span className="text-[10px] text-amber-400/80 font-mono">Click & Tap Tempo</span>
 </div>
 </div>
 <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
 BPM
 </span>
 </button>
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
 { id: 'epk', label: 'Dossier (EPK)', icon: BookOpen },
 { id: 'fans', label: 'Base de Fans', icon: Heart },
 { id: 'reels', label: 'Reels Center', icon: Video },
 { id: 'repertorio', label: 'Repertorio', icon: Disc3 },
 { id: 'chat', label: 'Agente Mánager', icon: Guitar },
 ...(isAdmin ? [{ id: 'finanzas', label: 'Finanzas', icon: Coins }, { id: 'merchan', label: 'Merchan', icon: Sparkles }] : []),
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
 ? 'bg-zinc-800/80 text-zinc-100 font-bold border-zinc-700'
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
 <div className="p-4 mt-auto border-[#22211F]/50">
 {currentUser && (
  <div className="flex flex-col gap-2 mb-4 p-2.5 rounded-xl bg-[#1A1918] border border-[#22211F]">
   <div 
    onClick={() => setShowUserProfileModal(true)}
    className="flex items-center gap-3 w-full cursor-pointer text-left group"
   >
    <div 
     className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[#121110] text-xs font-sans shrink-0 uppercase transition-transform group-hover:scale-105"
     style={{ backgroundColor: currentUser.avatarColor || '#eab308' }}
    >
     {currentUser.name ? currentUser.name.slice(0, 2) : 'US'}
    </div>
    <div className="flex flex-col min-w-0 flex-1">
     <span className="text-[12px] font-bold font-sans text-zinc-100 truncate">
      {currentUser.name}
     </span>
     <span className="text-[10px] font-mono text-[#9a9591] truncate" title={currentUser.email || currentUser.username}>
      {currentUser.email || currentUser.username}
     </span>
    </div>
   </div>

   {/* Band Switcher Dropdown */}
   {availableBands && availableBands.length > 1 && (
    <div className="mt-2 pt-2 border-t border-[#22211F]/60 flex flex-col gap-1">
     <label className="text-[9px] font-mono uppercase tracking-wider text-[#9a9591]">
      Mis Bandas
     </label>
     <div className="relative">
      <select
       value={currentUser.band_id}
       onChange={async (e) => {
        const selectedBandId = e.target.value;
        if (selectedBandId && selectedBandId !== currentUser.band_id) {
         try {
          await handleSwitchBand(selectedBandId);
         } catch (err) {
          console.error("Error switching band:", err);
         }
        }
       }}
       className="w-full bg-[#121110] text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg border border-[#333130] focus:border-amber-500/50 focus:outline-none transition-colors cursor-pointer appearance-none pr-8"
      >
       {availableBands.map((b) => (
        <option key={`switch-band-${b.band_id}`} value={b.band_id}>
         {b.bandName}
        </option>
       ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-[#9a9591]">
       <RefreshCw className="w-3 h-3 animate-pulse" />
      </div>
     </div>
    </div>
   )}
  </div>
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
 <div className="mb-4 p-3 bg-rose-500/10 border-rose-500/20 rounded-lg text-rose-300 text-xs flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
 <div className="flex gap-2 items-center">
 <ShieldAlert className="w-5 h-5 text-rose-300 shrink-0" />
 <span>
 <strong>Modo Simulación Activo:</strong> No se pudo conectar con el servidor Express backend local. Los cambios actuales se almacenarán temporalmente en memoria.
 </span>
 </div>
 <button
 onClick={fetchState}
 className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-300 font-mono text-[10px] rounded-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
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
 currentUser={currentUser}
 bandName={currentActiveBandName}
 onNavigate={handleNavigate}
 />
 )}
 {(currentView === 'booking' || currentView === 'medios') && (
 <BookingCRM 
 leads={leads} 
 colors={colors}
 onUpdateLead={handleUpdateLead}
 onAddLead={handleAddLead}
 epkConfig={epkConfig}
 onUpdateEpkConfig={handleUpdateEpkConfig}
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
 bandName={currentActiveBandName}
 onUpdateConcert={handleUpdateConcert}
 onUpdateRehearsal={handleUpdateRehearsal}
 />
 )}
{currentView === 'merchan' && (
 <Merchan colors={colors} currentTheme={currentTheme} />
 )}
        {currentView === 'epk' && (
          <ErrorBoundary fallbackTitle="EPK / Dossier Promocional">
            <EPKManager 
              epkConfig={epkConfig} 
              onSave={handleUpdateEpkConfig}
              colors={colors} 
              currentTheme={currentTheme} 
            />
          </ErrorBoundary>
        )}
        {currentView === 'fans' && (
          <FansPanel 
            fans={fans}
            concerts={concerts}
            epkConfig={epkConfig}
            onAddFan={handleAddFan}
            onDeleteFan={handleDeleteFan}
            onUpdateIncentive={handleUpdateIncentive}
            onUpdateEpkConfig={handleUpdateEpkConfig}
          />
        )}
        {currentView === 'giras' && (
          <ErrorBoundary fallbackTitle="Gestor de Giras">
            <TourManager 
              colors={colors}
              tours={tours}
              concerts={concerts}
              leads={leads}
              onAddLead={handleAddLead}
              onSaveTour={handleSaveTour}
              onDeleteTour={handleDeleteTour}
            />
          </ErrorBoundary>
        )}
 {currentView === 'finanzas' && (
 isAdmin ? (
 <Finanzas 
 colors={colors}
 payments={payments}
 concerts={concerts}
 onAddPayment={handleAddPayment}
 onUpdatePayment={handleUpdatePayment}
 onUpdateConcert={handleUpdateConcert}
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
  {/* Persistent Single Chatbot Instance */}
  <div className={
    currentView === 'chat'
      ? 'w-full h-[calc(100vh-140px)] min-h-[600px] block'
      : isFloatingChatOpen
        ? 'fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[420px] max-w-[440px] z-50 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 block'
        : 'hidden'
  }>
    <Chatbot
      colors={colors}
      leads={leads}
      rehearsals={rehearsals}
      concerts={concerts}
      onUpdateLead={handleUpdateLead}
      onAddRehearsal={handleAddRehearsal}
      onAddConcert={handleAddConcert}
      isFloating={currentView !== 'chat'}
      onClose={() => setIsFloatingChatOpen(false)}
      userRole={currentUser?.role}
      onLoadingChange={setIsChatLoading}
    />
  </div>
 </>
 )}
 </div>
 </main>

 {/* GitHub Actions Settings Modal */}
 {showGithubSettings && (
 <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
 <div className={`w-full max-w-xl rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 ${
 currentTheme === 'stitch_light' 
 ? 'bg-white border-slate-200 text-slate-800' 
 : 'bg-[#1c1b1b] border-[#f2ca50]/30 text-neutral-100'
 }`}>
 <div className={`absolute top-0 right-0 w-40 h-40 xl:w-48 xl:h-48 rounded-full blur-3xl pointer-events-none ${
 currentTheme === 'stitch_light' ? 'bg-indigo-500/5' : 'bg-[#f2ca50]/5'
 }`} />
 
 <div className="flex items-start justify-between">
 <div className="space-y-1">
 <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-bold ${
 currentTheme === 'stitch_light'
 ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
 : 'bg-[#f2ca50]/10 border-[#f2ca50]/20 text-[#f2ca50]'
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
 ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 placeholder:text-slate-300'
 : 'bg-neutral-950 border-neutral-800 text-neutral-100 focus:border-[#f2ca50] placeholder:text-neutral-800'
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
 ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
 : 'bg-neutral-950 border-neutral-800 text-neutral-100 focus:border-[#f2ca50]'
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
 ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
 : 'bg-neutral-950 border-neutral-800 text-neutral-100 focus:border-[#f2ca50]'
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
 ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
 : 'bg-neutral-950 border-neutral-800 text-neutral-100 focus:border-[#f2ca50]'
 }`}
 />
 </div>
 </div>

 <div className={`p-3 rounded-xl flex gap-2.5 items-start ${
 currentTheme === 'stitch_light'
 ? 'bg-slate-50 border-slate-200'
 : 'bg-neutral-950 border-neutral-800'
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
 ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700'
 : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
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
 ? 'bg-white border-slate-200 text-slate-800' 
 : 'bg-[#121111] border-neutral-800 text-neutral-100'
 }`}>
 <div className="flex items-start justify-between">
 <div className="space-y-1">
 <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-bold bg-emerald-400/20/10 border-[#73c991]/20/20 text-[#73c991]/20">
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
 <div className="p-3.5 bg-rose-500/10 border-rose-500/20 rounded-xl space-y-2">
 <p className="text-xs font-bold text-rose-300 font-mono">⚠️ No Configurado</p>
 <p className="text-[11px] leading-relaxed text-rose-300 font-mono">
 {sheetsStatus.error ||"Las variables de credenciales de Google o SPREADSHEET_ID no están presentes en el entorno."}
 </p>
 </div>
 ) : sheetsStatus.error ? (
 <div className="p-3.5 bg-rose-500/10 border-rose-500/20 rounded-xl space-y-2">
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
 currentTheme === 'stitch_light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950 border-neutral-800'
 }`}>
 <p className="text-neutral-500 uppercase tracking-widest text-[9px] mb-1">ID del Spreadsheet</p>
 <p className="font-mono text-neutral-400 truncate">{sheetsStatus.spreadsheetId}</p>
 </div>

 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <p className="text-neutral-500 uppercase tracking-widest text-[9px]">Pestañas Requeridas en Google Sheets</p>
 <a 
 href="/api/export-excel" 
 download="band_data.xlsx"
 className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
 >
 <FileSpreadsheet className="w-3 h-3" /> Descargar Excel (.xlsx)
 </a>
 </div>
 
 <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
 {[
 { key: 'registro_bandas', name: 'registro_bandas', desc: 'Registro de nuevas bandas SaaS (columna band_id)' },
 { key: 'usuarios', name: 'usuarios', desc: 'Tabla oficial de usuarios, roles y accesos (columna band_id)' },
 { key: 'leads', name: 'leads', desc: 'Directorio de salas, medios y contactos' },
 { key: 'bandas', name: 'bandas', desc: 'Bandas amigas y red co-booking' },
 { key: 'canciones', name: 'canciones', desc: 'Catálogo de temas y repertorio' },
 { key: 'repertorios', name: 'repertorios', desc: 'Setlists y listas de canciones' },
 { key: 'fans', name: 'fans', desc: 'Base de fans y tribu' },
 { key: 'tours', name: 'tours', desc: 'Giras y logística de ruta' },
 { key: 'conciertos', name: 'conciertos', desc: 'Historial de conciertos' },
 { key: 'ensayos', name: 'ensayos', desc: 'Historial de ensayos' },
 { key: 'finanzas', name: 'finanzas', desc: 'Registro de ingresos y gastos' }
 ].map(tab => {
 const exists = sheetsStatus.status[tab.key];
 const wasCreated = (sheetsStatus.created || []).includes(tab.key);

 return (
 <div 
 key={tab.key}
 className={`flex items-center justify-between p-2.5 rounded-xl ${
 exists 
 ? 'bg-emerald-400/20/5 border-[#73c991]/20/10' 
 : 'bg-rose-500/5 border-rose-500/10'
 }`}
 >
 <div className="min-w-0">
 <p className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
 <span>{tab.name}</span>
 {wasCreated && (
 <span className="text-[8px] font-bold text-[#f2ca50] bg-[#f2ca50]/10 px-1.5 py-0.5 rounded border-[#f2ca50]/20">
 ¡CREADA!
 </span>
 )}
 </p>
 <p className="text-[9px] text-neutral-500 leading-none mt-1">{tab.desc}</p>
 </div>

 <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
 exists 
 ? 'bg-emerald-400/20/10 text-[#73c991]/20 border-[#73c991]/20/20' 
 : 'bg-rose-500/15 text-rose-400 border-rose-500/20'
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
 ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
 : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
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

 {/* Floating Chatbot Trigger Button */}
 {currentView !== 'chat' && (
 <button
 id="floating-chat-trigger-btn"
 onClick={() => setIsFloatingChatOpen(!isFloatingChatOpen)}
 className={`fixed bottom-5 right-5 z-40 p-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-all duration-300 cursor-pointer active:scale-95 group ${
 isFloatingChatOpen
 ? 'bg-rose-600 text-white hover:bg-rose-700'
 : isChatLoading
 ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/30 ring-2 ring-cyan-400/50'
 : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 hover:scale-105 shadow-emerald-500/20'
 }`}
 title={isChatLoading ? "Agente AI ejecutando en segundo plano..." : "Abrir Agente Mánager AI"}
 >
 {isFloatingChatOpen ? (
 <X className="w-5 h-5" />
 ) : (
 <>
 <div className="relative">
 {isChatLoading ? (
 <RefreshCw className="w-5 h-5 animate-spin text-cyan-300" />
 ) : (
 <Guitar className="w-5 h-5" />
 )}
 <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isChatLoading ? 'bg-cyan-400 animate-ping' : 'bg-emerald-300 animate-ping'}`} />
 <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isChatLoading ? 'bg-cyan-300' : 'bg-emerald-400'}`} />
 </div>
 <span className="text-xs font-mono font-bold uppercase tracking-wider hidden sm:inline-block pr-1">
 {isChatLoading ? 'Ejecutando...' : 'Agente AI'}
 </span>
 </>
 )}
 </button>
 )}

 {/* Metronome Pro Modal */}
 <MetronomeModal
 isOpen={showMetronomeModal}
 onClose={() => setShowMetronomeModal(false)}
 songs={[]}
 colors={colors}
 />

 </div>
 );
}
