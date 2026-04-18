#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Installing dependencies ---"
npm install

echo "--- Building the application ---"
npm run build

echo "--- Build complete ---"
