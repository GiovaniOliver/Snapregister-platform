import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { clearInvalidSession } from '@/app/actions/auth';
import DashboardLayoutWrapper from '@/components/DashboardLayoutWrapper';
import SessionGuard from '@/components/SessionGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Camera, Package, Shield, TrendingUp, Clock, AlertCircle } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getSession();

  // SECURITY: If no session despite middleware protection, clear invalid cookie and redirect
  // This scenario should rarely occur now that middleware validates JWT signatures
  // However, we keep this as defense-in-depth for edge cases like:
  // - Session deleted from DB after middleware check but before page render
  // - Race conditions in session validation
  // - Database connectivity issues during middleware check
  if (!session) {
    console.error('[Dashboard] No session found despite middleware protection - this should rarely occur');

    // SECURITY: Clean up invalid session cookie to prevent redirect loops
    // This is an async operation but we don't await it to prevent blocking
    clearInvalidSession().catch((error) => {
      console.error('[Dashboard] Failed to clear invalid session:', error);
    });

    // SECURITY: Redirect with descriptive error to inform user
    // This will only execute once per request due to Next.js redirect behavior
    redirect('/login?error=invalid_session');
  }

  // Mock data - in production, fetch from database
  const stats = {
    totalProducts: 0,
    activeWarranties: 0,
    expiringWarranties: 0,
    registrationsCompleted: 0,
  };

  return (
    <DashboardLayoutWrapper user={session}>
      {/* SECURITY: Client-side session guard to detect and prevent infinite loops */}
      <SessionGuard currentPath="/dashboard" />
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-brand-navy">
            Welcome back, {session.firstName}!
          </h1>
          <p className="text-gray-600">
            Here's an overview of your product registrations and warranties.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Registered products
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Warranties</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeWarranties}</div>
              <p className="text-xs text-muted-foreground">
                Currently protected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expiringWarranties}</div>
              <p className="text-xs text-muted-foreground">
                Within 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registrations</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.registrationsCompleted}</div>
              <p className="text-xs text-muted-foreground">
                Completed this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with the most common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/register">
              <Button variant="outline" className="w-full h-auto p-6 flex flex-col items-center space-y-2 hover:border-brand-teal/50">
                <Camera className="h-8 w-8 text-brand-teal" />
                <div className="text-center">
                  <div className="font-semibold">Register Product</div>
                  <div className="text-xs text-gray-500">Snap photos to register</div>
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/products">
              <Button variant="outline" className="w-full h-auto p-6 flex flex-col items-center space-y-2 hover:border-brand-teal/50">
                <Package className="h-8 w-8 text-brand-navy" />
                <div className="text-center">
                  <div className="font-semibold">View Products</div>
                  <div className="text-xs text-gray-500">Manage your inventory</div>
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/warranties">
              <Button variant="outline" className="w-full h-auto p-6 flex flex-col items-center space-y-2 hover:border-brand-teal/50">
                <Shield className="h-8 w-8 text-brand-teal/80" />
                <div className="text-center">
                  <div className="font-semibold">Track Warranties</div>
                  <div className="text-xs text-gray-500">Monitor expiration dates</div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest product registrations and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
              <p className="text-sm mt-2">
                Start by <Link href="/register" className="text-brand-teal hover:text-brand-teal/80 hover:underline font-medium">registering your first product</Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started Guide for new users */}
        {stats.totalProducts === 0 && (
          <Card className="bg-teal-50 border-2 border-brand-teal/30">
            <CardHeader>
              <CardTitle className="text-brand-navy">Getting Started with SnapRegister</CardTitle>
              <CardDescription className="text-brand-navy/70">
                Follow these simple steps to register your first product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-brand-navy">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand-teal text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Take 4 photos</p>
                    <p className="text-sm text-brand-navy/70">Serial number, warranty card, receipt, and product</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand-teal text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">AI extracts information</p>
                    <p className="text-sm text-brand-navy/70">Our AI automatically reads all product details</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand-teal text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Automatic registration</p>
                    <p className="text-sm text-brand-navy/70">We register your product with the manufacturer</p>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <Link href="/register">
                  <Button className="w-full md:w-auto">
                    <Camera className="mr-2 h-4 w-4" />
                    Register Your First Product
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayoutWrapper>
  );
}