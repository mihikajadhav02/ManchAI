import { Line, Actor } from '@/types/scene';

/**
 * Scene Summarization - Maintains long-term coherence by summarizing recent dialogue
 * Uses heuristic approach (no GPT needed) to create concise summaries
 */

/**
 * Summarizes recent scene dialogue for memory context
 * Takes the last ~10 lines and produces a 3-5 sentence summary
 */
export function summarizeScene(prevSummary: string, lines: Line[], actors: Actor[]): string {
  // Get last 10 lines
  const recentLines = lines.slice(-10);
  
  if (recentLines.length === 0) {
    return prevSummary || 'Scene is beginning.';
  }

  // Create actor map for quick lookup
  const actorMap = new Map(actors.map((actor) => [actor.id, actor]));

  // Group lines by actor to identify key speakers
  const linesByActor = new Map<string, Line[]>();
  recentLines.forEach((line) => {
    const actorId = line.actorId;
    if (!linesByActor.has(actorId)) {
      linesByActor.set(actorId, []);
    }
    linesByActor.get(actorId)!.push(line);
  });

  // Identify main speakers (actors with most lines)
  const mainSpeakers = Array.from(linesByActor.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([actorId]) => {
      const actor = actorMap.get(actorId);
      return actor ? actor.name : 'Unknown';
    });

  // Extract key topics/themes from dialogue
  const allText = recentLines.map((line) => line.text).join(' ').toLowerCase();
  
  // Identify emotional tone (simple keyword matching)
  let tone = 'neutral';
  if (allText.match(/\b(angry|mad|furious|rage|hate)\b/)) {
    tone = 'tense';
  } else if (allText.match(/\b(happy|joy|excited|great|wonderful)\b/)) {
    tone = 'positive';
  } else if (allText.match(/\b(sad|sorry|regret|disappointed|worried)\b/)) {
    tone = 'somber';
  } else if (allText.match(/\b(question|why|what|how|confused)\b/)) {
    tone = 'inquisitive';
  }

  // Build summary sentences
  const summaryParts: string[] = [];

  // First sentence: Who is speaking
  if (mainSpeakers.length > 0) {
    if (mainSpeakers.length === 1) {
      summaryParts.push(`${mainSpeakers[0]} has been speaking.`);
    } else if (mainSpeakers.length === 2) {
      summaryParts.push(`${mainSpeakers[0]} and ${mainSpeakers[1]} have been in dialogue.`);
    } else {
      summaryParts.push(`${mainSpeakers[0]}, ${mainSpeakers[1]}, and ${mainSpeakers[2]} have been conversing.`);
    }
  }

  // Second sentence: Key topics/themes
  const keyPhrases: string[] = [];
  
  // Extract important phrases (questions, statements with key words)
  recentLines.forEach((line) => {
    const text = line.text;
    // Capture questions
    if (text.includes('?')) {
      keyPhrases.push(text.substring(0, Math.min(80, text.length)));
    }
    // Capture statements with action verbs or important nouns
    else if (
      text.match(/\b(will|must|should|need|want|going|decided|think|believe)\b/i) ||
      text.length > 50
    ) {
      keyPhrases.push(text.substring(0, Math.min(80, text.length)));
    }
  });

  if (keyPhrases.length > 0) {
    const topics = keyPhrases.slice(0, 2).join(' ').substring(0, 120);
    summaryParts.push(`Recent topics include: ${topics}...`);
  }

  // Third sentence: Tone/atmosphere
  if (tone !== 'neutral') {
    const toneDescriptions: Record<string, string> = {
      tense: 'The conversation has become tense.',
      positive: 'The mood is positive.',
      somber: 'The atmosphere is somber.',
      inquisitive: 'Questions are being raised.',
    };
    summaryParts.push(toneDescriptions[tone] || '');
  }

  // Fourth sentence: Recent developments (if any significant changes)
  const beatCount = new Set(recentLines.map((line) => line.beatIndex)).size;
  if (beatCount > 1) {
    summaryParts.push(`The conversation has progressed through ${beatCount} beats.`);
  }

  // Fifth sentence: Connect to previous summary if it exists
  if (prevSummary && prevSummary.trim().length > 0) {
    // Extract key context from previous summary (first sentence or key phrases)
    const prevSentences = prevSummary.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (prevSentences.length > 0) {
      const prevContext = prevSentences[0].substring(0, 100);
      summaryParts.push(`Building on previous context: ${prevContext}...`);
    }
  }

  // Combine into final summary (limit to 3-5 sentences)
  const finalSummary = summaryParts
    .filter((part) => part.trim().length > 0)
    .slice(0, 5)
    .join(' ');

  // If we have a previous summary, prepend it for continuity
  if (prevSummary && prevSummary.trim().length > 0 && finalSummary.length > 50) {
    // Keep previous summary but update with recent developments
    return `${prevSummary} ${finalSummary}`.substring(0, 800); // Limit total length
  }

  return finalSummary || 'Scene dialogue is progressing.';
}

