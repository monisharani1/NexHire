import React, { useEffect, useRef } from 'react';
import { Cpu, User } from 'lucide-react';

interface Message {
  role: string;
  text: string;
}

interface TranscriptPanelProps {
  transcript: Message[];
  currentResponse: string;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  transcript,
  currentResponse,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript, currentResponse]);

  return (
    <div className="flex flex-col h-full bg-slate-900/60 dark:bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-700/30 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/30 bg-slate-800/20 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Live Dialogue Transcript
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] text-green-400 font-bold uppercase">Streaming</span>
        </span>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[300px] min-h-[180px] scroll-smooth"
      >
        {transcript.map((msg, i) => {
          const isAi = msg.role.startsWith('ai');
          return (
            <div
              key={i}
              className={`flex gap-3 max-w-[85%] ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              <div
                className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center border ${
                  isAi
                    ? 'bg-palette-5/10 border-palette-5/30 text-palette-5'
                    : 'bg-palette-4/10 border-palette-4/30 text-palette-4'
                }`}
              >
                {isAi ? <Cpu className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed font-medium ${
                  isAi
                    ? 'bg-slate-800/80 text-slate-100 rounded-tl-none border border-slate-700/20'
                    : 'bg-palette-4 text-white rounded-tr-none'
                }`}
              >
                <p className="font-bold text-[9px] uppercase tracking-wider mb-1 opacity-60">
                  {isAi ? 'AI Interviewer (Vance)' : 'You'}
                </p>
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          );
        })}

        {currentResponse && (
          <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse animate-pulse">
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center border bg-palette-4/10 border-palette-4/30 text-palette-4">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 rounded-2xl text-xs leading-relaxed font-medium bg-palette-4/85 text-white rounded-tr-none">
              <p className="font-bold text-[9px] uppercase tracking-wider mb-1 opacity-60">
                You (Speaking...)
              </p>
              <p>{currentResponse}</p>
            </div>
          </div>
        )}

        {transcript.length === 0 && !currentResponse && (
          <div className="h-full flex items-center justify-center text-center p-6">
            <p className="text-xs text-slate-500 font-semibold italic">
              Interview conversation transcript will stream here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
