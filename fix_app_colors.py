import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace mobile drawer amber colors with the same muted gold and zinc pattern
content = content.replace(
    "'bg-[#eab308]/10 text-[#eab308] font-bold border border-[#eab308]/20'",
    "'bg-zinc-800/80 text-zinc-100 font-bold border border-zinc-700'"
)
content = content.replace(
    "'bg-[#eab308]/20 text-[#eab308]'",
    "'bg-zinc-700 text-zinc-300'"
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("App colors fixed")
