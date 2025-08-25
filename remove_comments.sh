#!/bin/bash

# Script to remove all comments from JavaScript files

remove_comments() {
    local file="$1"
    local temp_file="${file}.tmp"
    
    # Remove single line comments and multi-line comments
    sed -E '
        # Remove single line comments (// ...)
        s|//.*$||g
        # Remove multi-line comments (/* ... */) on same line
        s|/\*.*\*/||g
    ' "$file" > "$temp_file"
    
    # Remove empty lines
    sed '/^[[:space:]]*$/d' "$temp_file" > "$file"
    rm "$temp_file"
    
    echo "Cleaned: $file"
}

echo "Removing comments from frontend files..."
find frontend/src -name "*.js" -type f | while read file; do
    remove_comments "$file"
done

echo "Removing comments from backend files..."
find backend -name "*.js" -type f -not -path "*/node_modules/*" | while read file; do
    remove_comments "$file"
done

echo "All comments removed!"
