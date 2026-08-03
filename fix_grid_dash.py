import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Metric 1
content = re.sub(
    r'\{/\* Metric 1: Pitches pendientes de aprobar \*/\}.*?<div[^>]*?className="[^"]*?\$\{colors\.card\} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-\[1\.02\] cursor-pointer group"[^>]*?>',
    r"""{/* Metric 1: Pitches pendientes de aprobar */}
        <div 
          onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'pendiente_aprobacion' })}
          className={`${colors.card} p-6 lg:col-span-6 bg-[#1A1918] rounded-2xl flex flex-col justify-between transition-colors hover:bg-[#22211F] cursor-pointer group relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#d1b375] opacity-5 rounded-bl-full pointer-events-none" />""",
    content,
    flags=re.DOTALL
)

# Metric 2
content = re.sub(
    r'\{/\* Metric 2: Enviados y en espera \*/\}.*?<div[^>]*?className="[^"]*?\$\{colors\.card\} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-\[1\.02\] cursor-pointer group"[^>]*?>',
    r"""{/* Metric 2: Enviados y en espera */}
        <div 
          onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'esperando_respuesta' })}
          className={`${colors.card} p-5 lg:col-span-3 rounded-xl flex flex-col justify-between transition-colors hover:bg-[#22211F] cursor-pointer group`}
        >""",
    content,
    flags=re.DOTALL
)

# Metric 3
content = re.sub(
    r'\{/\* Metric 3: Interesados / En diálogo \*/\}.*?<div[^>]*?className="[^"]*?\$\{colors\.card\} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-\[1\.02\] cursor-pointer group"[^>]*?>',
    r"""{/* Metric 3: Interesados / En diálogo */}
        <div 
          onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'interesado' })}
          className={`${colors.card} p-5 lg:col-span-3 rounded-xl flex flex-col justify-between transition-colors hover:bg-[#22211F] cursor-pointer group`}
        >""",
    content,
    flags=re.DOTALL
)

# Metric 4
content = re.sub(
    r'\{/\* Metric 4: Medios & Prensa \*/\}.*?<div[^>]*?className="[^"]*?\$\{colors\.card\} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-\[1\.02\] cursor-pointer group"[^>]*?>',
    r"""{/* Metric 4: Medios & Prensa */}
        <div 
          onClick={() => onNavigate && onNavigate('prensa')}
          className={`${colors.card} p-5 lg:col-span-12 rounded-xl flex items-center justify-between transition-colors hover:bg-[#22211F] cursor-pointer group`}
        >""",
    content,
    flags=re.DOTALL
)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
print("Grid fixed.")
