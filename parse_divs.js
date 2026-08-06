const fs = require('fs');
const content = fs.readFileSync('src/components/RepertorioSetlists.tsx', 'utf-8');
const lines = content.split('\n');

let stack = [];
let htmlStack = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('<div')) {
    let match;
    const re = /<div/g;
    while ((match = re.exec(line)) !== null) {
      stack.push(i + 1);
      htmlStack.push('div');
    }
  }
  if (line.includes('</div')) {
    let match;
    const re = /<\/div>/g;
    while ((match = re.exec(line)) !== null) {
      if (stack.length > 0) {
        stack.pop();
        htmlStack.pop();
      }
    }
  }
}
console.log('Final open tags count:', stack.length);
