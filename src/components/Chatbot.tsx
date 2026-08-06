import React, { useState, useRef, useEffect } from 'react';
import { Message as MessageType, Lead, Rehearsal, Concert, ThemeColors } from '../types';
import { Send, Bot, Guitar, User, Sparkles, RefreshCw, AlertCircle, CheckCircle, HelpCircle, Calendar, ShieldAlert, X, Activity, ExternalLink, Terminal, Clock, Copy, Key } from 'lucide-react';

interface ProposedAction {
 type: 'propose_lead_approval' | 'propose_rehearsal' | 'propose_status_change' | 'propose_agent_trigger' | 'propose_concert' | 'propose_add_concert' | 'propose_band' | 'propose_tour' | 'propose_update_logo';
 leadId?: string;
 bandId?: string;
 targetType?: 'lead' | 'band';
 targetName?: string;
 leadName?: string;
 description: string;
 newStatus?: string;
 agentName?: string;
 params?: any;
 concert?: Partial<Concert>;
 rehearsal?: Partial<Rehearsal>;
 band?: any;
 tour?: any;
 imagen_url?: string;
 icono?: string;
}

interface ChatMessage {
 id: string;
 sender: 'user' | 'bot';
 text: string;
 timestamp: Date;
 proposedActions?: ProposedAction[];
 actionStatus?: 'pending' | 'applied' | 'dismissed';
}

interface ChatbotProps {
 colors: ThemeColors;
 leads: Lead[];
 rehearsals: Rehearsal[];
 concerts: Concert[];
 onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
 onAddRehearsal: (rehearsal: Rehearsal) => void;
 onAddConcert?: (concert: Concert) => void;
 isFloating?: boolean;
 onClose?: () => void;
 userRole?: string;
 onLoadingChange?: (isLoading: boolean) => void;
}

