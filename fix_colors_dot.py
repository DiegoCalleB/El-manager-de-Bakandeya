import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # The user script left a bunch of ${colors.} where ${colors.border} used to be
    content = content.replace('${colors.}', '')
    # Sometimes it left it like ${colors.} with an extra space
    content = content.replace('${colors.} ', '')

    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('src/components'):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

print("Fixed colors.")
