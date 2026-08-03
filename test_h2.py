import os
import re

for file in ['CalendarView.tsx', 'TourManager.tsx', 'Finanzas.tsx', 'ReelsCenter.tsx', 'RepertorioSetlists.tsx']:
    path = os.path.join('src/components', file)
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
        print(f"--- {file} ---")
        matches = re.findall(r'<h[23][^>]*>.*?</h[23]>', content, re.DOTALL)
        for m in matches:
            if 'text-xl' in m or 'text-2xl' in m or 'text-lg' in m or 'uppercase' in m:
                print(m)
