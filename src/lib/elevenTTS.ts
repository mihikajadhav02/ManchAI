import { LanguageCode } from '@/types/scene';

/**
 * ElevenLabs TTS Integration
 * Synthesizes speech using ElevenLabs Text-to-Speech API
 */

/**
 * Maps LanguageCode to ElevenLabs language code
 * Note: 'hi' and 'mixed' are mapped to 'en' for ElevenLabs (can be extended later)
 */
function mapLanguageCode(language: LanguageCode): string {
  const languageMap: Record<LanguageCode, string> = {
    en: 'en',
    es: 'es',
    fr: 'fr',
    de: 'de',
    it: 'it',
    ja: 'ja',
    zh: 'zh',
    ko: 'ko',
    hi: 'en', // Hindi text handled by multilingual model with language_code='en'
    mixed: 'en', // Hinglish text handled by multilingual model with language_code='en'
  };
  return languageMap[language] || 'en';
}

/**
 * Synthesizes a line of text using ElevenLabs TTS API
 * Returns a data URL (data:audio/mpeg;base64,...) containing the audio
 */
export async function synthesizeLine(
  text: string,
  voiceId: string,
  language: LanguageCode
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is not set');
  }

  const elevenLabsLanguage = mapLanguageCode(language);

  console.log(`[ElevenLabs] Synthesizing: text="${text.substring(0, 50)}...", voiceId=${voiceId}, language=${elevenLabsLanguage}`);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          language_code: elevenLabsLanguage,
        }),
      }
    );

    console.log(`[ElevenLabs] Response status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ElevenLabs] API error: ${response.status} ${response.statusText}`);
      console.error(`[ElevenLabs] Error details: ${errorText}`);
      throw new Error(
        `ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // Get audio as ArrayBuffer
    const audioBuffer = await response.arrayBuffer();
    console.log(`[ElevenLabs] Received audio buffer: ${audioBuffer.byteLength} bytes`);

    // Check content type to determine audio format
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const audioFormat = contentType.includes('mp3') ? 'mpeg' : contentType.split('/')[1] || 'mpeg';
    
    console.log(`[ElevenLabs] Detected audio format: ${audioFormat}, Content-Type: ${contentType}`);

    // Convert ArrayBuffer to base64
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    console.log(`[ElevenLabs] Converted to base64: ${base64Audio.length} characters`);

    // Return as data URL
    const dataUrl = `data:audio/${audioFormat};base64,${base64Audio}`;
    console.log(`[ElevenLabs] Generated data URL: ${dataUrl.substring(0, 50)}... (total length: ${dataUrl.length})`);
    
    return dataUrl;
  } catch (error) {
    console.error('[ElevenLabs] Error synthesizing line:', error);
    if (error instanceof Error) {
      console.error('[ElevenLabs] Error message:', error.message);
      console.error('[ElevenLabs] Error stack:', error.stack);
    }
    throw error;
  }
}

