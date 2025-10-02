#!/bin/sh
# Extract the publisher DID from the feedgen user account

HANDLE="${PUBLISH_HANDLE:-feedgen.pds.ts.u-at-proto.work}"
SERVICE="${PUBLISH_SERVICE:-https://pds.ts.u-at-proto.work}"

# Resolve the handle to get the DID
DID=$(curl -s "${SERVICE}/xrpc/com.atproto.identity.resolveHandle?handle=${HANDLE}" | grep -o '"did":"[^"]*"' | cut -d'"' -f4)

if [ -n "$DID" ]; then
  echo "$DID"
  exit 0
else
  echo "Failed to resolve DID for handle: ${HANDLE}" >&2
  exit 1
fi
