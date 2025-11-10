import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6 py-16">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Reset your password</h1>
          <p className="text-gray-600">
            Password resets are currently handled by our support team while we finish the automated flow.
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-gray-600">
            Email <a className="text-blue-600 hover:underline" href="mailto:support@snapregister.com">support@snapregister.com</a> with the
            email address you used to sign up and we will send a secure reset link.
          </p>
          <p className="text-sm text-gray-500">
            For security reasons, reset links expire quickly. Contact us if you need any assistance completing the process.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/login" className="text-blue-600 hover:underline">
            Back to sign in
          </Link>
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
