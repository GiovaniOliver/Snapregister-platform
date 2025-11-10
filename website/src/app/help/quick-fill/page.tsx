import Link from 'next/link';

export default function QuickFillHelpPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 py-20 px-6 text-white">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.4em] text-white/70">Quick Fill</p>
          <h1 className="text-4xl font-bold">Quick Fill support center</h1>
          <p className="max-w-2xl text-lg text-white/80">
            Guided help articles and video walkthroughs are almost ready. While we finish the interactive tutorials, this
            page gives you fast ways to get assistance.
          </p>
        </header>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
            <h2 className="text-2xl font-semibold">Need onboarding help?</h2>
            <p className="mt-2 text-white/80">
              Schedule a live onboarding session with our success engineers.
            </p>
            <a
              href="mailto:support@snapregister.com"
              className="mt-4 inline-flex items-center justify-center rounded-md bg-white px-4 py-2 font-medium text-indigo-700 hover:bg-indigo-100"
            >
              Email support
            </a>
          </div>
          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
            <h2 className="text-2xl font-semibold">Looking for documentation?</h2>
            <p className="mt-2 text-white/80">
              Visit our documentation hub for the latest Quick Fill configuration guides.
            </p>
            <Link
              href="/docs"
              className="mt-4 inline-flex items-center justify-center rounded-md border border-white px-4 py-2 font-medium text-white hover:bg-white/10"
            >
              Go to docs
            </Link>
          </div>
        </section>
        <div className="flex flex-wrap gap-3">
          <Link href="/faq" className="rounded-md bg-white px-4 py-2 font-medium text-indigo-700 hover:bg-indigo-100">
            View FAQs
          </Link>
          <Link href="/" className="rounded-md border border-white/80 px-4 py-2 text-white hover:bg-white/10">
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
