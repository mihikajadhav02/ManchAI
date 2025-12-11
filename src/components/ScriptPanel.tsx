import { useEffect, useRef } from 'react';
import { Line, Actor } from '@/types/scene';

interface ScriptPanelProps {
  lines: Line[];
  actors: Actor[];
  currentlyPlayingLineId: string | null;
}

export default function ScriptPanel({
  lines,
  actors,
  currentlyPlayingLineId,
}: ScriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new lines arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const getActorById = (actorId: string): Actor | undefined => {
    return actors.find((a) => a.id === actorId);
  };

  const linesByBeat = lines.reduce((acc, line) => {
    if (!acc[line.beatIndex]) {
      acc[line.beatIndex] = [];
    }
    acc[line.beatIndex].push(line);
    return acc;
  }, {} as Record<number, Line[]>);

  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-white">Script</h2>
        <p className="text-sm text-gray-400">{lines.length} lines</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {Object.keys(linesByBeat).length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No dialogue yet. Send a direction to start!</p>
          </div>
        ) : (
          Object.entries(linesByBeat)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([beatIndex, beatLines]) => (
              <div key={beatIndex} className="mb-6">
                <div className="text-xs text-gray-500 mb-2">Beat {beatIndex}</div>
                {beatLines.map((line) => {
                  const actor = getActorById(line.actorId);
                  const isCurrentlyPlaying = currentlyPlayingLineId === line.id;

                  return (
                    <div
                      key={line.id}
                      className={`mb-3 p-3 rounded-lg transition-all ${
                        isCurrentlyPlaying
                          ? 'bg-blue-900 border-2 border-blue-500'
                          : 'bg-gray-800 border border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">
                          {actor?.name || 'Unknown'}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
                          {actor?.language.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-200">{line.text}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(line.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
        )}
      </div>
    </div>
  );
}

