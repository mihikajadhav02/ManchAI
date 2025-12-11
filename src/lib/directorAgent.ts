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
  if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey.trim() === '') {
    console.error('[Director Agent] ❌ OPENAI_API_KEY is missing or placeholder');
    throw new Error('OPENAI_API_KEY environment variable is not set or is still a placeholder. Please set a valid OpenAI API key in .env.local');
  }
  
  console.log('[Director Agent] ✅ API key found, length:', apiKey.length);

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

CRITICAL REQUIREMENTS:

1. USE EXISTING ACTORS ONLY.
   - You MUST use only the actors provided in the actor roster.
   - DO NOT invent new actors unless the user explicitly asks you to create a new character.
   - Each actorId in newLines MUST match an existing actor's id from the roster.

2. PRODUCE EXACTLY 3 TO 6 NEWLINES PER TURN.
   - You MUST return at least 3 lines and at most 6 lines in the newLines array.
   - This is a hard requirement - never return fewer than 3 or more than 6 lines.
   - Each line must be a complete dialogue statement from one actor.

3. MULTIPLE ACTORS MUST SPEAK.
   - At least 2 different actors must speak in each turn (unless user explicitly requests a monologue).
   - Actors should alternate or have a natural back-and-forth.
   - Do not have one actor speak all lines.

4. EACH LINE MUST REPLY TO THE PREVIOUS ONE.
   - Each line should respond to, react to, or build upon the previous line.
   - Create a natural conversation flow where actors are actually talking to each other.
   - Lines should read as if actors are replying to one another, not making independent statements.

WRITE A CONVERSATION, not exposition.
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

RULES FOR NEWLINES (CRITICAL):
- MUST contain exactly 3 to 6 lines (no fewer, no more).
- MUST contain at least 2 different actorIds (unless monologue explicitly requested).
- MUST contain a real back-and-forth between characters.
- Each line should read as if actors reply to one another.
- beatDelta = 1 if this starts a new beat; otherwise 0.

ElevenLabs v3 Audio Tag Requirements

You must include 1–3 ElevenLabs v3 audio tags at the start of every dialogue line you generate inside newLines[i].text.

These tags control emotion, delivery, pacing, and style.

Allowed tag categories include:

Emotion:
[happy] [excited] [sad] [angry] [nervous] [calm] [tense] [scared]

Delivery / Style:
[whispers] [shouts] [laughs] [sighs] [sarcastic] [dramatic]

Pacing / Interaction:
[fast-paced] [slow] [hesitates] [interrupting] [overlapping] [cuts-in]

Rules:
- Tags MUST appear directly before the spoken line, e.g.:
  [annoyed][fast-paced] Arre bhai, kitni bheed hai yahan!
- Choose tags that match:
  - the actor's role
  - the tone of the scene
  - the user's latest direction
- Use different tags for different characters based on personality.
- Continue generating 3–6 lines per beat with natural interaction.
- JSON structure stays the same; only text changes to include tags.

Example JSON newLine entry:
{
  "actorId": "chaiwala",
  "language": "mixed",
  "text": "[annoyed][fast-paced] Arre bhai, kya kar rahe ho?!",
  "beatDelta": 1
}

TEST CASE EXAMPLE:
User command: "Start a funny argument between a Chaiwala and a strict Mumbai cop. They are in a crowded local train."
Expected: 3-6 lines with Chaiwala speaking mixed (Hinglish) and Cop speaking English/Hindi, 
with natural back-and-forth argument dialogue. Each line should include appropriate ElevenLabs audio tags like [angry][fast-paced] or [tense][shouts].`;

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

    // 🟥 RAW_DIRECTOR_OUTPUT - Log the raw content before parsing
    console.log('🟥 RAW_DIRECTOR_OUTPUT:', content);

    // Parse JSON response
    let directorResponse: DirectorResponse;
    try {
      directorResponse = JSON.parse(content);
      console.log('[Director Agent] Parsed JSON successfully');
      console.log('[Director Agent] Number of newLines:', directorResponse.newLines?.length || 0);
    } catch (parseError) {
      console.error('🟥 JSON_PARSE_ERROR:', parseError);
      console.error('[Director Agent] Raw content:', content);
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        console.log('[Director Agent] Found JSON in code block');
        try {
          directorResponse = JSON.parse(jsonMatch[1]);
        } catch (err) {
          console.error('🟥 JSON_PARSE_ERROR (from code block):', err);
          throw new Error(`Failed to parse JSON response: ${content.substring(0, 500)}`);
        }
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

