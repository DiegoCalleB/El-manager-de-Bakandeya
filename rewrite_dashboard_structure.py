import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# 1. H1 Typography
# Find the H1 (or what should be H1) and make it huge with Space Grotesk
# Right now there's no H1. It's just sections.
# Let's add a massive H1 at the very top of Dashboard.
h1_inject = """
      {/* HEADER / TITULO PRINCIPAL */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-zinc-100 mb-2">Resumen</h1>
        <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">Panel de Control General</p>
      </div>
"""

# Let's see what is currently at the top of Dashboard:
#   return (
#    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto font-sans p-4 sm:p-6 md:p-8">
#      {/* 0. SECCIÓN PRIORITARIA: CORREOS POR CONTESTAR Y ACCIONES URGENTES */}

content = content.replace(
    '{/* 0. SECCIÓN PRIORITARIA: CORREOS POR CONTESTAR Y ACCIONES URGENTES */}',
    h1_inject + '\n      {/* 0. SECCIÓN PRIORITARIA: CORREOS POR CONTESTAR Y ACCIONES URGENTES */}'
)

# 2. Section Titles Hierarchy
# Change <h3 className="text-base... "> to smaller uppercase with tracking
content = re.sub(
    r'<h3 className="text-base font-bold font-display uppercase tracking-wider[^"]*">',
    r'<h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-zinc-400">',
    content
)

# 3. Solid Button Reduction (UN SOLO BOTÓN DORADO)
# We make sure ONLY "Aprobar y Responder" is gold.
# The user complained about solid amber buttons.
# Let's find any `bg-[#d1b375]`, `bg-[#f2ca50]`, `bg-[#eab308]` etc that don't have opacity
# Actually, the user specifically mentioned: "Añadir sala", "Crear concierto", "Registrar operación", "Actualizar en Excel", "Rellenar direcciones Excel"
# We should hunt for these buttons across all files.

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)

print("Dashboard H1 and section titles updated")
