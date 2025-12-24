#!/bin/bash
ssh root@151.248.118.210 << 'ENDSSH'
cd ~/startloft/backend
cat > .env.new << 'EOF'
# MongoDB
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=startloft
ADMIN_TOKEN=secret123
FRONTEND_URL=https://www.startloft.kz
# Admin Security
ADMIN_SYNC_TOKEN=3f1b8f0a9b4d4b71aee7f9c6b7d2a8c1a0f7c3e9b2d4a6f8c7e1b5a9d2f6c8e3

# Server
HOST=127.0.0.1
PORT=2288

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS_FILE=/root/startloft/start-loft-cb70bbfaa5b7.json
GOOGLE_SHEETS_SPREADSHEET_ID=1C1E9LfVTU3mP5y40bpO5v6eqv0IMxBbqYgZ6-hgAeWI
EOF
mv .env.new .env
cat .env | grep GOOGLE
pm2 restart startloft-backend
sleep 3
curl -s http://127.0.0.1:2288/
ENDSSH
