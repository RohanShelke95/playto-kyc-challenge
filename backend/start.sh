#!/bin/bash
# Railway startup script: migrate, seed, then start the server
set -e

echo "=== Running migrations ==="
python manage.py migrate --noinput

echo "=== Seeding database ==="
python seed.py

echo "=== Starting server ==="
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
