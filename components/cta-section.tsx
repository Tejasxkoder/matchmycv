import Link from "next/link";

export function CtaSection() {
  return (
    <section className="bg-ink text-white text-center py-20 px-6">
      <h2 className="font-display font-bold text-4xl mb-4">
        Ready to run your pipeline?
      </h2>
      <p className="text-white/60 mb-8">
        Upload a PDF or paste your resume. Results in under 30 seconds.
      </p>
      <Link
        href="/upload"
        className="inline-block bg-action text-white font-medium px-6 py-3 rounded-md hover:bg-action/90 transition-colors"
      >
        Upload your resume
      </Link>
    </section>
  );
}
