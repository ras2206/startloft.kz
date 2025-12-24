#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_DIR="${REPO_DIR:-$ROOT_DIR}"

GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_BRANCH="${GIT_BRANCH:-}"
if [ -z "$GIT_BRANCH" ]; then
  GIT_BRANCH="$(git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD)"
fi

BACKEND_DIR="${BACKEND_DIR:-$REPO_DIR/backend}"
FRONTEND_DIR="${FRONTEND_DIR:-$REPO_DIR/frontend}"
VENV_DIR="${VENV_DIR:-$BACKEND_DIR/venv}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
PIP_BIN="${PIP_BIN:-$VENV_DIR/bin/pip}"
NPM_BIN="${NPM_BIN:-npm}"

BACKEND_SERVICE="${BACKEND_SERVICE:-}"
FRONTEND_SERVICE="${FRONTEND_SERVICE:-}"
SYSTEMCTL_CMD="${SYSTEMCTL_CMD:-systemctl}"
SUDO="${SUDO:-}"

echo "==> Updating repo"
git -C "$REPO_DIR" fetch --all --prune
git -C "$REPO_DIR" checkout "$GIT_BRANCH"
git -C "$REPO_DIR" pull --ff-only "$GIT_REMOTE" "$GIT_BRANCH"

echo "==> Backend dependencies"
if [ ! -d "$VENV_DIR" ]; then
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi
"$PIP_BIN" install -r "$BACKEND_DIR/requirements.txt"

echo "==> Frontend dependencies and build"
"$NPM_BIN" --prefix "$FRONTEND_DIR" ci
"$NPM_BIN" --prefix "$FRONTEND_DIR" run build

if [ -n "$BACKEND_SERVICE" ] || [ -n "$FRONTEND_SERVICE" ]; then
  echo "==> Restarting services"
  if [ -n "$BACKEND_SERVICE" ]; then
    $SUDO $SYSTEMCTL_CMD restart "$BACKEND_SERVICE"
  fi
  if [ -n "$FRONTEND_SERVICE" ]; then
    $SUDO $SYSTEMCTL_CMD restart "$FRONTEND_SERVICE"
  fi
else
  echo "==> Skipping service restart (BACKEND_SERVICE/FRONTEND_SERVICE not set)"
fi

echo "==> Done"
