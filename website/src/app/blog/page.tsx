import Link from 'next/link';

const placeholderPosts = [
  {
    title: 'How AI eliminates manual warranty paperwork',
    description: 'See how retailers are automating product registrations with SnapRegister.',
    href: '/contact',
  },
  {
    title: 'Building a seamless post-purchase experience',
    description: 'A forthcoming series covering onboarding flows, retention tactics, and more.',
    href: '/contact',
  },
  {
    title: 'Roadmap preview: automation and analytics',
    description: 'Learn what our product team is delivering next quarter.',
    href: '/contact',
  },
];

export default function BlogLandingPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16 px-6">
      <div className="mx-auto max-w-5xl space-y-12">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Insights from the SnapRegister team</h1>
          <p className="text-lg text-gray-600">
            The blog relaunch is almost ready. Until we publish new articles, explore upcoming topics and subscribe for
            updates.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-white shadow hover:bg-blue-500"
          >
            Join the newsletter
          </Link>
        </header>
        <section className="grid gap-6 md:grid-cols-3">
          {placeholderPosts.map((post) => (
            <article key={post.title} className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">{post.title}</h2>
              <p className="mt-2 text-gray-600">{post.description}</p>
              <Link href={post.href} className="mt-4 inline-flex text-blue-600 hover:underline">
                Get early access
              </Link>
            </article>
          ))}
        </section>
        <div className="text-center">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
