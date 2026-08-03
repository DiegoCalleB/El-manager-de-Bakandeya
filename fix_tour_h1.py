with open('src/components/TourManager.tsx', 'r') as f:
    content = f.read()

new_h1 = """      {/* HEADER / TITULO PRINCIPAL */}
      <div className="mb-2">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-zinc-100 mb-2">Rutas</h1>
        <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">Planificación Logística de Giras</p>
      </div>"""

content = content.replace(
    '<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">\n          <div></div>',
    new_h1 + '\n          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">\n          <div></div>'
)

with open('src/components/TourManager.tsx', 'w') as f:
    f.write(content)
