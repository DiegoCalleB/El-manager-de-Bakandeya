import React, { useState } from 'react';
import { Settings, Sparkles, RefreshCw, Building2, Tent, Disc3, Radio, Users, Briefcase, MessageSquare, Star } from 'lucide-react';
import { ThemeColors } from '../../types';

export type TemplateCategory = 'salas' | 'festivales' | 'discotecas' | 'medios' | 'grupos' | 'managements';

export interface ActiveTemplateData {
  title: string;
  desc: string;
  subject: string;
  setSubject: (val: string) => void;
  body: string;
  setBody: (val: string) => void;
  guidelines: string;
  setGuidelines: (val: string) => void;
}

interface TemplateConfigSectionProps {
  colors: ThemeColors;
  isStitchLight: boolean;
  textSub: string;
  textMuted: string;
  templateTab: TemplateCategory;
  onSelectTemplateTab: (tab: TemplateCategory) => void;
  activeTemplate: ActiveTemplateData;
  isTestingPrompt: boolean;
  testPromptResult: string;
  onTestPrompt: () => void;
  onSaveTemplates: () => void;
  onOptimizeTemplate?: () => void;
  isOptimizingTemplate?: boolean;
  optimizationFeedbackMsg?: string | null;
  customInstruction?: string;
  onCustomInstructionChange?: (val: string) => void;
  toneRating?: number;
  onToneRatingChange?: (rating: number) => void;
  contentRating?: number;
  onContentRatingChange?: (rating: number) => void;
}

