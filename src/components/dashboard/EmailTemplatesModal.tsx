import React, { useState } from 'react';
import { 
  FileText, Copy, Check, X, Sparkles, Send, Radio, Building2, 
  RefreshCw, MessageSquareCode, HelpCircle 
} from 'lucide-react';

interface EmailTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandName?: string;
}

export const EMAIL_TEMPLATES = [
  {
    id: 'sala_directa',
    title: '1. Proposal Inicial a Sala de Conciertos (Aforo 200 - 600 pax)',
    type: 'Booking directo',
    icon: Building2,
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    subject: 'Propuesta de Concierto - {bandName} en {nombre_sala} (Gira 2026)',
    body: `Hola team de {nombre_sala},

Espero que estéis teniendo una excelente semana.

Os escribo en nombre de la banda {bandName} ({genero}). Estamos cerrando las fechas de nuestra gira para los próximos meses y nos encantaría presentar nuestro directo en {nombre_sala}.

Conocemos vuestra programación y creemos que nuestra propuesta encaja perfectamente con el público de la sala. Ofrecemos un show de entre 60 y 90 minutos con potente energía en escenario, directo muy trabajado y una base de público fiel que responde en cada ciudad.

Adjuntamos nuestro Dossier Promocional con vídeo resumen del directo, Spotify y Rider Técnico:
- Dossier y Vídeo Directo: [Enlace al Dossier EPK]
- Escuchas en Spotify / Youtube: [Enlace a Spotify]

Nos gustaría consultar vuestra disponibilidad para los viernes o sábados del próximo trimestre. Quedamos a vuestra entera disposición para comentar condiciones (taquilla / caché garantizado).

Un cordial saludo,
Mánager Virtual & Booking Team de {bandName}`
  },
  {
    id: 'intercambio_bandas',
    title: '2. Propuesta de Intercambio de Fechas entre Bandas (Co-headlining)',
    type: 'Intercambio de bolos',
    icon: MessageSquareCode,
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    subject: 'Propuesta de bolo conjunto e intercambio de sala - {bandName} x {nombre_banda_amiga}',
    body: `¡Hola compas de {nombre_banda_amiga}!

¿Cómo va todo por ahí? Os escribimos desde la banda {bandName}. Nos gusta mucho vuestro estilo y creemos que haríamos un cartel de lujo compartiendo escenario.

Os proponemos una fecha de intercambio:
1. Vosotros venís a tocar con nosotros en nuestra ciudad (nos encargamos de la producción local y promoción).
2. Nosotros vamos a tocar con vosotros en vuestra ciudad.

Así doblamos aforo, compartimos público y abrimos nuevas plazas sin asumir riesgos excesivos.

Si os motiva la idea, decidnos y os pasamos un par de fechas que tenemos pre-reservadas en salas de nuestra zona.

¡Un abrazo fuerte y mucha música!
{bandName}`
  },
  {
    id: 'nota_prensa_medios',
    title: '3. Nota de Prensa & Estreno a Medios y Radios (Radio 3 / Prensa)',
    type: 'Prensa & Radios',
    icon: Radio,
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    subject: 'NOTA DE PRENSA: {bandName} estrena nuevo sencillo y anuncia fechas de gira',
    body: `A la atención del equipo de {nombre_medio},

{bandName}, una de las propuestas más vibrantes del panorama de {genero}, presenta su nuevo lanzamiento y anuncia las primeras fechas de su gira estatal.

Con un sonido fresco que combina ritmos festivos, arreglos orgánicos y letras de fuerte compromiso social, {bandName} se consolida tras sus recientes actuaciones en salas de referencia.

- Escucha en exclusiva el sencillo: [Enlace de Escucha]
- Descarga la portada en alta resolución y fotos de prensa: [Enlace a Drive]
- Biografía y ficha técnica: [Enlace al Dossier EPK]

Estaríamos encantados de coordinar una entrevista, acústico en estudio o reseña del lanzamiento.

Atentamente,
Prensa & Comunicación - {bandName}`
  },
  {
    id: 'seguimiento_sala',
    title: '4. Recordatorio Educado a Sala sin Respuesta (A los 7-10 días)',
    type: 'Seguimiento',
    icon: RefreshCw,
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    subject: 'Re: Propuesta de Concierto - {bandName} en {nombre_sala}',
    body: `Hola de nuevo, equipo de {nombre_sala},

Os escribo brevemente para hacer un rápido seguimiento del correo que os envié la semana pasada respecto a la fecha para {bandName}.

Entendemos perfectamente que tendréis la bandeja llena de propuestas. Solo queríamos confirmar si pudisteis echarle un ojo al Dossier y si tenéis algún hueco disponible en vuestra programación para los próximos meses.

Quedo atento a vuestra respuesta. ¡Muchas gracias por vuestro tiempo!

Saludos,
{bandName} Booking`
  }
];

export const EmailTemplatesModal: React.FC<EmailTemplatesModalProps> = ({
  isOpen,
  onClose,
  bandName = 'Bakandeya'
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('sala_directa');

  if (!isOpen) return null;

  const currentTpl = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate) || EMAIL_TEMPLATES[0];

  const handleCopy = (id: string, text: string) => {
    const formatted = text.replace(/{bandName}/g, bandName);
    navigator.clipboard.writeText(formatted);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#181716] border border-amber-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 bg-[#141312] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                Plantillas & Ejemplos Reales de Email
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                Modelos de redacción probados para salas, festivales, medios e intercambios
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Template Selection Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {EMAIL_TEMPLATES.map(tpl => {
              const isSelected = selectedTemplate === tpl.id;
              const IconComp = tpl.icon;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`p-3 rounded-xl text-left transition-all border flex flex-col justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md'
                      : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <IconComp className="w-4 h-4 shrink-0 text-amber-400" />
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${tpl.badgeColor}`}>
                      {tpl.type}
                    </span>
                  </div>
                  <span className="text-xs font-bold font-sans line-clamp-1">{tpl.title.split('.')[1] || tpl.title}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Template Display Box */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                  {currentTpl.type}
                </span>
                <h4 className="text-sm font-bold font-display text-zinc-100">
                  {currentTpl.title}
                </h4>
              </div>

              <button
                onClick={() => handleCopy(currentTpl.id, `Asunto: ${currentTpl.subject}\n\n${currentTpl.body}`)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-mono font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedId === currentTpl.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-950" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Plantilla</span>
                  </>
                )}
              </button>
            </div>

            {/* Subject preview */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Asunto del Correo:</span>
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-amber-300">
                {currentTpl.subject.replace(/{bandName}/g, bandName)}
              </div>
            </div>

            {/* Body preview */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Cuerpo del Mensaje:</span>
              <pre className="p-4 rounded-lg bg-neutral-900/90 border border-neutral-800 text-xs font-sans text-neutral-200 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {currentTpl.body.replace(/{bandName}/g, bandName)}
              </pre>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>Consejo de Agentes AI:</strong> El Agente Redactor utiliza este mismo estilo directo y conciso al generar propuestas desde el panel de Booking.
            </span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#141312] border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 text-zinc-200 font-mono text-xs font-bold hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
