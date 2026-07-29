export function safeParseJson(text: string): any {
  let cleanText = text.trim();
  
  if (cleanText.startsWith("```")) {
    const firstLineBreak = cleanText.indexOf("\n");
    if (firstLineBreak !== -1) {
      cleanText = cleanText.substring(firstLineBreak + 1);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();
  }
  
  const startIdx = cleanText.indexOf("{");
  const endIdx = cleanText.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleanText = cleanText.substring(startIdx, endIdx + 1);
  }
  
  return JSON.parse(cleanText);
}
