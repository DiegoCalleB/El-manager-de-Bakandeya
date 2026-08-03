import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("label: 'Booking salas'", "label: 'Booking Salas'")
content = content.replace("label: 'Medios & prensa'", "label: 'Medios y Prensa'")
content = content.replace("label: 'Bandas & artistas'", "label: 'Bandas Amigas'")
content = content.replace("label: 'Tour manager'", "label: 'Tour Manager'")
content = content.replace("label: 'Reels center'", "label: 'Reels Center'")

with open('src/App.tsx', 'w') as f:
    f.write(content)
