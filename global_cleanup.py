import os
import re

def remove_borders(text):
    # Remove border thickness and sides
    text = re.sub(r'\bborder-[tblrxy](-[0-4])?\b', '', text)
    text = re.sub(r'\bborder(-[0-4])?\b', '', text)
    # Remove border colors
    text = re.sub(r'\bborder-[a-z]+-[0-9]+(/[0-9]+)?\b', '', text)
    text = re.sub(r'\bborder-\[#[a-fA-F0-9]+\](/[0-9]+)?\b', '', text)
    text = re.sub(r'\bborder-transparent\b', '', text)
    text = re.sub(r'\bborder-dashed\b', '', text)
    text = re.sub(r'\bborder-solid\b', '', text)
    text = re.sub(r'\bdivide-[a-zxy]+(-[0-9]+)?\b', '', text)
    text = re.sub(r'\bdivide-[a-z]+-[0-9]+(/[0-9]+)?\b', '', text)
    text = re.sub(r'\bdivide-\[#[a-fA-F0-9]+\](/[0-9]+)?\b', '', text)
    # Clean up double spaces left behind
    text = re.sub(r' +', ' ', text)
    text = re.sub(r' "\b', '"', text)
    text = re.sub(r'\b "', '"', text)
    return text

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Remove borders globally
    # We only want to remove borders inside className="..." or className={`...`}
    def classname_replacer(match):
        prefix = match.group(1)
        classes = match.group(2)
        suffix = match.group(3)
        return prefix + remove_borders(classes) + suffix

    content = re.sub(r'(className=["\'])(.*?)(["\'])', classname_replacer, content)
    content = re.sub(r'(className=\{`)(.*?)(`\})', classname_replacer, content)
    
    # Also handle string concatenations inside className if any, but regex might be tricky.
    # Just running a global replace for border classes on the whole file is risky but mostly safe for Tailwind.
    content = remove_borders(content)

    # 2. Standardize Badges
    # Green (Confirmed/Paid/Interested)
    content = re.sub(r'bg-(emerald|green)-[0-9]+(/[0-9]+)? text-(emerald|green)-[0-9]+', 'bg-[#73c991]/15 text-[#73c991]', content)
    content = re.sub(r'bg-\[#73c991\]/[0-9]+ text-\[#73c991\]', 'bg-[#73c991]/15 text-[#73c991]', content)
    # Blue (Sent/Waiting)
    content = re.sub(r'bg-(sky|blue|indigo)-[0-9]+(/[0-9]+)? text-(sky|blue|indigo)-[0-9]+', 'bg-sky-500/15 text-sky-400', content)
    # Amber (Pending/Negotiating)
    content = re.sub(r'bg-(amber|yellow)-[0-9]+(/[0-9]+)? text-(amber|yellow)-[0-9]+', 'bg-[#d1b375]/15 text-[#d1b375]', content)
    content = re.sub(r'bg-\[#d1b375\]/[0-9]+ text-\[#d1b375\]', 'bg-[#d1b375]/15 text-[#d1b375]', content)
    # Red (Rejected/Error)
    content = re.sub(r'bg-(rose|red)-[0-9]+(/[0-9]+)? text-(rose|red)-[0-9]+', 'bg-rose-500/15 text-rose-400', content)

    # Standardize badge padding and text size (if they look like badges)
    content = re.sub(r'px-[0-9.]+ py-[0-9.]+ rounded(-[a-z]+)? font-mono text-\[[0-9]+px\]', 'px-2 py-1 rounded font-mono text-[10px]', content)

    with open(filepath, 'w') as f:
        f.write(content)

# Apply to all tsx files
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))

print("Global cleanup complete")
