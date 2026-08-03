import re
import os

def fix_padding(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Standardize card paddings: replace p-4 and p-6 with p-5 in typical card containers
    # We will target strings like className={`${colors.card} p-4 ...`}
    
    content = re.sub(
        r'(className="[^"]*?\$\{colors\.card\}[^"]*?)p-4([^"]*?")',
        r'\1p-5\2',
        content
    )
    content = re.sub(
        r'(className="[^"]*?\$\{colors\.card\}[^"]*?)p-6([^"]*?")',
        r'\1p-5\2',
        content
    )
    
    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('src/components'):
    for file in files:
        if file.endswith('.tsx'):
            fix_padding(os.path.join(root, file))

print("Paddings standardized")
