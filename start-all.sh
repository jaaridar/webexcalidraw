#!/bin/bash
# Boardly — robust service supervisor (keeps dev + collab alive)
cd /home/z/my-project

pkill -9 -f "next" 2>/dev/null
pkill -9 -f "start-dev" 2>/dev/null
pkill -9 -f "bun --hot" 2>/dev/null
pkill -9 -f "chrome" 2>/dev/null
pkill -9 -f "agent-browser" 2>/dev/null
sleep 2

# Collab service supervisor
cat > /home/z/my-project/run-collab.sh << 'EOF'
#!/bin/bash
cd /home/z/my-project/mini-services/collab-service
while true; do
  bun --hot index.ts >> /home/z/my-project/collab-service.log 2>&1
  echo "[$(date)] collab exited ($?), restarting in 2s..." >> /home/z/my-project/collab-service.log
  sleep 2
done
EOF
chmod +x /home/z/my-project/run-collab.sh

# Dev server supervisor
cat > /home/z/my-project/run-dev.sh << 'EOF'
#!/bin/bash
cd /home/z/my-project
while true; do
  ./node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  echo "[$(date)] next dev exited ($?), restarting in 3s..." >> /home/z/my-project/dev.log
  sleep 3
done
EOF
chmod +x /home/z/my-project/run-dev.sh

rm -f dev.log collab-service.log

# Launch both supervisors fully detached (new session, no controlling tty)
setsid bash /home/z/my-project/run-collab.sh </dev/null >/dev/null 2>&1 &
setsid bash /home/z/my-project/run-dev.sh </dev/null >/dev/null 2>&1 &

echo "supervisors launched, waiting for services..."
