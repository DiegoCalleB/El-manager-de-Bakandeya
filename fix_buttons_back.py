import re
import os

ghost_button_class = 'px-4 py-2 bg-transparent hover:bg-white/5 text-zinc-300 font-mono text-[10px] uppercase font-bold transition-colors cursor-pointer rounded-lg'

def fix_buttons_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # We replaced px-4 py-2 with px-2 py-1. We need to find the ghost buttons and restore px-4 py-2
    # The ghost button has bg-transparent hover:bg-white/5
    
    content = re.sub(
        r'px-[0-9.]+ py-[0-9.]+ bg-transparent hover:bg-white/5',
        'px-4 py-2 bg-transparent hover:bg-white/5',
        content
    )
    
    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('src/components'):
    for file in files:
        if file.endswith('.tsx'):
            fix_buttons_in_file(os.path.join(root, file))

print("Buttons restored")
