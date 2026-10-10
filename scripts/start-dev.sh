#!/usr/bin/env bash
# Consolidated dev runner for 2-application architecture
echo "Starting JobsAPI Consolidated Environment (1 Backend, 1 Frontend)..."

(cd backend && npm run dev) &
BACKEND_PID=$!

(cd frontend && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
