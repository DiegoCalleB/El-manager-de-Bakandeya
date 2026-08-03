import re

with open('src/components/RepertorioSetlists.tsx', 'r') as f:
    content = f.read()

new_h1 = """      {/* HEADER / TITULO PRINCIPAL */}
      <div className="mb-2">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-zinc-100 mb-2">Repertorio</h1>
        <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">Gestión de Setlists y Documentos</p>
      </div>"""

content = re.sub(
    r'<div className="flex items-center gap-3">\s*<div[^>]*?>\s*<Disc3[^>]*?>\s*</div>\s*<div>\s*<h2[^>]*?>\s*<span>Canciones & Setlists del Grupo</span>\s*</h2>\s*<p[^>]*?>\s*Catálogo de discografía, gestión de canciones y listas de repertorio para directos y ensayos\.\s*</p>\s*</div>\s*</div>',
    new_h1,
    content
)

with open('src/components/RepertorioSetlists.tsx', 'w') as f:
    f.write(content)
