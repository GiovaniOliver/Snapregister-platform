import Link from 'next/link';

export default function NewWarrantyPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-6 rounded-2xl bg-white p-8 shadow">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Add a new warranty</h1>
          <p className="text-gray-600">
            Manual entry is being finalized. For now, you can register products through the main registration flow or
            email our success team to import your warranties.
          </p>
        </header>
        <section className="space-y-4">
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            <p>
              The direct warranty creation form will appear here. Until then, start a new registration to capture the
              required documents.
            </p>
          </div>
        </section>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500">
            Register a product
          </Link>
          <a
            href="mailto:success@snapregister.com"
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Contact success team
          </a>
          <Link href="/dashboard/warranties" className="text-gray-600 hover:text-gray-900">
            Back to warranties
          </Link>
        </div>
      </div>
    </main>
  );
}
