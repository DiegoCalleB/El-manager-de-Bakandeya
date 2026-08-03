import re

# 1. BandCRM.tsx
with open('src/components/BandCRM.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<h2 className="text-xl sm:text-2xl font-black font-display tracking-wider uppercase text-white flex items-center gap-2\.5">\s*<span>CRM DE BANDAS Y ARTISTAS</span>',
    r'<h2 className="text-3xl font-bold font-display tracking-tight text-zinc-100 flex items-center gap-2.5">\n              <span>Bandas amigas</span>',
    content
)
with open('src/components/BandCRM.tsx', 'w') as f:
    f.write(content)


# 2. CalendarView.tsx
with open('src/components/CalendarView.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<h2 className={`text-xl font-bold font-display uppercase tracking-wider \$\{textTitle\}`>',
    r'<h2 className={`text-3xl font-bold font-display tracking-tight ${textTitle}`}>',
    content
)
with open('src/components/CalendarView.tsx', 'w') as f:
    f.write(content)


# 3. TourManager.tsx
with open('src/components/TourManager.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<h2 className={`text-2xl font-bold font-display \$\{colors\.text\} flex items-center gap-2`}>\s*<Truck([^>]+)>\s*Tour Manager\s*</h2>',
    r'<h2 className={`text-3xl font-bold font-display tracking-tight ${colors.text} flex items-center gap-2`}>\n              <Truck\1>\n              Tour manager\n            </h2>',
    content
)
with open('src/components/TourManager.tsx', 'w') as f:
    f.write(content)


# 4. Finanzas.tsx
with open('src/components/Finanzas.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<h2 className={`text-xl font-bold font-display uppercase tracking-wider \$\{textTitle\}`}>\s*FINANZAS Y RENTABILIDAD\s*</h2>',
    r'<h2 className={`text-3xl font-bold font-display tracking-tight ${textTitle}`}>\n                Finanzas y rentabilidad\n              </h2>',
    content
)
with open('src/components/Finanzas.tsx', 'w') as f:
    f.write(content)


# 5. ReelsCenter.tsx
with open('src/components/ReelsCenter.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<h2 className={`text-xl font-bold font-display uppercase tracking-wider mt-1 \$\{textTitle\}`}>REELS & AI CLIPS</h2>',
    r'<h2 className={`text-3xl font-bold font-display tracking-tight mt-1 ${textTitle}`}>Reels y AI clips</h2>',
    content
)
with open('src/components/ReelsCenter.tsx', 'w') as f:
    f.write(content)


# 6. RepertorioSetlists.tsx
with open('src/components/RepertorioSetlists.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<h2 className={`text-base sm:text-lg font-bold font-mono tracking-wider uppercase flex items-center gap-2 \$\{colors\.text\}`}>\s*<span>Canciones & Setlists del Grupo</span>\s*</h2>',
    r'<h2 className={`text-3xl font-bold font-display tracking-tight flex items-center gap-2 ${colors.text}`}>\n              <span>Canciones y setlists</span>\n            </h2>',
    content
)
with open('src/components/RepertorioSetlists.tsx', 'w') as f:
    f.write(content)

print("H2 headers homogenized")
