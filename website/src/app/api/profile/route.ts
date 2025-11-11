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

    // Get user with profile data
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        addressLine2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        dateOfBirth: true,
        companyName: true,
        alternatePhone: true,
        preferredContact: true,
        profileCompleted: true,
        notificationsEnabled: true,
        autoRegister: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: user
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

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        addressLine2: addressLine2?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        zipCode: zipCode?.trim() || null,
        country: country?.trim() || 'US',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        companyName: companyName?.trim() || null,
        alternatePhone: alternatePhone?.trim() || null,
        preferredContact: preferredContact || 'EMAIL',
        profileCompleted,
        notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : true,
        autoRegister: autoRegister !== undefined ? autoRegister : true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        addressLine2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        dateOfBirth: true,
        companyName: true,
        alternatePhone: true,
        preferredContact: true,
        profileCompleted: true,
        notificationsEnabled: true,
        autoRegister: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedUser
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', message: error.message },
      { status: 500 }
    );
  }
}

