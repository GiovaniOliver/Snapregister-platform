// GET/PUT /api/warranties/preferences - Get and update warranty notification preferences

import { NextRequest, NextResponse } from 'next/server';
import {
  getWarrantyPreferences,
  updateWarrantyPreferences,
} from '@/services/warranty-service';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

const preferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  reminder90Days: z.boolean().optional(),
  reminder30Days: z.boolean().optional(),
  reminder7Days: z.boolean().optional(),
  reminder1Day: z.boolean().optional(),
  customDays: z.array(z.number().min(1).max(365)).optional(),
  dailyDigest: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  monthlyDigest: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.number().min(0).max(23).optional(),
  quietHoursEnd: z.number().min(0).max(23).optional(),
  timezone: z.string().optional(),
  autoRenewReminder: z.boolean().optional(),
  lifetimeWarrantyReminder: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get preferences
    const preferences = await getWarrantyPreferences(userId);

    // Parse customDays JSON
    const customDays = preferences.customDays
      ? JSON.parse(preferences.customDays)
      : [];

    return NextResponse.json({
      success: true,
      preferences: {
        ...preferences,
        customDays,
      },
    });
  } catch (error: any) {
    console.error('Error fetching warranty preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch preferences',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Parse and validate request body
    const body = await request.json();
    const validation = preferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    // Update preferences
    const updatedPreferences = await updateWarrantyPreferences(
      userId,
      validation.data
    );

    // Parse customDays JSON for response
    const customDays = updatedPreferences.customDays
      ? JSON.parse(updatedPreferences.customDays)
      : [];

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        ...updatedPreferences,
        customDays,
      },
    });
  } catch (error: any) {
    console.error('Error updating warranty preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update preferences',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
