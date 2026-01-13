#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Running prisma migrate deploy..."
  attempts=0
  until [ "$attempts" -ge 10 ]
  do
    if npm run prisma:migrate; then
      break
    fi
    attempts=$((attempts + 1))
    echo "Migration failed, retrying in 3s..."
    sleep 3
  done

  if [ "$attempts" -ge 10 ]; then
    echo "Migration failed after retries."
    exit 1
  fi
fi

exec "$@"
