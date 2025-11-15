# Firebase Credentials Setup

## Instructions

1. Place your Firebase service account JSON file in this directory
2. Name it: `firebase-credentials.json`
3. The file will be automatically loaded by the application

## File Location

```
backend/config/firebase-credentials.json
```

## Security

- This file is in `.gitignore` and will NOT be committed to git
- Never share this file publicly
- Keep it secure and private

## After Setup

The application will automatically:
- Load the credentials on startup
- Initialize Firebase Admin SDK
- Enable real authentication (no more dev mode bypass)

