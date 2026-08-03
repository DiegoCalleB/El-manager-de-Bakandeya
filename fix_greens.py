import re
import os

def fix_green_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # If the file contains isStitchLight, we can use it.
    if 'isStitchLight' in content:
        # replace bg-[#4ade80]/15 text-[#4ade80]
        content = re.sub(
            r'bg-\[\#4ade80\]/15 text-\[\#4ade80\]',
            r'${isStitchLight ? \'bg-emerald-100 text-emerald-700\' : \'bg-[#4ade80]/15 text-[#4ade80]\'}',
            content
        )
        content = re.sub(
            r'text-\[\#4ade80\]',
            r'${isStitchLight ? \'text-emerald-600\' : \'text-[#4ade80]\'}',
            content
        )
    else:
        # If not, just make it a bit darker like #22c55e (green-500) which is slightly better, or #16a34a (green-600)
        content = content.replace('#4ade80', '10b981')

    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('src/components'):
    for file in files:
        if file.endswith('.tsx'):
            fix_green_in_file(os.path.join(root, file))

print("Greens fixed.")
