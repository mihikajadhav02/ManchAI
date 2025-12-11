import { SceneState, Actor, ActorRole } from '@/types/scene';

/**
 * Creates a default scene with 3 actors
 */
export function createDefaultScene(): SceneState {
  const now = Date.now();

  const defaultActors: Actor[] = [
    {
      id: 'actor-1',
      name: 'Alex',
      role: 'protagonist',
      language: 'en',
      // Using ElevenLabs voice ID - replace with your preferred voice
      // Get voice IDs from: https://elevenlabs.io/app/voice-library
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - professional female voice
      style: 'dramatic',
    },
    {
      id: 'actor-2',
      name: 'Sam',
      role: 'antagonist',
      language: 'en',
      voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - deep male voice
      style: 'neutral',
    },
    {
      id: 'actor-3',
      name: 'Jordan',
      role: 'supporting',
      language: 'en',
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - cheerful female voice
      style: 'comedic',
    },
  ];

  return {
    id: `scene-${now}`,
    title: 'Untitled Scene',
    genre: 'drama',
    setting: 'A neutral location',
    logline: 'A scene begins.',
    summary: 'Initial scene setup. Ready for dialogue.',
    actors: defaultActors,
    lines: [],
    createdAt: now,
    updatedAt: now,
  };
}

