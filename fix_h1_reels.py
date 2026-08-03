import re

with open('src/components/ReelsCenter.tsx', 'r') as f:
    content = f.read()

new_h1 = """      {/* HEADER / TITULO PRINCIPAL */}
      <div className="mb-2">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-zinc-100 mb-2">Medios</h1>
        <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">Analítica Social y Prensa</p>
      </div>"""

# Find and replace the logo block
content = re.sub(
    r'<div className="flex items-center gap-4">\s*<img[^>]*?>\s*<div>\s*<h4[^>]*?>Gestión de Redes & Reels</h4>\s*<h2[^>]*?>REELS & AI CLIPS</h2>\s*</div>\s*</div>',
    new_h1,
    content
)

with open('src/components/ReelsCenter.tsx', 'w') as f:
    f.write(content)
