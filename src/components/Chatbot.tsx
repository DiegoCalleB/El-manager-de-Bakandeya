import React, { useState, useRef, useEffect } from 'react';
import { Message as MessageType, Lead, Rehearsal, Concert, ThemeColors } from '../types';
import { Send, Bot, User, Sparkles, RefreshCw, AlertCircle, CheckCircle, HelpCircle, Calendar, ShieldAlert } from 'lucide-react';

interface ProposedAction {
  type: 'propose_lead_approval' | 'propose_rehearsal' | 'propose_status_change';
  leadId?: string;
  leadName?: string;
  description: string;
  newStatus?: string;
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
}

export default function Chatbot({ colors, leads, rehearsals, concerts, onUpdateLead, onAddRehearsal }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: '🎷 **¡Buenas, Diego/Larra!** Soy tu **Manager Virtual de Bakandeya**.\n\nEstoy conectado en tiempo real con vuestra hoja de datos de Google Sheets (leads), el calendario de ensayos de banda, la contabilidad y la logística de redes.\n\nPuedes preguntarme cosas como:\n- *¿Qué salas tengo pendientes de aprobación en Madrid o Granada?*\n- *Resúmeme el estado de la semana o hazme una lista de tareas para hoy.*\n- *¿Cuántas salas de Ska o Reggae tenemos registradas?*\n\nSi necesitas, puedo **proponer cambios directos** en las salas (como aprobar un pitch) o agendar ensayos, pidiéndote confirmación antes de actuar.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
        return <strong key={i} className="font-bold text-neutral-100">{part.slice(2, -2)}</strong>;
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsgText,
          chatHistory: messages.slice(-8).map(m => ({ sender: m.sender, text: m.text }))
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
  const handleConfirmAction = (msgId: string, action: ProposedAction) => {
    // 1. Apply changes
    if (action.type === 'propose_lead_approval' && action.leadId) {
      const targetLead = leads.find(l => l.id === action.leadId);
      if (targetLead) {
        const today = new Date().toISOString().split('T')[0];
        const updatedNotes = `*** [${today}] Pitch APROBADO vía Chatbot AI Assistant ***\n${targetLead.notas || ''}`;
        
        onUpdateLead(action.leadId, {
          estado: 'aprobado',
          notas: updatedNotes
        }, targetLead.estado);
      }
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
    }

    // 2. Mark message proposed actions as applied
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return { ...m, actionStatus: 'applied' };
      }
      return m;
    }));

    // 3. Add system success log in chat thread
    const successMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: 'bot',
      text: `✅ **Acción Ejecutada con éxito:** Se ha procesado la propuesta para **"${action.leadName || 'Sala'}"**. El estado ha sido modificado y se ha persistido el log correspondiente en la base de datos de Google Sheets. El agente Enviador re-procesará la cola esta tarde.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, successMsg]);
  };

  const handleDismissAction = (msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return { ...m, actionStatus: 'dismissed' };
      }
      return m;
    }));
  };

  return (
    <div className="flex flex-col h-[520px] bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden font-sans">
      {/* Bot Header */}
      <div className="bg-neutral-900 px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
              Mánager Virtual Bakandeya <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h4>
            <span className="text-[10px] font-mono text-neutral-500">Connected to Google Sheets API (Sandbox)</span>
          </div>
        </div>

        <button
          id="clear-chat-btn"
          onClick={() => setMessages([
            {
              id: 'welcome-1',
              sender: 'bot',
              text: '🎷 **¡Buenas, Diego/Larra!** He limpiado el hilo del chat.\n\n¿En qué os puedo ayudar para organizar los conciertos de la banda, el calendario de redes o revisar pitches de las salas hoy?',
              timestamp: new Date()
            }
          ])}
          className="text-[10px] text-neutral-500 hover:text-neutral-300 font-mono flex items-center gap-1 hover:underline"
        >
          Limpiar Conversación
        </button>
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-neutral-950/20">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div key={msg.id} className={`flex gap-3 max-w-[90%] ${isBot ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}>
              {/* Avatar circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                isBot 
                  ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' 
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300'
              }`}>
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className="space-y-2">
                {/* Text Bubble */}
                <div className={`p-3.5 rounded-xl border text-neutral-300 ${
                  isBot 
                    ? 'bg-neutral-900/50 border-neutral-800/80 rounded-tl-none' 
                    : 'bg-neutral-800/80 border-neutral-700 rounded-tr-none'
                }`}>
                  <div className="space-y-1">{parseMarkdown(msg.text)}</div>
                  <span className="text-[8px] font-mono text-neutral-600 block mt-2 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Proposed actions box within chat */}
                {isBot && msg.proposedActions && msg.proposedActions.length > 0 && (
                  <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-3.5 space-y-3 max-w-sm mt-1">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <h5 className="font-bold text-[11px] font-mono uppercase tracking-wider">Propuesta del Manager de IA</h5>
                    </div>
                    
                    {msg.proposedActions.map((act, aIdx) => (
                      <div key={aIdx} className="space-y-2.5">
                        <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950 p-2.5 rounded border border-neutral-900">
                          {act.description}
                        </p>

                        {msg.actionStatus === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              id={`confirm-proposal-btn-${msg.id}`}
                              onClick={() => handleConfirmAction(msg.id, act)}
                              className="flex-1 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-[10px] font-bold font-mono py-1.5 rounded transition-colors cursor-pointer"
                            >
                              ✓ Aplicar Cambio
                            </button>
                            <button
                              id={`dismiss-proposal-btn-${msg.id}`}
                              onClick={() => handleDismissAction(msg.id)}
                              className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-[10px] font-mono rounded border border-neutral-800 transition-colors"
                            >
                              Descartar
                            </button>
                          </div>
                        ) : msg.actionStatus === 'applied' ? (
                          <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded p-1.5 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Cambio de estado aplicado
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 rounded p-1.5">
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
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-xl border bg-neutral-900/50 border-neutral-800/80 rounded-tl-none text-xs text-neutral-500 font-mono flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" /> Analizando base de datos Sheets...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Form Footer */}
      <form onSubmit={handleSendMessage} className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2">
        <input
          id="chatbot-text-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe una pregunta sobre salas, ensayos o tareas para hoy..."
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-neutral-700 font-sans"
        />
        <button
          id="chatbot-send-btn"
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className={`p-2 rounded-lg font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer ${
            inputText.trim() ? colors.primary : 'bg-neutral-800 text-neutral-600 border border-neutral-800/40'
          }`}
        >
          <Send className="w-4 h-4 text-zinc-950" />
        </button>
      </form>
    </div>
  );
}
