import { useState, useRef, useEffect } from 'react';
import { SceneState, Line } from '@/types/scene';
import DirectionPanel from '@/components/DirectionPanel';
import ScriptPanel from '@/components/ScriptPanel';
import CastPanel from '@/components/CastPanel';

export default function Home() {
  const [sceneState, setSceneState] = useState<SceneState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlayingLineId, setCurrentlyPlayingLineId] = useState<string | null>(null);
  const [autoContinue, setAutoContinue] = useState(true); // Auto-continue by default
  const [audioEnabled, setAudioEnabled] = useState(false); // Track if audio is enabled via user interaction
  const playbackAbortRef = useRef({ aborted: false });
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const autoContinueTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sceneStateRef = useRef<SceneState | null>(null); // Keep ref to latest scene state
  const isLoadingRef = useRef(false); // Keep ref to latest loading state

  // Sync refs with state
  useEffect(() => {
    sceneStateRef.current = sceneState;
  }, [sceneState]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  /**
   * Plays lines sequentially with audio playback
   */
  async function playLinesSequentially(lines: Line[]) {
    setIsPlaying(true);
    playbackAbortRef.current.aborted = false;
    setCurrentlyPlayingLineId(null);

    for (const line of lines) {
      // Check if playback was aborted
      if (playbackAbortRef.current.aborted) {
        break;
      }

      // Skip if no audio URL
      if (!line.audioUrl) {
        console.warn(`No audio URL for line ${line.id} - text: "${line.text}"`);
        // Still highlight the line even without audio
        setCurrentlyPlayingLineId(line.id);
        // Wait a bit before moving to next line
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      // Validate audio URL format
      if (!line.audioUrl || line.audioUrl.trim() === '') {
        console.error(`[Audio] Empty audio URL for line ${line.id}`);
        setCurrentlyPlayingLineId(line.id);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      if (!line.audioUrl.startsWith('data:audio/')) {
        console.error(`[Audio] Invalid audio URL format for line ${line.id}:`, line.audioUrl.substring(0, 100));
        console.error(`[Audio] Expected format: data:audio/mpeg;base64,... but got: ${line.audioUrl.substring(0, 30)}`);
        setCurrentlyPlayingLineId(line.id);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      // Validate base64 data exists
      const base64Match = line.audioUrl.match(/base64,(.+)/);
      if (!base64Match || base64Match[1].length < 100) {
        console.error(`[Audio] Invalid or too short base64 data for line ${line.id}`);
        setCurrentlyPlayingLineId(line.id);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      // Create and play audio
      console.log(`[Audio] Creating audio element for line ${line.id}`);
      console.log(`[Audio] Audio URL length: ${line.audioUrl.length}, starts with: ${line.audioUrl.substring(0, 30)}`);
      
      const audio = new Audio(line.audioUrl);
      activeAudioRef.current = audio;
      setCurrentlyPlayingLineId(line.id);

      // Set volume to ensure it's audible
      audio.volume = 1.0;

      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.error(`[Audio] Timeout waiting for audio to play: ${line.id}`);
            reject(new Error('Audio playback timeout'));
          }, 30000); // 30 second timeout

          audio.onloadeddata = () => {
            console.log(`[Audio] Audio loaded successfully for line ${line.id}, duration: ${audio.duration}s`);
          };

          audio.oncanplay = () => {
            console.log(`[Audio] Audio can play for line ${line.id}`);
          };

          audio.onplay = () => {
            console.log(`[Audio] Audio started playing for line ${line.id}`);
          };

          audio.onended = () => {
            console.log(`[Audio] Audio finished playing for line ${line.id}`);
            clearTimeout(timeout);
            resolve();
          };

          audio.onerror = (error) => {
            clearTimeout(timeout);
            const errorMsg = audio.error ? `Code: ${audio.error.code}, Message: ${audio.error.message}` : 'Unknown error';
            console.error(`[Audio] Audio playback error for line ${line.id}:`, error, errorMsg);
            console.error(`[Audio] Audio element state:`, {
              readyState: audio.readyState,
              networkState: audio.networkState,
              error: audio.error,
            });
            reject(new Error(`Audio playback error: ${errorMsg}`));
          };

          // Load the audio first
          audio.load();

          // Try to play after a short delay to ensure it's loaded
          setTimeout(() => {
            audio.play()
              .then(() => {
                console.log(`[Audio] Successfully started playing audio for line ${line.id}: "${line.text.substring(0, 50)}..."`);
              })
              .catch((error) => {
                clearTimeout(timeout);
                console.error(`[Audio] Failed to play audio for line ${line.id}:`, error);
                console.error(`[Audio] Audio element state:`, {
                  readyState: audio.readyState,
                  networkState: audio.networkState,
                  error: audio.error,
                });
                // Browser autoplay restrictions - try to continue anyway
                console.warn('[Audio] Browser may have blocked autoplay. User interaction may be required.');
                console.warn('[Audio] Try clicking the page or a button first to enable audio playback.');
                reject(error);
              });
          }, 100); // Small delay to ensure audio is ready
        });
      } catch (error) {
        console.error(`[Audio] Error playing line ${line.id}:`, error);
        // Continue to next line even if this one fails
        // Still wait a bit so user can see the text
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // Check again if aborted after playback
      if (playbackAbortRef.current.aborted) {
        break;
      }
    }

    // Cleanup
    activeAudioRef.current = null;
    setCurrentlyPlayingLineId(null);
    setIsPlaying(false);

    // Auto-continue: Generate next turn automatically
    // Use ref to get the latest sceneState
    if (autoContinue && !playbackAbortRef.current.aborted) {
      // Clear any existing timeout first
      if (autoContinueTimeoutRef.current) {
        clearTimeout(autoContinueTimeoutRef.current);
      }
      // Wait a moment before continuing
      autoContinueTimeoutRef.current = setTimeout(() => {
        // Double-check conditions before auto-continuing - use refs for latest state
        if (autoContinue && !playbackAbortRef.current.aborted && sceneStateRef.current && !isLoadingRef.current) {
          console.log('[Auto-continue] Triggering next turn...');
          handleSendDirection('Continue the conversation naturally. Have the actors respond to each other and keep the dialogue going.');
        } else {
          console.log('[Auto-continue] Skipped - conditions not met:', {
            autoContinue,
            aborted: playbackAbortRef.current.aborted,
            hasSceneState: !!sceneStateRef.current,
            isLoading: isLoadingRef.current,
          });
        }
      }, 2000); // 2 second pause before next turn
    }
  }

  /**
   * Stops playback and pauses any active audio
   */
  function stopPlayback() {
    playbackAbortRef.current.aborted = true;
    setAutoContinue(false); // Stop auto-continue when user stops
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if (autoContinueTimeoutRef.current) {
      clearTimeout(autoContinueTimeoutRef.current);
      autoContinueTimeoutRef.current = null;
    }
    setCurrentlyPlayingLineId(null);
    setIsPlaying(false);
  }

  /**
   * Toggles auto-continue mode
   */
  function toggleAutoContinue() {
    setAutoContinue((prev) => !prev);
    if (autoContinueTimeoutRef.current) {
      clearTimeout(autoContinueTimeoutRef.current);
      autoContinueTimeoutRef.current = null;
    }
  }

  const handleSendDirection = async (command: string) => {
    // Enable audio on first user interaction (required for browser autoplay policy)
    if (!audioEnabled) {
      console.log('[Audio] Enabling audio via user interaction');
      setAudioEnabled(true);
      // Create a silent audio context to unlock audio
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
        console.log('[Audio] Audio context unlocked');
      } catch (e) {
        console.warn('[Audio] Could not unlock audio context:', e);
      }
    }

    // Check if user wants to stop
    const shouldStop = command.toLowerCase().includes('stop') || 
                       command.toLowerCase().includes('end') ||
                       command.toLowerCase().includes('pause');
    
    if (shouldStop) {
      setAutoContinue(false);
      stopPlayback();
      return;
    }

    // Clear any pending auto-continue - user command takes priority
    if (autoContinueTimeoutRef.current) {
      clearTimeout(autoContinueTimeoutRef.current);
      autoContinueTimeoutRef.current = null;
    }

    // Immediately abort playback and pause audio
    playbackAbortRef.current.aborted = true;
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/scene/turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sceneState,
          userCommand: command,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Frontend] API error:', response.status, errorText);
        throw new Error(`Failed to process turn: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[Frontend] Received response:', {
        newLinesCount: data.newLines?.length || 0,
        linesWithAudio: data.newLines?.filter((l: Line) => l.audioUrl).length || 0,
        totalSceneLines: data.sceneState?.lines?.length || 0,
      });
      setSceneState(data.sceneState);
      sceneStateRef.current = data.sceneState; // Update ref with latest state

      // Always reset abort flag when we get a response - user command was processed
      playbackAbortRef.current.aborted = false;

      // Play new lines sequentially if they have audio
      if (data.newLines && data.newLines.length > 0) {
        const linesWithAudio = data.newLines.filter((line: Line) => line.audioUrl);
        const linesWithoutAudio = data.newLines.filter((line: Line) => !line.audioUrl);
        
        if (linesWithoutAudio.length > 0) {
          console.warn(`${linesWithoutAudio.length} line(s) missing audio - may need ELEVENLABS_API_KEY`);
        }
        
        console.log(`[Frontend] Lines with audio: ${linesWithAudio.length}, Total lines: ${data.newLines.length}`);
        
        // Debug: Log audio URLs
        linesWithAudio.forEach((line: Line, idx: number) => {
          if (line.audioUrl) {
            console.log(`[Frontend] Line ${idx + 1} audio URL: ${line.audioUrl.substring(0, 50)}... (length: ${line.audioUrl.length})`);
          } else {
            console.warn(`[Frontend] Line ${idx + 1} has NO audio URL`);
          }
        });
        
        if (linesWithAudio.length > 0) {
          console.log(`[Frontend] Starting audio playback for ${linesWithAudio.length} lines`);
          // Add a small delay to ensure audio context is ready (browser autoplay policy)
          setTimeout(() => {
            playLinesSequentially(linesWithAudio);
          }, 100);
        } else if (data.newLines.length > 0) {
          // All lines missing audio - still continue if auto-continue is on
          if (autoContinue && !playbackAbortRef.current.aborted) {
            setTimeout(() => {
              if (autoContinue && !playbackAbortRef.current.aborted && !isLoadingRef.current) {
                console.log('[Auto-continue] Triggering next turn (no audio)...');
                handleSendDirection('Continue the conversation naturally. Have the actors respond to each other and keep the dialogue going.');
              }
            }, 2000);
          }
          console.warn('No audio available for new lines. Check ELEVENLABS_API_KEY configuration.');
        }
      }
    } catch (error) {
      console.error('Error sending direction:', error);
      alert('Failed to send direction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get currently speaking actor ID
  const currentlySpeakingActorId = sceneState?.lines.find(
    (line) => line.id === currentlyPlayingLineId
  )?.actorId || null;

  // Get status text
  const getStatusText = () => {
    if (isLoading) {
      return 'Director is thinking…';
    }
    if (isPlaying) {
      return 'Actors performing…';
    }
    return '';
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">ManchAI</h1>
            <p className="text-sm text-gray-400">Real-time Scriptwriting + Multi-voice Improv Studio</p>
          </div>
          {getStatusText() && (
            <div className="text-sm text-blue-400 font-medium">
              {getStatusText()}
            </div>
          )}
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Direction Panel */}
        <div className="w-80 flex-shrink-0">
          <DirectionPanel
            onSendDirection={handleSendDirection}
            onStop={stopPlayback}
            onToggleAutoContinue={toggleAutoContinue}
            isLoading={isLoading}
            isPlaying={isPlaying}
            autoContinue={autoContinue}
          />
        </div>

        {/* Script Panel */}
        <div className="flex-1 min-w-0">
          <ScriptPanel
            lines={sceneState?.lines || []}
            actors={sceneState?.actors || []}
            currentlyPlayingLineId={currentlyPlayingLineId}
          />
        </div>

        {/* Cast Panel */}
        <div className="w-80 flex-shrink-0">
          <CastPanel
            actors={sceneState?.actors || []}
            currentlySpeakingActorId={currentlySpeakingActorId}
          />
        </div>
      </div>
    </div>
  );
}

