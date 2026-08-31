#!/usr/bin/env bash
set -Eeuo pipefail

compose_file="${COMPOSE_FILE:-compose.ha.yaml}"
gateway_url="${GATEWAY_URL:-http://127.0.0.1:${OMNIWRITER_GATEWAY_PORT:-3080}}"
health_timeout="${HEALTH_TIMEOUT_SECONDS:-90}"
env_file="${ENV_FILE:-.env.production}"
compose=(docker compose)
if [[ -f "$env_file" ]]; then
  compose+=(--env-file "$env_file")
fi
compose+=(-f "$compose_file")

preserve_runtime_configuration() {
  local id runtime_image env_line
  id="$(container_id app-a)"
  [[ -n "$id" ]] || { printf 'FAIL app-a is not running\n' >&2; return 1; }
  runtime_image="$(docker inspect --format '{{.Config.Image}}' "$id")"
  if [[ "$runtime_image" != *:* ]]; then
    printf 'FAIL unsupported app image name: %s\n' "$runtime_image" >&2
    return 1
  fi
  export OMNIWRITER_IMAGE_REPOSITORY="${runtime_image%:*}"
  export APP_VERSION="${runtime_image##*:}"
  while IFS= read -r env_line; do
    case "$env_line" in
      ANTHROPIC_API_KEY=*) export ANTHROPIC_API_KEY="${env_line#*=}" ;;
      ANTHROPIC_API_KEY_FILE=*) export ANTHROPIC_API_KEY_FILE="${env_line#*=}" ;;
      ANTHROPIC_BASE_URL=*) export ANTHROPIC_BASE_URL="${env_line#*=}" ;;
      ANTHROPIC_MODEL=*) export ANTHROPIC_MODEL="${env_line#*=}" ;;
      FETCH_TIMEOUT_MS=*) export FETCH_TIMEOUT_MS="${env_line#*=}" ;;
    esac
  done < <(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$id")
}

container_id() {
  "${compose[@]}" ps -q "$1"
}

wait_healthy() {
  local service="$1"
  local deadline=$((SECONDS + health_timeout))
  local id
  while (( SECONDS < deadline )); do
    id="$(container_id "$service")"
    if [[ -n "$id" ]] && [[ "$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id" 2>/dev/null || true)" == "healthy" ]]; then
      return 0
    fi
    sleep 1
  done
  printf 'FAIL %s did not become healthy\n' "$service" >&2
  "${compose[@]}" logs --tail 80 "$service" >&2 || true
  return 1
}

probe_gateway() {
  local attempts="$1"
  local failures=0
  local i
  for ((i = 1; i <= attempts; i += 1)); do
    if ! curl --fail --silent --show-error --max-time 5 "$gateway_url/api/health" >/dev/null; then
      failures=$((failures + 1))
    fi
    sleep 0.2
  done
  if (( failures > 0 )); then
    printf 'FAIL gateway lost %s/%s requests\n' "$failures" "$attempts" >&2
    return 1
  fi
  printf 'PASS gateway served %s/%s requests\n' "$attempts" "$attempts"
}

restore_services() {
  "${compose[@]}" start app-a app-b >/dev/null 2>&1 || true
}
trap restore_services EXIT

# force-recreate 用于验证 Docker DNS 地址变化。复用当前容器的镜像标签和
# 模型环境，避免测试结束后把正在运行的部署悄悄降级为 local/空密钥配置。
preserve_runtime_configuration

printf 'Checking gateway baseline\n'
probe_gateway 5

printf 'Stopping app-a; app-b must carry all traffic\n'
"${compose[@]}" stop app-a >/dev/null
probe_gateway 10
"${compose[@]}" start app-a >/dev/null
wait_healthy app-a
sleep 3

printf 'Stopping app-b; app-a must carry all traffic\n'
"${compose[@]}" stop app-b >/dev/null
probe_gateway 10
"${compose[@]}" start app-b >/dev/null
wait_healthy app-b
sleep 3

printf 'Recreating app-a while app-b remains online\n'
rolling_result="$(mktemp)"
(probe_gateway 40 >"$rolling_result" 2>&1) &
probe_pid=$!
"${compose[@]}" up -d --no-deps --no-build --force-recreate app-a >/dev/null
wait_healthy app-a
wait "$probe_pid"
cat "$rolling_result"
rm -f "$rolling_result"

printf 'Verifying gateway follows the recreated app-a address\n'
"${compose[@]}" stop app-b >/dev/null
sleep 6
probe_gateway 10
"${compose[@]}" start app-b >/dev/null
wait_healthy app-b

printf 'Recreating app-b while app-a remains online\n'
rolling_result="$(mktemp)"
(probe_gateway 40 >"$rolling_result" 2>&1) &
probe_pid=$!
"${compose[@]}" up -d --no-deps --no-build --force-recreate app-b >/dev/null
wait_healthy app-b
wait "$probe_pid"
cat "$rolling_result"
rm -f "$rolling_result"

printf 'Verifying gateway follows the recreated app-b address\n'
"${compose[@]}" stop app-a >/dev/null
sleep 3
probe_gateway 10
"${compose[@]}" start app-a >/dev/null
wait_healthy app-a

printf 'PASS all HA failover checks completed\n'
