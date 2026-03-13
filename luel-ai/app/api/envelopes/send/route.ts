import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * Mock database writes for Recipient Setup & Send endpoint
 * 
 * This endpoint creates records in the following tables (per Luel-esign.sql schema):
 * 
 * 1. envelopes table:
 *    - id, owner_user_id, title, status, original_pdf_path, flattened_pdf_path, created_at, updated_at
 * 
 * 2. recipients table:
 *    - id, envelope_id, name, email, signing_token, token_expires_at, status, created_at, updated_at
 * 
 * 3. audit_events table:
 *    - id, envelope_id, recipient_id, event_type, event_time_utc, ip_address, user_agent, metadata, created_at
 */

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
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null;

    // Extract User-Agent from request headers
    const userAgent = request.headers.get('user-agent') || null;

    // Generate UUIDs for database records
    const envelopeId = randomUUID();
    const recipientId = randomUUID();
    const auditEventId = randomUUID();
    
    // Mock owner_user_id (in production, this would come from authenticated session)
    const ownerUserId = randomUUID();

    // Generate a secure UUID v4 for the signing token
    const signingToken = randomUUID();

    // Calculate expiration date 7 days from now
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    // Current timestamp for all created_at/updated_at fields
    const now = new Date();

    // Mock PDF paths (in production, these would be actual file paths)
    const originalPdfPath = `/uploads/envelopes/${envelopeId}/original.pdf`;
    const flattenedPdfPath = null; // Optional field, set to null initially

    // Mock 'append-only' database write for envelopes table
    // Schema: id, owner_user_id, title, status, original_pdf_path, flattened_pdf_path, created_at, updated_at
    console.log('DB_WRITE: envelopes');
    console.log(JSON.stringify({
      id: envelopeId,
      owner_user_id: ownerUserId,
      title: null, // Optional field
      status: 'draft', // Required: draft, pending, sent, completed, cancelled, etc.
      original_pdf_path: originalPdfPath, // Required
      flattened_pdf_path: flattenedPdfPath, // Optional
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }, null, 2));

    // Mock 'append-only' database write for recipients table
    // Schema: id, envelope_id, name, email, signing_token, token_expires_at, status, created_at, updated_at
    console.log('DB_WRITE: recipients');
    console.log(JSON.stringify({
      id: recipientId,
      envelope_id: envelopeId,
      name: name, // Required
      email: email, // Required
      signing_token: signingToken, // Required, UNIQUE
      token_expires_at: tokenExpiresAt.toISOString(), // Required
      status: 'pending', // Required: pending, sent, signed, declined, etc.
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }, null, 2));

    // Mock audit trail write for audit_events table
    // Schema: id, envelope_id, recipient_id, event_type, event_time_utc, ip_address, user_agent, metadata, created_at
    console.log('DB_WRITE: audit_events');
    console.log(JSON.stringify({
      id: auditEventId,
      envelope_id: envelopeId, // Required, FK to envelopes
      recipient_id: recipientId, // Optional, FK to recipients (included since we're creating recipient)
      event_type: 'envelope_created', // Required
      event_time_utc: now.toISOString(), // Required
      ip_address: ipAddress, // Optional
      user_agent: userAgent, // Optional
      metadata: { // Optional JSONB field
        action: 'recipient_setup',
        recipient_email: email,
      },
      created_at: now.toISOString(),
    }, null, 2));

    return NextResponse.json(
      {
        success: true,
        message: 'Envelope created successfully',
        envelopeId,
        recipientId,
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
