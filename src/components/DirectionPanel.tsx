import { useState } from 'react';

interface DirectionPanelProps {
  onSendDirection: (command: string) => void;
  onStop: () => void;
  onToggleAutoContinue: () => void;
  isLoading: boolean;
  isPlaying: boolean;
  autoContinue: boolean;
}

const QUICK_PROMPTS = [
  'Start new scene',
  'Make it horror',
  'Add conflict',
  'Make it dramatic',
  'Add humor',
];

export default function DirectionPanel({
  onSendDirection,
  onStop,
  onToggleAutoContinue,
  isLoading,
  isPlaying,
  autoContinue,
}: DirectionPanelProps) {
  const [command, setCommand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !isLoading) {
      onSendDirection(command.trim());
      setCommand('');
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (!isLoading) {
      onSendDirection(prompt);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-2">Direction</h2>
        <p className="text-sm text-gray-400">Guide the scene with your commands</p>
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter your direction..."
            className="flex-1 w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
            disabled={isLoading}
          />
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={isLoading || !command.trim()}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send Direction'}
            </button>
            {(isPlaying || isLoading) && (
              <button
                type="button"
                onClick={onStop}
                className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Stop
              </button>
            )}
          </div>
        </form>

        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-gray-400">Quick Prompts:</p>
            <button
              onClick={onToggleAutoContinue}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                autoContinue
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {autoContinue ? 'Auto: ON' : 'Auto: OFF'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isLoading}
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
          {autoContinue && (
            <p className="text-xs text-green-400 mt-2">
              Conversation will continue automatically. Type "stop" to pause.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

