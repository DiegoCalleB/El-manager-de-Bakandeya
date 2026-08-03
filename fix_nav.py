import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace the nav item for calendario to include a badge for upcoming events.
# We will just see if there is any upcoming event.
old_nav_cal = "{ id: 'calendario', label: 'Calendario', icon: CalendarRange },"

# To get upcoming, we can just do:
# const today = new Date().toISOString().split('T')[0];
# const upcomingEvents = [...concerts, ...rehearsals].filter(e => e.date >= today).length;

new_nav_cal = """{ id: 'calendario', label: 'Calendario', icon: CalendarRange, badge: (() => {
                const today = new Date().toISOString().split('T')[0];
                return [...concerts, ...rehearsals].filter(e => e.date >= today).length;
              })() },"""

content = content.replace(old_nav_cal, new_nav_cal)

# Remove the badge from 'bandas'
content = content.replace("{ id: 'bandas', label: 'Bandas & artistas', icon: Users, badge: leads.filter(l => isBanda(l)).length },", "{ id: 'bandas', label: 'Bandas & artistas', icon: Users },")

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Nav Fixed")
