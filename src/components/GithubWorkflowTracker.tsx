import React, { useState, useEffect, useCallback } from 'react';
import { 
 Github, Activity, CheckCircle, AlertCircle, RefreshCw, 
 ChevronDown, ChevronUp, ExternalLink, Clock, User, Terminal, AlertTriangle, Copy, Key
} from 'lucide-react';
import { ThemeColors } from '../types';

interface GithubWorkflowTrackerProps {
 githubPat: string;
 githubOwner: string;
 githubRepo: string;
 githubRef: string;
 colors: ThemeColors;
 currentTheme: string;
}

interface WorkflowRun {
 id: number;
 name: string;
 run_number: number;
 event: string;
 status: string;
 conclusion: string | null;
 created_at: string;
 html_url: string;
 actor: {
 login: string;
 avatar_url: string;
 };
 trigger_agent?: string; // Derived or explicitly simulated
}

interface Step {
 name: string;
 status: string;
 conclusion: string | null;
 number: number;
}

interface Job {
 id: number;
 name: string;
 status: string;
 conclusion: string | null;
 steps: Step[];
}

export default function GithubWorkflowTracker({
 githubPat,
 githubOwner,
 githubRepo,
 githubRef,
 colors,
 currentTheme
}: GithubWorkflowTrackerProps) {
 const [runs, setRuns] = useState<WorkflowRun[]>([]);
 const [loading, setLoading] = useState<boolean>(false);
 const [error, setError] = useState<string | null>(null);
 const [expandedRunId, setExpandedRunId] = useState<number | null>(null);
 const [jobsData, setJobsData] = useState<Record<number, Job[]>>({});
 const [loadingJobs, setLoadingJobs] = useState<Record<number, boolean>>({});
 const [isDemo, setIsDemo] = useState<boolean>(false);
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

 const isStitchLight = false;

 // Format relative time in Spanish
 const formatRelativeTime = (dateStr: string) => {
 try {
 const ms = Date.now() - new Date(dateStr).getTime();
 const mins = Math.floor(ms / 60000);
 const hours = Math.floor(mins / 60);
 const days = Math.floor(hours / 24);

 if (mins < 1) return 'Hace unos segundos';
 if (mins < 60) return `Hace ${mins} min`;
 if (hours < 24) return `Hace ${hours} h`;
 return `Hace ${days} d`;
 } catch (e) {
 return dateStr;
 }
 };

 // Safe client-side fetch from GitHub Actions
 const fetchWorkflowRuns = useCallback(async () => {
 if (!githubPat || githubPat.trim() === '') {
 setIsDemo(true);
 setError(null);
 // Load exquisitely detailed mock runs
 const now = Date.now();
 const mockRuns: WorkflowRun[] = [
 {
 id: 104,
 name:"Run Python Agents",
 run_number: 45,
 event:"workflow_dispatch",
 status:"in_progress",
 conclusion: null,
 created_at: new Date(now - 1.5 * 60 * 1000).toISOString(),
 html_url:"https://github.com/DiegoCalleB/bakandeya-agent-manager/actions",
 actor: { login:"DiegoCalleB", avatar_url:"https://github.com/DiegoCalleB.png" },
 trigger_agent:"Enviador"
 },
 {
 id: 101,
 name:"Run Python Agents",
 run_number: 44,
 event:"workflow_dispatch",
 status:"completed",
 conclusion:"success",
 created_at: new Date(now - 25 * 60 * 1000).toISOString(),
 html_url:"https://github.com/DiegoCalleB/bakandeya-agent-manager/actions",
 actor: { login:"DiegoCalleB", avatar_url:"https://github.com/DiegoCalleB.png" },
 trigger_agent:"Scout"
 },
 {
 id: 102,
 name:"Run Python Agents",
 run_number: 43,
 event:"workflow_dispatch",
 status:"completed",
 conclusion:"failure",
 created_at: new Date(now - 3 * 3600 * 1000).toISOString(),
 html_url:"https://github.com/DiegoCalleB/bakandeya-agent-manager/actions",
 actor: { login:"DiegoCalleB", avatar_url:"https://github.com/DiegoCalleB.png" },
 trigger_agent:"Redactor"
 },
 {
 id: 103,
 name:"Run Python Agents",
 run_number: 42,
 event:"schedule",
 status:"completed",
 conclusion:"success",
 created_at: new Date(now - 24 * 3600 * 1000).toISOString(),
 html_url:"https://github.com/DiegoCalleB/bakandeya-agent-manager/actions",
 actor: { login:"github-actions[bot]", avatar_url: "" },
 trigger_agent:"Lector"
 }
 ];
 setRuns(mockRuns);
 return;
 }

 setIsDemo(false);
 setLoading(true);
 setError(null);

 const owner = githubOwner || 'DiegoCalleB';
 const repo = githubRepo || 'bakandeya-agent-manager';
 const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=8`;
 const authHeader = githubPat.startsWith("github_pat_") || githubPat.length > 40 ? `Bearer ${githubPat}` : `token ${githubPat}`;

 try {
 const response = await fetch(url, {
 headers: {
"Authorization": authHeader,
"Accept":"application/vnd.github.v3+json",
"X-GitHub-Api-Version":"2022-11-28"
 }
 });

 if (!response.ok) {
 if (response.status === 401) {
 throw new Error("Token de GitHub (PAT) inválido o expirado.");
 }
 if (response.status === 404) {
 throw new Error(`Repositorio '${owner}/${repo}' no encontrado o inaccesible.`);
 }
 throw new Error(`Fallo de la API de GitHub (Código: ${response.status})`);
 }

 const data = await response.json();
 const workflowRuns: WorkflowRun[] = (data.workflow_runs || []).map((run: any) => {
 // Simple heuristic to determine which agent triggered
 let agent: string | undefined = undefined;
 const lowerName = (run.name || "").toLowerCase();
 const lowerHead = (run.head_commit?.message || "").toLowerCase();
 if (lowerName.includes("descubridor") || lowerName.includes("scout_descubridor") || lowerHead.includes("descubridor") || lowerHead.includes("scout_descubridor")) agent ="Scout Descubridor";
 else if (lowerName.includes("scout") || lowerHead.includes("scout")) agent ="Scout";
 else if (lowerName.includes("redactor") || lowerHead.includes("redactor")) agent ="Redactor";
 else if (lowerName.includes("enviador") || lowerHead.includes("enviador")) agent ="Enviador";
 else if (lowerName.includes("lector") || lowerHead.includes("lector") || lowerHead.includes("bandeja")) agent ="Lector";
 
 return {
 id: run.id,
 name: run.name ||"Workflow Run",
 run_number: run.run_number,
 event: run.event,
 status: run.status,
 conclusion: run.conclusion,
 created_at: run.created_at,
 html_url: run.html_url,
 actor: {
 login: run.triggering_actor?.login ||"github-actions",
 avatar_url: run.triggering_actor?.avatar_url || ""
 },
 trigger_agent: agent
 };
 });

 setRuns(workflowRuns);
 } catch (err: any) {
 console.error("Error fetching workflow runs:", err);
 setError(err.message ||"Error al conectar con la API de GitHub Actions.");
 } finally {
 setLoading(false);
 }
 }, [githubPat, githubOwner, githubRepo]);

 // Fetch jobs and steps for a specific run
 const fetchJobsForRun = async (runId: number) => {
 if (isDemo) {
 // Return high-fidelity simulated steps for each demo run
 let mockSteps: Step[] = [];
 if (runId === 104) { // Enviador
 mockSteps = [
 { name:"Set up job", status:"completed", conclusion:"success", number: 1 },
 { name:"Run actions/checkout@v4", status:"completed", conclusion:"success", number: 2 },
 { name:"Set up Python 3.11", status:"completed", conclusion:"success", number: 3 },
 { name:"Install dependencies", status:"completed", conclusion:"success", number: 4 },
 { name:"Run Enviador Agent (Python)", status:"in_progress", conclusion: null, number: 5 },
 { name:"Post Run actions/checkout@v4", status:"queued", conclusion: null, number: 6 }
 ];
 } else if (runId === 101) { // Scout
 mockSteps = [
 { name:"Set up job", status:"completed", conclusion:"success", number: 1 },
 { name:"Run actions/checkout@v4", status:"completed", conclusion:"success", number: 2 },
 { name:"Set up Python 3.11", status:"completed", conclusion:"success", number: 3 },
 { name:"Install dependencies", status:"completed", conclusion:"success", number: 4 },
 { name:"Run Scout Agent (Python)", status:"completed", conclusion:"success", number: 5 },
 { name:"Post Run actions/checkout@v4", status:"completed", conclusion:"success", number: 6 },
 { name:"Complete job", status:"completed", conclusion:"success", number: 7 }
 ];
 } else if (runId === 102) { // Redactor
 mockSteps = [
 { name:"Set up job", status:"completed", conclusion:"success", number: 1 },
 { name:"Run actions/checkout@v4", status:"completed", conclusion:"success", number: 2 },
 { name:"Set up Python 3.11", status:"completed", conclusion:"success", number: 3 },
 { name:"Install dependencies", status:"completed", conclusion:"success", number: 4 },
 { name:"Run Redactor Agent (Python)", status:"completed", conclusion:"failure", number: 5 },
 { name:"Post Run actions/checkout@v4", status:"completed", conclusion:"success", number: 6 }
 ];
 } else { // Lector
 mockSteps = [
 { name:"Set up job", status:"completed", conclusion:"success", number: 1 },
 { name:"Run actions/checkout@v4", status:"completed", conclusion:"success", number: 2 },
 { name:"Set up Python 3.11", status:"completed", conclusion:"success", number: 3 },
 { name:"Install dependencies", status:"completed", conclusion:"success", number: 4 },
 { name:"Run Lector de Bandeja Agent (Python)", status:"completed", conclusion:"success", number: 5 },
 { name:"Post Run actions/checkout@v4", status:"completed", conclusion:"success", number: 6 }
 ];
 }

 setJobsData(prev => ({
 ...prev,
 [runId]: [{
 id: runId * 10,
 name:"run-python-agent",
 status: runId === 104 ?"in_progress" :"completed",
 conclusion: runId === 102 ?"failure" : (runId === 104 ? null :"success"),
 steps: mockSteps
 }]
 }));
 return;
 }

 setLoadingJobs(prev => ({ ...prev, [runId]: true }));
 const owner = githubOwner || 'DiegoCalleB';
 const repo = githubRepo || 'bakandeya-agent-manager';
 const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/jobs`;
 const authHeader = githubPat.startsWith("github_pat_") || githubPat.length > 40 ? `Bearer ${githubPat}` : `token ${githubPat}`;

 try {
 const response = await fetch(url, {
 headers: {
"Authorization": authHeader,
"Accept":"application/vnd.github.v3+json",
"X-GitHub-Api-Version":"2022-11-28"
 }
 });

 if (!response.ok) throw new Error("No se pudieron cargar los detalles del workflow.");
 const data = await response.json();
 
 const jobs: Job[] = (data.jobs || []).map((j: any) => ({
 id: j.id,
 name: j.name,
 status: j.status,
 conclusion: j.conclusion,
 steps: (j.steps || []).map((s: any) => ({
 name: s.name,
 status: s.status,
 conclusion: s.conclusion,
 number: s.number
 }))
 }));

 setJobsData(prev => ({ ...prev, [runId]: jobs }));
 } catch (err) {
 console.error(`Error fetching jobs for run ${runId}:`, err);
 } finally {
 setLoadingJobs(prev => ({ ...prev, [runId]: false }));
 }
 };

 const handleToggleExpand = async (runId: number) => {
 if (expandedRunId === runId) {
 setExpandedRunId(null);
 } else {
 setExpandedRunId(runId);
 if (!jobsData[runId]) {
 await fetchJobsForRun(runId);
 }
 }
 };

 useEffect(() => {
 fetchWorkflowRuns();
 }, [fetchWorkflowRuns]);

 // Status-based Badge generator
 const renderStatusBadge = (status: string, conclusion: string | null) => {
 if (status === 'queued') {
 return (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#d1b375]/15 text-[#d1b375] -amber-500/20 animate-pulse">
 En Cola
 </span>
 );
 }
 if (status === 'in_progress') {
 return (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 -cyan-500/20 animate-pulse">
 Corriendo
 </span>
 );
 }
 if (status === 'completed') {
 if (conclusion === 'success') {
 return (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#10b981]/15 text-[#10b981] -emerald-500/20">
 ✓ Éxito
 </span>
 );
 }
 if (conclusion === 'failure') {
 return (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-400 -rose-500/20">
 ✗ Falló
 </span>
 );
 }
 return (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-neutral-800 text-neutral-400 -neutral-700">
 {conclusion || 'Terminado'}
 </span>
 );
 }
 return (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono bg-neutral-900 text-neutral-500 -neutral-800">
 {status}
 </span>
 );
 };

 // Agent Badge generator
 const renderAgentBadge = (agent: string | undefined) => {
 if (!agent) return null;
 let badgeClass = 'bg-neutral-800 text-neutral-300 -neutral-700';
 if (agent === 'Scout Descubridor') badgeClass = 'bg-cyan-500/10 text-cyan-400 -cyan-500/20';
 if (agent === 'Scout') badgeClass = 'bg-sky-500/15 text-sky-400 -sky-500/20';
 if (agent === 'Redactor') badgeClass = 'bg-purple-500/10 text-purple-400 -purple-500/20';
 if (agent === 'Enviador') badgeClass = 'bg-[#f2ca50]/10 text-[#f2ca50] -[#f2ca50]/20';
 if (agent === 'Lector') badgeClass = 'bg-[#10b981]/15 text-[#10b981] -emerald-500/20';

 return (
 <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${badgeClass}`}>
 Agente {agent}
 </span>
 );
 };

 return (
 <div className={`mt-6 -dashed ${isStitchLight ? '-slate-200' : '-neutral-800'} pt-6 space-y-4`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Activity className={`w-4 h-4 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`} />
 <h4 className={`text-xs font-mono font-bold uppercase tracking-wider ${isStitchLight ? 'text-slate-800' : 'text-neutral-100'}`}>
 Registro de Agentes (GitHub Runs)
 </h4>
 </div>
 
 <div className="flex items-center gap-2">
 {isDemo && (
 <span className="text-[9px] font-mono text-[#f2ca50]/80 bg-[#f2ca50]/5 -[#f2ca50]/20 px-2 py-0.5 rounded">
 MODO SIMULADOR
 </span>
 )}
 <button
 type="button"
 onClick={handleCopyCredentials}
 className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
 isStitchLight
 ? 'bg-slate-100 hover:bg-slate-200 -slate-200 text-slate-700'
 : 'bg-neutral-900 hover:bg-neutral-800 -neutral-800 text-neutral-300'
 }`}
 title="Copiar credenciales Service Account JSON para GitHub Secrets"
 >
 <Copy className="w-3 h-3 text-[#f2ca50]" />
 <span>{copiedCredentials ? '✓ Copiado' : 'Copiar Secrets JSON'}</span>
 </button>
 <button
 type="button"
 onClick={fetchWorkflowRuns}
 disabled={loading}
 className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
 isStitchLight 
 ? 'bg-slate-50 -slate-200 hover:bg-slate-100 text-slate-600' 
 : 'bg-neutral-900 -neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white'
 }`}
 title="Refrescar ejecuciones"
 >
 <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
 </button>
 </div>
 </div>

 {error ? (
 <div className="p-3 bg-rose-500/10 -rose-500/20 rounded-xl flex gap-2 items-start">
 <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
 <div className="space-y-1">
 <p className="text-[11px] text-rose-300 font-bold">Error de Conexión a GitHub</p>
 <p className="text-[10px] text-rose-400 leading-normal">{error}</p>
 <p className="text-[9px] text-neutral-500 leading-normal font-mono">
 Comprueba que tu PAT tenga permisos de lectura ("repo" o"actions") y que el Propietario/Repositorio sean correctos.
 </p>
 </div>
 </div>
 ) : loading ? (
 <div className="flex flex-col items-center justify-center py-6 gap-2">
 <RefreshCw className={`w-5 h-5 animate-spin ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`} />
 <p className="text-[10px] text-neutral-500 font-mono">Consultando historial en GitHub Actions...</p>
 </div>
 ) : runs.length === 0 ? (
 <div className="p-4 rounded-xl -dashed text-center space-y-2 text-neutral-500 -neutral-800 bg-neutral-950/20">
 <AlertTriangle className="w-5 h-5 mx-auto text-neutral-600" />
 <p className="text-xs font-mono">No se han encontrado ejecuciones previas.</p>
 <p className="text-[10px] text-neutral-600">Dispara tus agentes desde el Chatbot para verlos aparecer aquí.</p>
 </div>
 ) : (
 <div className="space-y-2">
 {runs.map((run) => {
 const isExpanded = expandedRunId === run.id;
 const jobs = jobsData[run.id] || [];
 const isJobLoading = loadingJobs[run.id];

 return (
 <div 
 key={run.id} 
 className={` rounded-xl transition-all overflow-hidden ${
 isStitchLight 
 ? `bg-slate-50 -slate-200/80 ${isExpanded ? 'ring-1 ring-indigo-500/20' : ''}` 
 : `bg-neutral-950/40 -neutral-800/80 ${isExpanded ? '-neutral-700 bg-neutral-950/80' : ''}`
 }`}
 >
 {/* Run Main Row */}
 <div 
 onClick={() => handleToggleExpand(run.id)}
 className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
 >
 <div className="flex items-center gap-2.5 min-w-0">
 {/* Actor avatar / icon */}
 <div className="w-6 h-6 rounded-lg overflow-hidden -neutral-800 bg-neutral-900 shrink-0 flex items-center justify-center">
 {run.actor.avatar_url ? (
 <img 
 src={run.actor.avatar_url} 
 alt={run.actor.login} 
 className="w-full h-full object-cover" 
 referrerPolicy="no-referrer"
 />
 ) : (
 <User className="w-3.5 h-3.5 text-neutral-500" />
 )}
 </div>

 <div className="min-w-0">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className={`text-[11px] font-bold font-mono tracking-tight ${isStitchLight ? 'text-slate-700' : 'text-neutral-200'}`}>
 #{run.run_number}
 </span>
 {renderAgentBadge(run.trigger_agent)}
 {renderStatusBadge(run.status, run.conclusion)}
 </div>
 <div className="flex items-center gap-1.5 text-[9px] text-neutral-500 font-mono mt-0.5">
 <span className="truncate max-w-[120px]">{run.actor.login}</span>
 <span>•</span>
 <span className="flex items-center gap-1">
 <Clock className="w-2.5 h-2.5" /> {formatRelativeTime(run.created_at)}
 </span>
 <span>•</span>
 <span className="uppercase tracking-wider text-[8px]">{run.event}</span>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <a 
 href={run.html_url} 
 target="_blank" 
 rel="noopener noreferrer"
 onClick={(e) => e.stopPropagation()}
 className={`p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer`}
 title="Ver ejecución en GitHub"
 >
 <ExternalLink className="w-3.5 h-3.5" />
 </a>
 {isExpanded ? (
 <ChevronUp className="w-4 h-4 text-neutral-500" />
 ) : (
 <ChevronDown className="w-4 h-4 text-neutral-500" />
 )}
 </div>
 </div>

 {/* Expanded Steps logs panel */}
 {isExpanded && (
 <div className={`px-4 pb-3 pt-1 ${isStitchLight ? '-slate-200 bg-white' : '-neutral-900 bg-neutral-950/80'} font-mono`}>
 <div className="flex items-center gap-1.5 text-[9px] text-neutral-500 uppercase tracking-widest mb-2">
 <Terminal className="w-3 h-3" /> Secuencia de Pasos del Job
 </div>

 {isJobLoading ? (
 <div className="flex items-center gap-1.5 py-2 text-[10px] text-neutral-500">
 <RefreshCw className="w-3 h-3 animate-spin text-neutral-500" /> Cargando secuencia...
 </div>
 ) : jobs.length === 0 ? (
 <p className="text-[10px] text-neutral-500 py-1">No hay datos de pasos disponibles para esta ejecución.</p>
 ) : (
 <div className="space-y-1.5 -neutral-800 ml-1.5 pl-3 py-1">
 {jobs[0].steps.map((step, idx) => {
 const isStepSuccess = step.conclusion === 'success';
 const isStepFailure = step.conclusion === 'failure';
 const isStepRunning = step.status === 'in_progress';
 const isStepQueued = step.status === 'queued';

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
 textColor = 'text-cyan-400 font-bold animate-pulse';
 } else if (isStepQueued) {
 dotColor = 'bg-amber-500';
 textColor = 'text-amber-500/80';
 }

 return (
 <div key={idx} className="flex items-center gap-2.5 text-[10px]">
 <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
 <span className="text-neutral-600 select-none text-[8px]">
 {String(step.number).padStart(2, '0')}
 </span>
 <span className={`truncate leading-none ${textColor}`}>
 {step.name}
 </span>
 {isStepRunning && (
 <RefreshCw className="w-2.5 h-2.5 animate-spin text-cyan-400 shrink-0" />
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
}
