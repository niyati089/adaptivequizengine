# Run Enhanced Proctoring Migration
cd c:\Users\anisk\ogadaptivequiz\backend

Write-Host "Running database migration..." -ForegroundColor Yellow

# Option 1: Apply migration SQL (if you have psql or database client)
Write-Host "
Option 1: Apply SQL migration" -ForegroundColor Cyan
Write-Host "  Run: psql $env:DATABASE_URL -f proctoring_migration.sql" -ForegroundColor White
Write-Host "  Or use pgAdmin/DBeaver to execute: backend\proctoring_migration.sql" -ForegroundColor White

# Option 2: Recreate tables (DESTRUCTIVE - only for development)
Write-Host "
Option 2: Recreate all tables (DEV ONLY - DESTROYS DATA!)" -ForegroundColor Red
Write-Host "  Run the following Python code:" -ForegroundColor White
Write-Host @'
python -c "
from app.database.connection import Base, engine
from app.models import *

# Drop all tables
Base.metadata.drop_all(bind=engine)
print('✓ Dropped all tables')

# Create all tables with new schema
Base.metadata.create_all(bind=engine)
print('✓ Created all tables')
"
'@ -ForegroundColor Cyan

Write-Host "
Choose option and press Enter when migration is complete..." -ForegroundColor Yellow
Read-Host
