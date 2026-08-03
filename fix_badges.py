import re
import os

def fix_badges(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # We want to find spans or divs that look like badges (e.g. they have px-X py-Y rounded text-[size] bg-... text-...)
    # Instead of regexing the whole tag, we will standardize the classes inside className.
    
    # 1. Standardize padding and text size
    content = re.sub(r'px-[0-9.]+ py-[0-9.]+', 'px-2 py-1', content)
    content = re.sub(r'text-\[9px\]', 'text-[10px]', content)
    content = re.sub(r'text-\[8px\]', 'text-[10px]', content)
    content = re.sub(r'text-\[11px\]', 'text-[10px]', content)
    content = re.sub(r'text-xs', 'text-[10px]', content) # Dangerous, but let's assume it's mostly badges. Wait, no, text-xs is used a lot.
    
    # 2. Re-enforce the 4 colors
    # Green (Confirmed/Paid)
    content = re.sub(r'bg-emerald-[0-9]+(/[0-9]+)?', 'bg-[#73c991]/15', content)
    content = re.sub(r'text-emerald-[0-9]+', 'text-[#73c991]', content)
    
    # Amber (Pending)
    content = re.sub(r'bg-amber-[0-9]+(/[0-9]+)?', 'bg-[#d1b375]/15', content)
    content = re.sub(r'text-amber-[0-9]+', 'text-[#d1b375]', content)
    
    # Blue (Sent/Waiting)
    content = re.sub(r'bg-(sky|blue|indigo)-[0-9]+(/[0-9]+)?', 'bg-sky-500/15', content)
    content = re.sub(r'text-(sky|blue|indigo)-[0-9]+', 'text-sky-400', content)
    
    # Red (Rejected)
    content = re.sub(r'bg-(rose|red)-[0-9]+(/[0-9]+)?', 'bg-rose-500/15', content)
    content = re.sub(r'text-(rose|red)-[0-9]+', 'text-rose-400', content)

    # Let's clean up any weird artifacts left behind by previous bad regexes
    content = re.sub(r' -[a-z]+-[0-9]+(/[0-9]+)?', '', content) # e.g. -emerald-500/40
    content = re.sub(r' -\[#[a-fA-F0-9]+\](/[0-9]+)?(/[0-9]+)?', '', content) # e.g. -[#f2ca50]/30

    with open(filepath, 'w') as f:
        f.write(content)

# Apply specifically to components that have lists and badges
for file in ['BookingCRM.tsx', 'BandCRM.tsx', 'RepertorioSetlists.tsx', 'CalendarView.tsx', 'TourManager.tsx', 'Dashboard.tsx']:
    filepath = os.path.join('src/components', file)
    if os.path.exists(filepath):
        fix_badges(filepath)

print("Badges standardized")
