with open('index.html', 'r') as f:
    content = f.read()

content = content.replace(
    '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">',
    '<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">'
)

with open('index.html', 'w') as f:
    f.write(content)

with open('src/index.css', 'r') as f:
    css = f.read()

css = css.replace('"Outfit", sans-serif', '"Space Grotesk", sans-serif')

with open('src/index.css', 'w') as f:
    f.write(css)

print("Fonts updated")
