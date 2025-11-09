// API Route: Device Information Capture
// POST /api/device-info - Store device information

import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';
// import { validateDeviceInfo } from '@/lib/validation';
import { parseDeviceInfoFromUserAgent } from '@/lib/device-detector';

// const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // TODO: Implement device info tracking when deviceInfo model is added to schema
    return NextResponse.json({
      success: true,
      message: 'Device info tracking not yet implemented'
    });
  } catch (error) {
    console.error('Error storing device info:', error);
    return NextResponse.json(
      { error: 'Failed to store device information' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userAgent = req.headers.get('user-agent') || '';
    const headers: Record<string, string> = {};

    // Extract relevant headers
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Parse device info from user agent
    const deviceInfo = parseDeviceInfoFromUserAgent(userAgent, headers);

    return NextResponse.json({
      success: true,
      deviceInfo
    });
  } catch (error) {
    console.error('Error parsing device info:', error);
    return NextResponse.json(
      { error: 'Failed to parse device information' },
      { status: 500 }
    );
  }
}