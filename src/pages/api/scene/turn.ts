import type { NextApiRequest, NextApiResponse } from 'next';
import { SceneState, Line } from '@/types/scene';
import { runDirectorAgent, convertLanguage } from '@/lib/directorAgent';
import { createDefaultScene } from '@/lib/sceneUtils';
import { synthesizeLine } from '@/lib/elevenTTS';
import { summarizeScene } from '@/lib/summarizeScene';
import { createInitialScene, generateMockLines } from '@/lib/mockDirector';
import { processLinesWithTTS } from '@/lib/mockTTS';

interface TurnRequest {
  sceneState: SceneState | null;
  userCommand: string;
}

interface TurnResponse {
  sceneState: SceneState;
  newLines: Line[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TurnResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sceneState, userCommand }: TurnRequest = req.body;

    if (!userCommand || typeof userCommand !== 'string') {
      return res.status(400).json({ error: 'userCommand is required' });
    }

    let currentSceneState: SceneState;
    let currentBeatIndex: number;

    // If no scene exists, create default scene
    if (!sceneState) {
      currentSceneState = createDefaultScene();
      currentBeatIndex = 0;
    } else {
      currentSceneState = sceneState;
      currentBeatIndex = currentSceneState.lines.length > 0
        ? Math.max(...currentSceneState.lines.map((l) => l.beatIndex), 0)
        : 0;
    }

    // Call Director Agent
    let directorResponse;
    try {
      console.log('[API] Calling Director Agent with command:', userCommand);
      console.log('[API] Current scene has', currentSceneState.lines.length, 'lines');
      console.log('[API] Current actors:', currentSceneState.actors.map(a => `${a.name} (${a.id})`).join(', '));
      directorResponse = await runDirectorAgent(currentSceneState, userCommand);
      console.log('[API] Director Agent returned', directorResponse.newLines?.length || 0, 'lines');
    } catch (error) {
      console.error('========================================');
      console.error('[API] ❌ Director Agent FAILED - Falling back to mock');
      console.error('========================================');
      if (error instanceof Error) {
        console.error('[API] Error type:', error.constructor.name);
        console.error('[API] Error message:', error.message);
        console.error('[API] Error stack:', error.stack);
        
        // Check if it's an API key issue
        if (error.message.includes('OPENAI_API_KEY') || error.message.includes('placeholder')) {
          console.error('[API] ⚠️  WARNING: OpenAI API key is not set or is a placeholder!');
          console.error('[API] ⚠️  Please set OPENAI_API_KEY in .env.local with your actual API key.');
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          console.error('[API] ⚠️  WARNING: OpenAI API key is invalid or unauthorized!');
          console.error('[API] ⚠️  Check that your OPENAI_API_KEY is correct and has credits.');
        } else if (error.message.includes('JSON') || error.message.includes('parse')) {
          console.error('[API] ⚠️  WARNING: Director Agent returned invalid JSON!');
          console.error('[API] ⚠️  Check the 🟥 RAW_DIRECTOR_OUTPUT log above to see what was returned.');
        } else {
          console.error('[API] ⚠️  Unknown error - check logs above for details');
        }
      } else {
        console.error('[API] Unknown error type:', error);
      }
      console.error('[API] ⚠️  Falling back to mock director (will generate generic dialogue, NOT real conversations)');
      console.error('========================================');
      // Fallback to mock director
      const newLines = generateMockLines(currentSceneState, userCommand, currentBeatIndex);
      const actorsMap = new Map(
        currentSceneState.actors.map((actor) => [actor.id, { voiceId: actor.voiceId }])
      );
      const linesWithAudio = processLinesWithTTS(newLines, actorsMap);
      
      // Summarize scene even for mock fallback
      const updatedLines = [...currentSceneState.lines, ...linesWithAudio];
      const updatedSummary = summarizeScene(
        currentSceneState.summary,
        updatedLines,
        currentSceneState.actors
      );

      const updatedSceneState: SceneState = {
        ...currentSceneState,
        lines: updatedLines,
        summary: updatedSummary,
        updatedAt: Date.now(),
      };

      return res.status(200).json({
        sceneState: updatedSceneState,
        newLines: linesWithAudio,
      });
    }

    // Update scene metadata if provided
    if (directorResponse.sceneMetadata) {
      currentSceneState.title = directorResponse.sceneMetadata.title;
      currentSceneState.genre = directorResponse.sceneMetadata.genre;
      currentSceneState.setting = directorResponse.sceneMetadata.setting;
      currentSceneState.logline = directorResponse.sceneMetadata.logline;
    }

    // Update actors if listed in updatedActors
    if (directorResponse.updatedActors && directorResponse.updatedActors.length > 0) {
      const updatedActorMap = new Map(
        directorResponse.updatedActors.map((ua) => [ua.id, ua])
      );

      currentSceneState.actors = currentSceneState.actors.map((actor) => {
        const update = updatedActorMap.get(actor.id);
        if (update) {
          return {
            ...actor,
            language: convertLanguage(update.language),
            style: update.style,
          };
        }
        return actor;
      });
    }

