#!/bin/bash

# Test script for anonymous user access
# This script tests the worker with anonymous users
#
# Usage: ./test-anonymous.sh [SERVER_ID]
# Example: ./test-anonymous.sh my-server-id

SERVER_ID="${1:-<SERVER_ID>}"

if [ "$SERVER_ID" == "<SERVER_ID>" ]; then
    echo "Error: Please provide a SERVER_ID"
    echo "Usage: ./test-anonymous.sh <SERVER_ID>"
    echo "Example: ./test-anonymous.sh my-server-id"
    exit 1
fi

echo "=========================================="
echo "Anonymous User Test - Worker Validation"
echo "=========================================="
echo "Server ID: $SERVER_ID"
echo ""

echo "Test 1: Anonymous user -> test-local-repo (should be BLOCKED)"
echo "------------------------------------------------------------"
jf worker dry-run --server-id $SERVER_ID '{
  "userContext": null,
  "metadata": {
    "repoPath": {
      "key": "test-local-repo",
      "path": "/test-file.txt",
      "id": "test-local-repo:/test-file.txt",
      "isRoot": false,
      "isFolder": false
    },
    "repoType": 1
  }
}' 2>&1 | grep -A 5 '"status"'

echo ""
echo "Test 2: Anonymous user -> c1 (should be ALLOWED)"
echo "------------------------------------------------------------"
jf worker dry-run --server-id $SERVER_ID '{
  "userContext": null,
  "metadata": {
    "repoPath": {
      "key": "c1",
      "path": "/test-file.txt",
      "id": "c1:/test-file.txt",
      "isRoot": false,
      "isFolder": false
    },
    "repoType": 1
  }
}' 2>&1 | grep -A 5 '"status"'

echo ""
echo "Test 3: Anonymous user -> test-remote-repo (should be ALLOWED)"
echo "------------------------------------------------------------"
jf worker dry-run --server-id $SERVER_ID '{
  "userContext": null,
  "metadata": {
    "repoPath": {
      "key": "test-remote-repo",
      "path": "/test-file.txt",
      "id": "test-remote-repo:/test-file.txt",
      "isRoot": false,
      "isFolder": false
    },
    "repoType": 1
  }
}' 2>&1 | grep -A 5 '"status"'

echo ""
echo "=========================================="
echo "Summary:"
echo "  Test 1: Should be STOP (blocked)"
echo "  Test 2: Should be PROCEED (allowed)"
echo "  Test 3: Should be PROCEED (allowed)"
echo "=========================================="
