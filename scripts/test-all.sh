#!/usr/bin/env bash
set -e

echo "Running Backend Tests..."
(cd backend && npm test)

echo "Running Frontend Lint..."
(cd frontend && npm run lint)

echo "Running Frontend Production Build..."
(cd frontend && npm run build)

echo "ALL CONSOLIDATED VERIFICATIONS PASSED!"
