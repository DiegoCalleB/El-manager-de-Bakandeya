with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace('${colors.}', '')

with open('src/App.tsx', 'w') as f:
    f.write(content)
