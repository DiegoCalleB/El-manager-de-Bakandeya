with open('src/components/VenueMap.tsx', 'r') as f:
    content = f.read()

content = content.replace("textShadow: '-1.5px -1.5px", ": '-1.5px -1.5px")

with open('src/components/VenueMap.tsx', 'w') as f:
    f.write(content)
