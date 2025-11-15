# Firebase Credentials Setup

## Instructions

1. Place your Firebase service account JSON file in this directory
2. The file name should match your Firebase project (e.g., `fitduo-830b3-firebase-adminsdk-fbsvc-5dfdb41c47.json`)
3. Add the path to your `.env` file in the backend directory:

```
FIREBASE_CREDENTIALS=config/fitduo-830b3-firebase-adminsdk-fbsvc-5dfdb41c47.json
```

## File Location

```
backend/config/fitduo-830b3-firebase-adminsdk-fbsvc-5dfdb41c47.json
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

