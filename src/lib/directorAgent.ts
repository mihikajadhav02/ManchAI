import { SceneState, Actor, Line, LanguageCode } from '@/types/scene';

/**
 * Director Agent - Powered by OpenAI Chat Completions API
 * Generates scene metadata, actor updates, and dialogue lines based on user direction
 */

interface DirectorResponse {
  sceneMetadata: {
    title: string;
    genre: string;
    setting: string;
    logline: string;
  };
  updatedActors: Array<{
    id: string;
    language: 'en' | 'hi' | 'mixed';
    style: string;
  }>;
  newLines: Array<{
    actorId: string;
    language: 'en' | 'hi' | 'mixed';
    text: string;
    beatDelta: 0 | 1;
  }>;
}

/**
 * Builds the input prompt for the Director Agent
 */
export function buildDirectorInput(sceneState: SceneState | null, userCommand: string): string {
  if (!sceneState) {
    return `You are creating a new scene. User direction: "${userCommand}"

Create a scene with 3 actors (protagonist, antagonist, supporting) and generate initial dialogue.
IMPORTANT: Start with actors having a conversation - have them speak and respond to each other, not just make independent statements.`;
  }

  // Get last 10 lines grouped by beat
  const lastLines = sceneState.lines.slice(-10);
  
  // Group lines by beat for better formatting
  const linesByBeat = new Map<number, Line[]>();
  lastLines.forEach((line) => {
    if (!linesByBeat.has(line.beatIndex)) {
      linesByBeat.set(line.beatIndex, []);
    }
    linesByBeat.get(line.beatIndex)!.push(line);
  });

  // Format dialogue with beat headers
  let linesText = 'No dialogue yet.';
  if (lastLines.length > 0) {
    const formattedLines: string[] = [];
    Array.from(linesByBeat.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([beatIndex, beatLines]) => {
        formattedLines.push(`Beat ${beatIndex}:`);
        beatLines.forEach((line) => {
          const actor = sceneState.actors.find((a) => a.id === line.actorId);
          const speakerName = actor?.name || 'Unknown';
          const language = actor?.language || 'en';
          // Show language in brackets for clarity
          formattedLines.push(`${speakerName} [${language}]: "${line.text}"`);
        });
        formattedLines.push(''); // Empty line between beats
      });
    linesText = formattedLines.join('\n').trim();
  }

  // Build full actor roster with all details
  const actorsList = sceneState.actors.map((actor) => 
    `- ${actor.name} (id: ${actor.id}, role: ${actor.role}, language: ${actor.language}, style: ${actor.style})`
  ).join('\n');

  return `STORY SUMMARY:
${sceneState.summary}

SCENE METADATA:
Title: ${sceneState.title}
Genre: ${sceneState.genre}
Setting: ${sceneState.setting}
Logline: ${sceneState.logline}

ACTOR ROSTER:
${actorsList}

LAST 10 DIALOGUE LINES:
${linesText}

User Command: "${userCommand}"

CRITICAL INSTRUCTIONS:
- Generate the next beat of dialogue following the user's command.
- Write a conversation where actors respond to each other naturally.
- If the user says "continue" or similar, KEEP THE CONVERSATION GOING by having actors respond to the last lines spoken.
- Each actor should react to what was just said by another actor.
- Create natural back-and-forth dialogue that flows from the previous lines.
- DO NOT end the conversation - keep it alive and dynamic.`;
}

/**
 * Runs the Director Agent using OpenAI Chat Completions API
 */
