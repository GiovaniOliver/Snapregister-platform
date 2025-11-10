import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white py-16 px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="text-lg text-gray-600">
          We are preparing a detailed privacy policy that outlines how SnapRegister collects, uses, and protects your
          data. In the meantime, please reach out to our team if you have any immediate questions about privacy or data
          usage.
        </p>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">Need help right now?</h2>
          <p className="mt-3 text-gray-600">
            Contact us and we will gladly walk you through our current data handling practices.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-md bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-500">
              Contact Support
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
