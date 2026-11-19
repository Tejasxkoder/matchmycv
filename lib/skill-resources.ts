export type Resource = { title: string; url: string };

const R: Record<string, Resource[]> = {
  JavaScript: [{ title: "The Modern JavaScript Tutorial", url: "https://javascript.info" }],
  TypeScript: [{ title: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html" }],
  React: [{ title: "React: Learn", url: "https://react.dev/learn" }],
  "Next.js": [{ title: "Next.js Learn course", url: "https://nextjs.org/learn" }],
  "Node.js": [{ title: "Node.js: Learn", url: "https://nodejs.org/en/learn" }],
  Python: [{ title: "The Python Tutorial", url: "https://docs.python.org/3/tutorial/" }],
  Go: [{ title: "A Tour of Go", url: "https://go.dev/tour/" }],
  Rust: [{ title: "The Rust Book", url: "https://doc.rust-lang.org/book/" }],
  Java: [{ title: "Dev.java Learn", url: "https://dev.java/learn/" }],
  SQL: [{ title: "SQLBolt interactive lessons", url: "https://sqlbolt.com" }],
  PostgreSQL: [{ title: "PostgreSQL Tutorial", url: "https://www.postgresql.org/docs/current/tutorial.html" }],
  Redis: [{ title: "Redis University", url: "https://university.redis.io" }],
  MongoDB: [{ title: "MongoDB University", url: "https://learn.mongodb.com" }],
  GraphQL: [{ title: "How to GraphQL", url: "https://www.howtographql.com" }],
  Docker: [{ title: "Docker: Get started", url: "https://docs.docker.com/get-started/" }],
  Kubernetes: [{ title: "Kubernetes tutorials", url: "https://kubernetes.io/docs/tutorials/" }],
  Terraform: [{ title: "Terraform tutorials (HashiCorp)", url: "https://developer.hashicorp.com/terraform/tutorials" }],
  AWS: [{ title: "AWS Skill Builder", url: "https://skillbuilder.aws" }],
  Azure: [{ title: "Microsoft Learn: Azure", url: "https://learn.microsoft.com/training/azure/" }],
  GCP: [{ title: "Google Cloud Skills Boost", url: "https://www.cloudskillsboost.google" }],
  Kafka: [{ title: "Apache Kafka documentation", url: "https://kafka.apache.org/documentation/" }],
  Linux: [{ title: "Linux Journey", url: "https://linuxjourney.com" }],
  Git: [{ title: "Pro Git book", url: "https://git-scm.com/book" }],
  "CI/CD": [{ title: "GitHub Actions documentation", url: "https://docs.github.com/actions" }],
  "GitHub Actions": [{ title: "GitHub Actions documentation", url: "https://docs.github.com/actions" }],
  Prometheus: [{ title: "Prometheus: Getting started", url: "https://prometheus.io/docs/prometheus/latest/getting_started/" }],
  "Machine Learning": [{ title: "Google Machine Learning Crash Course", url: "https://developers.google.com/machine-learning/crash-course" }],
  PyTorch: [{ title: "PyTorch tutorials", url: "https://pytorch.org/tutorials/" }],
  TensorFlow: [{ title: "TensorFlow tutorials", url: "https://www.tensorflow.org/tutorials" }],
};

export function resourcesFor(skill: string): Resource[] {
  return (
    R[skill] ?? [
      { title: `Search: learn ${skill}`, url: `https://www.google.com/search?q=${encodeURIComponent(`learn ${skill} tutorial`)}` },
      { title: "roadmap.sh developer roadmaps", url: "https://roadmap.sh" },
    ]
  );
}
