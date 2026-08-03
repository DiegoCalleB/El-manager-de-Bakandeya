import re
import os

def fix_list(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Look for lists mapping over leads/salas
    # In BookingCRM, it's typically:
    # className={`p-4 cursor-pointer transition-all ${ ... hover:... }
    
    # Let's replace common row structures to have an even/odd striping and better hover
    # BookingCRM:
    content = re.sub(
        r'className={`p-4 cursor-pointer transition-all (.*?)\`}',
        r'className={`p-4 cursor-pointer transition-colors even:bg-white/[0.02] hover:bg-white/[0.05] \1`}',
        content
    )
    
    # BandCRM:
    content = re.sub(
        r'className={`p-3 sm:p-4 cursor-pointer transition-all (.*?)\`}',
        r'className={`p-3 sm:p-4 cursor-pointer transition-colors even:bg-white/[0.02] hover:bg-white/[0.05] \1`}',
        content
    )
    
    with open(filepath, 'w') as f:
        f.write(content)

for file in ['BookingCRM.tsx', 'BandCRM.tsx', 'Finanzas.tsx', 'TourManager.tsx']:
    filepath = os.path.join('src/components', file)
    if os.path.exists(filepath):
        fix_list(filepath)

print("Lists updated")
