#!/bin/bash
# Dev server manager with auto-restart on crash.
# Usage:
#   ./dev.sh start   - kill any existing server, start fresh (auto-restarts on crash)
#   ./dev.sh stop    - kill the server and watcher
#   ./dev.sh status  - check if running
#   ./dev.sh restart - stop then start
#   ./dev.sh logs    - tail recent server logs

PORT=4321
DIR="$(cd "$(dirname "$0")" && pwd)"
DEVDIR="$DIR/.dev"
PIDFILE="$DEVDIR/dev.pid"
WATCHPID="$DEVDIR/watch.pid"
LOGFILE="$DEVDIR/dev.log"

mkdir -p "$DEVDIR"

run_server() {
  cd "$DIR" || exit 1
  while true; do
    echo "[$(date)] Starting dev server..." >> "$LOGFILE"
    npm run dev >> "$LOGFILE" 2>&1
    echo "[$(date)] Server exited, restarting in 2s..." >> "$LOGFILE"
    sleep 2
  done
}

start() {
  stop_quiet
  run_server &
  echo $! > "$WATCHPID"
  echo "Starting dev server (watcher PID $(cat "$WATCHPID"))..."
  for i in {1..15}; do
    if curl -s -o /dev/null -w '' "http://localhost:$PORT" 2>/dev/null; then
      echo "Ready at http://localhost:$PORT"
      return 0
    fi
    sleep 1
  done
  echo "Server may still be starting. Check: ./dev.sh status"
}

stop_quiet() {
  [ -f "$WATCHPID" ] && kill -9 "$(cat "$WATCHPID")" 2>/dev/null && rm -f "$WATCHPID"
  lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null
  [ -f "$PIDFILE" ] && kill -9 "$(cat "$PIDFILE")" 2>/dev/null && rm -f "$PIDFILE"
  pgrep -f "astro dev" | xargs kill -9 2>/dev/null
}

stop() {
  stop_quiet
  echo "Server stopped."
}

status() {
  if curl -s -o /dev/null -w '' "http://localhost:$PORT" 2>/dev/null; then
    echo "Running on http://localhost:$PORT"
    [ -f "$WATCHPID" ] && echo "Watcher PID: $(cat "$WATCHPID")"
  else
    echo "Not running."
  fi
}

logs() {
  tail -50 "$LOGFILE" 2>/dev/null || echo "No logs found."
}

case "${1:-start}" in
  start)   start ;;
  stop)    stop ;;
  status)  status ;;
  restart) stop; start ;;
  logs)    logs ;;
  *) echo "Usage: $0 {start|stop|status|restart|logs}" ;;
esac
