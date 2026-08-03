import re

with open('src/components/BookingCRM.tsx', 'r') as f:
    content = f.read()

empty_state_old = r'<div className=\{` rounded-xl p-6 text-center py-24 space-y-3 \$\{\s*isStitchLight \? \'bg-slate-50/50 -dashed text-slate-400\' : \'bg-\[#1c1b1b\]/95 text-neutral-500\'\s*\}\`\}>.*?</div>\s*\)\}'

empty_state_new = """<div className={`relative rounded-2xl p-6 py-32 flex flex-col items-center justify-center overflow-hidden bg-[#121110]`}>
              {/* Textured Background Grid */}
              <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)`,
                  backgroundSize: '16px 16px'
                }}
              />
              {/* Ambient Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-zinc-800 rounded-full blur-[80px] opacity-20 pointer-events-none" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center shadow-2xl">
                  <Bot className="w-8 h-8 text-zinc-500/50" />
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-zinc-300">Intervención de Booking</h4>
                  <p className="text-[10px] leading-relaxed max-w-[240px] mx-auto text-zinc-500">
                    Selecciona cualquier sala o contacto en la lista para revisar su estado, 
                    editar su borrador con el asistente o registrar una respuesta manual.
                  </p>
                </div>
              </div>
            </div>
          )}"""

content = re.sub(empty_state_old, empty_state_new, content, flags=re.DOTALL)

with open('src/components/BookingCRM.tsx', 'w') as f:
    f.write(content)

print("Empty state designed.")
