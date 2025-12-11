import { Line } from '@/types/scene';

/**
 * Mock TTS - Returns placeholder audio URLs
 * TODO: Replace with actual ElevenLabs API calls
 * TODO: Generate real audio files using voiceId from actors
 * TODO: Handle different languages and styles
 */

export function generateAudioUrl(lineId: string, voiceId: string): string {
  // TODO: Call ElevenLabs API with:
  // - text: line.text
  // - voice_id: voiceId
  // - model_id: appropriate model
  // - language_code: from actor.language
  // - style: from actor.style
  
  // Return placeholder URL
  return `https://placeholder-audio.example.com/${voiceId}/${lineId}.mp3`;
}

export function processLinesWithTTS(lines: Line[], actors: Map<string, { voiceId: string }>): Line[] {
  return lines.map((line) => {
    const actor = actors.get(line.actorId);
    if (!actor) return line;

    return {
      ...line,
      audioUrl: generateAudioUrl(line.id, actor.voiceId),
    };
  });
}

