import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { pool } from '@/app/lib/db';

/**
 * Database writes for Recipient Setup & Send endpoint
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

    // Use a transaction to ensure all inserts succeed or all fail
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get or create a default user for development
      // In production, this would come from authenticated session
      const defaultUserEmail = 'dev@luel.local';
      const defaultUserName = 'Development User';
      
      // Try to get existing user first
      let ownerUserId: string;
      const userResult = await client.query(
        `SELECT id FROM users WHERE email = $1`,
        [defaultUserEmail]
      );

      if (userResult.rows.length > 0) {
        // User exists, use their ID
        ownerUserId = userResult.rows[0].id;
      } else {
        // Create new default user
        ownerUserId = randomUUID();
        await client.query(
          `INSERT INTO users (id, email, name, created_at)
           VALUES ($1, $2, $3, $4)`,
          [ownerUserId, defaultUserEmail, defaultUserName, now]
        );
      }

      // Database write for envelopes table
      // Schema: id, owner_user_id, title, status, original_pdf_path, flattened_pdf_path, created_at, updated_at
      await client.query(
        `INSERT INTO envelopes (id, owner_user_id, title, status, original_pdf_path, flattened_pdf_path, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          envelopeId,
          ownerUserId,
          null, // title (optional)
          'draft', // status
          originalPdfPath,
          flattenedPdfPath,
          now,
          now,
        ]
      );

      // Database write for recipients table
      // Schema: id, envelope_id, name, email, signing_token, token_expires_at, status, created_at, updated_at
      await client.query(
        `INSERT INTO recipients (id, envelope_id, name, email, signing_token, token_expires_at, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          recipientId,
          envelopeId,
          name,
          email,
          signingToken,
          tokenExpiresAt,
          'pending', // status
          now,
          now,
        ]
      );

      // Database write for audit_events table
      // Schema: id, envelope_id, recipient_id, event_type, event_time_utc, ip_address, user_agent, metadata, created_at
      const metadata = {
        action: 'recipient_setup',
        recipient_email: email,
      };

      await client.query(
        `INSERT INTO audit_events (id, envelope_id, recipient_id, event_type, event_time_utc, ip_address, user_agent, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          auditEventId,
          envelopeId,
          recipientId,
          'envelope_created',
          now,
          ipAddress,
          userAgent,
          JSON.stringify(metadata), // JSONB field
          now,
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

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
