#!/bin/bash
cd /home/z/my-project

export DATABASE_URL="postgresql://postgres.kcqygvzxgkvwlupoyzzw:Joshcat%401406@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
export NEXT_PUBLIC_SUPABASE_URL="https://kcqygvzxgkvwlupoyzzw.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjcXlndnp4Z2t2dWx1cG95enp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODIwMTcsImV4cCI6MjA5NzM1ODAxN30.CliWFYqtnzuqc0GFl67MWWq0bXnBIDWwCsxgIWIhlCw"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjcXlndnp4Z2t2dWx1cG95enp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc4MjAxNywiZXhwIjoyMDk3MzU4MDE3fQ.7NPq3yrFPnww6k12DYDyJLgxagzHOqcOxUsgX-7oP74"
export NEXT_PUBLIC_SITE_URL="http://localhost:3000"
export NODE_OPTIONS="--max-old-space-size=2048"

ROUTES=(
  "/api/vendors?ecosystem=FINDMYBITES&limit=5"
  "/api/products/trending?ecosystem=FINDMYBITES&limit=5"
  "/api/products?ecosystem=FINDMYBITES&limit=5"
  "/api/reviews/recent?ecosystem=FINDMYBITES&limit=5"
  "/api/cities/popular?ecosystem=FINDMYBITES&limit=5"
  "/api/vendor/success-center"
  "/api/vendor/onboarding"
  "/dashboard"
  "/admin"
  "/api/vendor/products"
  "/api/vendor/profile"
  "/api/vendor/reviews"
  "/api/vendor/bookings"
  "/api/vendor/analytics"
  "/api/vendor/messages"
  "/api/admin/vendors"
  "/api/admin/products"
  "/api/admin/stats"
)

for route in "${ROUTES[@]}"; do
  echo "--- Warming: $route ---"
  # Kill existing server
  pkill -9 -f "next-server" 2>/dev/null
  pkill -9 -f "next dev" 2>/dev/null
  sleep 3
  
  # Start server
  nohup node node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
  DEV_PID=$!
  sleep 8
  
  # Check if server started
  if ! ps -p $DEV_PID > /dev/null 2>&1; then
    echo "  Server failed to start"
    continue
  fi
  
  # Hit the route
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 "http://localhost:3000${route}" 2>/dev/null)
  echo "  HTTP: $HTTP_CODE"
  
  # Wait for compilation to settle
  sleep 3
  
  # Check if server survived
  if ps -p $DEV_PID > /dev/null 2>&1; then
    echo "  Server ALIVE"
    # Try to hit more routes while server is alive
    for extra_route in "${ROUTES[@]}"; do
      if [ "$extra_route" = "$route" ]; then continue; fi
      EXTRA_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "http://localhost:3000${extra_route}" 2>/dev/null)
      if [ "$EXTRA_CODE" != "000" ]; then
        echo "  Extra: $extra_route -> $EXTRA_CODE"
      else
        echo "  Server crashed on extra: $extra_route"
        break
      fi
      sleep 2
    done
  else
    echo "  Server CRASHED (route cached in .next)"
  fi
done

echo "=== Warming complete ==="
# Start final server
pkill -9 -f "next" 2>/dev/null
sleep 3
nohup node node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
echo "Final server PID: $!"
sleep 8
curl -s -o /dev/null -w "Homepage: %{http_code}\n" --max-time 30 "http://localhost:3000/"
