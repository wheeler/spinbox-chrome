#!/bin/bash

set -e
set -o pipefail

echo "Copying necessary files to /dist..."

# Create dist directory
mkdir -p dist


# Bundle the content script modules into a single classic script
npx esbuild feed-page/content.js \
  --bundle \
  --outfile=dist/feed-page/content.js \
  --format=iife \
  --target=chrome110 \
#  --minify

echo "✓ Bundled: feed-page/content.js"

# Copy files that don't need bundling
files=(
  "README.md"
  "manifest.json"
  "popup"
  "feed-page/feed-page.css"
  "images"
)

for file in "${files[@]}"; do
  if [ -e "$file" ]; then
    cp -r "$file" dist/
    echo "✓ Copied: $file"
  else
    echo "⚠ Not found: $file"
  fi
done

echo "Build complete!"