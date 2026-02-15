#!/bin/bash
echo "Starting soma-digilib for LAN..."
echo "Ensure you have run 'npm install' first!"

# Get IP Address (Linux/Mac)
IP=$(hostname -I | awk '{print $1}')
echo "------------------------------------------------"
echo "Server will be accessible at: http://$IP:5000"
echo "------------------------------------------------"

# Start the server using PM2
npm start

echo "Server is running in background."
echo "To stop, run: npm run stop"
echo "To check logs, run: npm run monitor"
