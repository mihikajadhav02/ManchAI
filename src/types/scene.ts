export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'zh' | 'ko' | 'hi' | 'mixed';

export type ActorRole = 'protagonist' | 'antagonist' | 'supporting' | 'narrator' | 'ensemble';

export interface Actor {
  id: string;
  name: string;
  role: ActorRole;
  language: LanguageCode;
  voiceId: string; // Placeholder for ElevenLabs voice ID
  style: string; // e.g., "dramatic", "comedic", "neutral"
}

export interface Line {
  id: string;
  actorId: string;
  text: string;
  timestamp: number; // Unix timestamp in milliseconds
  beatIndex: number; // Which beat/sequence this line belongs to
  audioUrl: string; // Placeholder URL for audio file
}

export interface SceneState {
  id: string;
  title: string;
  genre: string;
  setting: string;
  logline: string;
  summary: string;
  actors: Actor[];
  lines: Line[];
  createdAt: number;
  updatedAt: number;
}

