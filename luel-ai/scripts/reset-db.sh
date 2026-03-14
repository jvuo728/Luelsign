#!/bin/bash
# Reset database - clears all data but keeps schema

docker compose exec -T postgres psql -U luel_user -d luel_esign <<EOF
TRUNCATE TABLE audit_events, recipients, fields, envelopes, users CASCADE;
EOF

echo "Database cleared successfully!"
