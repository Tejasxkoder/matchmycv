import type { InterviewQuestion } from "../../lib/interview-types";

type Input = { skills: string[]; missingSkills: string[]; repos: string[] };

export function templateQuestions({ skills, missingSkills, repos }: Input): InterviewQuestion[] {
  const out: Omit<InterviewQuestion, "id">[] = [
    {
      cat: "Behavioral",
      lvl: "MEDIUM",
      q: "Tell me about a time you had to make a technical decision with incomplete information.",
      hint: "Name the options you weighed, why you picked one, and what you did to limit the cost of being wrong.",
      a: "Outline: the situation and deadline, the two or three options, the reason you picked the one that was easiest to undo, what you monitored afterwards, and what you would change next time.",
    },
    {
      cat: "Behavioral",
      lvl: "MEDIUM",
      q: "Describe a disagreement with a teammate or manager about a technical direction.",
      hint: "Show that you argued with evidence and committed fully once the decision was made.",
      a: "Outline: the two positions, the data or prototype you used to compare them, how the decision was made, and how you supported it afterwards even if it was not your choice.",
    },
    {
      cat: "Behavioral",
      lvl: "EASY",
      src: repos[0],
      q: repos[0]
        ? `Tell me about ${repos[0]} and what your specific contribution was.`
        : "Tell me about the project you are proudest of and what your specific contribution was.",
      hint: "Start with the problem, then say what you personally built or decided, and end with a result you can point to.",
      a: "Outline: the problem, why existing options fell short, what you owned, one hard trade-off, and the measurable outcome.",
    },
  ];

  for (const skill of skills.slice(0, 2)) {
    out.push({
      cat: "Technical",
      lvl: "MEDIUM",
      src: skill,
      q: `Where have you used ${skill} in production, and what went wrong the first time?`,
      hint: "Pick one concrete project, name the failure, and explain how you diagnosed and fixed it.",
      a: `Outline: the project and scale, one real failure involving ${skill}, how you found the cause, the fix, and the guard you added so it would not recur.`,
    });
  }
  for (const skill of missingSkills.slice(0, 2)) {
    out.push({
      cat: "Technical",
      lvl: "HARD",
      src: `Skill gap: ${skill}`,
      q: `${skill} is a target skill for this role and is not on your resume. How would you get productive with it quickly?`,
      hint: "Be upfront about the gap, then show a concrete learning plan and a related skill you can build on.",
      a: `Outline: say plainly you have not used ${skill} professionally, name the closest tool you do know, describe the first small project you would build with ${skill}, and how you would ask for review.`,
    });
  }
  while (out.filter((q) => q.cat === "Technical").length < 3) {
    out.push({
      cat: "Technical",
      lvl: "MEDIUM",
      q: "Walk me through how you would debug a slow API endpoint in production.",
      hint: "Measure first. Think about where time can go: network, database, application code, dependencies.",
      a: "Outline: confirm the regression with metrics and traces, narrow down the slow span, check queries and indexes, check downstream calls and caching, fix, then verify with the same metric.",
    });
  }

  out.push(
    {
      cat: "System Design",
      lvl: "HARD",
      q: "Design a job queue that stays correct when workers crash and messages are retried.",
      hint: "Assume messages can be delivered more than once. What makes processing the same message twice safe?",
      a: "Outline: at-least-once delivery, idempotency keys, a state machine per job, retries with backoff and jitter, a dead-letter queue, and a reconciliation job.",
    },
    {
      cat: "System Design",
      lvl: "MEDIUM",
      q: "Design a rate limiter for a public API used by thousands of clients.",
      hint: "Where does the counter live, how do you keep it atomic, and what happens if that store is down?",
      a: "Outline: token bucket per API key in a shared store with atomic updates, per-plan limits, 429 with Retry-After, and a decision on failing open or closed.",
    },
    {
      cat: "System Design",
      lvl: "MEDIUM",
      q: "Design a URL shortener that handles a read-heavy workload.",
      hint: "Think about ID generation, storage, caching, and how reads differ from writes.",
      a: "Outline: generate short IDs, store the mapping in a key-value store, cache hot keys, serve redirects from the edge, and track clicks asynchronously.",
    }
  );

  return out.slice(0, 9).map((q, i) => ({ id: i + 1, ...q }));
}