export async function runDirectorAgent(
  sceneState: SceneState | null,
  userCommand: string
): Promise<DirectorResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  // Use gpt-4o-mini (or gpt-4o for better quality)
  // Note: gpt-4.1/gpt-4.1-mini don't exist yet, using gpt-4o-mini as equivalent
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const systemPrompt = `You are ManchAI's Director Agent, responsible for writing the next beat of a fictional scene as a multi-character dialogue.

You are given:
- A short summary of the story so far.
- Current scene metadata (title, setting, genre, logline).
- A list of actors. Each actor has:
  - id
  - name
  - role (protagonist, sidekick, villain, narrator)
  - language (en, hi, mixed)
  - style (acting style)
- The last ~10 lines of dialogue.
- A new director command from the human (userCommand).

Your objectives:

WRITE A CONVERSATION, not exposition.
- Produce 3 to 6 lines per turn.
- At least two different actors must speak unless user explicitly requests a monologue.
- Each line must respond to the previous one, forming a coherent scene.
- When continuing a conversation, have actors react to the LAST lines spoken.
- Keep the conversation flowing naturally - actors should ask questions, respond to statements, build on each other's points.
- NEVER end the conversation abruptly - always leave room for continuation.

OBEY ACTORS STRICTLY.
- Actors speak only in their assigned language:
  - en → English only
  - hi → Hindi only
  - mixed → Hinglish (code-mixed, natural)
- Follow each actor's role, personality, style.

OBEY USER COMMANDS IMMEDIATELY.
If user says:
- "Switch the detective to Hindi" → Update that actor's language
- "Make it horror" → shift tone immediately
- "Change setting to a running train" → update metadata

MAINTAIN STORY CONTINUITY.
- Use the summary + last dialogue lines to maintain logical flow.
- Do not contradict already established facts.
- DO NOT invent new actors unless user explicitly asks.

Output format (return EXACTLY this JSON structure):
{
  "sceneMetadata": {
    "title": "string",
    "genre": "string",
    "setting": "string",
    "logline": "string"
  },
  "updatedActors": [
    {
      "id": "string",
      "language": "en | hi | mixed",
      "style": "string"
    }
  ],
  "newLines": [
    {
      "actorId": "string",
      "language": "en | hi | mixed",
      "text": "string",
      "beatDelta": 0 | 1
    }
  ]
}

Rules for newLines:
- Must contain 3 to 6 lines.
- Must contain a real back-and-forth between characters.
- Lines should read as if actors reply to one another.
- beatDelta = 1 if this starts a new beat; otherwise 0.

TEST CASE EXAMPLE:
User command: "Start a funny argument between a Chaiwala and a strict Mumbai cop. They are in a crowded local train."
Expected: 3-6 lines with Chaiwala speaking mixed (Hinglish) and Cop speaking English/Hindi, 
with natural back-and-forth argument dialogue.`;

  const userPrompt = buildDirectorInput(sceneState, userCommand);

  console.log('[Director Agent] Starting request...');
  console.log('[Director Agent] Model:', model);
  console.log('[Director Agent] User command:', userCommand);
  console.log('[Director Agent] User prompt length:', userPrompt.length);
  console.log('[Director Agent] User prompt preview:', userPrompt.substring(0, 200) + '...');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
    });

    console.log('[Director Agent] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Director Agent] API error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }
      throw new Error(`OpenAI API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('[Director Agent] Response received, choices:', data.choices?.length || 0);
    
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('[Director Agent] No content in response:', JSON.stringify(data, null, 2));
      throw new Error('No content in OpenAI response');
    }

    console.log('[Director Agent] Content length:', content.length);
    console.log('[Director Agent] Content preview:', content.substring(0, 300) + '...');

    // Parse JSON response
    let directorResponse: DirectorResponse;
    try {
      directorResponse = JSON.parse(content);
      console.log('[Director Agent] Parsed JSON successfully');
      console.log('[Director Agent] Number of newLines:', directorResponse.newLines?.length || 0);
    } catch (parseError) {
      console.error('[Director Agent] JSON parse error:', parseError);
      console.error('[Director Agent] Raw content:', content);
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        console.log('[Director Agent] Found JSON in code block');
        directorResponse = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error(`Failed to parse JSON response: ${content.substring(0, 500)}`);
      }
    }

    // Validate response structure
    if (!directorResponse.sceneMetadata || !directorResponse.newLines) {
      throw new Error('Invalid response structure from Director Agent');
    }

    // Validate we have 3-6 lines
    if (directorResponse.newLines.length < 3) {
      console.warn(`Director Agent returned only ${directorResponse.newLines.length} lines (expected 3-6)`);
    }

    if (directorResponse.newLines.length > 6) {
      console.warn(`Director Agent returned ${directorResponse.newLines.length} lines (expected 3-6)`);
    }

    // Validate at least 2 different actors speak (unless monologue requested)
    const uniqueActors = new Set(directorResponse.newLines.map((line) => line.actorId));
    if (uniqueActors.size < 2 && directorResponse.newLines.length >= 3) {
      console.warn(`Only ${uniqueActors.size} actor(s) speaking in ${directorResponse.newLines.length} lines - expected dialogue between multiple actors`);
    }

    return directorResponse;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

/**
 * Converts director language response to LanguageCode type
 * Maps 'hi' and 'mixed' to LanguageCode (now supported in types)
 */
export function convertLanguage(lang: 'en' | 'hi' | 'mixed'): LanguageCode {
  // 'hi' and 'mixed' are now valid LanguageCode values
  return lang as LanguageCode;
}

