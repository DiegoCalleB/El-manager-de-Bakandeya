import re
import os

h1_inject = """
      {/* HEADER / TITULO PRINCIPAL */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-zinc-100 mb-2">{TITLE}</h1>
        <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">{SUBTITLE}</p>
      </div>
"""

def add_h1(filepath, title, subtitle):
    with open(filepath, 'r') as f:
        content = f.read()

    # The typical top container is `<div className="flex flex-col gap-6 w-full...`
    # We will inject the H1 right after this div.
    
    injection = h1_inject.replace('{TITLE}', title).replace('{SUBTITLE}', subtitle)
    
    content = re.sub(
        r'(<div className="flex flex-col gap-6 w-full max-w-7xl mx-auto[^>]*?>)',
        r'\1' + injection,
        content
    )
    
    with open(filepath, 'w') as f:
        f.write(content)

add_h1('src/components/BookingCRM.tsx', 'Scout & Booking', 'Gestión de Salas y Agente de Ventas')
add_h1('src/components/BandCRM.tsx', 'Artistas', 'Base de Datos de Bandas y Aliados')
add_h1('src/components/CalendarView.tsx', 'Agenda', 'Calendario Global de Fechas')
add_h1('src/components/TourManager.tsx', 'Rutas', 'Planificación Logística de Giras')
add_h1('src/components/Finanzas.tsx', 'Finanzas', 'Control de Cachés y Gastos')
add_h1('src/components/ReelsCenter.tsx', 'Medios', 'Analítica Social y Prensa')
add_h1('src/components/RepertorioSetlists.tsx', 'Repertorio', 'Gestión de Setlists y Documentos')

print("H1s added to all main screens")
