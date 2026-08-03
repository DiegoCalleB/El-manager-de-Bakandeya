import re

with open('src/components/TourManager.tsx', 'r') as f:
    content = f.read()

new_h1 = """      {/* HEADER / TITULO PRINCIPAL */}
      <div className="mb-2">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-zinc-100 mb-2">Rutas</h1>
        <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">Planificación Logística de Giras</p>
      </div>"""

content = content.replace(
    '      {/* Header */}\n      <div className={`p-5 sm:p-6 rounded-2xl ${colors.card}  shadow-sm`}>',
    new_h1 + '\n      {/* Header */}\n      <div className={`p-5 sm:p-6 rounded-2xl ${colors.card}  shadow-sm`}>'
)

# Replace the inner H2
content = re.sub(
    r'<div>\s*<h2 className={`text-2xl font-bold font-display \$\{colors\.text\} flex items-center gap-2`}>\s*<Truck className={`w-6 h-6 \$\{colors\.primary\.replace\(\'bg-\', \'text-\'\)\}`} />\s*Tour Manager\s*</h2>\s*<p className={`text-sm \$\{colors\.textMuted\} mt-1`}>\s*Organiza rutas, agrupa conciertos y calcula gastos logísticos\.\s*</p>\s*</div>',
    '<div></div>',
    content
)


with open('src/components/TourManager.tsx', 'w') as f:
    f.write(content)
