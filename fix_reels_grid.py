import re

with open('src/components/ReelsCenter.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<div className="grid grid-cols-2 md:grid-cols-4 gap-4">',
    '<div className="grid grid-cols-1 md:grid-cols-12 gap-4">'
)

content = content.replace(
    """{/* Total Seguidores */}
                <div className={`p-4 rounded-xl ${isStitchLight ? 'bg-slate-50/50 -slate-100' : 'bg-neutral-900/40 -neutral-900'}`}>
                  <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Seguidores Totales</span>
                  <span className={`text-xl font-black font-display tracking-tight mt-1 block ${isStitchLight ? 'text-slate-800' : 'text-white'}`}>""",
    """{/* Total Seguidores */}
                <div className={`p-5 md:col-span-6 rounded-2xl relative overflow-hidden ${isStitchLight ? 'bg-indigo-50/50' : 'bg-[#1A1918]'}`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#73c991] opacity-5 rounded-bl-full pointer-events-none" />
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">Seguidores Totales</span>
                  <span className={`text-4xl md:text-5xl font-black font-display tracking-tighter mt-1 block ${isStitchLight ? 'text-indigo-900' : 'text-zinc-100'}`}>"""
)

# Other 3 cards should span 2 columns each
content = re.sub(
    r'\{\/\* (Net Growth|Interacciones|Alcance Viral) \*\/.*?<div className=\{`p-4 rounded-xl ',
    r'{/* \1 */}\n                <div className={`p-4 md:col-span-2 rounded-xl ',
    content,
    flags=re.DOTALL
)

with open('src/components/ReelsCenter.tsx', 'w') as f:
    f.write(content)

print("ReelsCenter grid fixed")
