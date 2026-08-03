import re
import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # The previous script broke things by doing:
    # r'${isStitchLight ? \'bg-emerald-100 text-emerald-700\' : \'bg-[#4ade80]/15 text-[#4ade80]\'}'
    # Let's just restore everything back to `#10b981` (emerald-500).
    # We will search for the broken pattern and replace it.

    # Fix nested template literals with escaped quotes that broke React.
    content = re.sub(
        r'\$\{isStitchLight \? \\\'bg-emerald-100 text-emerald-700\\\' : \\\'bg-\[\#4ade80\]/15 text-\[\#4ade80\]\\\'\}',
        'bg-[#10b981]/15 text-[#10b981]',
        content
    )
    content = re.sub(
        r'\$\{isStitchLight \? \\\'text-emerald-600\\\' : \\\'text-\[\#4ade80\]\\\'\}',
        'text-[#10b981]',
        content
    )
    
    # Also replace any remaining 4ade80 with 10b981
    content = content.replace('4ade80', '10b981')
    content = content.replace('73c991', '10b981')

    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('src/components'):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

print("Syntax fixed")