    // Process new lines - ensure ALL lines are processed (3-6 lines)
    const now = Date.now();
    let runningBeatIndex = currentBeatIndex;

    // Validate we have the expected number of lines (3-6 lines)
    console.log('[API] Validating director response...');
    console.log('[API] newLines array:', directorResponse.newLines);
    
    if (!directorResponse.newLines || directorResponse.newLines.length === 0) {
      console.error('[API] ERROR: Director Agent returned no dialogue lines');
      throw new Error('Director Agent returned no dialogue lines');
    }

    console.log('[API] Director Agent returned', directorResponse.newLines.length, 'lines');
    
    if (directorResponse.newLines.length < 3) {
      console.warn(`[API] WARNING: Director Agent returned only ${directorResponse.newLines.length} lines (expected 3-6)`);
    }

    if (directorResponse.newLines.length > 6) {
      console.warn(`[API] WARNING: Director Agent returned ${directorResponse.newLines.length} lines (expected 3-6), using first 6`);
    }
    
    // Log each line for debugging
    directorResponse.newLines.forEach((line, idx) => {
      console.log(`[API] Line ${idx + 1}: actorId=${line.actorId}, language=${line.language}, text="${line.text.substring(0, 50)}..."`);
    });

    // Process ALL newLines (3-6 lines) - ensure we don't drop any
    const linesToProcess = directorResponse.newLines.slice(0, 6);
    
    // Create Line objects for all newLines
    const newLines: Line[] = linesToProcess.map((line, index) => {
      // Update beat index based on beatDelta BEFORE assigning
      // beatDelta=1 means start a new beat, beatDelta=0 means continue current beat
      if (line.beatDelta === 1) {
        runningBeatIndex += 1;
      }

      // Validate actorId exists
      const actor = currentSceneState.actors.find((a) => a.id === line.actorId);
      if (!actor) {
        console.error(`Actor not found for line ${index}: actorId=${line.actorId}`);
        throw new Error(`Invalid actorId in Director response: ${line.actorId}. Available actors: ${currentSceneState.actors.map(a => a.id).join(', ')}`);
      }

      return {
        id: `line-${now}-${index}`,
        actorId: line.actorId,
        text: line.text,
        timestamp: now + index * 1000,
        beatIndex: runningBeatIndex,
        audioUrl: '', // Will be filled by ElevenLabs TTS
      };
    });

    console.log(`Processing ${newLines.length} new dialogue lines from Director Agent`);

    // Create actor map for quick lookup
    const actorMap = new Map(
      currentSceneState.actors.map((actor) => [actor.id, actor])
    );

    // Synthesize audio for ALL lines in parallel using ElevenLabs TTS
    // This ensures all 3-6 lines get audio, not just the first one
    const linesWithAudio = await Promise.all(
      newLines.map(async (line) => {
        const actor = actorMap.get(line.actorId);
        if (!actor) {
          console.warn(`Actor not found for line ${line.id}, actorId: ${line.actorId}`);
          return line; // Return line without audio if actor not found
        }

        // Use the language from the director response, fallback to actor's language
        const lineLanguage = directorResponse.newLines.find((dl) => dl.actorId === line.actorId && dl.text === line.text)?.language;
        const languageToUse = lineLanguage ? convertLanguage(lineLanguage) : actor.language;

        try {
          console.log(`Synthesizing audio for line ${line.id}: actor=${actor.name}, voiceId=${actor.voiceId}, language=${languageToUse}, text="${line.text.substring(0, 50)}..."`);
          const audioUrl = await synthesizeLine(line.text, actor.voiceId, languageToUse);
          console.log(`Audio synthesized successfully for line ${line.id}, URL length: ${audioUrl.length}`);
          return {
            ...line,
            audioUrl,
          };
        } catch (error) {
          console.error(`Failed to synthesize audio for line ${line.id} (actor: ${actor.name}, voiceId: ${actor.voiceId}):`, error);
          // Return line without audioUrl if synthesis fails
          return line;
        }
      })
    );

    console.log(`Successfully processed ${linesWithAudio.length} lines with audio synthesis`);

    // Update scene state with new lines
    const updatedLines = [...currentSceneState.lines, ...linesWithAudio];
    
    // Summarize scene for long-term coherence
    const updatedSummary = summarizeScene(
      currentSceneState.summary,
      updatedLines,
      currentSceneState.actors
    );

    const updatedSceneState: SceneState = {
      ...currentSceneState,
      lines: updatedLines,
      summary: updatedSummary,
      updatedAt: Date.now(),
    };

    // TODO: Implement memory compression logic here
    // TODO: If lines array gets too long, compress older beats into summary
    // TODO: Keep only recent N beats in lines array, move rest to summary

    res.status(200).json({
      sceneState: updatedSceneState,
      newLines: linesWithAudio,
    });
  } catch (error) {
    console.error('Error processing turn:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

