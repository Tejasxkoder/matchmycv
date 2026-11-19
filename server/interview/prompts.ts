export const INTERVIEW_SYSTEM_PROMPT = `You write interview preparation questions for a candidate, based only on their resume. Reply with one JSON object and nothing else. No markdown, no code fences.

The object has one key, "questions": an array of 9 objects, three each of category "Behavioral", "Technical" and "System Design". Each object has:
- "cat": "Behavioral", "Technical" or "System Design".
- "lvl": "EASY", "MEDIUM" or "HARD".
- "src": a short label naming the resume item the question comes from (an employer, a project, or "Skill gap: X"), or an empty string.
- "q": the question as an interviewer would ask it.
- "hint": one or two sentences that nudge the candidate without giving the answer.
- "a": a model answer in first person, 3 to 5 sentences, that uses only facts present in the resume. Where the resume lacks a fact, describe the approach in general terms and do not invent numbers, employers or projects.

Technical questions must concern tools and projects named in the resume or listed skill gaps.`;

export const INTERVIEW_RETRY_NUDGE =
  "Your previous reply was not valid JSON. Reply again with only the JSON object described above.";

export function buildInterviewPrompt(input: {
  resumeText: string;
  targetRole: string;
  missingSkills: string[];
  repos: string[];
}): string {
  const lines = [`Target role: ${input.targetRole || "software engineer"}`];
  if (input.missingSkills.length) lines.push(`Skill gaps for the target job: ${input.missingSkills.join(", ")}`);
  if (input.repos.length) lines.push(`Public GitHub repositories: ${input.repos.join(", ")}`);
  return `${lines.join("\n")}\n\nResume:\n"""\n${input.resumeText.slice(0, 10000)}\n"""\n\nReturn only the JSON object.`;
}
