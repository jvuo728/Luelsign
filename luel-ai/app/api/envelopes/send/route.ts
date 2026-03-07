import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Extract recipient's name and email from the body
    const body = await request.json();
    const { name, email } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { message: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Extract sender's IP address from request headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || request.ip || 'unknown';

    // Extract User-Agent from request headers
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Generate a secure UUID v4 for the signing token
    const signingToken = randomUUID();

    // Calculate expiration date 7 days from now
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    // Generate a mock internal Envelope ID
    const envelopeId = `ENV-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Mock 'append-only' database write for the Envelope record
    console.log('=== MOCK DATABASE WRITE: Envelope Record ===');
    console.log(JSON.stringify({
      envelopeId,
      recipient: {
        name,
        email,
      },
      signingToken,
      expirationDate: expirationDate.toISOString(),
      createdAt: new Date().toISOString(),
    }, null, 2));
    console.log('===========================================');

    // Mock audit trail write for 'envelope created' event
    console.log('=== MOCK AUDIT TRAIL WRITE: Envelope Created ===');
    console.log(JSON.stringify({
      event: 'envelope created',
      timestamp: new Date().toISOString(),
      utcTimestamp: new Date().toUTCString(),
      ipAddress,
      userAgent,
      envelopeId,
    }, null, 2));
    console.log('================================================');

    return NextResponse.json(
      {
        success: true,
        message: 'Envelope created successfully',
        envelopeId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating envelope:', error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
