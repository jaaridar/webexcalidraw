#!/bin/bash
cd /home/z/my-project/mini-services/collab-service
while true; do
  bun --hot index.ts >> /home/z/my-project/collab-service.log 2>&1
  echo "[$(date)] collab exited ($?), restarting in 2s..." >> /home/z/my-project/collab-service.log
  sleep 2
done
