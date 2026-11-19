export const MAX_JD_CHARS = 8000;
export const MAX_JD_RESUME_CHARS = 10000;

export const JD_SYSTEM_PROMPT = `You compare a resume with a job description. Reply with one JSON object and nothing else. No markdown, no code fences.

The object has three keys.
"title" is the job title from the description.
"company" is the company name, or an empty string if it is not stated.
"requirements" is an array of 4 to 15 objects, one per distinct requirement in the job description, in the order they appear. Each object has:
- "text": the requirement, shortened to one line.
- "kind": "required" or "nice" (nice to have or preferred).
- "verdict": "match" if the resume clearly shows it, "partial" if the resume shows something related but vague or incomplete, "missing" if there is no sign of it.
- "evidence": for match and partial, one line copied exactly from the resume that supports the verdict. Empty string for missing.
- "note": at most 100 characters. For partial and missing, say what to add or change.

Rules:
- Never invent resume content. Evidence must be a real line from the resume.
- Judge only what the resume says.`;

export const JD_RETRY_NUDGE =
  "Your previous reply was not valid JSON. Reply again with only the JSON object described above.";

export function buildJdPrompt(resumeText: string, jdText: string): string {
  const resume = resumeText.slice(0, MAX_JD_RESUME_CHARS);
  const jd = jdText.slice(0, MAX_JD_CHARS);
  return `Resume:\n"""\n${resume}\n"""\n\nJob description:\n"""\n${jd}\n"""\n\nReturn only the JSON object.`;
}
