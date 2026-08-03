import re
import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Look for ${isStitchLight ? ... : ...} and remove it, replacing it with a single class
    # Because there are too many malformed strings.
    
    content = re.sub(
        r'\$\{isStitchLight \? \'bg-emerald-100 text-emerald-700\' : \'bg-\[\#10b981\]/15 text-\[\#10b981\]\'\}',
        'bg-[#10b981]/15 text-[#10b981]',
        content
    )
    content = re.sub(
        r'\$\{isStitchLight \? \'text-emerald-600\' : \'text-\[\#10b981\]\'\}',
        'text-[#10b981]',
        content
    )
    
    # Also fix Dashboard.tsx line 883:
    content = content.replace("? 'bg-[#10b981]/15 hover:bg-[#10b981]/15 text-[#10b981]'", "? 'bg-emerald-100 text-emerald-700'")
    content = content.replace("hover:bg-[#10b981]/15 text-[#10b981]'", "hover:bg-[#10b981]/15 text-[#10b981]'")
    
    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('src/components'):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

print("Syntax 3 fixed")
