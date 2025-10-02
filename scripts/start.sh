#!/bin/sh
set -e

# Auto-publish feed generator if AUTO_PUBLISH is set
if [ "$AUTO_PUBLISH" = "true" ]; then
  echo "Auto-publishing feed generator..."

  # Wait for PDS to be ready
  echo "Waiting for PDS to be ready..."
  sleep 10

  # Publish the feed generator
  OUTPUT=$(node dist/scripts/publishFeedGenAuto.js 2>&1) || {
    echo "Failed to publish feed generator, continuing anyway..."
    echo "$OUTPUT"
  }

  # Extract the DID from the output
  PUBLISHED_DID=$(echo "$OUTPUT" | grep -o 'did:plc:[a-z0-9]*' | head -1)

  if [ -n "$PUBLISHED_DID" ]; then
    echo "Published feed with DID: $PUBLISHED_DID"
    export FEEDGEN_PUBLISHER_DID="$PUBLISHED_DID"

    echo "$PUBLISHED_DID" > /shared/publisher-did.txt
    echo "Wrote publisher DID to /shared/publisher-did.txt"
  fi
fi

# Start the feed generator
echo "Starting feed generator..."
exec node dist/index.js
