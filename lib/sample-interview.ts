import type { InterviewSet } from "./interview-types";

export function buildSampleInterview(): InterviewSet {
  return {
    analysisId: "sample",
    createdAt: new Date().toISOString(),
    source: "sample",
    warnings: [],
    questions: [
      {
        id: 1,
        cat: "Behavioral",
        lvl: "MEDIUM",
        q: "Tell me about a time you had to make a technical decision under pressure with incomplete information.",
        hint: "Name the options you weighed, why you picked the one that was easy to undo, and what you did afterwards.",
        a: "During a production incident our payment queue started backing up before a cut-off. I had three hypotheses and little time, so I picked the one with a fast rollback path, cleared the retry queue and reset backoff timers. It worked, and I investigated the other two afterwards. The lesson was to favour reversibility when time is short.",
      },
      {
        id: 2,
        cat: "Behavioral",
        lvl: "EASY",
        src: "Led development of features",
        q: "Tell me about the project you are proudest of and what your specific contribution was.",
        hint: "Start with the problem, then say what you personally built or decided. End with a result you can point to.",
        a: "I led development of the product features that most affected load time. I owned the design and implementation, worked with the team across sprints, and measured the result against the baseline before and after release.",
      },
      {
        id: 3,
        cat: "Technical",
        lvl: "MEDIUM",
        src: "Redis caching",
        q: "How would you prevent a cache stampede when a hot key expires?",
        hint: "Two ideas: make only one caller rebuild the value, and avoid every key expiring at the same moment.",
        a: "Only one caller rebuilds the value while the others wait or serve the stale copy. TTLs get random jitter so related keys do not expire together, and hot keys use stale-while-revalidate so readers never block on a rebuild.",
      },
      {
        id: 4,
        cat: "Technical",
        lvl: "HARD",
        src: "Skill gap: Kubernetes",
        q: "Kubernetes is a target skill for this role. How would you roll out a new version of a service with zero downtime?",
        hint: "Cover how new pods are brought in, how traffic is kept off unready pods, and how you would undo it.",
        a: "I would be upfront that I have used Kubernetes less than Docker, then walk through a rolling update with maxUnavailable 0, readiness probes so traffic only reaches ready pods, a preStop hook for in-flight requests, a PodDisruptionBudget, and kubectl rollout undo for rollback.",
      },
      {
        id: 5,
        cat: "System Design",
        lvl: "MEDIUM",
        q: "Design a rate limiter for a public API used by thousands of clients.",
        hint: "Where does the counter live, how do you keep it atomic, and what happens if that store is down?",
        a: "A token bucket per API key in Redis, updated atomically with a Lua script. Limits differ per plan and responses return 429 with Retry-After. If Redis is unreachable I would fail open for read endpoints and fail closed for abuse-prone ones, and alert either way.",
      },
    ],
  };
}
