export type GithubRepo = {
  name: string;
  description: string;
  stars: number;
  language: string | null;
  url: string;
};

export type GithubSnapshot = {
  username: string;
  name: string | null;
  profileUrl: string;
  publicRepos: number;
  followers: number;
  totalStars: number;
  topRepos: GithubRepo[];
  languages: Record<string, number>;
  topics: Record<string, number>;
  activity: Record<string, number>;
  activityDays: number;
  fetchedAt: string;
};

export function githubEvidence(snapshot: GithubSnapshot, skill: string): number {
  const key = skill.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "-");
  let count = 0;
  for (const [lang, n] of Object.entries(snapshot.languages)) {
    if (lang.toLowerCase() === skill.toLowerCase()) count += n;
  }
  for (const [topic, n] of Object.entries(snapshot.topics)) {
    const t = topic.toLowerCase().replace(/\.js$/, "");
    if (t === key || t === key.replace(/-/g, "")) count += n;
  }
  return count;
}
