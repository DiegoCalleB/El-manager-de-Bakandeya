import re

with open('src/components/CalendarView.tsx', 'r') as f:
    content = f.read()

new_h1 = """      {/* HEADER / TITULO PRINCIPAL */}
      <div className="lg:col-span-3 mb-2">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-zinc-100 mb-2">Agenda</h1>
        <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">Calendario Global de Fechas</p>
      </div>"""

content = content.replace(
    '  {/* LEFT: MONTH GRID CALENDAR (2/3 width) */}',
    new_h1 + '\n  {/* LEFT: MONTH GRID CALENDAR (2/3 width) */}'
)

with open('src/components/CalendarView.tsx', 'w') as f:
    f.write(content)
