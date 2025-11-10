import Link from 'next/link';

export default function DocsLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 py-16 px-6 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-400">Documentation</p>
          <h1 className="text-4xl font-bold">SnapRegister developer resources</h1>
          <p className="max-w-3xl text-lg text-slate-300">
            A refreshed documentation hub is on the way. Until it launches, use the quick links below to access the most
            requested integration guides and reach our engineering team.
          </p>
        </header>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-white">API integration</h2>
            <p className="mt-3 text-slate-300">
              Email <a className="text-blue-400 hover:underline" href="mailto:api@snapregister.com">api@snapregister.com</a> to
              receive the latest API specification and sandbox credentials.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-white">Automation playbooks</h2>
            <p className="mt-3 text-slate-300">
              Our success team can walk you through existing Zapier and Make templates while the self-serve catalog is
              being finalized.
            </p>
          </div>
        </section>
        <div className="flex flex-wrap gap-3">
          <Link href="/contact" className="rounded-md bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-400">
            Contact developer support
          </Link>
          <Link href="/" className="rounded-md border border-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-900">
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
