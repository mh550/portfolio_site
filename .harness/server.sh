# Sourced by init.sh and src/__tests__/harness/server-sh.test.ts: start and stop the dev server.
# The server runs in its own session (setsid), so its pid is its process group: stopping the group ends npx, next
# and next-server together. Killing npx's pid alone left next-server holding the port.

stop_server() {  # <pid file>
  local pidfile=$1 pid
  [[ -f $pidfile ]] || return 0
  pid=$(cat "$pidfile")
  # a pid file from before setsid names a plain pid, not a group
  kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
  for _ in $(seq 1 20); do kill -0 -- "-$pid" 2>/dev/null || break; sleep 0.25; done
  kill -KILL -- "-$pid" 2>/dev/null || true
  rm -f "$pidfile"
}

start_server() {  # <pid file> <log file> <command...>
  local pidfile=$1 log=$2
  shift 2
  # a script's background job is no group leader, so setsid doesn't fork and $! is the new group's id
  setsid "$@" > "$log" 2>&1 < /dev/null &
  echo $! > "$pidfile"
}
