import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white py-16 px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
        <p className="text-lg text-gray-600">
          Our legal team is finalizing the complete Terms of Service for SnapRegister. While that document is being
          completed, you can review the highlights below and contact us for any clarifications required for your
          organization.
        </p>
        <div className="rounded-lg bg-white p-6 shadow-sm space-y-4">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900">What to expect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
              <li>Responsible usage of the platform and fair use limits</li>
              <li>Our uptime commitments and support response targets</li>
              <li>Data retention and deletion procedures</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900">Need specifics?</h2>
            <p className="text-gray-600">
              Let us know if you need to review a draft agreement or require a signed contract version for procurement.
            </p>
          </section>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-md bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-500">
              Talk to sales
            </Link>
            <Link href="/" className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
              Return home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
