export const MAX_FILE_BYTES = 4 * 1024 * 1024;

export class ParseError extends Error {
  code: "unsupported" | "too_large" | "unreadable";

  constructor(code: "unsupported" | "too_large" | "unreadable", message: string) {
    super(message);
    this.name = "ParseError";
    this.code = code;
  }
}

export type Extractors = {
  pdf: (bytes: Uint8Array) => Promise<string>;
  docx: (bytes: Uint8Array) => Promise<string>;
};

export const defaultExtractors: Extractors = {
  async pdf(bytes) {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  },
  async docx(bytes) {
    const mod = await import("mammoth");
    const mammoth = mod.default ?? mod;
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return result.value;
  },
};

export async function extractResumeText(
  file: { name: string; bytes: Uint8Array },
  extractors: Extractors = defaultExtractors
): Promise<string> {
  if (file.bytes.byteLength > MAX_FILE_BYTES) {
    throw new ParseError("too_large", "That file is over 4 MB. Try a smaller export or paste the text instead.");
  }

  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  try {
    if (ext === "pdf") return await extractors.pdf(file.bytes);
    if (ext === "docx") return await extractors.docx(file.bytes);
    if (ext === "txt" || ext === "md") return new TextDecoder().decode(file.bytes);
  } catch {
    throw new ParseError("unreadable", "We could not read that file. Export it again, or paste the text instead.");
  }
  throw new ParseError("unsupported", "Upload a PDF, DOCX or TXT file.");
}
