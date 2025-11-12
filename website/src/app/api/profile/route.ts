/**
 * User Profile API Endpoints
 * 
 * GET /api/profile - Get user profile
 * PUT /api/profile - Update user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user with profile data - use findUnique without select to avoid field errors
    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return only the fields we need, handling missing fields gracefully
    const profile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      addressLine2: (user as any).addressLine2 || null,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      country: user.country,
      dateOfBirth: user.dateOfBirth,
      companyName: user.companyName,
      alternatePhone: user.alternatePhone,
      preferredContact: (user as any).preferredContact || 'EMAIL',
      profileCompleted: (user as any).profileCompleted || false,
      notificationsEnabled: user.notificationsEnabled,
      autoRegister: user.autoRegister,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({
      success: true,
      profile
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      phone,
      address,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      dateOfBirth,
      companyName,
      alternatePhone,
      preferredContact,
      notificationsEnabled,
      autoRegister,
    } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Check if profile is complete
    // Profile is considered complete if all essential fields are filled
    const essentialFields = [
      firstName,
      lastName,
      session.email,
      phone,
      address,
      city,
      state,
      zipCode,
    ];
    const profileCompleted = essentialFields.every(field => field && field.trim() !== '');

    // Update user profile - build data object conditionally
    const updateData: any = {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      zipCode: zipCode?.trim() || null,
      country: country?.trim() || 'US',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      companyName: companyName?.trim() || null,
      alternatePhone: alternatePhone?.trim() || null,
      notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : true,
      autoRegister: autoRegister !== undefined ? autoRegister : true,
    };

    // Include addressLine2 if provided
    if (addressLine2 !== undefined) {
      updateData.addressLine2 = addressLine2?.trim() || null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
    });

    // Return only the fields we need
    const profile = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      address: updatedUser.address,
      addressLine2: (updatedUser as any).addressLine2 || null,
      city: updatedUser.city,
      state: updatedUser.state,
      zipCode: updatedUser.zipCode,
      country: updatedUser.country,
      dateOfBirth: updatedUser.dateOfBirth,
      companyName: updatedUser.companyName,
      alternatePhone: updatedUser.alternatePhone,
      preferredContact: (updatedUser as any).preferredContact || 'EMAIL',
      profileCompleted: (updatedUser as any).profileCompleted || false,
      notificationsEnabled: updatedUser.notificationsEnabled,
      autoRegister: updatedUser.autoRegister,
      updatedAt: updatedUser.updatedAt,
    };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', message: error.message },
      { status: 500 }
    );
  }
}

