import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Generic solid amber replacements
    # We want to change bg-[#eab308] or bg-amber-500 or bg-[#f2ca50]
    # to a ghost button style: `bg-white/5 hover:bg-white/10 text-zinc-300 ring-1 ring-white/10`
    
    # 1. BookingCRM.tsx
    if "BookingCRM.tsx" in filepath:
        # Button: Añadir sala / Añadir medio -> This is the PRIMARY action. We KEEP it amber.
        # Button: Guardar Cambios (Modal) -> make it ghost
        content = content.replace(
            "bg-[#eab308] hover:bg-[#facc15] text-[#121110]", 
            "bg-zinc-800 hover:bg-zinc-700 text-zinc-200" # fallback if we missed any
        )
        content = content.replace(
            "bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00]",
            "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
        )
        # Wait, if we change ALL of them, we lose the primary. 
        # Let's restore the primary explicitly:
        content = content.replace(
            '<button\n                onClick={() => {\n                  setEditingLead(null);\n                  resetForm();\n                  setIsAddingLeadModalOpen(true);\n                }}\n                className="flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-sm font-bold transition-all cursor-pointer shrink-0 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 active:scale-95"',
            '<button\n                onClick={() => {\n                  setEditingLead(null);\n                  resetForm();\n                  setIsAddingLeadModalOpen(true);\n                }}\n                className="flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-sm font-bold transition-all cursor-pointer shrink-0 bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00] active:scale-95"'
        )
        
    # 2. BandCRM.tsx
    if "BandCRM.tsx" in filepath:
        content = content.replace(
            "bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00]",
            "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
        )
        # Restore primary
        content = content.replace(
            'id="band-btn-add-new"\n              onClick={handleOpenCreateModal}\n              className="px-2 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer flex items-center gap-2 shadow-md active:scale-95"',
            'id="band-btn-add-new"\n              onClick={handleOpenCreateModal}\n              className="px-2 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00] transition-all cursor-pointer flex items-center gap-2 shadow-md active:scale-95"'
        )
        
    # 3. Finanzas.tsx
    if "Finanzas.tsx" in filepath:
        content = content.replace(
            "bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00]",
            "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
        )
        # Restore primary: Registrar Operación
        content = content.replace(
            'onClick={handleOpenCreateModal}\n            className={`px-2 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200`}',
            'onClick={handleOpenCreateModal}\n            className={`px-2 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2 bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00]`}'
        )

    # 4. ReelsCenter.tsx
    if "ReelsCenter.tsx" in filepath:
        content = content.replace(
            "bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00]",
            "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
        )
        # primary: Sincronizar (maybe?)
        content = content.replace(
            'id="sync-reels-excel-btn"\n            onClick={handleSyncReels}\n            disabled={isSyncing}\n            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200`}',
            'id="sync-reels-excel-btn"\n            onClick={handleSyncReels}\n            disabled={isSyncing}\n            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00]`}'
        )
        
    # 5. TourManager.tsx
    if "TourManager.tsx" in filepath:
        content = content.replace(
            "bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00]",
            "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
        )
        content = content.replace(
            "${colors.primary} text-white",
            "bg-[#f2ca50] text-[#3c2f00]"
        )

    # 6. CalendarView.tsx
    if "CalendarView.tsx" in filepath:
        content = content.replace(
            "bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00]",
            "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
        )
        # primary: Agendar Concierto
        content = content.replace(
            '<button\n              onClick={() => handleOpenCreateModal(\'concierto\')}\n              className={`w-full py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 bg-zinc-800 hover:bg-zinc-700 text-zinc-200`}',
            '<button\n              onClick={() => handleOpenCreateModal(\'concierto\')}\n              className={`w-full py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00]`}'
        )

    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('src/components'):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

print("Buttons fixed")
