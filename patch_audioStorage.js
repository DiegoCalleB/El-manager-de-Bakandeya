const fs = require('fs');
let code = fs.readFileSync('src/utils/audioStorage.ts', 'utf-8');

const uploadCode = `
/**
 * Uploads a file to the backend server and returns the static URL
 */
export async function uploadFileToServer(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, base64 })
  });
  if (!response.ok) {
    throw new Error('Upload failed');
  }
  const data = await response.json();
  return data.url;
}
`;

code = code.replace("export function fileToBase64", uploadCode + "\nexport function fileToBase64");
fs.writeFileSync('src/utils/audioStorage.ts', code);
