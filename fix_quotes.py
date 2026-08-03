import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    content = content.replace("\\'", "'")
    content = content.replace("bg-[#10b981]/15 ${isStitchLight ? 'text-emerald-600' : 'text-[#10b981]'}'", "bg-[#10b981]/15 text-[#10b981]'")
    
    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('src/components'):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

print("Quotes fixed")
