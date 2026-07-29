import React, { useState, useEffect } from 'react';
import { Lead, Rehearsal, Concert, SocialPost, Payment, Message, ThemeName, ThemeColors, SocialMetric, User } from './types';
import { THEMES } from './utils/theme';
import Dashboard from './components/Dashboard';
import BookingCRM from './components/BookingCRM';
import CalendarView from './components/CalendarView';
import ReelsCenter from './components/ReelsCenter';
import Finanzas from './components/Finanzas';
import Chatbot from './components/Chatbot';
import GithubWorkflowTracker from './components/GithubWorkflowTracker';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { UserProfileModal } from './components/UserProfileModal';
import { 
  Music, Sparkles, LogOut, ShieldAlert, Users, Shield, UserCheck,
  Table, FileCheck, CheckSquare, MessageSquareCode, RefreshCw,
  Settings, Key, Github, X, CalendarRange, Bot, Flame, Video, FileSpreadsheet, Coins
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
  const [currentView, setCurrentView] = useState<'resumen' | 'booking' | 'calendario' | 'reels' | 'chat'>('resumen');

  // Application Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [metrics, setMetrics] = useState<SocialMetric[]>([]);

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

  // GitHub Settings State
  const [showGithubSettings, setShowGithubSettings] = useState(false);
  const [githubPat, setGithubPat] = useState(() => localStorage.getItem('bakandeya_github_pat') || '');
  const [githubOwner, setGithubOwner] = useState(() => localStorage.getItem('bakandeya_github_owner') || 'DiegoCalleB');
  const [githubRepo, setGithubRepo] = useState(() => localStorage.getItem('bakandeya_github_repo') || 'bakandeya-agent-manager');
  const [githubRef, setGithubRef] = useState(() => localStorage.getItem('bakandeya_github_ref') || 'main');
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);

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

  // REST API UPDATE OPERATIONS
  const handleUpdateLead = async (id: string, updatedFields: Partial<Lead>, expectedStatus?: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updatedFields } : l));
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedFields, expectedStatus })
      });
      if (res.status === 409) {
        const data = await res.json();
        alert(data.error || 'Conflicto de sincronización con Google Sheets. Los datos han cambiado en paralelo.');
        fetchState();
        return;
      }
      if (!res.ok) throw new Error();
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        method: 'DELETE'
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
      className={`min-h-screen ${colors.bg} flex flex-col transition-colors duration-500 font-sans w-full max-w-full overflow-x-hidden`}
      style={{
        '--font-display': colors.fontDisplay === 'font-sans' ? '"Hanken Grotesk", sans-serif' : colors.fontDisplay === 'font-mono' ? '"JetBrains Mono", monospace' : '"Bodoni Moda", serif',
        '--font-sans': colors.fontSans === 'font-mono' ? '"JetBrains Mono", monospace' : '"Hanken Grotesk", sans-serif',
      } as React.CSSProperties}
    >
      
      {/* 1. TOP HEADER NAVIGATION NAVBAR (Theme-dynamic brand styling) */}
      <header className={`border-b py-2.5 px-3 md:px-8 sticky top-0 z-40 transition-all duration-300 backdrop-blur-md w-full max-w-full overflow-x-hidden ${
        currentTheme.startsWith('stitch')
          ? currentTheme === 'stitch_light' 
            ? 'bg-white/95 border-slate-200 text-slate-900' 
            : 'bg-slate-950/95 border-slate-850 text-slate-100'
          : 'bg-[#0c0c0e]/95 border-[#99907c]/15 text-[#e5e2e1]'
      }`}>
        <div className="w-full max-w-full flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink">
            <img 
              src="/logo_bakandeya.jpg" 
              alt="Bakandeya Logo" 
              className="w-10 h-10 sm:w-14 sm:h-14 object-cover rounded-xl sm:rounded-2xl border border-neutral-800/80 shadow-md shrink-0 hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
            {/* Branding */}
            <div className="min-w-0">
              <h1 className={`text-base sm:text-xl font-display font-extrabold tracking-wide uppercase flex items-center gap-1.5 min-w-0 truncate ${
                currentTheme === 'stitch_light' ? 'text-slate-900' : 'text-neutral-100'
              }`}>
                <span>BAKANDEYA</span>
                <span className="hidden sm:inline-block text-[8px] font-mono tracking-widest text-neutral-500 font-normal uppercase">Management Hub</span>
              </h1>
              <button 
                onClick={fetchState}
                className="text-[9px] font-mono text-neutral-500 hover:text-neutral-300 flex items-center gap-1 mt-0.5 cursor-pointer bg-transparent border-none p-0 focus:outline-none truncate"
                title="Hacer clic para reintentar sincronizar"
              >
                {syncStatus === 'syncing' && <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#f2ca50] shrink-0" />}
                {syncStatus === 'synced' && <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50] shadow-[0_0_8px_#f2ca50] inline-block animate-pulse shrink-0" />}
                {syncStatus === 'error' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse shrink-0" />}
                <span className="truncate">{syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'error' ? 'Error' : 'Live Synced Google Sheets'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* User Chip & Band Management */}
            {currentUser && (
              <div className="flex items-center gap-1 sm:gap-2 border-r border-neutral-800/80 pr-1.5 sm:pr-2 mr-0.5 sm:mr-1">
                <button 
                  onClick={() => setShowUserProfileModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 py-1 hover:opacity-85 transition-all cursor-pointer group text-left"
                  title="Hacer clic para editar perfil y cambiar contraseña"
                >
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[11px] font-mono shadow-sm shrink-0 uppercase ring-1 ring-white/10 group-hover:ring-emerald-400/50 transition-all"
                    style={{ backgroundColor: currentUser.avatarColor || '#10b981' }}
                  >
                    {currentUser.name.slice(0, 2)}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-[11px] font-bold leading-none font-sans text-neutral-200 group-hover:text-amber-300 transition-colors">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] font-mono text-amber-400 opacity-90 leading-tight">
                      {isAdmin ? 'Admin / Mánager' : currentUser.instrument || 'Músico'}
                    </span>
                  </div>
                </button>

                <button
                  id="user-profile-btn"
                  onClick={() => setShowUserProfileModal(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 hover:text-amber-200 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2 sm:px-2.5 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 shadow-sm"
                  title="Editar perfil y opciones de mi cuenta"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden md:inline font-bold">Mi Perfil</span>
                </button>
              </div>
            )}

            {/* Action buttons */}
            <button
              id="check-sheets-btn"
              onClick={checkGoogleSheets}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-300 hover:text-neutral-100 border border-neutral-700/80 bg-neutral-900/90 hover:bg-neutral-800 px-2 sm:px-2.5 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Sincronización Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden lg:inline">Sheets</span>
            </button>

            <button
              id="configure-github-btn"
              onClick={() => setShowGithubSettings(true)}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-[#f2ca50] hover:text-[#ffe088] border border-[#f2ca50]/20 bg-[#f2ca50]/5 px-2 py-1.5 rounded transition-all cursor-pointer active:scale-95"
              title="Configurar GitHub Actions"
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden lg:inline">GitHub</span>
            </button>

            <button
              id="band-logout"
              onClick={handleLogout}
              className="text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-neutral-900 transition-colors active:scale-95 shrink-0"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTAINER: SIDEBAR + MAIN CONTENT WORKSPACE */}
      <div className="w-full max-w-full flex-1 flex flex-col md:flex-row gap-4 sm:gap-5 p-2 sm:p-5 md:p-6 items-stretch px-2 sm:px-5 md:px-6 min-w-0 overflow-x-hidden">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-56 lg:w-60 shrink-0 flex flex-col gap-3 min-w-0 max-w-full overflow-x-hidden">
          <nav className={`flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-1 pb-2 md:pb-0 border-b md:border-b-0 ${colors.border} max-w-full no-scrollbar`}>
            {[
              { id: 'resumen', label: 'RESUMEN', icon: Table },
              { id: 'booking', label: 'BOOKING CRM', icon: FileCheck, badge: leads.filter(l => l.estado === 'pendiente_aprobacion').length },
              { id: 'calendario', label: 'CALENDARIO & LOGÍSTICA', icon: CalendarRange },
              { id: 'reels', label: 'REELS CENTER', icon: Video },
              ...(isAdmin ? [{ id: 'finanzas', label: 'FINANZAS BANDA', icon: Coins }] : []),
              { id: 'chat', label: 'MÁNAGER VIRTUAL', icon: MessageSquareCode }
            ].map((item) => {
              const isSelected = currentView === item.id;
              const IconComp = item.icon;
              return (
                <button
                  id={`nav-btn-${item.id}`}
                  key={item.id}
                  onClick={() => setCurrentView(item.id as any)}
                  className={`flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-[10px] font-mono tracking-widest transition-all cursor-pointer shrink-0 active:scale-95 ${
                    isSelected 
                      ? colors.primary
                      : currentTheme.startsWith('stitch')
                        ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                        : 'text-neutral-400 hover:text-white hover:bg-[#1c1b1b]/50'
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0 opacity-80" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      isSelected 
                        ? currentTheme === 'stitch_light' ? 'bg-indigo-800 text-white' : 'bg-white text-indigo-900'
                        : colors.badgeYellow
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Sync warning if backend fails */}
          {syncStatus === 'error' && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex gap-2 items-center">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <span>
                  <strong>Modo Simulación Activo:</strong> No se pudo conectar con el servidor Express backend local. Los cambios actuales se almacenarán temporalmente en memoria.
                </span>
              </div>
              <button
                onClick={fetchState}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-mono text-[10px] rounded-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                Reintentar Conexión
              </button>
            </div>
          )}

          {/* Dynamic Views */}
          <div className="flex-1">
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
                  />
                )}
                {currentView === 'booking' && (
                  <BookingCRM 
                    leads={leads} 
                    colors={colors}
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
                {currentView === 'finanzas' && (
                  isAdmin ? (
                    <Finanzas 
                      colors={colors}
                      payments={payments}
                      onAddPayment={handleAddPayment}
                      onUpdatePayment={handleUpdatePayment}
                    />
                  ) : (
                    <div className={`p-8 rounded-2xl border text-center space-y-3 ${colors.card} ${colors.border}`}>
                      <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
                      <h3 className="text-sm font-mono font-bold text-rose-400 uppercase tracking-wider">Acceso Restringido</h3>
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
                    userRole={isAdmin ? 'leader' : 'member'}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* GitHub Actions Settings Modal */}
      {showGithubSettings && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-xl border rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 ${
            currentTheme === 'stitch_light' 
              ? 'bg-white border-slate-200 text-slate-800' 
              : 'bg-[#1c1b1b] border-[#f2ca50]/30 text-neutral-100'
          }`}>
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
              currentTheme === 'stitch_light' ? 'bg-indigo-500/5' : 'bg-[#f2ca50]/5'
            }`} />
            
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-bold border ${
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
                    className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs font-mono focus:outline-none ${
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
                    className={`w-full border rounded-lg px-2.5 py-2 text-xs font-mono focus:outline-none ${
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
                    className={`w-full border rounded-lg px-2.5 py-2 text-xs font-mono focus:outline-none ${
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
                    className={`w-full border rounded-lg px-2.5 py-2 text-xs font-mono focus:outline-none ${
                      currentTheme === 'stitch_light'
                        ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-100 focus:border-[#f2ca50]'
                    }`}
                  />
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex gap-2.5 items-start ${
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
                  className={`px-4 py-2 border font-mono text-xs rounded-lg transition-all cursor-pointer active:scale-95 ${
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

      {/* Floating Chatbot Widget Button and Panel */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-4 font-mono select-none">
        {/* Floating Chat Panel */}
        {isFloatingChatOpen && (
          <div className="w-[380px] max-w-[calc(100vw-32px)] h-[580px] rounded-2xl overflow-hidden border border-neutral-900 shadow-[0_10px_50px_rgba(0,0,0,0.85)] relative animate-in slide-in-from-bottom-6 fade-in duration-300">
            <Chatbot 
              colors={colors} 
              leads={leads}
              rehearsals={rehearsals}
              concerts={concerts}
              onUpdateLead={handleUpdateLead}
              onAddRehearsal={handleAddRehearsal}
              isFloating={true}
              onClose={() => setIsFloatingChatOpen(false)}
            />
          </div>
        )}

        {/* Floating Toggle Trigger Button */}
        <button
          id="floating-chat-toggle-btn"
          onClick={() => setIsFloatingChatOpen(!isFloatingChatOpen)}
          className={`group p-4 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(242,202,80,0.15)] active:scale-95 ${
            isFloatingChatOpen 
              ? 'bg-[#f2ca50] border-[#f2ca50] text-[#3c2f00] scale-105' 
              : 'bg-[#0c0c10]/95 hover:bg-[#14141c]/95 border-neutral-800 text-[#f2ca50] hover:border-[#f2ca50]/50'
          }`}
          title="Abrir Mánager Virtual AI"
        >
          {isFloatingChatOpen ? (
            <X className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
          ) : (
            <div className="relative">
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#f2ca50] animate-ping opacity-75"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#f2ca50]"></span>
              <Bot className="w-5.5 h-5.5 transition-transform group-hover:scale-110 duration-200" />
            </div>
          )}
        </button>
      </div>

      {/* Google Sheets Verification Modal */}
      {showSheetsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className={`w-full max-w-md border rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden ${
            currentTheme === 'stitch_light' 
              ? 'bg-white border-slate-200 text-slate-800' 
              : 'bg-[#121111] border-neutral-800 text-neutral-100'
          }`}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-bold border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
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
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-xs font-mono text-neutral-400">Consultando hojas en Google Sheets...</p>
              </div>
            ) : sheetsStatus ? (
              <div className="space-y-4">
                {!sheetsStatus.configured ? (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-rose-400 font-mono">⚠️ No Configurado</p>
                    <p className="text-[11px] leading-relaxed text-rose-300 font-mono">
                      {sheetsStatus.error || "Las variables de credenciales de Google o SPREADSHEET_ID no están presentes en el entorno."}
                    </p>
                  </div>
                ) : sheetsStatus.error ? (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-rose-400 font-mono">⚠️ Error de Autenticación</p>
                    <p className="text-[11px] leading-relaxed text-rose-300 font-mono">
                      {sheetsStatus.error}
                    </p>
                    <p className="text-[9px] leading-normal text-neutral-500 font-mono pt-1">
                      Comprueba que el archivo de credenciales de Google Service Account sea válido, y que hayas compartido tu hoja con el email de tu Service Account con permisos de "Editor".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 font-mono">
                    <div className={`p-3 rounded-xl border text-[10px] ${
                      currentTheme === 'stitch_light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950 border-neutral-800'
                    }`}>
                      <p className="text-neutral-500 uppercase tracking-widest text-[9px] mb-1">ID del Spreadsheet</p>
                      <p className="font-mono text-neutral-400 truncate">{sheetsStatus.spreadsheetId}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-neutral-500 uppercase tracking-widest text-[9px]">Pestañas Requeridas</p>
                      
                      <div className="space-y-1.5">
                        {[
                          { key: 'leads', name: 'leads', desc: 'CRM de salas y leads' },
                          { key: 'ensayos', name: 'ensayos', desc: 'Historial de ensayos' },
                          { key: 'conciertos', name: 'conciertos', desc: 'Historial de conciertos' }
                        ].map(tab => {
                          const exists = sheetsStatus.status[tab.key];
                          const wasCreated = (sheetsStatus.created || []).includes(tab.key);

                          return (
                            <div 
                              key={tab.key}
                              className={`flex items-center justify-between p-2.5 rounded-xl border ${
                                exists 
                                  ? 'bg-emerald-500/5 border-emerald-500/10' 
                                  : 'bg-rose-500/5 border-rose-500/10'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                                  <span>{tab.name}</span>
                                  {wasCreated && (
                                    <span className="text-[8px] font-bold text-[#f2ca50] bg-[#f2ca50]/10 px-1.5 py-0.5 rounded border border-[#f2ca50]/20">
                                      ¡CREADA!
                                    </span>
                                  )}
                                </p>
                                <p className="text-[9px] text-neutral-500 leading-none mt-1">{tab.desc}</p>
                              </div>

                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                                exists 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
                    className={`flex-1 py-2 font-mono text-xs font-bold rounded-lg transition-all cursor-pointer border hover:scale-[1.02] active:scale-[0.98] text-center ${
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
                        : 'bg-emerald-500 text-neutral-950 font-black hover:bg-emerald-400'
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
        />
      )}

    </div>
  );
}
