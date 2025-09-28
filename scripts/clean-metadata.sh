#!/bin/bash

set -e

echo "🧹 Cleaning macOS metadata files (._*) ..."

# Find ._* files, excluding node_modules directories
files_to_clean=$(find . -name "._*" -not -path "*/node_modules/*" -type f)

if [ -z "$files_to_clean" ]; then
    echo "✨ No metadata files found to clean"
else
    # Count the files
    file_count=$(echo "$files_to_clean" | wc -l)
    echo "📁 Found $file_count metadata files to clean"
    
    # Delete the files
    echo "$files_to_clean" | xargs rm -f
    
    echo "✅ Cleaned up $file_count macOS metadata files"
fi
