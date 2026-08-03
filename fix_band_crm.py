import re

with open('src/components/BandCRM.tsx', 'r') as f:
    content = f.read()

# Replace H2 header
new_h1 = """      {/* HEADER / TITULO PRINCIPAL */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-zinc-100 mb-2">Bandas Amigas</h1>
        <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">Base de Datos de Bandas y Aliados</p>
      </div>"""

content = content.replace('  {/* 1. HEADER HERO BANNER & METRICS BAR */} \n      <div className={`p-5 sm:p-6 rounded-2xl transition-all ${colors.card}  space-y-5 shadow-lg`}>', new_h1 + '\n      {/* 1. HEADER HERO BANNER & METRICS BAR */} \n      <div className={`p-5 sm:p-6 rounded-2xl transition-all ${colors.card}  space-y-5 shadow-lg`}>')

# Now remove the old H2 and P that we just replaced
old_h2_block = """          <div className="space-y-1">\n            <div className="flex items-center gap-2">\n              <span className="px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#f2ca50]/15 text-[#f2ca50] inline-flex items-center gap-1.5">\n                <Users className="w-3 h-3" /> Red de Colaboración entre Bandas\n              </span>\n              <span className="text-[10px] font-mono text-neutral-400">• Co-Booking & Giras</span>\n            </div>\n            <h2 className="text-xl sm:text-2xl font-black font-display tracking-wider uppercase text-white flex items-center gap-2.5">\n              <span>CRM DE BANDAS Y ARTISTAS</span>\n              <Sparkles className="w-5 h-5 text-[#f2ca50] shrink-0" />\n            </h2>\n            <p className="text-[10px] text-neutral-400 max-w-2xl font-sans leading-relaxed">\n              Base de datos estratégica de contactos de otras bandas para coordinar <strong>intercambios de fechas (Date Swaps)</strong>, dobles carteles en salas grandes, compartir furgoneta y backline, y agilizar giras conjuntas.\n            </p>\n          </div>"""
content = content.replace(old_h2_block, '          <div></div>')

with open('src/components/BandCRM.tsx', 'w') as f:
    f.write(content)
