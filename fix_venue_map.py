import re

with open('src/components/VenueMap.tsx', 'r') as f:
    content = f.read()

content = content.replace(': 2px solid white', 'border: 2px solid white')
content = content.replace(': ${isSelected ? `2.5px solid ${pinColor}` : \'1px solid rgba(0,0,0,0.15)\'}', 'border: ${isSelected ? `2.5px solid ${pinColor}` : \'1px solid rgba(0,0,0,0.15)\'}')
content = content.replace(': \'-1.5px', 'textShadow: \'-1.5px')
content = content.replace('-radius: 4px; : 1px solid', 'border-radius: 4px; border: 1px solid')
content = content.replace(': none;', 'border: none;')
content = content.replace(': 1px solid ${statusBadge.};', 'border: 1px solid ${statusBadge.border};')
content = content.replace('${statusBadge.}', '${statusBadge.color}') # Just a fallback if it was something else

with open('src/components/VenueMap.tsx', 'w') as f:
    f.write(content)

print("VenueMap styles fixed.")
