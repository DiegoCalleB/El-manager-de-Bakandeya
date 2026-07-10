import React, { useState, useEffect } from 'react';
import { Lead, Rehearsal, Concert, SocialPost, Payment, Message, ThemeName, ThemeColors } from './types';
import { THEMES } from './utils/theme';
import ThemeSelector from './components/ThemeSelector';
import Dashboard from './components/Dashboard';
import ApprovalPanel from './components/ApprovalPanel';
import ClassificationView from './components/ClassificationView';
import CalendarLogistics from './components/CalendarLogistics';
import FinanceStats from './components/FinanceStats';
import Chatbot from './components/Chatbot';
import { 
  Music, Sparkles, LogOut, CheckCircle2, ShieldAlert,
  Menu, X, Table, FileCheck, CheckSquare, MessageSquareCode, CalendarDays, DollarSign, RefreshCw 
} from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('bakandeya_logged_in') === 'true';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active View State
  const [currentView, setCurrentView] = useState<'dashboard' | 'aprobacion' | 'clasificacion' | 'chat' | 'logistica' | 'finanzas'>('dashboard');

  // Application Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('syncing');

  // Active Theme State
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    return (localStorage.getItem('bakandeya_theme') as ThemeName) || 'backstage_neon';
  });

  const colors: ThemeColors = THEMES[currentTheme];

  // Fetch full state from full-stack Express API
  const fetchState = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      
      setLeads(data.leads || []);
      setRehearsals(data.rehearsals || []);
      setConcerts(data.concerts || []);
      setPosts(data.posts || []);
      setPayments(data.payments || []);
      setMessages(data.messages || []);
      setSyncStatus('synced');
    } catch (e) {
      console.error('Error syncing state, offline or waking up:', e);
      setSyncStatus('error');
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

  // 1. Password Auth Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple secure phrase for the band
    if (password.toLowerCase() === 'bakandeya2026' || password === 'diego' || password === 'larra') {
      setIsLoggedIn(true);
      localStorage.setItem('bakandeya_logged_in', 'true');
      setLoginError('');
    } else {
      setLoginError('Contraseña incorrecta. Pista: Es el nombre de la banda seguido del año.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('bakandeya_logged_in');
    setPassword('');
  };

  // REST API UPDATE OPERATIONS
  // Lead Update
  const handleUpdateLead = async (id: string, updatedFields: Partial<Lead>, expectedStatus?: string) => {
    // Optimistic update
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
      fetchState(); // sync again on failure
    }
  };

  // Rehearsal Update
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

  // Concert Update
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

  // Social Post Update
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
      console.error('Error saving post updates:', e);
      fetchState();
    }
  };

  // Payment update
  const handleUpdatePaymentStatus = async (id: string, updatedFields: Partial<Payment>) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      console.error('Error saving payment:', e);
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

  const handleAddConcert = async (con: Concert) => {
    setConcerts(prev => [...prev, con]);
    try {
      const res = await fetch('/api/concerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(con)
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      console.error('Error adding concert:', e);
      fetchState();
    }
  };

  const handleAddPost = async (p: SocialPost) => {
    setPosts(prev => [...prev, p]);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      console.error('Error adding social post:', e);
      fetchState();
    }
  };

  const handleAddPayment = async (p: Payment) => {
    setPayments(prev => [...prev, p]);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      console.error('Error adding payment:', e);
      fetchState();
    }
  };

  const handleSendMessage = async (msg: Message) => {
    setMessages(prev => [...prev, msg]);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      console.error('Error adding logistics message:', e);
      fetchState();
    }
  };

  const handleResetData = async () => {
    if (window.confirm('¿Seguro que quieres resetear todos los cambios simulados a su estado inicial?')) {
      setIsLoading(true);
      try {
        const res = await fetch('/api/reset', { method: 'POST' });
        if (!res.ok) throw new Error();
        await fetchState();
      } catch (e) {
        console.error('Error resetting:', e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Auth Screen Render
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
        {/* Abstract background blobs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="w-full max-w-sm bg-neutral-900/90 border border-neutral-800 rounded-2xl p-8 relative shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-2 animate-bounce" style={{ animationDuration: '3s' }}>
              <Music className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-wider uppercase text-neutral-100">EL MÁNAGER</h1>
            <p className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">Bakandeya Backstage Pass</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-1">Contraseña de la Banda</label>
              <input
                id="login-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introducir clave de acceso..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-cyan-500 text-center font-mono placeholder:text-neutral-700"
              />
            </div>

            {loginError && (
              <p className="text-[11px] text-rose-400 font-medium text-center leading-normal">
                {loginError}
              </p>
            )}

            <button
              id="submit-login"
              type="submit"
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-neutral-950 font-bold rounded-lg text-xs tracking-wider uppercase font-mono transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
            >
              Acceder al Backstage
            </button>
          </form>

          <div className="text-center">
            <span className="text-[9px] text-neutral-600 font-mono">
              Acceso restringido para Diego, Larra, Filgue y técnicos.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.bg} flex flex-col transition-colors duration-500 font-sans`}>
      {/* Top Header navbar */}
      <header className="bg-neutral-950 border-b border-neutral-800 py-3.5 px-4 md:px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-cyan-400 font-black tracking-tighter text-sm">
              BK
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest uppercase text-neutral-100 flex items-center gap-1.5">
                EL MÁNAGER <span className="text-[9px] font-mono font-bold tracking-normal bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded border border-neutral-800">BAKANDEYA</span>
              </h1>
              <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />}
                {syncStatus === 'synced' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
                {syncStatus === 'error' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse" />}
                {syncStatus === 'syncing' ? 'Sincronizando Google Sheets...' : 'Sheets API Conectada'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="reset-simulation-data"
              onClick={handleResetData}
              className="hidden sm:inline-flex text-[10px] font-mono text-neutral-500 hover:text-neutral-300 border border-neutral-900 bg-neutral-950 hover:bg-neutral-900 px-2.5 py-1.5 rounded"
              title="Resetear demo"
            >
              Resetear Datos Demo
            </button>
            <button
              id="band-logout"
              onClick={handleLogout}
              className="text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-neutral-900 transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-6 items-stretch">
        {/* Navigation Sidebar */}
        <aside className="md:w-64 shrink-0 flex flex-col gap-3">
          {/* Backstage card badge */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-900 text-center space-y-1 relative overflow-hidden select-none">
            <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/5 rounded-full blur-xl" />
            <span className="text-[8px] font-mono tracking-widest text-neutral-600 block uppercase">PASS ACCREDITATION</span>
            <span className="text-xs font-black text-neutral-200 block uppercase">ARTISTA / GESTIÓN</span>
            <span className="text-[10px] font-mono text-cyan-400 block mt-1">TOUR 2026</span>
          </div>

          <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-1 pb-2 md:pb-0 border-b md:border-b-0 border-neutral-900">
            {[
              { id: 'dashboard', label: '🗂️ Panel Leads', icon: Table },
              { id: 'aprobacion', label: '🛡️ Aprobaciones', icon: FileCheck, badge: leads.filter(l => l.estado === 'pendiente_aprobacion').length },
              { id: 'clasificacion', label: '🏷️ Clasificados', icon: CheckSquare },
              { id: 'chat', label: '🤖 Mánager Virtual', icon: MessageSquareCode },
              { id: 'logistica', label: '📅 Ensayos y Giras', icon: CalendarDays },
              { id: 'finanzas', label: '📊 Pagos y Informes', icon: DollarSign }
            ].map((item) => {
              const isSelected = currentView === item.id;
              return (
                <button
                  id={`nav-btn-${item.id}`}
                  key={item.id}
                  onClick={() => setCurrentView(item.id as any)}
                  className={`flex items-center gap-2.5 py-2.5 px-4 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer shrink-0 ${
                    isSelected 
                      ? `${colors.primary} text-neutral-950 font-black` 
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans font-black ${
                      isSelected ? 'bg-neutral-950 text-neutral-200' : 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
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
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex gap-2 items-center">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                <strong>Modo Simulación Activo:</strong> No se pudo conectar con el servidor Express backend local. Los cambios actuales se almacenarán temporalmente en memoria.
              </span>
            </div>
          )}

          {/* Theme Selector Drawer */}
          <ThemeSelector 
            currentTheme={currentTheme} 
            onThemeChange={handleThemeChange} 
            colors={colors} 
          />

          {/* Dynamic Views */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                <p className="text-xs text-neutral-400 font-mono">Cargando base de datos Bakandeya...</p>
              </div>
            ) : (
              <>
                {currentView === 'dashboard' && (
                  <Dashboard 
                    leads={leads} 
                    colors={colors}
                    onUpdateLead={handleUpdateLead}
                    onAddLead={handleAddLead}
                  />
                )}
                {currentView === 'aprobacion' && (
                  <ApprovalPanel 
                    leads={leads} 
                    colors={colors}
                    onUpdateLead={handleUpdateLead}
                  />
                )}
                {currentView === 'clasificacion' && (
                  <ClassificationView 
                    leads={leads} 
                    colors={colors}
                    onUpdateLead={handleUpdateLead}
                  />
                )}
                {currentView === 'chat' && (
                  <Chatbot 
                    colors={colors} 
                    leads={leads}
                    rehearsals={rehearsals}
                    concerts={concerts}
                    onUpdateLead={handleUpdateLead}
                    onAddRehearsal={handleAddRehearsal}
                  />
                )}
                {currentView === 'logistica' && (
                  <CalendarLogistics 
                    rehearsals={rehearsals}
                    concerts={concerts}
                    posts={posts}
                    messages={messages}
                    colors={colors}
                    onAddRehearsal={handleAddRehearsal}
                    onUpdateRehearsal={handleUpdateRehearsal}
                    onAddConcert={handleAddConcert}
                    onUpdateConcert={handleUpdateConcert}
                    onAddPost={handleAddPost}
                    onUpdatePost={handleUpdatePost}
                    onSendMessage={handleSendMessage}
                  />
                )}
                {currentView === 'finanzas' && (
                  <FinanceStats 
                    payments={payments}
                    concerts={concerts}
                    leads={leads}
                    colors={colors}
                    onAddPayment={handleAddPayment}
                    onUpdatePaymentStatus={handleUpdatePaymentStatus}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
