#!/bin/bash

echo "Copying necessary files to /dist..."

# Create dist directory
mkdir -p dist

# Files and folders to copy
files=(
  "README.md"
  "manifest.json"
  "popup"
  "feed-page"
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