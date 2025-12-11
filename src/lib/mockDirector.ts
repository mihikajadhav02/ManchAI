import { SceneState, Line, Actor, ActorRole, LanguageCode } from '@/types/scene';

/**
 * Mock Director - Generates initial scenes and dialogue lines
 * TODO: Replace with actual Claude API calls
 */

const MOCK_ACTORS: Actor[] = [
  {
    id: 'actor-1',
    name: 'Alex',
    role: 'protagonist',
    language: 'en',
    voiceId: 'voice-alex',
    style: 'dramatic',
  },
  {
    id: 'actor-2',
    name: 'Sam',
    role: 'antagonist',
    language: 'en',
    voiceId: 'voice-sam',
    style: 'neutral',
  },
  {
    id: 'actor-3',
    name: 'Jordan',
    role: 'supporting',
    language: 'en',
    voiceId: 'voice-jordan',
    style: 'comedic',
  },
];

const GENRES = ['drama', 'comedy', 'thriller', 'sci-fi', 'horror', 'romance'];
const SETTINGS = [
  'A dimly lit coffee shop in downtown',
  'An abandoned warehouse on the outskirts',
  'A high-tech laboratory',
  'A quiet suburban home',
  'A bustling city street',
];

export function createInitialScene(userCommand?: string): SceneState {
  const now = Date.now();
  const genre = userCommand?.toLowerCase().includes('horror')
    ? 'horror'
    : GENRES[Math.floor(Math.random() * GENRES.length)];
  const setting = SETTINGS[Math.floor(Math.random() * SETTINGS.length)];

  return {
    id: `scene-${now}`,
    title: `${genre.charAt(0).toUpperCase() + genre.slice(1)} Scene`,
    genre,
    setting,
    logline: `A tense encounter between characters in ${setting.toLowerCase()}.`,
    summary: `Initial scene setup: ${setting}. Characters are about to engage in dialogue.`,
    actors: MOCK_ACTORS,
    lines: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function generateMockLines(
  sceneState: SceneState,
  userCommand: string,
  currentBeatIndex: number
): Line[] {
  // MOCK FALLBACK: Creates basic conversation-like dialogue
  // This is only used when Director Agent (OpenAI) fails
  // TODO: Replace with actual Director Agent API call

  const newLines: Line[] = [];
  const now = Date.now();
  const actors = sceneState.actors;
  
  if (actors.length === 0) {
    return newLines;
  }

  // Generate 3-4 lines per turn (conversation-like)
  const numLines = 3 + Math.floor(Math.random() * 2);
  const beatIndex = currentBeatIndex + 1;

  // Create conversation pairs - actors respond to each other
  for (let i = 0; i < numLines; i++) {
    // Alternate between actors to create conversation flow
    const actorIndex = i % actors.length;
    const actor = actors[actorIndex];
    const nextActor = actors[(actorIndex + 1) % actors.length];
    
    // Create conversation-like responses
    let text: string;
    if (i === 0) {
      // First line - opening statement
      text = `Hey, ${nextActor.name}, we need to talk.`;
    } else if (i === 1) {
      // Second line - response to first
      text = `What's on your mind, ${actor.name}?`;
    } else if (i === 2) {
      // Third line - builds on previous
      text = `I've been thinking about what you said earlier.`;
    } else {
      // Fourth line - continues conversation
      text = `Go on, I'm listening.`;
    }

    // Incorporate user command context if possible
    const cmdLower = userCommand.toLowerCase();
    if (cmdLower.includes('angry') || cmdLower.includes('mad')) {
      text = i === 0 ? `I'm really upset about this!` : `You have no right to be angry!`;
    } else if (cmdLower.includes('happy') || cmdLower.includes('excited')) {
      text = i === 0 ? `This is amazing news!` : `I'm so happy to hear that!`;
    } else if (cmdLower.includes('sad')) {
      text = i === 0 ? `I can't believe this happened...` : `I'm sorry you feel that way.`;
    }

    newLines.push({
      id: `line-${now}-${i}`,
      actorId: actor.id,
      text,
      timestamp: now + i * 1000,
      beatIndex,
      audioUrl: '', // Will be filled by mockTTS
    });
  }

  return newLines;
}

