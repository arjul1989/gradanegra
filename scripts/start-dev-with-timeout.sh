#!/usr/bin/env bash
# Start backend and admin-panel in background and wait for readiness with a timeout
# Usage: bash scripts/start-dev-with-timeout.sh [--timeout N] [--no-backend] [--no-frontend]

set -u

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$REPO_ROOT/logs"
mkdir -p "$LOG_DIR"

TIMEOUT=60
START_BACKEND=1
START_FRONTEND=1

while [ "$#" -gt 0 ]; do
  case "$1" in
    --timeout)
      TIMEOUT="$2"; shift 2;;
    --no-backend)
      START_BACKEND=0; shift;;
    --no-frontend)
      START_FRONTEND=0; shift;;
    *)
      echo "Unknown arg: $1"; exit 2;;
  esac
done

echo "Starting dev servers with timeout=${TIMEOUT}s"

start_backend() {
  echo "Starting backend..."
  cd "$REPO_ROOT/backend" || return 1
  # install if node_modules missing
  if [ ! -d node_modules ]; then
    echo "Installing backend dependencies..."
    npm install --no-audit --no-fund
  fi
  nohup npm run dev > "$LOG_DIR/backend.log" 2>&1 &
  echo $! > "$LOG_DIR/backend.pid"
  echo "Backend pid: $(cat "$LOG_DIR/backend.pid")"
}

start_frontend() {
  echo "Starting admin-panel (Next.js)..."
  cd "$REPO_ROOT/admin-panel" || return 1
  if [ ! -d node_modules ]; then
    echo "Installing admin-panel dependencies..."
    npm install --no-audit --no-fund
  fi
  nohup npm run dev > "$LOG_DIR/admin-panel.log" 2>&1 &
  echo $! > "$LOG_DIR/admin-panel.pid"
  echo "Admin-panel pid: $(cat "$LOG_DIR/admin-panel.pid")"
}

wait_for_http() {
  local url="$1"
  local timeout="$2"
  local start_ts=$(date +%s)
  while true; do
    now_ts=$(date +%s)
    elapsed=$((now_ts - start_ts))
    if [ "$elapsed" -ge "$timeout" ]; then
      return 1
    fi
    # use curl to check status
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
    # consider any 2xx or 3xx (redirect) status as OK
    if [[ "$status" =~ ^2 ]] || [[ "$status" =~ ^3 ]]; then
      return 0
    fi
    sleep 1
  done
}

if [ "$START_BACKEND" -eq 1 ]; then
  start_backend || { echo "Failed to start backend"; }
fi

if [ "$START_FRONTEND" -eq 1 ]; then
  start_frontend || { echo "Failed to start admin-panel"; }
fi

echo "Waiting for services to be ready (timeout ${TIMEOUT}s)..."

BACKEND_OK=0
FRONTEND_OK=0

if [ "$START_BACKEND" -eq 1 ]; then
  if wait_for_http "http://localhost:8080/health" "$TIMEOUT"; then
    BACKEND_OK=1
    echo "Backend is healthy at http://localhost:8080/health"
  else
    echo "Backend did not become healthy within ${TIMEOUT}s. Check $LOG_DIR/backend.log"
  fi
fi

if [ "$START_FRONTEND" -eq 1 ]; then
  if wait_for_http "http://localhost:3000/" "$TIMEOUT"; then
    FRONTEND_OK=1
    echo "Admin-panel is up at http://localhost:3000/"
  else
    echo "Admin-panel did not respond with 200 within ${TIMEOUT}s. Check $LOG_DIR/admin-panel.log"
  fi
fi

echo "--- Summary ---"
if [ "$START_BACKEND" -eq 1 ]; then
  if [ "$BACKEND_OK" -eq 1 ]; then
    echo "Backend: READY"
  else
    echo "Backend: FAILED"
    echo "Last backend log lines:"
    tail -n 200 "$LOG_DIR/backend.log" || true
  fi
fi

if [ "$START_FRONTEND" -eq 1 ]; then
  if [ "$FRONTEND_OK" -eq 1 ]; then
    echo "Admin-panel: READY"
  else
    echo "Admin-panel: FAILED"
    echo "Last admin-panel log lines:"
    tail -n 200 "$LOG_DIR/admin-panel.log" || true
  fi
fi

if [ "$BACKEND_OK" -eq 1 ] && [ "$FRONTEND_OK" -eq 1 ]; then
  echo "All services are up"
  exit 0
else
  echo "One or more services failed to start"
  exit 2
fi
