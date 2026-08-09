import React, { useState } from 'react';
import { 
  X, MessageSquare, Share2, Copy, Check, Mail, Phone, Edit3, 
  Sparkles, Music, Calendar, Disc, FileText, Send
} from 'lucide-react';
import { ThemeColors } from '../types';
import { 
  shareViaWhatsApp, 
  shareViaWebShare, 
  copyToClipboard, 
  shareViaEmail,
  SharePayload 
} from '../utils/shareUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  initialText: string;
  itemType?: 'song' | 'idea' | 'setlist' | 'rehearsal' | 'concert' | 'pitch' | 'epk' | 'custom';
  defaultPhone?: string;
  colors?: ThemeColors;
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  subtitle,
  initialText,
  itemType = 'custom',
  defaultPhone = '',
  colors
}: ShareModalProps) {
  const [text, setText] = useState<string>(initialText);
  const [phone, setPhone] = useState<string>(defaultPhone);
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Sync state if initialText changes while modal opens
  React.useEffect(() => {
    setText(initialText);
    setCopied(false);
  }, [initialText]);

  if (!isOpen) return null;

  const handleWhatsApp = () => {
    shareViaWhatsApp(text, phone);
  };

  const handleWebShare = async () => {
    const success = await shareViaWebShare({
      title,
      text
    });
    if (!success) {
      // Fallback to clipboard if native share was closed or not supported
      handleCopy();
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleEmail = () => {
    shareViaEmail(title, text);
  };

  const getItemIcon = () => {
    switch (itemType) {
      case 'song': return <Music className="w-5 h-5 text-indigo-400" />;
      case 'idea': return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'setlist': return <Disc className="w-5 h-5 text-purple-400" />;
      case 'rehearsal':
      case 'concert': return <Calendar className="w-5 h-5 text-emerald-400" />;
      case 'pitch':
      case 'epk': return <FileText className="w-5 h-5 text-sky-400" />;
      default: return <Share2 className="w-5 h-5 text-[#d1b375]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div 
        className="w-full max-w-xl rounded-2xl bg-[#141820] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              {getItemIcon()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Compartir {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-zinc-400">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Quick Action Buttons Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-900/30 active:scale-95"
            >
              <MessageSquare className="w-4 h-4 fill-white/20" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleWebShare}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-900/30 active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Otras Apps</span>
            </button>

            <button
              onClick={handleCopy}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-xs transition-all shadow-lg active:scale-95 ${
                copied 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleEmail}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-900/30 active:scale-95"
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </button>
          </div>

          {/* Optional Phone Number input for WhatsApp direct */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Número de WhatsApp (Opcional)
              </span>
              <span className="text-[10px] text-zinc-500">
                Déjalo en blanco para elegir contacto en la app
              </span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: +34612345678 o 612345678"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Text Preview & Edit Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                Vista previa del mensaje
              </span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-[#d1b375] hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                {isEditing ? 'Ver formato final' : 'Editar texto antes de enviar'}
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#d1b375] leading-relaxed custom-scrollbar"
              />
            ) : (
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-white/10 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-sans custom-scrollbar select-text">
                {text}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#d1b375]" />
            Listos para WhatsApp, Telegram, Signal o Email
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleWhatsApp}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar a WhatsApp
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
