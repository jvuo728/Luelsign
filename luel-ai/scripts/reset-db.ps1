# Reset database - clears all data but keeps schema (PowerShell)

docker compose exec -T postgres psql -U luel_user -d luel_esign -c "TRUNCATE TABLE audit_events, recipients, fields, envelopes, users CASCADE;"

Write-Host "Database cleared successfully!"
