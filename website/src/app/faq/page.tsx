import Link from 'next/link';

const questions = [
  {
    question: 'When will the self-service portal launch?',
    answer: 'We are onboarding pilot customers now and plan to open access to everyone soon. Join the waitlist to stay informed.',
  },
  {
    question: 'Do you integrate with our existing CRM?',
    answer: 'Yes. Salesforce and HubSpot connectors are available today and additional integrations are coming. Contact sales for specifics.',
  },
  {
    question: 'How secure is SnapRegister?',
    answer: 'We follow industry best practices including SOC 2 controls, encryption at rest, and SSO for enterprise tiers.',
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white py-16 px-6">
      <div className="mx-auto max-w-4xl space-y-12">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Frequently asked questions</h1>
          <p className="text-lg text-gray-600">
            Answers to the common questions we hear while we finish our full support center.
          </p>
        </header>
        <section className="space-y-6">
          {questions.map(({ question, answer }) => (
            <div key={question} className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">{question}</h2>
              <p className="mt-2 text-gray-600">{answer}</p>
            </div>
          ))}
        </section>
        <div className="rounded-xl bg-blue-600 p-8 text-white">
          <h2 className="text-2xl font-semibold">Still looking for something else?</h2>
          <p className="mt-2 text-blue-100">
            We are happy to help. Reach out and we will guide you to the right resource.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-md bg-white px-4 py-2 font-medium text-blue-600 hover:bg-blue-50">
              Contact support
            </Link>
            <Link href="/" className="rounded-md border border-white/60 px-4 py-2 text-white hover:bg-white/10">
              Return home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
