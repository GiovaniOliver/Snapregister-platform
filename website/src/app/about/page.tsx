import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Camera, Brain, Shield, Clock, Users, Award } from 'lucide-react';

export default function AboutPage() {
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
            About SnapRegister
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            We're revolutionizing product registration with AI-powered automation.
            No more lost receipts, forgotten warranties, or tedious forms.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/signup">
              <Button size="lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Mission
              </h2>
              <p className="text-gray-600 mb-4">
                We believe product registration should be effortless. Our mission is to protect
                consumers by ensuring every product purchase is properly registered and every
                warranty is tracked automatically.
              </p>
              <p className="text-gray-600 mb-4">
                Using cutting-edge AI technology, we've reduced a 15-minute process to just
                30 seconds. Simply snap 4 photos, and we handle the rest.
              </p>
              <p className="text-gray-600">
                Founded in 2024, SnapRegister is backed by leading technology investors and
                partnered with major manufacturers to streamline the registration process for
                millions of products.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">30s</div>
                  <div className="text-sm text-gray-600">Average Registration Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">99%</div>
                  <div className="text-sm text-gray-600">Accuracy Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">500+</div>
                  <div className="text-sm text-gray-600">Supported Brands</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">24/7</div>
                  <div className="text-sm text-gray-600">AI Processing</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How SnapRegister Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Capture</h3>
                <p className="text-gray-600">
                  Take photos of your serial number, warranty card, receipt, and product.
                  Our app guides you through each step.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Extract</h3>
                <p className="text-gray-600">
                  Claude AI automatically reads and extracts all relevant information from
                  your photos with 99% accuracy.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Register</h3>
                <p className="text-gray-600">
                  We automatically submit your registration to the manufacturer and track
                  your warranty expiration dates.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose SnapRegister?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start space-x-4">
              <Clock className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Save Time</h3>
                <p className="text-gray-600 text-sm">
                  Register products in 30 seconds instead of 15 minutes
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Shield className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Never Miss Warranties</h3>
                <p className="text-gray-600 text-sm">
                  Automatic tracking and reminders before expiration
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Brain className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">AI-Powered</h3>
                <p className="text-gray-600 text-sm">
                  Advanced OCR and AI extract data with 99% accuracy
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Users className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Family Sharing</h3>
                <p className="text-gray-600 text-sm">
                  Manage products for your entire household
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Award className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Manufacturer Verified</h3>
                <p className="text-gray-600 text-sm">
                  Direct integration with 500+ brands
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Shield className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Secure & Private</h3>
                <p className="text-gray-600 text-sm">
                  Bank-level encryption for your data
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Built by a Team of Experts
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Our team combines expertise in AI, consumer protection, and product manufacturing
            to create the most advanced registration platform.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold">Engineering</h3>
              <p className="text-sm text-gray-600">
                Former engineers from Google, Apple, and Amazon
              </p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold">AI Research</h3>
              <p className="text-sm text-gray-600">
                PhD researchers in computer vision and NLP
              </p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold">Industry Experts</h3>
              <p className="text-sm text-gray-600">
                Veterans from major appliance and electronics brands
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Simplify Your Product Registrations?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of users who never miss a warranty claim.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/signup">
              <Button size="lg" variant="secondary">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                View Pricing
              </Button>
            </Link>
          </div>
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