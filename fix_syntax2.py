import re
import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace `'${isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]'}'`
    # with `(isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]')`
    
    content = content.replace(
        "\"${isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]'}\"",
        "(isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]')"
    )
    content = content.replace(
        "'${isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]'}'",
        "(isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]')"
    )
    content = content.replace(
        "\"${isStitchLight ? 'text-emerald-600' : 'text-[#10b981]'}\"",
        "(isStitchLight ? 'text-emerald-600' : 'text-[#10b981]')"
    )
    content = content.replace(
        "'${isStitchLight ? 'text-emerald-600' : 'text-[#10b981]'}'",
        "(isStitchLight ? 'text-emerald-600' : 'text-[#10b981]')"
    )
    
    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('src/components'):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

print("Syntax 2 fixed")
