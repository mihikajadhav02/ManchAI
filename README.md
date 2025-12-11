# ManchAI

A real-time scriptwriting + multi-voice improv studio built with Next.js and TypeScript.

## Project Status

This is the foundation scaffold with mocked backend logic. The frontend is fully interactive and ready for integration with Anthropic Claude and ElevenLabs TTS APIs.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
  types/          # Shared TypeScript type definitions
    scene.ts      # Actor, Line, SceneState, ActorRole, LanguageCode
  
  lib/            # Business logic modules
    mockDirector.ts  # Mock scene and dialogue generation
    mockTTS.ts       # Mock TTS audio URL generation
  
  components/      # React UI components
    DirectionPanel.tsx  # Left panel for user direction input
    ScriptPanel.tsx     # Middle panel showing script lines
    CastPanel.tsx       # Right panel showing actors
  
  pages/          # Next.js pages and API routes
    index.tsx          # Main UI page
    api/
      scene/
        turn.ts        # API endpoint for processing scene turns
```

## Architecture

### Types (`src/types/scene.ts`)

All shared data models are defined here:
- `Actor`: Character with role, language, voice ID, and style
- `Line`: Dialogue line with timestamp, beat index, and audio URL
- `SceneState`: Complete scene with title, genre, setting, actors, and lines
- `ActorRole`: Type for character roles
- `LanguageCode`: Supported language codes

### Mock Director (`src/lib/mockDirector.ts`)

Generates initial scenes and mock dialogue lines. Contains TODO comments where Claude API integration will go.

### Mock TTS (`src/lib/mockTTS.ts`)

Returns placeholder audio URLs. Contains TODO comments where ElevenLabs API integration will go.

### API Endpoint (`src/pages/api/scene/turn.ts`)

Handles POST requests with `{ sceneState, userCommand }`:
- Creates initial scene if `sceneState` is null
- Generates new dialogue lines using mock director
- Processes lines with mock TTS
- Returns updated scene state and new lines

Contains TODO comments for:
- Claude API integration
- ElevenLabs TTS integration
- Memory compression logic

## Features

- ✅ 3-panel UI layout (Direction, Script, Cast)
- ✅ Real-time script display grouped by beats
- ✅ Auto-scrolling script panel
- ✅ Playback simulation with line highlighting
- ✅ Quick prompt buttons
- ✅ Dark theme cinematic styling
- ✅ Fully typed with TypeScript
- ✅ Mock backend ready for API integration

## Integration Points

### Claude API Integration

Look for `TODO: Replace with Claude API call` comments in:
- `src/lib/mockDirector.ts` - `generateMockLines()` function
- `src/pages/api/scene/turn.ts` - Main handler function

### ElevenLabs TTS Integration

Look for `TODO: Replace with ElevenLabs API calls` comments in:
- `src/lib/mockTTS.ts` - `generateAudioUrl()` function
- `src/pages/api/scene/turn.ts` - After line generation

### Memory Compression

Look for `TODO: Implement memory compression logic` in:
- `src/pages/api/scene/turn.ts` - After updating scene state

## Team Collaboration

All components import from `src/types/scene.ts` to ensure type safety across the codebase. The main UI calls `/api/scene/turn` for all scene updates.

## Next Steps

1. Integrate Claude API for dialogue generation
2. Integrate ElevenLabs API for TTS
3. Implement memory compression for long scenes
4. Add voice controls in Cast Panel
5. Add real audio playback functionality

