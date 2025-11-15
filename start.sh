#!/bin/bash
# Start script for Railway
# This allows Railway to start from the root directory

cd backend
uvicorn app.main:app --host 0.0.0.0 --port $PORT

