// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text.trim();
}

export function cleanText(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").replace(/\s{2,}/g, " ").trim();
}