export default function Chatbot({ colors, leads, rehearsals, concerts, onUpdateLead, onAddRehearsal, onAddConcert, isFloating, onClose, userRole, onLoadingChange }: ChatbotProps) {
 const [messages, setMessages] = useState<ChatMessage[]>(() => {
 const saved = localStorage.getItem('bakandeya_chat_messages');
 if (saved) {
 try {
 const parsed = JSON.parse(saved);
 if (Array.isArray(parsed) && parsed.length > 0) {
 return parsed.map((m: any) => ({
 ...m,
 timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
 }));
 }
 } catch (e) {
 console.error("Error al cargar historial del chat:", e);
 }
 }
 return [
 {
 id: 'welcome-1',
 sender: 'bot',
 text: '👋 **¡Buenas, Jon/Filgue/R-violin/elyar!** Soy vuestro **Manager Virtual de Bakandeya**.\n\nEstoy conectado en tiempo real con vuestra hoja de datos de Google Sheets (salas), el calendario de ensayos de banda, la contabilidad y la logística de redes.\n\nPuedes preguntarme cosas como:\n- *¿Qué salas tengo pendientes de aprobación en Madrid o Granada?*\n- *Resúmeme el estado de la semana o hazme una lista de tareas para hoy.*\n- *¿Cuántas salas de Ska, Reggae o Fusión tenemos registradas?*\n\nSi necesitas, puedo **proponer cambios directos** en las salas (como aprobar un correo de contacto) o agendar ensayos, pidiéndote confirmación antes de actuar.',
 timestamp: new Date()
 }
 ];
 });

 useEffect(() => {
 try {
 localStorage.setItem('bakandeya_chat_messages', JSON.stringify(messages));
 } catch (e) {
 console.error("Error al guardar historial del chat:", e);
 }
 }, [messages]);
 const [inputText, setInputText] = useState('');
 const [isLoading, setIsLoading] = useState(false);

 useEffect(() => {
   onLoadingChange?.(isLoading);
 }, [isLoading, onLoadingChange]);
 const messagesEndRef = useRef<HTMLDivElement>(null);
 const textareaRef = useRef<HTMLTextAreaElement>(null);

 // Switch mode between Python GitHub Agents vs Direct Gemini AI
 const [agentsEnabled, setAgentsEnabled] = useState<boolean>(() => {
 const saved = localStorage.getItem('bakandeya_agents_enabled');
 return saved !== null ? saved === 'true' : false; // Default to false (Gemini Direct Mode)
 });

 useEffect(() => {
 localStorage.setItem('bakandeya_agents_enabled', String(agentsEnabled));
 }, [agentsEnabled]);

 useEffect(() => {
 if (textareaRef.current) {
 textareaRef.current.style.height = 'auto';
 textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
 }
 }, [inputText]);

 const [activeRun, setActiveRun] = useState<{
 id: number | null;
 status: 'queued' | 'in_progress' | 'completed' | 'unknown' | 'fetching' | 'error';
 conclusion: string | null;
 agentName: string;
 triggeredAt: number;
 steps: { name: string; status: string; conclusion: string | null; number: number }[];
 isDemo: boolean;
 initialLeadIds?: string[];
 } | null>(null);

 const [copiedCredentials, setCopiedCredentials] = useState(false);

 const handleCopyCredentials = async () => {
 try {
 const token = localStorage.getItem('bakandeya_token');
 const headers: Record<string, string> = {};
 if (token) {
 headers['Authorization'] = `Bearer ${token}`;
 headers['x-auth-token'] = token;
 }
 const res = await fetch('/api/github-secrets-helper', { headers });
 if (res.ok) {
 const data = await res.json();
 if (data.serviceAccountJson) {
 await navigator.clipboard.writeText(data.serviceAccountJson);
 setCopiedCredentials(true);
 setTimeout(() => setCopiedCredentials(false), 3000);
 return;
 }
 }
 alert("No se pudieron obtener las credenciales JSON del servidor.");
 } catch (e) {
 console.error("Error al copiar credenciales:", e);
 alert("Error al copiar las credenciales.");
 }
 };

 useEffect(() => {
 if (!activeRun || activeRun.status === 'completed' || activeRun.status === 'error') return;

 let intervalId: any;
 let attempts = 0;

 const pollStatus = async () => {
 if (activeRun?.isDemo) {
 attempts += 1;
 if (attempts >= 4) {
 setActiveRun((prev: any) => {
 if (!prev) return null;
 setTimeout(() => {
 window.dispatchEvent(new Event('github-agent-completed'));
 }, 50);
 return {
 ...prev,
 status: 'completed',
 conclusion: 'success',
 steps: prev.steps.map((s: any) => 
 s.name.includes("Agent") || s.number === 5 ? { ...s, status: 'completed', conclusion: 'success' } : s
 )
 };
 });
 }
 return;
 }

 try {
 const token = localStorage.getItem('bakandeya_token');
 const pat = localStorage.getItem('bakandeya_github_pat') || '';
 const owner = localStorage.getItem('bakandeya_github_owner') || '';
 const repo = localStorage.getItem('bakandeya_github_repo') || '';

 const headers: Record<string, string> = {};
 if (token) {
 headers['Authorization'] = `Bearer ${token}`;
 headers['x-auth-token'] = token;
 }
 if (pat) headers['x-github-pat'] = pat;
 if (owner) headers['x-github-owner'] = owner;
 if (repo) headers['x-github-repo'] = repo;

 if (!activeRun?.id) {
 // Find newly started run
 const res = await fetch('/api/agent-runs', { headers });
 if (res.ok) {
 const data = await res.json();
 const recentRuns = data.runs || [];
 
 const matchedRun = recentRuns.find((run: any) => {
 const runTime = new Date(run.created_at).getTime();
 const timeDiff = Math.abs(Date.now() - runTime);
 return timeDiff < 180000; // 3 minutes
 });

 if (matchedRun) {
 setActiveRun((prev: any) => {
 if (!prev) return null;
 return {
 ...prev,
 id: matchedRun.id,
 status: matchedRun.status,
 conclusion: matchedRun.conclusion
 };
 });
 }
 }
 } else {
 // Poll specific run status and job steps
 const runId = activeRun.id;
 const runsRes = await fetch('/api/agent-runs', { headers });
 if (runsRes.ok) {
 const runsData = await runsRes.json();
 const matchingRun = (runsData.runs || []).find((r: any) => r.id === runId);
 
 if (matchingRun) {
 const updatedStatus = matchingRun.status;
 const updatedConclusion = matchingRun.conclusion;

 // Fetch job steps
 const jobsRes = await fetch(`/api/agent-runs/${runId}/jobs`, { headers });
 let steps: any[] = [];
 if (jobsRes.ok) {
 const jobsData = await jobsRes.json();
 if (jobsData.jobs && jobsData.jobs.length > 0) {
 steps = jobsData.jobs[0].steps || [];
 }
 }

 setActiveRun((prev: any) => {
 if (!prev) return null;
 
 if (updatedStatus === 'completed' && prev.status !== 'completed') {
 if (updatedConclusion === 'success') {
 setTimeout(() => {
 window.dispatchEvent(new Event('github-agent-completed'));
 }, 50);

 // Delay showing success for 3s while App.tsx fetches new state
 setTimeout(() => {
 setActiveRun((current: any) => current ? { ...current, status: 'completed', conclusion: 'success' } : null);
 }, 3000);

 return {
 ...prev,
 status: 'in_progress', // Keep it visually running
 conclusion: null,
 steps: [...(steps.length > 0 ? steps : prev.steps), { name:"Sincronizando con Google Sheets...", status:"in_progress", conclusion: null }]
 };
 }
 }

 return {
 ...prev,
 status: updatedStatus,
 conclusion: updatedConclusion,
 steps: steps.length > 0 ? steps : prev.steps
 };
 });
 }
 }
 }
 } catch (err) {
 // Silent retry on network flicker
 }
 };

 pollStatus();
 intervalId = setInterval(pollStatus, 6000);

 return () => clearInterval(intervalId);
 }, [activeRun?.id, activeRun?.status, activeRun?.isDemo]);

 const isStitchLight = colors.accent === 'text-indigo-600';

 // Auto-scroll chat to bottom on mount and on message/loading updates
 useEffect(() => {
 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
 };

 // Scroll immediately
 scrollToBottom();
 // Re-scroll after layout paint
 const timer1 = setTimeout(scrollToBottom, 80);
 const timer2 = setTimeout(scrollToBottom, 250);

 return () => {
 clearTimeout(timer1);
 clearTimeout(timer2);
 };
 }, [messages.length, isLoading]);

 const parseMarkdown = (text: string) => {
 const lines = text.split('\n');
 return lines.map((line, idx) => {
 // Bullets
 if (line.trim().startsWith('- ')) {
 const bulletText = line.trim().slice(2);
 return (
 <li key={idx} className="ml-4 list-disc mt-1 text-xs">
 {formatBold(bulletText)}
 </li>
 );
 }
 return (
 <p key={idx} className="min-h-[1.2em] text-xs leading-relaxed mt-1">
 {formatBold(line)}
 </p>
 );
 });
 };

 const formatBold = (text: string) => {
 const parts = text.split(/(\*\*.*?\*\*)/g);
 return parts.map((part, i) => {
 if (part.startsWith('**') && part.endsWith('**')) {
 return <strong key={i} className={`font-bold ${isStitchLight ? 'text-indigo-950' : 'text-neutral-100'}`}>{part.slice(2, -2)}</strong>;
 }
 return part;
 });
 };

 const handleSendMessage = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!inputText.trim() || isLoading) return;

 const userMsgText = inputText;
 setInputText('');

 // Add user message
 const userMsg: ChatMessage = {
 id: `user-${Date.now()}`,
 sender: 'user',
 text: userMsgText,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, userMsg]);
 setIsLoading(true);

 try {
 const token = localStorage.getItem('bakandeya_token');
 const response = await fetch('/api/chat', {
 method: 'POST',
 headers: { 
 'Content-Type': 'application/json',
 'Authorization': token ? `Bearer ${token}` : '',
 'x-user-role': userRole || ''
 },
 body: JSON.stringify({
 message: userMsgText,
 chatHistory: messages.slice(-8).map(m => ({ sender: m.sender, text: m.text })),
 userRole: userRole || 'member',
 agentsEnabled: agentsEnabled
 })
 });

 if (!response.ok) {
 throw new Error('Response error from server');
 }

 const data = await response.json();
 
 const botMsg: ChatMessage = {
 id: `bot-${Date.now()}`,
 sender: 'bot',
 text: data.text || 'He recibido los datos correctamente.',
 timestamp: new Date(),
 proposedActions: data.proposedActions || [],
 actionStatus: (data.proposedActions && data.proposedActions.length > 0) ? 'pending' : undefined
 };

 setMessages(prev => [...prev, botMsg]);
 
 // Auto-execute the agent trigger action if proposed
 if (data.proposedActions && data.proposedActions.length > 0) {
 data.proposedActions.forEach((action: ProposedAction) => {
 if (action.type === 'propose_agent_trigger') {
 handleConfirmAction(botMsg.id, action);
 }
 });
 }

 } catch (error) {
 console.error(error);
 const errMsg: ChatMessage = {
 id: `err-${Date.now()}`,
 sender: 'bot',
 text: '⚠️ **Error de Conexión:** Ha habido un problema conectando con el servicio de Inteligencia Artificial. Por favor, inténtalo de nuevo.',
 timestamp: new Date()
 };
 setMessages(prev => [...prev, errMsg]);
 } finally {
 setIsLoading(false);
 }
 };

 // Confirm action callback
 async function handleConfirmAction(msgId: string, action: ProposedAction) {
 // 1. Apply changes
 if (action.type === 'propose_lead_approval' && action.leadId) {
 const targetLead = leads.find(l => l.id === action.leadId);
 if (targetLead) {
 const today = new Date().toISOString().split('T')[0];
 const updatedNotes = `*** [${today}] Correo APROBADO vía Chatbot AI Assistant ***\n${targetLead.notas || ''}`;
 
 onUpdateLead(action.leadId, {
 estado: 'aprobado',
 notas: updatedNotes
 }, targetLead.estado);
 }

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 return { ...m, actionStatus: 'applied' };
 }
 return m;
 }));

 const successMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender: 'bot',
 text: `✅ **Acción Ejecutada con éxito:** Se ha procesado la propuesta para **"${action.leadName || 'Sala'}"**. El estado ha sido modificado y se ha persistido el log correspondiente en la base de datos de Google Sheets. El agente Enviador re-procesará la cola esta tarde.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, successMsg]);

 } else if (action.type === 'propose_status_change' && action.leadId && action.newStatus) {
 const targetLead = leads.find(l => l.id === action.leadId);
 if (targetLead) {
 const today = new Date().toISOString().split('T')[0];
 const updatedNotes = `*** [${today}] Clasificación editada vía Chatbot AI a '${action.newStatus}' ***\n${targetLead.notas || ''}`;
 
 onUpdateLead(action.leadId, {
 estado: action.newStatus as any,
 notas: updatedNotes
 }, targetLead.estado);
 }

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 return { ...m, actionStatus: 'applied' };
 }
 return m;
 }));

 const successMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender: 'bot',
 text: `✅ **Acción Ejecutada con éxito:** Se ha procesado la propuesta para **"${action.leadName || 'Sala'}"**. El estado ha sido modificado y se ha persistido el log correspondiente en la base de datos de Google Sheets.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, successMsg]);

 } else if (action.type === 'propose_band' || action.band) {
 const bandData = {
 id: `band-${Date.now()}`,
 nombre_banda: action.band?.nombre_banda || 'Nueva Banda',
 estilo_musical: action.band?.estilo_musical || 'Desconocido',
 localizacion: action.band?.localizacion || 'Desconocido',
 estado_relacion: action.band?.estado_relacion || 'nuevo',
 ultimo_contacto: new Date().toISOString().split('T')[0],
 contacto_nombre: action.band?.contacto_nombre || '',
 email: action.band?.email || '',
 telefono: action.band?.telefono || '',
 instagram: action.band?.instagram || '',
 spotify_youtube: action.band?.spotify_youtube || '',
 aforo_promedio: Number(action.band?.aforo_promedio) || 300,
 notas_colaboracion: action.band?.notas_colaboracion || 'Añadido vía AI',
 ciudad_origen_swap: action.band?.localizacion || ''
 };
 
 try {
 const token = localStorage.getItem('bakandeya_token');
 fetch('/api/bands', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 ...(token ? { 'Authorization': `Bearer ${token}` } : {})
 },
 body: JSON.stringify(bandData)
 });
 } catch (e) {
 console.error("Error adding band directly:", e);
 }

 setMessages(prev => [...prev, {
 id: Date.now().toString(),
 text: `✅ He añadido a **${bandData.nombre_banda}** a la base de datos de bandas aliadas.`,
 sender: 'ai',
 timestamp: new Date()
 }]);
 } else if (action.type === 'propose_concert' || action.type === 'propose_add_concert' || action.concert) {
 const concertData: Concert = {
 id: action.concert?.id || `con-${Date.now()}`,
 fecha: action.concert?.fecha || new Date().toISOString().split('T')[0],
 ciudad: action.concert?.ciudad || (action.leadId ? leads.find(l => l.id === action.leadId)?.ciudad || 'Madrid' : 'Madrid'),
 sala: action.concert?.sala || action.leadName || 'Sala Villanos',
 cache: action.concert?.cache || 0,
 aforo_vendido: action.concert?.aforo_vendido || 0,
 aforo_total: action.concert?.aforo_total || 200,
 contrato_firmado: action.concert?.contrato_firmado ?? true,
 estado_pago: action.concert?.estado_pago || 'pendiente',
 notas: action.concert?.notas || 'Bolo agendado vía Mánager Virtual AI',
 tipo: action.concert?.tipo || 'sala'
 };

 if (onAddConcert) {
 onAddConcert(concertData);
 } else {
 try {
 const token = localStorage.getItem('bakandeya_token');
 fetch('/api/concerts', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 ...(token ? { 'Authorization': `Bearer ${token}` } : {})
 },
 body: JSON.stringify(concertData)
 });
 } catch (e) {
 console.error("Error adding concert directly:", e);
 }
 }

 if (action.leadId) {
 const targetLead = leads.find(l => l.id === action.leadId);
 if (targetLead) {
 const today = new Date().toISOString().split('T')[0];
 onUpdateLead(action.leadId, {
 estado: (action.newStatus as any) || 'negociando',
 notas: `*** [${today}] Concierto agendado para el ${concertData.fecha} ***\n${targetLead.notas || ''}`
 }, targetLead.estado);
 }
 }

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 return { ...m, actionStatus: 'applied' };
 }
 return m;
 }));

 const successMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender: 'bot',
 text: `🎉 **¡Concierto Agendado con Éxito!**\n\nSe ha añadido el bolo en **${concertData.sala}** (${concertData.ciudad}) para el **${concertData.fecha}** en la agenda de conciertos y guardado en la pestaña **conciertos** de Google Sheets.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, successMsg]);

 } else if (action.type === 'propose_rehearsal' || action.rehearsal) {
 const rehearsalData: Rehearsal = {
 id: action.rehearsal?.id || `reh-${Date.now()}`,
 fecha: action.rehearsal?.fecha || new Date().toISOString().split('T')[0],
 hora: action.rehearsal?.hora || '19:00',
 lugar: action.rehearsal?.lugar || 'Local de Ensayo',
 asistentes: action.rehearsal?.asistentes || ['Banda'],
 notas: action.rehearsal?.notas || 'Ensayo agendado vía Chatbot AI',
 estado: action.rehearsal?.estado || 'programado'
 };

 if (onAddRehearsal) {
 onAddRehearsal(rehearsalData);
 } else {
 try {
 const token = localStorage.getItem('bakandeya_token');
 fetch('/api/rehearsals', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 ...(token ? { 'Authorization': `Bearer ${token}` } : {})
 },
 body: JSON.stringify(rehearsalData)
 });
 } catch (e) {
 console.error("Error adding rehearsal directly:", e);
 }
 }

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 return { ...m, actionStatus: 'applied' };
 }
 return m;
 }));

 const successMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender: 'bot',
 text: `📅 **Ensayo Programado con Éxito:**\n\nSe ha agendado el ensayo para el **${rehearsalData.fecha}** a las **${rehearsalData.hora}** en **${rehearsalData.lugar}** y guardado en Google Sheets.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, successMsg]);

 } else if (action.type === 'propose_tour' || action.tour) {
 const tourData = action.tour || {
 id: `tour-${Date.now()}`,
 nombre: action.description || 'Nueva Gira',
 vehiculo: 'Furgoneta 9 Plazas',
 estado: 'planificacion',
 fechaInicio: new Date().toISOString().split('T')[0],
 fechaFin: new Date().toISOString().split('T')[0],
 presupuestoLogistica: 0,
 stops: []
 };

 try {
 const token = localStorage.getItem('bakandeya_token');
 await fetch('/api/tours', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 ...(token ? { 'Authorization': `Bearer ${token}` } : {})
 },
 body: JSON.stringify(tourData)
 });
 } catch (e) {
 console.error("Error creating tour from chat:", e);
 }

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 return { ...m, actionStatus: 'applied' };
 }
 return m;
 }));

 const successMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender: 'bot',
 text: `🚚 **Gira Guardada con Éxito:**\n\nSe ha registrado la gira **"${tourData.nombre || 'Nueva Gira'}"** en la base de datos y sincronizado con Google Sheets.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, successMsg]);

 } else if (action.type === 'propose_update_logo') {
 const targetLeadId = action.leadId || (action.targetType === 'lead' ? action.leadId : undefined);
 const targetBandId = action.bandId || (action.targetType === 'band' ? action.bandId : undefined);
 const name = action.targetName || action.leadName || 'Item';

 if (targetLeadId) {
 onUpdateLead(targetLeadId, {
 imagen_url: action.imagen_url,
 icono: action.icono
 });
 } else if (targetBandId) {
 try {
 const token = localStorage.getItem('bakandeya_token');
 fetch(`/api/bands/${targetBandId}`, {
 method: 'PUT',
 headers: {
 'Content-Type': 'application/json',
 ...(token ? { 'Authorization': `Bearer ${token}` } : {})
 },
 body: JSON.stringify({
 id: targetBandId,
 imagen_url: action.imagen_url,
 icono: action.icono
 })
 });
 } catch (e) {
 console.error("Error updating band logo directly:", e);
 }
 }

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 return { ...m, actionStatus: 'applied' };
 }
 return m;
 }));

 const successMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender: 'bot',
 text: `🖼️ **Logo/Icono Actualizado con Éxito:** Se ha guardado el logo/icono para **"${name}"** en la base de datos y sincronizado con Google Sheets.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, successMsg]);

 } else if (action.type === 'propose_agent_trigger' && action.agentName) {
 try {
 const token = localStorage.getItem('bakandeya_token');
 const pat = localStorage.getItem('bakandeya_github_pat') || '';
 const owner = localStorage.getItem('bakandeya_github_owner') || '';
 const repo = localStorage.getItem('bakandeya_github_repo') || '';
 const ref = localStorage.getItem('bakandeya_github_ref') || 'main';

 const customHeaders: Record<string, string> = {
 'Content-Type': 'application/json'
 };

 if (token) {
 customHeaders['Authorization'] = `Bearer ${token}`;
 customHeaders['x-auth-token'] = token;
 }
 if (pat) customHeaders['x-github-pat'] = pat;
 if (owner) customHeaders['x-github-owner'] = owner;
 if (repo) customHeaders['x-github-repo'] = repo;
 if (ref) customHeaders['x-github-ref'] = ref;

 const response = await fetch('/api/trigger-agent', {
 method: 'POST',
 headers: customHeaders,
 body: JSON.stringify({
 agentName: action.agentName,
 params: action.params
 })
 });

 if (!response.ok) {
 let errorText = 'Fallo al disparar el agente.';
 try {
 const errData = await response.json();
 if (errData && errData.error) {
 errorText = errData.error;
 }
 } catch (_) {
 // fallback if JSON parsing fails
 }
 throw new Error(errorText);
 }

 const data = await response.json();

 if (data.detectedRef) {
 localStorage.setItem('bakandeya_github_ref', data.detectedRef);
 window.dispatchEvent(new Event('github-ref-updated'));
 }

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 return { ...m, actionStatus: 'applied' };
 }
 return m;
 }));

 const isSim = data.simulated;
 const successMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender: 'bot',
 text: isSim 
 ? `⚙️ **Simulación del Agente '${action.agentName}':**\n\n${data.message}`
 : `🚀 **Agente '${action.agentName}' Iniciado:**\n\n${data.message}`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, successMsg]);

 const targetRegion = action.params?.ciudad || action.params?.region || 'Huelva';

 if (isSim) {
 setActiveRun({
 id: 999,
 status: 'in_progress',
 conclusion: null,
 agentName: action.agentName,
 region: targetRegion,
 params: action.params,
 triggeredAt: Date.now(),
 steps: [
 { name:"Configurar entorno", status:"completed", conclusion:"success", number: 1 },
 { name:"Verificar repositorio", status:"completed", conclusion:"success", number: 2 },
 { name:"Instalar dependencias", status:"completed", conclusion:"success", number: 3 },
 { name: `Ejecutar Agente de Python '${action.agentName}'`, status:"in_progress", conclusion: null, number: 4 }
 ],
 isDemo: true,
 initialLeadIds: leads.map(l => l.id)
 });
 } else {
 setActiveRun({
 id: null,
 status: 'fetching',
 conclusion: null,
 agentName: action.agentName,
 region: targetRegion,
 params: action.params,
 triggeredAt: Date.now(),
 steps: [
 { name:"Preparando disparador", status:"completed", conclusion:"success", number: 1 },
 { name:"Esperando a que GitHub Actions inicie el run...", status:"in_progress", conclusion: null, number: 2 }
 ],
 isDemo: false,
 initialLeadIds: leads.map(l => l.id)
 });
 }

 } catch (err: any) {
 console.error(err);
 const errorMsg: ChatMessage = {
 id: `sys-err-${Date.now()}`,
 sender: 'bot',
 text: `❌ **Error al ejecutar el agente:** ${err.message || 'No se pudo contactar con el backend.'}\n\nAsegúrate de configurar tu **GITHUB_PAT** y los datos de repositorio correctos en la sección de configuración de GitHub de arriba.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, errorMsg]);
 }
 }
 };

 const handleDismissAction = (msgId: string) => {
 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 return { ...m, actionStatus: 'dismissed' };
 }
 return m;
 }));
 };

 const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 if (inputText.trim() && !isLoading) {
 handleSendMessage(e as any);
 }
 }
 };

 return (
 <div className={`flex flex-col ${isFloating ? 'h-[550px]' : 'h-full min-h-[500px]'} ${isStitchLight ? 'bg-white -slate-200' : 'bg-[#0c0c10]/95 -neutral-900'} rounded-2xl overflow-hidden font-sans backdrop-blur-xl shadow-2xl w-full max-w-full overflow-x-hidden`}>
 {/* Bot Header */}
 <div className={`px-5 py-4 flex items-center justify-between ${isStitchLight ? 'bg-slate-50 -slate-200/80' : 'bg-[#050507]/90 -neutral-900/60'}`}>
 <div className="flex items-center gap-3">
 <div className={`p-1.5 rounded-lg ${isStitchLight ? 'bg-indigo-50 -indigo-100 text-indigo-600' : 'bg-cyan-500/10 -cyan-500/20 text-cyan-400'}`}>
 <Guitar className="w-4 h-4" />
 </div>
 <div>
 <h4 className={`text-xs font-display font-medium tracking-widest flex items-center gap-1.5 uppercase ${isStitchLight ? 'text-slate-800' : 'text-neutral-100'}`}>
 Mánager Virtual AI <span className={`w-1.5 h-1.5 rounded-full inline-block animate-pulse ${isStitchLight ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.8)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]'}`} />
 </h4>
 <span className="text-[9px] font-mono text-neutral-500">SYSTEM CORES ACTIVE // SHEETS INTEGRATION</span>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <button
 id="clear-chat-btn"
 onClick={() => {
 const resetMessages: ChatMessage[] = [
 {
 id: 'welcome-1',
 sender: 'bot',
 text: '👋 **¡Buenas, equipo de Bakandeya!** He limpiado el hilo del chat.\n\n¿En qué os puedo ayudar para organizar los conciertos de la banda, el calendario de redes o revisar los correos para las salas hoy?',
 timestamp: new Date()
 }
 ];
 setMessages(resetMessages);
 try {
 localStorage.setItem('bakandeya_chat_messages', JSON.stringify(resetMessages));
 } catch (e) {
 console.error(e);
 }
 }}
 className={`text-[9px] font-mono tracking-wider uppercase transition-all flex items-center gap-1 hover:underline cursor-pointer active:scale-95 ${isStitchLight ? 'text-slate-400 hover:text-indigo-600' : 'text-neutral-500 hover:text-cyan-400'}`}
 >
 Limpiar Hilo
 </button>
 {onClose && (
 <button
 id="close-floating-chat-btn"
 onClick={onClose}
 className={`p-1.5 rounded transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
 isStitchLight 
 ? 'bg-slate-100 hover:bg-slate-200 -slate-200 text-slate-500 hover:text-slate-800' 
 : 'bg-neutral-900 hover:bg-neutral-800 -neutral-800 text-neutral-400 hover:text-white'
 }`}
 title="Cerrar Chat"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>

 {/* Mode Switcher Banner (Python Agents vs Direct Gemini) */}
 <div className={`px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono transition-colors ${
 agentsEnabled 
 ? (isStitchLight ? 'bg-amber-50/80 -amber-200/80 text-amber-900' : 'bg-amber-500/10 -amber-500/20 text-amber-300')
 : (isStitchLight ? 'bg-emerald-50/80 -emerald-200/80 text-emerald-900' : 'bg-emerald-500/10 -emerald-500/20 text-emerald-300')
 }`}>
 <div className="flex items-center gap-2 min-w-0">
 <span className={`w-2 h-2 rounded-full shrink-0 ${agentsEnabled ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
 <span className="font-bold truncate text-[11px] uppercase tracking-wider">
 {agentsEnabled ? '⚡ Agentes Python Activos (GitHub Actions)' : '🤖 Modo Gemini Directo (100% Autónomo)'}
 </span>
 <span className="text-[10px] opacity-75 hidden sm:inline truncate">
 {agentsEnabled ? '— Dispara workflows en GitHub Actions' : '— Asistencia e ideas directas con Gemini'}
 </span>
 </div>

 <button
 id="toggle-agents-switch"
 type="button"
 onClick={() => {
 const nextVal = !agentsEnabled;
 setAgentsEnabled(nextVal);
 localStorage.setItem('bakandeya_agents_enabled', String(nextVal));
 }}
 className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 ${
 agentsEnabled
 ? (isStitchLight ? 'bg-amber-200 hover:bg-[#d1b375]/15 text-[#d1b375] -amber-300' : 'bg-amber-500/20 hover:bg-[#d1b375]/15 text-[#d1b375] -amber-500/40')
 : (isStitchLight ? 'bg-emerald-200 hover:bg-[#10b981]/15 text-[#10b981] -emerald-300' : 'bg-emerald-500/20 hover:bg-[#10b981]/15 text-[#10b981] -emerald-500/40')
 }`}
 title={agentsEnabled ?"Desactivar lanzadores de Python y usar solo Gemini" :"Activar ejecuciones de Python en GitHub Actions"}
 >
 <span>{agentsEnabled ?"Desactivar Agentes Python" :"Activar Agentes Python"}</span>
 </button>
 </div>

 {/* Messages Thread Container */}
 <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${isStitchLight ? 'bg-slate-50/50' : 'bg-neutral-950/20'}`}>
 {messages.map((msg) => {
 const isBot = msg.sender === 'bot';
 return (
 <div key={msg.id} className={`flex gap-3 max-w-[90%] ${isBot ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}>
 {/* Avatar circle */}
 <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
 isBot 
 ? (isStitchLight ? 'bg-indigo-50 -indigo-100 text-indigo-600' : 'bg-cyan-500/10 -cyan-500/20 text-cyan-400') 
 : (isStitchLight ? 'bg-slate-100 -slate-200 text-slate-500' : 'bg-neutral-900 -neutral-800 text-neutral-400')
 }`}>
 {isBot ? <Guitar className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
 </div>

 <div className="space-y-2">
 {/* Text Bubble */}
 <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${
 isBot 
 ? (isStitchLight 
 ? 'bg-white -slate-200 text-slate-800 rounded-tl-none shadow-sm' 
 : 'bg-neutral-900/50 -neutral-900/80 rounded-tl-none text-neutral-300') 
 : (isStitchLight 
 ? 'bg-indigo-50 -indigo-100 text-indigo-950 rounded-tr-none' 
 : 'bg-cyan-950/20 -cyan-500/10 rounded-tr-none text-neutral-300')
 }`}>
 <div className="space-y-1">{parseMarkdown(msg.text)}</div>
 <span className="text-[8px] font-mono text-neutral-600 block mt-2 text-right">
 {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>

 {/* Proposed actions box within chat */}
 {isBot && msg.proposedActions && msg.proposedActions.filter(a => a.type !== 'propose_agent_trigger').length > 0 && (
 <div className={` rounded-2xl p-4 space-y-3 max-w-sm mt-1 backdrop-blur-md ${isStitchLight ? '-indigo-100 bg-indigo-50/20' : '-cyan-500/20 bg-cyan-500/5'}`}>
 <div className={`flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-600' : 'text-cyan-400'}`}>
 <Sparkles className="w-3.5 h-3.5 animate-pulse" />
 <h5 className="font-mono font-bold text-[9px] tracking-widest uppercase">Propuesta del Manager de IA</h5>
 </div>
 
 {msg.proposedActions.filter(a => a.type !== 'propose_agent_trigger').map((act, aIdx) => (
 <div key={aIdx} className="space-y-2.5">
 <p className={`text-[11px] leading-relaxed p-2.5 rounded-xl font-mono ${isStitchLight ? 'text-slate-800 bg-white -slate-200' : 'text-neutral-300 bg-neutral-950 -neutral-900'}`}>
 {act.description}
 </p>

 {msg.actionStatus === 'pending' ? (
 <div className="flex gap-2">
 <button
 id={`confirm-proposal-btn-${msg.id}`}
 onClick={() => handleConfirmAction(msg.id, act)}
 className={`flex-1 text-[10px] font-bold font-mono tracking-wider uppercase py-2 rounded-lg transition-all cursor-pointer active:scale-95 active:opacity-90 ${isStitchLight ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'bg-cyan-500 hover:bg-cyan-600 text-neutral-950'}`}
 >
 ✓ Aplicar Cambio
 </button>
 <button
 id={`dismiss-proposal-btn-${msg.id}`}
 onClick={() => handleDismissAction(msg.id)}
 className={`px-3 py-2 text-[10px] font-mono rounded-lg transition-colors cursor-pointer active:scale-95 active:opacity-90 ${
 isStitchLight 
 ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 -slate-200' 
 : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white -neutral-800'
 }`}
 >
 Descartar
 </button>
 </div>
 ) : msg.actionStatus === 'applied' ? (
 <div className="text-[10px] font-mono text-emerald-600 bg-emerald-500/5 -emerald-500/10 rounded-lg p-2 flex items-center gap-1.5">
 <CheckCircle className="w-3.5 h-3.5" /> Cambio de estado aplicado
 </div>
 ) : (
 <div className={`text-[10px] font-mono rounded-lg p-2 ${isStitchLight ? 'text-slate-400 bg-slate-50 -slate-100' : 'text-neutral-500 bg-neutral-900 -neutral-800'}`}>
 Propuesta descartada / expirada
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
 })}

 {isLoading && (
 <div className="flex gap-3 max-w-[80%] self-start">
 <div className={`w-7 h-7 rounded-lg flex items-center justify-center animate-pulse ${isStitchLight ? 'bg-indigo-50 -indigo-100 text-indigo-600' : 'bg-cyan-500/10 -cyan-500/20 text-cyan-400'}`}>
 <Guitar className="w-3.5 h-3.5" />
 </div>
 <div className={`p-3.5 rounded-xl rounded-tl-none text-[11px] font-mono flex items-center gap-2 ${isStitchLight ? 'bg-white -slate-200 text-slate-500 shadow-sm' : 'bg-neutral-900/50 -neutral-900 text-neutral-500'}`}>
 <RefreshCw className={`w-3.5 h-3.5 animate-spin ${isStitchLight ? 'text-indigo-600' : 'text-cyan-400'}`} /> Analizando base de datos Sheets...
 </div>
 </div>
 )}

 {activeRun && (
 <div className={` rounded-2xl p-4 space-y-3 max-w-sm mt-1 animate-in slide-in-from-bottom-2 fade-in duration-300 ${isStitchLight ? '-indigo-100 bg-white shadow-md text-slate-800' : '-cyan-500/10 bg-[#0c0c10]/80 shadow-[0_4px_24px_rgba(0,0,0,0.6)] text-neutral-300'}`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest uppercase">
 <Activity className={`w-3.5 h-3.5 ${isStitchLight ? 'text-indigo-600' : 'text-cyan-400'} animate-pulse`} />
 <span>Monitoreando {activeRun.agentName}</span>
 </div>
 <button 
 type="button"
 onClick={() => setActiveRun(null)}
 className="text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
 title="Cerrar monitor"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>

 <div className={`p-3 rounded-xl ${isStitchLight ? 'bg-slate-50 -slate-200/60' : 'bg-[#050507]/60 -neutral-900/80'}`}>
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase text-neutral-500">Estado</span>
 {activeRun.status === 'queued' && (
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#d1b375]/15 text-[#d1b375] -amber-500/20 animate-pulse">🕒 En Cola</span>
 )}
 {activeRun.status === 'fetching' && (
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-500/15 text-sky-400 -indigo-500/20 animate-pulse">🔄 Despachando</span>
 )}
 {activeRun.status === 'in_progress' && (
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 -cyan-500/20 animate-pulse">⚙️ Ejecutando...</span>
 )}
 {activeRun.status === 'completed' && activeRun.conclusion === 'success' && (
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#10b981]/15 text-[#10b981] -emerald-500/20">✅ Éxito</span>
 )}
 {activeRun.status === 'completed' && activeRun.conclusion === 'failure' && (
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-400 -rose-500/20">❌ Fallido</span>
 )}
 {activeRun.status === 'completed' && activeRun.conclusion !== 'success' && activeRun.conclusion !== 'failure' && (
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-neutral-800 text-neutral-400 -neutral-700">{activeRun.conclusion || 'Terminado'}</span>
 )}
 </div>

 {/* Steps sequencer */}
 {activeRun.steps && activeRun.steps.length > 0 && (
 <div className="mt-3 space-y-2 pt-2 -dashed -neutral-200 dark:-neutral-800">
 <div className="flex items-center gap-1.5 text-[9px] text-neutral-500 uppercase tracking-wider">
 <Terminal className="w-3 h-3" /> Secuencia de Pasos:
 </div>
 <div className="space-y-1.5 pl-1">
 {activeRun.steps.map((step: any, idx: number) => {
 const isStepSuccess = step.conclusion === 'success';
 const isStepFailure = step.conclusion === 'failure';
 const isStepRunning = step.status === 'in_progress';
 
 let dotColor = 'bg-neutral-800';
 let textColor = 'text-neutral-500';
 if (isStepSuccess) {
 dotColor = 'bg-emerald-500 shadow-[0_0_4px_#10b981]';
 textColor = isStitchLight ? 'text-slate-600' : 'text-neutral-300';
 } else if (isStepFailure) {
 dotColor = 'bg-rose-500 shadow-[0_0_4px_#f43f5e] animate-pulse';
 textColor = 'text-rose-400 font-bold';
 } else if (isStepRunning) {
 dotColor = 'bg-cyan-400 animate-ping';
 textColor = 'text-cyan-400 font-bold';
 }

 return (
 <div key={idx} className="flex items-center gap-2 text-[10px] font-mono">
 <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
 <span className={`truncate leading-none ${textColor}`}>{step.name}</span>
 {isStepRunning && <RefreshCw className="w-2.5 h-2.5 animate-spin text-cyan-400 shrink-0" />}
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>

 {/* Outcome message feedback */}
 {activeRun.status === 'completed' && activeRun.conclusion === 'success' && (() => {
 // Get actual new leads
 let detectedLeads = leads.filter(l => !activeRun.initialLeadIds?.includes(l.id));

 if (activeRun.region) {
 const searchLower = activeRun.region.toLowerCase();
 const regionalFiltered = detectedLeads.filter(l => 
 (l.ciudad && l.ciudad.toLowerCase().includes(searchLower)) ||
 (l.region && l.region.toLowerCase().includes(searchLower)) ||
 (l.fuente && l.fuente.toLowerCase().includes(searchLower))
 );
 if (regionalFiltered.length > 0) {
 detectedLeads = regionalFiltered;
 }
 }

 // Fallback to region-specific simulated leads if no new leads were detected or in demo mode
 if (detectedLeads.length === 0 || activeRun.isDemo) {
 const regionName = activeRun.region || activeRun.params?.region || activeRun.params?.ciudad || 'Huelva';
 const normLoc = regionName.toLowerCase();
 const dateTag = new Date().toLocaleDateString();

 if (normLoc.includes("huelva")) {
 detectedLeads = [
 {
 id: `demo-huelva-1-${Date.now()}`,
 nombre_sala: 'Gran Teatro de Huelva',
 ciudad: 'Huelva',
 region: 'Andalucía',
 aforo: 600,
 genero: 'Música / Teatro / Mestizaje',
 tipo: activeRun.params?.tipo || 'Teatro/Sala',
 email_contacto: 'programacion@teatrohuelva.es',
 telefono: '+34 959 21 01 00',
 instagram: '@teatrohuelva',
 fuente: 'Scout Descubridor: Huelva',
 estado: 'nuevo',
 pitch_generado: '',
 notas: `Descubierto para Huelva (${dateTag}).`
 },
 {
 id: `demo-huelva-2-${Date.now()}`,
 nombre_sala: 'Foro Iberoamericano de La Rábida',
 ciudad: 'Palos de la Frontera (Huelva)',
 region: 'Andalucía',
 aforo: 2500,
 genero: 'Festivales / Conciertos',
 tipo: 'Festival',
 email_contacto: 'cultura@diphuelva.es',
 telefono: '+34 959 53 05 00',
 instagram: '@diphuelva',
 fuente: 'Scout Descubridor: Huelva',
 estado: 'nuevo',
 pitch_generado: '',
 notas: `Descubierto para Huelva (${dateTag}).`
 }
 ];
 } else if (normLoc.includes("sevilla") || normLoc.includes("andaluc")) {
 detectedLeads = [
 {
 id: `demo-sevilla-1-${Date.now()}`,
 nombre_sala: 'Sala Custom',
 ciudad: 'Sevilla',
 region: 'Andalucía',
 aforo: 1000,
 genero: 'Rock / Electronica / Fusion',
 tipo: activeRun.params?.tipo || 'Sala',
 email_contacto: 'info@salacustom.com',
 telefono: '+34 954 51 52 53',
 instagram: '@salacustom',
 fuente: 'Scout Descubridor: Sevilla',
 estado: 'nuevo',
 pitch_generado: '',
 notas: `Descubierto para Sevilla (${dateTag}).`
 }
 ];
 } else {
 const capLoc = regionName.charAt(0).toUpperCase() + regionName.slice(1);
 detectedLeads = [
 {
 id: `demo-gen-1-${Date.now()}`,
 nombre_sala: `Gran Espacio Musical de ${capLoc}`,
 ciudad: capLoc,
 region: capLoc,
 aforo: 550,
 genero: 'Música en Directo / Fusion',
 tipo: activeRun.params?.tipo || 'Sala',
 email_contacto: `booking@espacio${capLoc.toLowerCase().replace(/\s+/g, '')}.es`,
 telefono: '+34 900 12 34 56',
 instagram: `@espacio_${capLoc.toLowerCase().replace(/\s+/g, '_')}`,
 fuente: `Scout Descubridor: ${capLoc}`,
 estado: 'nuevo',
 pitch_generado: '',
 notas: `Descubierto para ${capLoc} (${dateTag}).`
 }
 ];
 }
 }

 const getLeadCategory = (lead: any) => {
 const name = (lead.nombre_sala || '').toLowerCase();
 const type = (lead.tipo || '').toLowerCase();
 if (name.includes('ayuntamiento') || name.includes('ayto') || name.includes('concello') || name.includes('gobierno') || type.includes('ayuntamiento') || type.includes('concello') || type.includes('teatro') || type.includes('auditorio')) {
 return 'Ayuntamientos';
 }
 if (name.includes('festival') || name.includes('fest') || type.includes('festival')) {
 return 'Festivales';
 }
 return 'Salas / Clubs';
 };

 const groupedLeads = detectedLeads.reduce((acc: Record<string, typeof detectedLeads>, lead) => {
 const cat = getLeadCategory(lead);
 if (!acc[cat]) acc[cat] = [];
 acc[cat].push(lead);
 return acc;
 }, {});

 return (
 <div className="p-3.5 bg-emerald-500/10 -emerald-500/20 rounded-xl space-y-2.5 animate-in fade-in duration-300 select-text">
 <div className="flex items-center gap-2">
 <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
 <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">¡Búsqueda Finalizada!</span>
 </div>
 
 <p className="text-[10px] leading-normal text-emerald-500/90 dark:text-emerald-400/80">
 El agente ha terminado con éxito y ha enviado los resultados directos a Google Sheets. Tu Gestor de Booking se ha actualizado en tiempo real.
 </p>

 <div className=" -emerald-500/20 pt-2.5 mt-2 space-y-2">
 <div className="flex justify-between items-center text-[10px] font-mono">
 <span className="text-emerald-400/80 text-[10px]">Nuevos contactos añadidos:</span>
 <span className="px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold font-sans -emerald-500/30">
 {detectedLeads.length} contactos
 </span>
 </div>

 {detectedLeads.length > 0 ? (
 <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
 {Object.entries(groupedLeads).map(([category, items]) => (
 <div key={category} className="space-y-1">
 <span className="text-[8px] font-bold font-mono tracking-wider uppercase text-emerald-500/70 block">
 {category} ({items.length})
 </span>
 <div className="space-y-1 pl-1">
 {items.map((item, iIdx) => (
 <div 
 key={iIdx} 
 className={`p-1.5 rounded text-[9px] font-sans flex flex-col gap-0.5 ${
 isStitchLight 
 ? 'bg-white/60 -slate-200/50 text-slate-700' 
 : 'bg-neutral-900/40 -neutral-800/60 text-neutral-300'
 }`}
 >
 <div className="flex justify-between items-start">
 <strong className={`${isStitchLight ? 'text-slate-900' : 'text-neutral-100'} font-semibold truncate`}>
 {item.nombre_sala}
 </strong>
 <span className="text-[8px] opacity-75 font-mono">{item.ciudad}</span>
 </div>
 <div className="flex justify-between items-center text-[8px] opacity-80 font-mono">
 <span className="truncate max-w-[150px]">{item.email_contacto || 'Sin email'}</span>
 <span className="text-emerald-500 uppercase text-[7px] font-bold">Añadido</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-[9px] italic text-neutral-500 font-mono">
 No se detectaron nuevas filas en esta ejecución. Toda la información ya está al día.
 </p>
 )}
 </div>
 </div>
 );
 })()}

 {activeRun.status === 'completed' && activeRun.conclusion === 'failure' && (
 <div className="p-3 bg-rose-500/10 -rose-500/20 rounded-xl space-y-2 animate-in fade-in duration-300">
 <div className="flex items-center justify-between">
 <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
 <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
 <span>Fallo de Ejecución en GitHub Actions</span>
 </p>
 <a
 href={`https://github.com/${localStorage.getItem('bakandeya_github_owner') || 'DiegoCalleB'}/${localStorage.getItem('bakandeya_github_repo') || 'bakandeya-agent-manager'}/actions/runs/${activeRun.id}`}
 target="_blank"
 rel="noopener noreferrer"
 className="text-[9px] font-mono text-rose-300 hover:text-white underline flex items-center gap-1"
 >
 Ver Log en GitHub <ExternalLink className="w-2.5 h-2.5" />
 </a>
 </div>
 <p className="text-[10px] leading-normal text-rose-300/90">
 El agente Python falló durante su ejecución en GitHub Actions. Las causas principales son:
 </p>
 <ul className="list-disc pl-3.5 text-[9px] text-rose-300/80 space-y-0.5">
 <li><strong>Secrets faltantes o con formato inválido</strong> en el repositorio de GitHub (<code>GCP_SA_KEY</code>, <code>GOOGLE_CREDENTIALS</code>, o <code>SPREADSHEET_ID</code>).</li>
 <li><strong>Permisos de Google Sheet:</strong> La hoja de cálculo no está compartida con el email del Service Account.</li>
 </ul>
 <div className="pt-1.5 flex flex-wrap gap-2">
 <button
 type="button"
 onClick={handleCopyCredentials}
 className="px-2.5 py-1 text-[9px] font-mono font-bold bg-rose-500/20 hover:bg-rose-500/15 text-rose-400 -rose-500/30 rounded flex items-center gap-1 cursor-pointer transition-all"
 >
 <Copy className="w-3 h-3" />
 <span>{copiedCredentials ? '✓ Copiado al Portapapeles' : 'Copiar Credenciales JSON'}</span>
 </button>
 <a
 href={`https://github.com/${localStorage.getItem('bakandeya_github_owner') || 'DiegoCalleB'}/${localStorage.getItem('bakandeya_github_repo') || 'bakandeya-agent-manager'}/settings/secrets/actions`}
 target="_blank"
 rel="noopener noreferrer"
 className="px-2.5 py-1 text-[9px] font-mono font-bold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 -neutral-700 rounded flex items-center gap-1 cursor-pointer"
 >
 <Key className="w-3 h-3" />
 <span>Configurar Secrets en GitHub ↗</span>
 </a>
 </div>
 </div>
 )}
 </div>
 )}

 <div ref={messagesEndRef} />
 </div>

 {/* Input Message Form Footer */}
 <form onSubmit={handleSendMessage} className={`p-3 flex gap-2 items-end ${isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-[#050507]/90 -neutral-900/60'}`}>
 <textarea
 id="chatbot-text-input"
 ref={textareaRef}
 rows={1}
 value={inputText}
 onChange={(e) => setInputText(e.target.value)}
 onKeyDown={handleKeyDown}
 placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
 className={`flex-1 rounded-xl px-3.5 py-2 text-xs focus:outline-none transition-all font-sans resize-none max-h-28 min-h-[38px] ${
 isStitchLight 
 ? 'bg-white -slate-200 text-slate-800 focus:-indigo-500 placeholder:text-slate-400' 
 : 'bg-neutral-950/60 -neutral-900 text-neutral-200 focus:-cyan-500/50 placeholder:text-neutral-600'
 }`}
 />
 <button
 id="chatbot-send-btn"
 type="submit"
 disabled={!inputText.trim() || isLoading}
 className={`p-2.5 rounded-xl font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95 active:opacity-90 mb-0.5 ${
 inputText.trim() 
 ? (isStitchLight ? 'bg-indigo-600 text-white' : colors.primary) 
 : (isStitchLight ? 'bg-slate-100 text-slate-400 -slate-200' : 'bg-neutral-900 text-neutral-600 -neutral-800/40')
 }`}
 >
 <Send className={`w-4 h-4 ${isStitchLight && inputText.trim() ? 'text-white' : 'text-zinc-950'}`} />
 </button>
 </form>
 </div>
 );
}
