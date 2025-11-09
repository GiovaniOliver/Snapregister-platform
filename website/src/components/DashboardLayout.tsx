'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Home,
  Package,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  Camera,
  User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    plan: string;
  };
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Register Product', href: '/register', icon: Camera },
    { name: 'My Products', href: '/dashboard/products', icon: Package },
    { name: 'Warranties', href: '/dashboard/warranties', icon: Shield },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="SnapRegister"
              width={40}
              height={40}
              className="object-contain"
            />
            <h1 className="text-xl font-bold text-brand-navy">
              SnapRegister<span className="text-brand-teal">.</span>
            </h1>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
            transform transition-transform duration-200 ease-in-out lg:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="hidden lg:flex flex-col items-center justify-center p-6 border-b border-gray-200">
              <Link href="/dashboard" className="flex flex-col items-center space-y-2">
                <Image
                  src="/logo.png"
                  alt="SnapRegister"
                  width={60}
                  height={60}
                  className="object-contain"
                />
                <h1 className="text-2xl font-bold text-brand-navy">
                  SnapRegister<span className="text-brand-teal">.</span>
                </h1>
              </Link>
            </div>

            {/* User info */}
            {user && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-brand-teal flex items-center justify-center text-white font-semibold">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-navy truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-brand-teal border border-brand-teal/20">
                    {user.plan} Plan
                  </span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                      ${
                        isActive
                          ? 'bg-teal-50 text-brand-teal font-medium border border-brand-teal/20'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-brand-navy'
                      }
                    `}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom actions */}
            <div className="p-4 border-t border-gray-200">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut size={20} className="mr-3" />
                Log out
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}