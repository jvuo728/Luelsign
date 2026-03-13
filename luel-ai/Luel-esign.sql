CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "email" text UNIQUE NOT NULL,
  "name" text,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "envelopes" (
  "id" uuid PRIMARY KEY,
  "owner_user_id" uuid NOT NULL,
  "title" text,
  "status" text NOT NULL,
  "original_pdf_path" text NOT NULL,
  "flattened_pdf_path" text,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "recipients" (
  "id" uuid PRIMARY KEY,
  "envelope_id" uuid NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "signing_token" text UNIQUE NOT NULL,
  "token_expires_at" timestamptz NOT NULL,
  "status" text NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE "fields" (
  "id" uuid PRIMARY KEY,
  "envelope_id" uuid NOT NULL,
  "recipient_id" uuid,
  "type" text NOT NULL,
  "page_number" int NOT NULL,
  "x" numeric NOT NULL,
  "y" numeric NOT NULL,
  "width" numeric NOT NULL,
  "height" numeric NOT NULL,
  "required" boolean NOT NULL,
  "created_at" timestamptz NOT NULL
);

CREATE TABLE "audit_events" (
  "id" uuid PRIMARY KEY,
  "envelope_id" uuid NOT NULL,
  "recipient_id" uuid,
  "event_type" text NOT NULL,
  "event_time_utc" timestamptz NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "metadata" jsonb,
  "created_at" timestamptz NOT NULL
);

ALTER TABLE "envelopes" ADD FOREIGN KEY ("owner_user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "recipients" ADD FOREIGN KEY ("envelope_id") REFERENCES "envelopes" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "fields" ADD FOREIGN KEY ("envelope_id") REFERENCES "envelopes" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "fields" ADD FOREIGN KEY ("recipient_id") REFERENCES "recipients" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "audit_events" ADD FOREIGN KEY ("envelope_id") REFERENCES "envelopes" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "audit_events" ADD FOREIGN KEY ("recipient_id") REFERENCES "recipients" ("id") DEFERRABLE INITIALLY IMMEDIATE;
