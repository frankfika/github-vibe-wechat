#!/usr/bin/env bash
set -Eeuo pipefail

project_name="${COMPOSE_PROJECT_NAME:-omniwriter}"
compose_file="${COMPOSE_FILE:-compose.ha.yaml}"
version="${APP_VERSION:-$(git rev-parse --short HEAD)}"
image_repository="${OMNIWRITER_IMAGE_REPOSITORY:-omniwriter}"
build_image="${BUILD_IMAGE:-1}"
pull_image="${PULL_IMAGE:-0}"
health_timeout="${HEALTH_TIMEOUT_SECONDS:-90}"
env_file="${ENV_FILE:-.env.production}"
compose=(docker compose -p "$project_name")

if command -v flock >/dev/null 2>&1; then
  exec 9>"${DEPLOY_LOCK_FILE:-/tmp/omniwriter-deploy.lock}"
  if ! flock -n 9; then
    printf 'another OmniWriter deployment is already running\n' >&2
    exit 1
  fi
fi

if [[ -f "$env_file" ]]; then
  compose+=(--env-file "$env_file")
fi
compose+=(-f "$compose_file")

container_name() {
  printf '%s-%s-1' "$project_name" "$1"
}

current_version() {
  local name image
  name="$(container_name "$1")"
  image="$(docker inspect --format '{{.Config.Image}}' "$name" 2>/dev/null || true)"
  if [[ "$image" == "$image_repository:"* ]]; then
    printf '%s\n' "${image#"$image_repository:"}"
  fi
}

wait_healthy() {
  local service="$1"
  local name
  name="$(container_name "$service")"
  local deadline=$((SECONDS + health_timeout))
  while (( SECONDS < deadline )); do
    if [[ "$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$name" 2>/dev/null || true)" == "healthy" ]]; then
      return 0
    fi
    sleep 2
  done
  docker logs --tail 80 "$name" 2>&1 || true
  return 1
}

old_a="$(current_version app-a || true)"
old_b="$(current_version app-b || true)"
updated_a=0
updated_b=0

rollback() {
  local exit_code=$?
  trap - ERR
  if (( updated_b == 1 )) && [[ -n "$old_b" ]]; then
    printf 'deployment gate failed; rolling app-b back to %s\n' "$old_b" >&2
    APP_VERSION="$old_b" "${compose[@]}" up -d --no-deps --no-build app-b || true
    wait_healthy app-b || true
  fi
  if (( updated_a == 1 )) && [[ -n "$old_a" ]]; then
    printf 'deployment gate failed; rolling app-a back to %s\n' "$old_a" >&2
    APP_VERSION="$old_a" "${compose[@]}" up -d --no-deps --no-build app-a || true
    wait_healthy app-a || true
  fi
  exit "$exit_code"
}
trap rollback ERR

if [[ "$build_image" == "1" ]]; then
  printf 'Building immutable image %s:%s\n' "$image_repository" "$version"
  docker build --build-arg APP_VERSION="$version" -t "$image_repository:$version" .
fi
if [[ "$pull_image" == "1" ]]; then
  printf 'Pulling immutable image %s:%s\n' "$image_repository" "$version"
  docker pull "$image_repository:$version"
fi

printf 'Updating app-a\n'
APP_VERSION="$version" "${compose[@]}" up -d --no-deps --no-build app-a
updated_a=1
wait_healthy app-a

printf 'Updating app-b\n'
APP_VERSION="$version" "${compose[@]}" up -d --no-deps --no-build app-b
updated_b=1
if ! wait_healthy app-b; then
  if [[ -n "$old_b" ]]; then
    printf 'app-b health gate failed; rolling back to %s\n' "$old_b" >&2
    APP_VERSION="$old_b" "${compose[@]}" up -d --no-deps --no-build app-b
    wait_healthy app-b || true
  fi
  updated_b=0
  exit 1
fi

printf 'Ensuring gateway is healthy\n'
APP_VERSION="$version" "${compose[@]}" up -d --no-deps --no-build gateway
wait_healthy gateway

printf 'Deployment healthy: app-a=%s app-b=%s gateway=healthy\n' "$version" "$version"
"${compose[@]}" ps

if [[ -n "${SMOKE_URL:-}" ]]; then
  printf 'Running external smoke check: %s\n' "$SMOKE_URL"
  smoke_payload="$(curl --fail --silent --show-error --max-time 10 "$SMOKE_URL/api/health")"
  if [[ "$smoke_payload" != *"\"version\":\"$version\""* ]]; then
    printf 'external smoke check returned an unexpected version\n' >&2
    false
  fi
  ready_payload="$(curl --fail --silent --show-error --max-time 10 "$SMOKE_URL/api/ready")"
  if [[ "$ready_payload" != *'"status":"ready"'* ]] || [[ "$ready_payload" != *"\"version\":\"$version\""* ]]; then
    printf 'external readiness check failed or returned an unexpected version\n' >&2
    false
  fi
fi

trap - ERR
