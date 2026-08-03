import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Make the Section Titles smaller and spaced out
content = re.sub(
    r'<h3 className="text-sm font-bold font-display uppercase tracking-wider[^"]*">',
    r'<h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-zinc-400">',
    content
)

# 1. Action Button: "Revisar y Aprobar Correos"
content = re.sub(
    r'className={`flex items-center gap-1\.5 px-3 py-1\.5 text-\[10px\] font-mono font-bold uppercase rounded-lg transition-all shadow-sm[^`]*`}',
    r'className="flex items-center gap-2 px-6 py-3 bg-[#d1b375] hover:bg-white text-zinc-950 text-[10px] font-mono font-bold uppercase rounded-xl transition-all shadow-lg shadow-[#d1b375]/10 cursor-pointer"',
    content
)

# 2. Action Button: "Contestar Correos Ahora"
content = re.sub(
    r'className={`flex items-center gap-1\.5 px-3 py-1\.5 text-\[10px\] font-mono font-bold uppercase rounded-lg transition-all shadow-sm[^`]*`}',
    r'className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-white/5 text-zinc-300 text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer"',
    content
)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)

print("Dashboard buttons fixed")
