export const RESUME = `Arjun Kumar
arjun@dev.io | +91 98765 43210 | github.com/arjunk | linkedin.com/in/arjunk

SUMMARY
Backend engineer with four years of experience building APIs and internal tools for payments teams.

EXPERIENCE
Backend Engineer, Fintech Corp (2021 - Present)
- Led development of features for the product.
- Responsible for managing the team and coordinating sprints.
- Worked on improving system performance.
- Aggressive approach to problem-solving when production incidents happen.
- Built a recommendation engine for the platform.
- Reduced checkout errors by 35% by adding retries to the payment service.

EDUCATION
B.Tech in Computer Science, Delhi Technological University, 2017 - 2021

SKILLS
Skills: React, TS, Node, Postgres, Docker, AWS, Kubernetes, Redis, GraphQL, Git, CI/CD, Python`;

export const GOOD_AI_REPLY = {
  targetRole: "backend engineer",
  suggestions: [
    {
      current: "Led development of features for the product.",
      suggested: "Led development of [N] features for [X] users, cutting load time by [Y]%.",
      category: "quantify",
      note: "Add scale and a measurable outcome",
    },
    {
      current: "Aggressive approach to problem-solving when production incidents happen.",
      suggested: "Methodical approach to problem-solving when production incidents happen.",
      category: "tone",
      note: "Aggressive is gender coded",
    },
    {
      current: "Led a team of forty engineers at a company that is not on this resume.",
      suggested: "Led a team of forty engineers.",
      category: "quantify",
      note: "invented line",
    },
    {
      current: "Skills: React, TS, Node, Postgres, Docker, AWS, Kubernetes, Redis, GraphQL, Git, CI/CD, Python",
      suggested: "Skills: React, TypeScript, Node.js, PostgreSQL, Docker, AWS, Kubernetes, Redis, GraphQL, Git, CI/CD, Python",
      category: "ats",
      note: "Spell out abbreviations",
    },
  ],
  toneFlags: ["aggressive", "not in the resume at all"],
};

export function replyWith(value: unknown, wrap = true) {
  const body = JSON.stringify(value);
  return { content: wrap ? "```json\n" + body + "\n```" : body, model: "mock/free-model" };
}
