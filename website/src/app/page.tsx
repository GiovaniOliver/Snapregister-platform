import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Camera, Brain, Shield, Clock, Zap, CheckCircle, Star, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Navigation Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-2">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  SnapRegister<span className="text-blue-600">.</span>
                </h1>
              </div>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
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
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-2 bg-blue-100 rounded-full text-blue-600 font-medium text-sm mb-6">
                🚀 AI-Powered Product Registration
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Register Products in
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> 30 Seconds</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Just snap 4 photos - our AI extracts all the data and registers your product automatically with the manufacturer. Never miss a warranty claim again.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Watch Demo
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  14-day free trial
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <Camera className="h-8 w-8 text-blue-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Snap Photos</p>
                    <p className="text-xs text-gray-500">4 quick photos</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <Brain className="h-8 w-8 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">AI Processing</p>
                    <p className="text-xs text-gray-500">99% accuracy</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <Zap className="h-8 w-8 text-yellow-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Auto-Register</p>
                    <p className="text-xs text-gray-500">Instant submission</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <Shield className="h-8 w-8 text-purple-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Track Warranties</p>
                    <p className="text-xs text-gray-500">Never expire</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">30s</div>
              <div className="text-blue-100">Avg Registration Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99%</div>
              <div className="text-blue-100">AI Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Supported Brands</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10k+</div>
              <div className="text-blue-100">Happy Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How SnapRegister Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From photo to registered product in just three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-300 mb-2">01</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Capture 4 Photos</h3>
                <p className="text-gray-600">
                  Take photos of your serial number, warranty card, receipt, and product. Our guided camera makes it easy.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-300 mb-2">02</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">AI Extracts Data</h3>
                <p className="text-gray-600">
                  Claude AI automatically reads and structures all product information with 99% accuracy.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-300 mb-2">03</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Auto-Register</h3>
                <p className="text-gray-600">
                  We submit your registration to the manufacturer and track warranty expiration dates automatically.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to manage warranties effortlessly
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Clock className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold mb-2">Expiration Reminders</h3>
              <p className="text-gray-600 text-sm">
                Get notified before warranties expire so you never miss a claim
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Users className="h-10 w-10 text-green-600 mb-4" />
              <h3 className="text-lg font-bold mb-2">Family Sharing</h3>
              <p className="text-gray-600 text-sm">
                Manage products for your entire household in one place
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Shield className="h-10 w-10 text-purple-600 mb-4" />
              <h3 className="text-lg font-bold mb-2">Secure Storage</h3>
              <p className="text-gray-600 text-sm">
                Bank-level encryption keeps your product data safe
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Zap className="h-10 w-10 text-yellow-600 mb-4" />
              <h3 className="text-lg font-bold mb-2">Instant Processing</h3>
              <p className="text-gray-600 text-sm">
                AI processes your images in seconds, not minutes
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Brain className="h-10 w-10 text-pink-600 mb-4" />
              <h3 className="text-lg font-bold mb-2">Smart OCR</h3>
              <p className="text-gray-600 text-sm">
                Advanced AI reads even hard-to-capture serial numbers
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Star className="h-10 w-10 text-orange-600 mb-4" />
              <h3 className="text-lg font-bold mb-2">Multi-Brand Support</h3>
              <p className="text-gray-600 text-sm">
                Works with 500+ manufacturers across all categories
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">
            Loved by Thousands of Users
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Saved me so much time! I registered 5 appliances in under 3 minutes. The AI is incredibly accurate."
                </p>
                <p className="font-semibold text-gray-900">Sarah M.</p>
                <p className="text-sm text-gray-500">Homeowner</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Perfect for managing our rental properties. All warranties in one place with automatic reminders."
                </p>
                <p className="font-semibold text-gray-900">John D.</p>
                <p className="text-sm text-gray-500">Property Manager</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "The auto-registration feature is a game changer. No more filling out tedious manufacturer forms!"
                </p>
                <p className="font-semibold text-gray-900">Emily R.</p>
                <p className="text-sm text-gray-500">Tech Enthusiast</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of users who never miss a warranty claim. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent text-white border-white hover:bg-white/10">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-100">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">SnapRegister</h3>
              <p className="text-sm">AI-powered product registration made simple.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 SnapRegister.com. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
