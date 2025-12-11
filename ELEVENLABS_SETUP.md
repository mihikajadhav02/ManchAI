# ElevenLabs API Setup Guide

## Step 1: Get Your ElevenLabs API Key

1. Go to [ElevenLabs](https://elevenlabs.io) and sign up/login
2. Navigate to your profile settings: https://elevenlabs.io/app/settings/api-keys
3. Click "Create API Key" or copy your existing API key
4. The API key will look like: `abc123def456ghi789...`

## Step 2: Add API Key to .env.local

1. Open `.env.local` in your project root
2. Replace `your_elevenlabs_api_key_here` with your actual API key:

```env
ELEVENLABS_API_KEY=abc123def456ghi789...
```

**Important:** 
- Do NOT commit this file to git (it's already in .gitignore)
- Keep your API key secret and secure

## Step 3: Get Voice IDs (Optional - Customize Actors)

The default actors use these ElevenLabs voice IDs:
- **Alex (protagonist)**: `21m00Tcm4TlvDq8ikWAM` (Rachel - professional female)
- **Sam (antagonist)**: `pNInz6obpgDQGcFmaJgB` (Adam - deep male)
- **Jordan (supporting)**: `EXAVITQu4vr4xnSDxMaL` (Bella - cheerful female)

To use different voices:
1. Browse voices at: https://elevenlabs.io/app/voice-library
2. Click on a voice to see its ID
3. Update the `voiceId` in `src/lib/sceneUtils.ts` for the actors you want to change

## Step 4: Restart Your Dev Server

After adding your API key, restart your Next.js dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 5: Test It Out

1. Start a new scene by sending a direction
2. The API will generate dialogue and synthesize audio using ElevenLabs
3. Audio will play automatically when new lines are generated

## Troubleshooting

**Error: "ELEVENLABS_API_KEY environment variable is not set"**
- Make sure `.env.local` exists in the project root
- Make sure the key is spelled correctly: `ELEVENLABS_API_KEY`
- Restart your dev server after adding the key

**Error: "ElevenLabs API error: 401"**
- Your API key is invalid or expired
- Get a new key from https://elevenlabs.io/app/settings/api-keys

**Error: "ElevenLabs API error: 429"**
- You've hit your rate limit
- Check your ElevenLabs account usage/limits

**No audio playing**
- Check browser console for errors
- Verify voice IDs are valid ElevenLabs voice IDs
- Make sure audio URLs are being generated (check network tab)

