import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Replace hardcoded dark theme vintage colors with modern zinc/indigo
content = content.replace("text-[#f2ca50]", "text-zinc-100")
content = content.replace("bg-[#f2ca50]", "bg-zinc-100")
content = content.replace("bg-gradient-to-r from-[#f2ca50] to-[#ffb596]", "bg-gradient-to-r from-zinc-300 to-zinc-500")
content = content.replace("hover:bg-[#ffe088]", "hover:bg-white")
content = content.replace("text-[#3c2f00]", "text-zinc-900")
content = content.replace("shadow-[#f2ca50]/10", "shadow-zinc-500/10")

content = content.replace("bg-[#131313]", "bg-[#1A1918]")
content = content.replace("border-[#99907c]/25", "border-zinc-800")
content = content.replace("text-[#e5e2e1]", "text-zinc-100")
content = content.replace("focus:border-[#f2ca50]/50", "focus:border-zinc-500/50")

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)

print("More colors replaced")
