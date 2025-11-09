import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for individuals getting started',
      features: [
        { text: 'Up to 5 product registrations', included: true },
        { text: 'Basic warranty tracking', included: true },
        { text: 'Email reminders', included: true },
        { text: 'Manual registration assistance', included: true },
        { text: 'Automated registration', included: false },
        { text: 'Priority support', included: false },
        { text: 'Family sharing', included: false },
        { text: 'API access', included: false },
      ],
      cta: 'Start Free',
      ctaVariant: 'outline' as const,
      popular: false,
    },
    {
      name: 'Premium',
      price: '$9.99',
      period: '/month',
      description: 'Ideal for households with many products',
      features: [
        { text: 'Unlimited product registrations', included: true },
        { text: 'Advanced warranty tracking', included: true },
        { text: 'Email & SMS reminders', included: true },
        { text: 'Automated registration', included: true },
        { text: 'Priority support', included: true },
        { text: 'Export data to CSV/PDF', included: true },
        { text: 'Family sharing (up to 4)', included: false },
        { text: 'API access', included: false },
      ],
      cta: 'Start Trial',
      ctaVariant: 'default' as const,
      popular: true,
    },
    {
      name: 'Family',
      price: '$19.99',
      period: '/month',
      description: 'Share with your entire household',
      features: [
        { text: 'Everything in Premium', included: true },
        { text: 'Family sharing (up to 6)', included: true },
        { text: 'Shared product library', included: true },
        { text: 'Individual profiles', included: true },
        { text: 'Parental controls', included: true },
        { text: 'Household analytics', included: true },
        { text: 'Dedicated account manager', included: false },
        { text: 'API access', included: false },
      ],
      cta: 'Start Trial',
      ctaVariant: 'default' as const,
      popular: false,
    },
    {
      name: 'Business',
      price: 'Custom',
      period: '',
      description: 'For businesses and property managers',
      features: [
        { text: 'Everything in Family', included: true },
        { text: 'Unlimited users', included: true },
        { text: 'API access', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'SLA guarantee', included: true },
        { text: 'Custom reporting', included: true },
        { text: 'White-label options', included: true },
      ],
      cta: 'Contact Sales',
      ctaVariant: 'outline' as const,
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">
                SnapRegister<span className="text-blue-600">.</span>
              </h1>
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/about" className="text-gray-600 hover:text-gray-900 font-medium">
                About
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium">
                Pricing
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 font-medium">
                Contact
              </Link>
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that works best for you. Upgrade or downgrade anytime.
          </p>
          <div className="inline-flex items-center justify-center p-1 bg-gray-100 rounded-lg">
            <button className="px-4 py-2 bg-white rounded-md shadow-sm font-medium text-gray-900">
              Monthly
            </button>
            <button className="px-4 py-2 text-gray-600 font-medium">
              Annual (Save 20%)
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.popular
                    ? 'border-blue-600 shadow-xl scale-105 z-10'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mr-2 flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? 'text-gray-700' : 'text-gray-400'
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href={plan.name === 'Business' ? '/contact' : '/signup'} className="w-full">
                    <Button
                      className="w-full"
                      variant={plan.ctaVariant}
                      size="lg"
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                immediately, and we'll prorate any charges or credits.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">
                Yes, Premium and Family plans include a 14-day free trial. No credit card required
                to start.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">What happens to my data if I cancel?</h3>
              <p className="text-gray-600">
                Your data remains accessible for 30 days after cancellation. You can export it
                anytime or reactivate your account to regain full access.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Do you offer discounts for annual billing?</h3>
              <p className="text-gray-600">
                Yes! Pay annually and save 20% on Premium and Family plans. That's 2 months free
                every year.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards, PayPal, and ACH transfers for Business accounts.
                All payments are processed securely through Stripe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Start Your Free Trial Today
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            14 days free. No credit card required. Cancel anytime.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p>&copy; 2024 SnapRegister.com. All rights reserved.</p>
            <div className="mt-4 space-x-6">
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white">Terms of Service</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}