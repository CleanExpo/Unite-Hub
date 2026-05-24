#!/usr/bin/env bash
# Thin wrapper for Vercel REST API. Uses VERCEL_TOKEN env var.
# This machine's SSL inspection breaks normal cert validation; --insecure works around.
#
# Usage:
#   ./vercel-api.sh GET  /v9/projects?teamId=team_KMZACI5rIltoCRhAtGCXlxUf
#   ./vercel-api.sh POST /v10/projects?teamId=...  '{"name":"foo","framework":null}'
#   ./vercel-api.sh PATCH /v9/projects/<id>?teamId=...  '{"name":"new"}'
#   ./vercel-api.sh DELETE /v9/projects/<id>?teamId=...

set -euo pipefail

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "VERCEL_TOKEN not set" >&2
  exit 2
fi

METHOD="$1"; PATH_="$2"; BODY="${3:-}"
URL="https://api.vercel.com${PATH_}"

if [ -n "$BODY" ]; then
  curl -s --insecure -X "$METHOD" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BODY" \
    "$URL"
else
  curl -s --insecure -X "$METHOD" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    "$URL"
fi
