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
  // TODO: Replace with Claude API call
  // TODO: Parse userCommand and generate contextually appropriate dialogue
  // TODO: Use sceneState.genre, sceneState.setting, and sceneState.summary for context

  const newLines: Line[] = [];
  const now = Date.now();
  const actors = sceneState.actors;

  // Generate 2-4 lines per turn
  const numLines = 2 + Math.floor(Math.random() * 3);
  const beatIndex = currentBeatIndex + 1;

  for (let i = 0; i < numLines; i++) {
    const actor = actors[i % actors.length];
    const lineTexts = [
      `I can't believe you're here.`,
      `We need to talk about what happened.`,
      `This changes everything.`,
      `Are you sure about this?`,
      `I've been waiting for this moment.`,
      `There's no going back now.`,
      `What do you mean by that?`,
      `I understand your concern, but...`,
    ];

    // If user command mentions something specific, try to incorporate it
    let text = lineTexts[Math.floor(Math.random() * lineTexts.length)];
    if (userCommand.toLowerCase().includes('angry')) {
      text = `I'm furious about this!`;
    } else if (userCommand.toLowerCase().includes('sad')) {
      text = `I can't believe this is happening...`;
    } else if (userCommand.toLowerCase().includes('excited')) {
      text = `This is amazing! I'm so excited!`;
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

