'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// SECURITY: Error messages mapping for session-related issues
// Generic messages to prevent information disclosure
const ERROR_MESSAGES: Record<string, string> = {
  'invalid_session': 'Your session has expired or is invalid. Please sign in again.',
  'session_expired': 'Your session has expired. Please sign in again.',
  'unauthorized': 'Please sign in to access this page.',
  'no_session': 'Please sign in to continue.',
  'session_loop_detected': 'We detected an issue with your session. Please sign in again.',
  'dashboard_error': 'An error occurred while loading your dashboard. Please sign in again.',
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // SECURITY: Handle error query parameters on mount
  // Display user-friendly messages for session issues
  useEffect(() => {
    const error = searchParams.get('error');
    if (error && ERROR_MESSAGES[error]) {
      setErrorMessage(ERROR_MESSAGES[error]);

      // SECURITY: Clear the error parameter from URL without page reload
      // This prevents error message persistence on browser refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    // SECURITY: Clear any existing error messages when attempting login
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'You have been logged in successfully.',
        });
        router.push('/dashboard');
        router.refresh();
      } else {
        // SECURITY: Use generic error message from API or fallback
        // Prevents information disclosure about user existence
        toast({
          title: 'Error',
          description: result.error || 'Invalid email or password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // SECURITY: Generic error message for network/unexpected errors
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex flex-col items-center justify-center mb-4 space-y-3">
            <Image
              src="/logo.png"
              alt="SnapRegister Logo"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
            <h1 className="text-3xl font-bold text-gray-900">
              SnapRegister<span className="text-blue-600">.</span>
            </h1>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* SECURITY: Display session error messages above login form */}
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-gray-600 text-center">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </div>
          <Link href="/forgot-password" className="text-sm text-gray-600 hover:underline">
            Forgot your password?
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}