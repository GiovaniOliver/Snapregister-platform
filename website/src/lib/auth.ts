import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
);

export interface UserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createSession(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, plan: true }
  });

  if (!user) throw new Error('User not found');

  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    plan: user.plan
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  // Create session in database
  await prisma.session.create({
    data: {
      userId,
      sessionToken: token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return token;
}

function safeHeaders(): ReturnType<typeof headers> | null {
  try {
    return headers();
  } catch {
    console.debug('[Auth] headers() unavailable in current context');
    return null;
  }
}

function safeCookies(): ReturnType<typeof cookies> | null {
  try {
    return cookies();
  } catch {
    console.debug('[Auth] cookies() unavailable in current context');
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  let token: string | undefined;

  // Try to get token from Authorization header (for mobile apps)
  const headersList = safeHeaders();
  const authHeader = headersList?.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Remove "Bearer " prefix
    console.debug('[Auth] Session token found in Authorization header');
  }

  // Fallback to cookie (for web browsers)
  if (!token) {
    const cookieStore = safeCookies();
    token = cookieStore?.get('session')?.value;
    if (token) {
      console.debug('[Auth] Session token found in cookies');
    }
  }

  if (!token) {
    console.debug('[Auth] No session token found');
    return null;
  }

  try {
    // Verify JWT signature and expiration
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Verify session exists in database and is not expired
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
    });

    if (!session) {
      console.warn('[Auth] Session token valid but not found in database');
      // SECURITY: Don't try to clear cookie here - middleware handles invalid JWTs
      // This can happen after database migration/reset when old tokens still exist
      // The middleware will catch invalid tokens on next request
      return null;
    }

    if (session.expiresAt < new Date()) {
      console.info('[Auth] Session expired', { userId: session.userId });
      // Clean up expired session from database
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    return payload as UserSession;
  } catch (error) {
    console.error('[Auth] Session verification failed:', error);
    return null;
  }
}

export async function destroySession() {
  const cookieStore = safeCookies();

  if (!cookieStore) {
    return;
  }

  const token = cookieStore.get('session')?.value;

  if (token) {
    await prisma.session.delete({
      where: { sessionToken: token },
    }).catch(() => {}); // Ignore errors if session doesn't exist
  }

  cookieStore.delete('session');
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}