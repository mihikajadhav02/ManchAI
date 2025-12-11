import { Actor } from '@/types/scene';

interface CastPanelProps {
  actors: Actor[];
  currentlySpeakingActorId: string | null;
}

export default function CastPanel({
  actors,
  currentlySpeakingActorId,
}: CastPanelProps) {
  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-white">Cast</h2>
        <p className="text-sm text-gray-400">{actors.length} actors</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {actors.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No actors yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {actors.map((actor) => {
              const isCurrentlySpeaking = currentlySpeakingActorId === actor.id;

              return (
                <div
                  key={actor.id}
                  className={`p-4 rounded-lg transition-all ${
                    isCurrentlySpeaking
                      ? 'bg-blue-900 border-2 border-blue-500'
                      : 'bg-gray-800 border border-gray-700'
                  }`}
                >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{actor.name}</h3>
                  <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded">
                    {actor.role}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Language:</span>
                    <span className="text-gray-300">{actor.language.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Voice:</span>
                    <span className="text-gray-300">{actor.voiceId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Style:</span>
                    <span className="text-gray-300">{actor.style}</span>
                  </div>
                </div>
                  {/* TODO: Add voice controls here */}
                  {/* TODO: Add volume slider */}
                  {/* TODO: Add mute/unmute toggle */}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

