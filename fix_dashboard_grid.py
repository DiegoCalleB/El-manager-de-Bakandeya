import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Replace the grid container
content = content.replace(
    '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">',
    '<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">'
)

# Metric 1: Pending (Make it protagonist)
content = content.replace(
    """{/* Metric 1: Pitches pendientes de aprobar */}
        <div 
          onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'pendiente_aprobacion' })}
          className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
        >""",
    """{/* Metric 1: Pitches pendientes de aprobar */}
        <div 
          onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'pendiente_aprobacion' })}
          className={`${colors.card} p-6 lg:col-span-6 bg-[#1A1918] rounded-2xl flex flex-col justify-between transition-all hover:bg-[#22211F] cursor-pointer group relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#d1b375] opacity-5 rounded-bl-full pointer-events-none" />"""
)

# Replace the text sizes for the protagonist to make it stand out
content = content.replace(
    '<h3 className={`text-2xl font-mono font-black ${textTitle}`}>{pendingApprovalCount}</h3>',
    '<h3 className={`text-5xl font-display font-black tracking-tighter ${textTitle}`}>{pendingApprovalCount}</h3>'
)

# Metric 2: Enviados
content = content.replace(
    """{/* Metric 2: Enviados y en espera */}
        <div 
          onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'enviado' })}
          className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
        >""",
    """{/* Metric 2: Enviados y en espera */}
        <div 
          onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'enviado' })}
          className={`${colors.card} p-5 lg:col-span-3 rounded-xl flex flex-col justify-between transition-all hover:bg-[#22211F] cursor-pointer group`}
        >"""
)

# Metric 3: Interesados
content = content.replace(
    """{/* Metric 3: Interesados / En diálogo */}
        <div 
          onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'interesado' })}
          className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
        >""",
    """{/* Metric 3: Interesados / En diálogo */}
        <div 
          onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'interesado' })}
          className={`${colors.card} p-5 lg:col-span-3 rounded-xl flex flex-col justify-between transition-all hover:bg-[#22211F] cursor-pointer group`}
        >"""
)

# Metric 4: Medios (Move it to a new row or just let it wrap)
content = content.replace(
    """{/* Metric 4: Medios & Prensa */}
        <div 
          onClick={() => onNavigate && onNavigate('prensa')}
          className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
        >""",
    """{/* Metric 4: Medios & Prensa */}
        <div 
          onClick={() => onNavigate && onNavigate('prensa')}
          className={`${colors.card} p-5 lg:col-span-12 rounded-xl flex items-center justify-between transition-all hover:bg-[#22211F] cursor-pointer group`}
        >"""
)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)

print("Dashboard grid and hierarchy fixed")
