const features = [
  {
    eyebrow: "Checks",
    title: "7 automated checks per run",
    body: "Every bullet point, keyword, and tone flag gets a verdict. Pass, warn, or fail — with an exact fix, not a vague suggestion.",
  },
  {
    eyebrow: "Live feed",
    title: "Matching jobs stream as you edit",
    body: "The gap between you and a role shrinks in real time. See which postings your updated resume unlocks before you apply.",
  },
  {
    eyebrow: "Dependency graph",
    title: "Skills are nodes, gaps are edges",
    body: "See what you need to learn and in what order. The graph knows which certifications unblock which roles.",
  },
];

export function FeatureGrid() {
  return (
    <section
      id="how-it-works"
      className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-10 border-t border-hair dark:border-white/10"
    >
      {features.map((feature) => (
        <div key={feature.title}>
          <p className="font-mono text-xs text-action dark:text-[#5C86FF] tracking-wide mb-3 uppercase">
            {feature.eyebrow}
          </p>
          <h3 className="font-display font-bold text-xl mb-2">{feature.title}</h3>
          <p className="text-muted dark:text-white/60 text-sm leading-relaxed">{feature.body}</p>
        </div>
      ))}
    </section>
  );
}
