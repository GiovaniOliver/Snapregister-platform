/**
 * Prisma Helper Functions
 * Utilities for working with Prisma and handling database schema mismatches
 */

import { prisma } from './prisma';

/**
 * Get user with safe field selection
 * Automatically handles missing fields in the database
 */
export async function getUserSafe(id: string) {
  try {
    // Try to get user with all fields first
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    // Return only fields that exist
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || undefined,
      address: user.address || undefined,
      // Only include addressLine2 if it exists in the database
      ...(('addressLine2' in user) ? { addressLine2: (user as any).addressLine2 || undefined } : {}),
      city: user.city || undefined,
      state: user.state || undefined,
      zipCode: user.zipCode || undefined,
      country: user.country || 'US',
      dateOfBirth: user.dateOfBirth || undefined,
      companyName: user.companyName || undefined,
      alternatePhone: user.alternatePhone || undefined,
    };
  } catch (error: any) {
    // If there's a field error, try with minimal fields
    if (error.code === 'P2009' || error.message?.includes('Unknown field')) {
      console.warn('[Prisma] Field mismatch detected, using minimal query');
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          dateOfBirth: true,
          companyName: true,
          alternatePhone: true,
        },
      });
      return user;
    }
    throw error;
  }
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('[Prisma] Database connection test failed:', error);
    return false;
  }
}

/**
 * Get database schema info
 */
export async function getDatabaseInfo() {
  try {
    const result = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    return result;
  } catch (error) {
    console.error('[Prisma] Failed to get database info:', error);
    return [];
  }
}

