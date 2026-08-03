import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix Green (change to a brighter green #4ade80)
    content = content.replace('text-[#73c991]/20', 'text-[#4ade80]')
    content = content.replace('text-[#73c991]', 'text-[#4ade80]')
    content = content.replace('bg-[#73c991]/15/10', 'bg-[#4ade80]/15')
    content = content.replace('bg-[#73c991]/15/20', 'bg-[#4ade80]/15')
    content = content.replace('bg-[#73c991]/15', 'bg-[#4ade80]/15')
    content = content.replace('-[#73c991]/20/40', '-[#4ade80]/40')
    content = content.replace('-[#73c991]/20', '-[#4ade80]/40')
    content = content.replace('#73c991', '#4ade80')

    # Fix Amber
    content = content.replace('text-[#d1b375]/20', 'text-[#d1b375]')
    content = content.replace('bg-[#d1b375]/15/10', 'bg-[#d1b375]/15')
    content = content.replace('bg-[#d1b375]/15/20', 'bg-[#d1b375]/15')
    content = content.replace('-[#d1b375]/20/40', '-[#d1b375]/40')
    content = content.replace('-[#d1b375]/20', '-[#d1b375]/40')

    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('src/components'):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

print("Transparencies fixed.")
