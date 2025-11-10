import Link from 'next/link';

export default function ImportWarrantiesPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-6 rounded-2xl bg-white p-8 shadow">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Import warranties</h1>
          <p className="text-gray-600">
            Bulk CSV uploads are being polished so you can bring existing warranty records into SnapRegister without
            manual entry.
          </p>
        </header>
        <section className="space-y-4">
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            <p>
              The upload widget will be available soon. Share your export with us and we will process the import for you
              in the meantime.
            </p>
          </div>
        </section>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:success@snapregister.com"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
          >
            Email your CSV
          </a>
          <Link href="/dashboard/warranties" className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
            Back to warranties
          </Link>
          <Link href="/register" className="text-gray-600 hover:text-gray-900">
            Register a product instead
          </Link>
        </div>
      </div>
    </main>
  );
}