export function TemplateConfigSection({
  colors,
  isStitchLight,
  textSub,
  textMuted,
  templateTab,
  onSelectTemplateTab,
  activeTemplate,
  isTestingPrompt,
  testPromptResult,
  onTestPrompt,
  onSaveTemplates,
  onOptimizeTemplate,
  isOptimizingTemplate,
  optimizationFeedbackMsg,
  customInstruction: customInstructionProp,
  onCustomInstructionChange,
  toneRating: toneRatingProp,
  onToneRatingChange,
  contentRating: contentRatingProp,
  onContentRatingChange,
}: TemplateConfigSectionProps) {
  const [internalInstruction, setInternalInstruction] = useState('');
  const [internalToneRating, setInternalToneRating] = useState(0);
  const [internalContentRating, setInternalContentRating] = useState(0);

  const customInstruction = customInstructionProp !== undefined ? customInstructionProp : internalInstruction;
  const setCustomInstruction = onCustomInstructionChange || setInternalInstruction;

  const toneRating = toneRatingProp !== undefined ? toneRatingProp : internalToneRating;
  const setToneRating = onToneRatingChange || setInternalToneRating;

  const contentRating = contentRatingProp !== undefined ? contentRatingProp : internalContentRating;
  const setContentRating = onContentRatingChange || setInternalContentRating;
  return (
    <div className={`${colors.card} p-5 space-y-6`}>
      <div
        className={`pb-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b ${
          isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'
        }`}
      >
        <div>
          <h3
            className={`text-sm font-bold font-display uppercase tracking-widest flex items-center gap-2 ${
              isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'
            }`}
          >
            <Settings className={`w-4 h-4 ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`} />{' '}
            Configuración de Plantillas y Pautas AI por Categoría (Redactor)
          </h3>
          <p className={`text-[10px] font-sans mt-1 ${textSub}`}>
            Personaliza el correo por defecto y las pautas de IA diferenciadas para Salas, Festivales, Discotecas, Medios, Grupos y Managements.
          </p>
        </div>

        {/* Template Tab Selector (6 Categories) */}
        <div
          className={`flex flex-wrap items-center gap-1 p-1 rounded-xl shrink-0 ${
            isStitchLight ? 'bg-slate-100' : 'bg-[#121215]'
          }`}
        >
          {[
            { id: 'salas', label: '🏛️ Salas', icon: Building2 },
            { id: 'festivales', label: '🎪 Festivales', icon: Tent },
            { id: 'discotecas', label: '🪩 Discotecas', icon: Disc3 },
            { id: 'medios', label: '📻 Medios', icon: Radio },
            { id: 'grupos', label: '🎸 Grupos', icon: Users },
            { id: 'managements', label: '💼 Managements', icon: Briefcase },
          ].map((tab) => {
            const isActive = templateTab === tab.id;
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                id={`template-tab-${tab.id}`}
                onClick={() => onSelectTemplateTab(tab.id as TemplateCategory)}
                className={`py-1.5 px-2.5 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  isActive
                    ? isStitchLight
                      ? 'bg-white text-sky-400 shadow-sm'
                      : 'bg-[#f2ca50] text-[#3c2f00] font-extrabold shadow-md'
                    : isStitchLight
                    ? 'text-slate-500 hover:text-slate-800'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Notice Banner */}
      <div
        className={`p-3 rounded-xl text-[10px] font-sans flex items-center justify-between ${
          templateTab === 'medios'
            ? 'bg-rose-500/15 text-rose-400'
            : templateTab === 'grupos'
            ? isStitchLight
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-[#10b981]/15 text-[#10b981]'
            : templateTab === 'discotecas'
            ? isStitchLight
              ? 'bg-purple-50 text-purple-900'
              : 'bg-purple-500/10 text-purple-300'
            : isStitchLight
            ? 'bg-sky-500/15 text-sky-400'
            : 'bg-sky-500/15 text-sky-400'
        }`}
      >
        <div>
          <strong>{activeTemplate.title}</strong>
          <p className="text-[10px] opacity-80 mt-0.5">{activeTemplate.desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Side */}
        <div className="space-y-4">
          {optimizationFeedbackMsg && (
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px] rounded-xl font-sans animate-in fade-in">
              {optimizationFeedbackMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              className={`block text-[10px] uppercase font-sans tracking-wider ${
                isStitchLight ? 'text-slate-600' : 'text-neutral-300'
              }`}
            >
              Asunto del Email por Defecto
            </label>
            <input
              id="template-subject"
              type="text"
              value={activeTemplate.subject}
              onChange={(e) => activeTemplate.setSubject(e.target.value)}
              className={`w-full rounded-lg px-2 py-1 text-[10px] focus:outline-none transition-all font-sans ${
                isStitchLight
                  ? 'bg-white text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  : 'bg-[#131313] text-[#e5e2e1] focus:border-[#f2ca50]/50'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className={`block text-[10px] uppercase font-sans tracking-wider ${
                isStitchLight ? 'text-slate-600' : 'text-neutral-300'
              }`}
            >
              Cuerpo de la Plantilla de Correo de Presentación
            </label>
            <textarea
              id="template-body"
              rows={8}
              value={activeTemplate.body}
              onChange={(e) => activeTemplate.setBody(e.target.value)}
              className={`w-full rounded-lg p-3 text-[10px] focus:outline-none transition-all font-sans leading-relaxed ${
                isStitchLight
                  ? 'bg-white text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  : 'bg-[#131313] text-[#e5e2e1] focus:border-[#f2ca50]/50'
              }`}
              placeholder="Escribe el cuerpo de la plantilla usando {{nombre_sala}}, {{ciudad}} etc..."
            />
          </div>

          <div className="space-y-1.5">
            <label
              className={`block text-[10px] uppercase font-sans tracking-wider flex items-center gap-1.5 ${
                isStitchLight ? 'text-sky-400' : 'text-[#ffb596]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Pautas AI (Directrices de Redacción Subjetiva)
            </label>
            <textarea
              id="template-guidelines"
              rows={3}
              value={activeTemplate.guidelines}
              onChange={(e) => activeTemplate.setGuidelines(e.target.value)}
              className={`w-full rounded-lg p-3 text-[10px] focus:outline-none transition-all font-sans leading-relaxed ${
                isStitchLight
                  ? 'bg-white text-slate-800 focus:border-indigo-500'
                  : 'bg-[#131313] text-[#e5e2e1] focus:border-[#ffb596]/50'
              }`}
              placeholder="Ej: Mantén un tono periodístico, enfatiza el lanzamiento del single..."
            />
          </div>

          {/* Evaluation & Training Box for Template */}
          <div className="space-y-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] uppercase font-sans font-bold tracking-wider text-amber-300 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" /> Evaluación y Entrenamiento de la Plantilla
              </label>
              {(toneRating > 0 || contentRating > 0 || customInstruction) && (
                <button 
                  type="button" 
                  onClick={() => {
                    setToneRating(0);
                    setContentRating(0);
                    setCustomInstruction('');
                  }}
                  className="text-[9px] text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            {/* Estrellitas de Tono y Contenido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Tono y Estilo */}
              <div className="p-2 bg-[#131313] rounded-lg border border-amber-500/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-200">Tono y Estilo</span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    {toneRating > 0 ? `${toneRating}/5` : 'Sin calificar'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={`template-tone-${star}`}
                      type="button"
                      onClick={() => setToneRating(toneRating === star ? 0 : star)}
                      className={`p-0.5 rounded hover:bg-amber-500/20 transition-colors cursor-pointer ${
                        toneRating >= star ? 'text-amber-400' : 'text-neutral-600'
                      }`}
                      title={`Calificar tono y estilo: ${star}/5`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenido y Estructura */}
              <div className="p-2 bg-[#131313] rounded-lg border border-amber-500/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-200">Contenido y Estructura</span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    {contentRating > 0 ? `${contentRating}/5` : 'Sin calificar'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={`template-content-${star}`}
                      type="button"
                      onClick={() => setContentRating(contentRating === star ? 0 : star)}
                      className={`p-0.5 rounded hover:bg-amber-500/20 transition-colors cursor-pointer ${
                        contentRating >= star ? 'text-amber-400' : 'text-neutral-600'
                      }`}
                      title={`Calificar contenido y estructura: ${star}/5`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Comentario / Instrucción */}
            <div className="space-y-1 pt-1">
              <label className="block text-[10px] uppercase font-sans font-bold tracking-wider text-amber-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Comentario o Corrección Directa
              </label>
              <textarea
                id="template-custom-instruction-standalone"
                rows={2}
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                className="w-full rounded-lg p-2.5 text-[10px] bg-[#131313] text-[#e5e2e1] border border-amber-500/30 focus:border-amber-400 focus:outline-none font-sans leading-relaxed"
                placeholder="Ej: 'Haz la plantilla de salas un 20% más corta, resalta nuestro directo enérgico sin instrumentos de viento y pide propuesta de fecha para el próximo trimestre...'"
              />
            </div>

            <div className="text-[9px] text-amber-300/80 font-sans leading-tight">
              💡 Califica con estrellas el tono y el contenido e introduce comentarios. Al hacer clic abajo en <strong>Regenerar</strong>, la IA aplicará tus valoraciones para optimizar la plantilla.
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {onOptimizeTemplate && (
              <button
                type="button"
                onClick={onOptimizeTemplate}
                disabled={isOptimizingTemplate}
                className="py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isOptimizingTemplate ? 'animate-spin' : ''}`} />
                <span>{isOptimizingTemplate ? 'Regenerando con IA...' : '✨ Regenerar Plantilla con IA y Aprendizaje'}</span>
              </button>
            )}
            <button
              id="template-btn-test"
              onClick={onTestPrompt}
              disabled={isTestingPrompt}
              className={`px-2 py-1 font-sans text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                isStitchLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  : 'bg-neutral-900 hover:border-neutral-700 text-neutral-300 border border-neutral-800'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingPrompt ? 'animate-spin' : ''}`} />
              <span>Probar Prompt</span>
            </button>
            <button
              id="template-btn-save"
              onClick={onSaveTemplates}
              className={`flex-1 py-2 font-sans font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center active:scale-95 ${
                isStitchLight
                  ? 'bg-sky-500/15 hover:bg-sky-500/15 text-white shadow-md shadow-indigo-100'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shadow-lg shadow-[#f2ca50]/10'
              }`}
            >
              Guardar Plantillas y Directrices
            </button>
          </div>
        </div>

        {/* Test / Prompt Output side */}
        <div
          className={`border rounded-xl p-4 flex flex-col justify-between ${
            isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131313] border-neutral-800'
          }`}
        >
          <div className="space-y-3">
            <div
              className={`flex items-center gap-2 pb-2 border-b ${
                isStitchLight ? 'border-slate-200' : 'border-neutral-900'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  isStitchLight ? 'bg-sky-500/15' : 'bg-[#f2ca50]'
                }`}
              />
              <h4 className={`text-[10px] font-sans uppercase tracking-widest ${textSub}`}>
                Sandbox de Simulación de Redacción AI
              </h4>
            </div>

            <div className={`text-[10px] leading-relaxed font-sans ${textSub}`}>
              Cuando el agente de Python <strong>"Redactor"</strong> corre, lee estas plantillas y
              pautas, las mezcla con los detalles del contacto capturado por el{' '}
              <strong>"Scout"</strong> (aforo, ubicación, género, redes) y genera un borrador adaptado
              para que lo revises en esta misma pantalla.
            </div>

            {testPromptResult ? (
              <div className="space-y-3">
                <div
                  className={`border rounded-lg p-3.5 text-[10px] font-sans whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto animate-in fade-in duration-300 select-text ${
                    isStitchLight
                      ? 'bg-white text-slate-700 border-slate-200'
                      : 'bg-[#1c1b1b] text-neutral-300 border-neutral-800'
                  }`}
                >
                  {testPromptResult}
                </div>

                {/* Valoración directa del resultado generado en la simulación */}
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" /> Valorar esta plantilla / resultado
                    </span>
                    {(toneRating > 0 || contentRating > 0) && (
                      <span className="text-[9px] text-amber-400 font-mono">
                        Tono: {toneRating || '-'}/5 | Contenido: {contentRating || '-'}/5
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Tono */}
                    <div className="p-2 bg-[#131313] rounded-lg border border-amber-500/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-200">Tono y Estilo</span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {toneRating > 0 ? `${toneRating}/5` : '⭐'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={`template-sandbox-tone-${star}`}
                            type="button"
                            onClick={() => setToneRating(toneRating === star ? 0 : star)}
                            className={`p-0.5 rounded hover:bg-amber-500/20 transition-colors cursor-pointer ${
                              toneRating >= star ? 'text-amber-400' : 'text-neutral-600'
                            }`}
                            title={`Calificar tono: ${star}/5`}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-2 bg-[#131313] rounded-lg border border-amber-500/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-200">Contenido y Estructura</span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {contentRating > 0 ? `${contentRating}/5` : '⭐'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={`template-sandbox-content-${star}`}
                            type="button"
                            onClick={() => setContentRating(contentRating === star ? 0 : star)}
                            className={`p-0.5 rounded hover:bg-amber-500/20 transition-colors cursor-pointer ${
                              contentRating >= star ? 'text-amber-400' : 'text-neutral-600'
                            }`}
                            title={`Calificar contenido: ${star}/5`}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {onOptimizeTemplate && (
                    <button
                      type="button"
                      onClick={onOptimizeTemplate}
                      disabled={isOptimizingTemplate}
                      className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isOptimizingTemplate ? 'animate-spin' : ''}`} />
                      <span>Re-generar plantilla usando estas valoraciones ✨</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div
                className={`border border-dashed rounded-lg p-12 text-center text-[10px] font-sans ${
                  isStitchLight
                    ? 'border-slate-200 text-slate-400'
                    : 'border-neutral-800 text-neutral-600'
                }`}
              >
                Haz clic en "Probar Prompt" a la izquierda para simular el resultado de generación
                del Redactor AI basado en tus directrices actuales.
              </div>
            )}
          </div>

          <div className={`text-[10px] font-sans mt-4 leading-normal text-right ${textMuted}`}>
            Módulo de Modelado AI de Bakandeya Systems v2.4. Powered by Gemini.
          </div>
        </div>
      </div>
    </div>
  );
}
