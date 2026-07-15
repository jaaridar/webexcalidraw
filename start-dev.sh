#!/bin/bash
# Auto-restart wrapper for the Next.js dev server
cd /home/z/my-project
while true; do
  echo "[$(date)] starting next dev..." >> dev.log
  ./node_modules/.bin/next dev -p 3000 >> dev.log 2>&1
  echo "[$(date)] next dev exited (code $?), restarting in 3s..." >> dev.log
  sleep 3
done
