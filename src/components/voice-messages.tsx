'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Send,
  Trash2,
  AudioWaveform,
  FileText,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface VoiceRecording {
  id: string;
  duration: number; // seconds
  transcription: string;
  timestamp: number;
  isPlaying?: boolean;
}

interface VoiceMessagesProps {
  onSendVoice: (recording: VoiceRecording) => void;
  onRecordStart: () => void;
  onRecordStop: () => void;
  isRecording: boolean;
  recordings: VoiceRecording[];
  language?: 'sw' | 'en';
  className?: string;
}

// ── Helpers ──

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

let recordingIdCounter = 0;

// ── Component ──

export function VoiceMessages({
  onSendVoice,
  onRecordStart,
  onRecordStop,
  isRecording,
  recordings,
  language: languageProp,
  className,
}: VoiceMessagesProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer for recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleStop = useCallback(() => {
    onRecordStop();
    const recording: VoiceRecording = {
      id: `voice-${Date.now()}-${++recordingIdCounter}`,
      duration: recordingDuration,
      transcription: lang === 'sw' ? 'Nakala ya sauti...' : 'Voice transcription...',
      timestamp: Date.now(),
    };
    setRecordingDuration(0);
    return recording;
  }, [onRecordStop, recordingDuration, lang]);

  const handleSend = useCallback(
    (recording: VoiceRecording) => {
      onSendVoice(recording);
    },
    [onSendVoice]
  );

  const togglePlayback = useCallback((id: string) => {
    setPlayingId((prev) => (prev === id ? null : id));
  }, []);

  // Simulated waveform bars
  const generateWaveform = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      height: 15 + Math.sin(i * 0.5) * 30 + Math.random() * 20,
    }));
  };

  return (
    <div className={cn('glass-card gradient-border p-5 space-y-5', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'size-9 rounded-xl flex items-center justify-center shadow-lg',
              isRecording
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20'
                : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20'
            )}
          >
            <Mic className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {t('voice_title', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {isRecording
                ? t('voice_recording', lang)
                : t('voice_tap_record', lang)}
            </p>
          </div>
        </div>

        {isRecording && (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-0 text-[11px] px-2.5 py-0.5">
            <span className="relative flex size-2 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-red-500" />
            </span>
            {t('voice_recording', lang)}
          </Badge>
        )}
      </div>

      {/* ── Recording interface ── */}
      <div className="glass rounded-xl p-4 space-y-4">
        {isRecording ? (
          <>
            {/* Waveform visualization */}
            <div className="flex items-center justify-center gap-0.5 h-16">
              {generateWaveform(24).map((bar, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1.5 rounded-full transition-all duration-200',
                    i % 2 === 0 ? 'bg-red-500' : 'bg-red-400'
                  )}
                  style={{
                    height: `${bar.height}%`,
                    animationDelay: `${i * 0.05}s`,
                    animation: 'gentle-pulse 0.8s ease-in-out infinite',
                  }}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center">
              <p className="text-3xl font-mono font-bold text-red-600 dark:text-red-400 tabular-nums">
                {formatDuration(recordingDuration)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {t('voice_duration', lang)}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="destructive"
                size="sm"
                className="h-10 px-5 text-xs font-semibold"
                onClick={() => {
                  setRecordingDuration(0);
                  onRecordStop();
                }}
              >
                <Trash2 className="size-4 mr-1.5" />
                {t('voice_cancel', lang)}
              </Button>
              <button
                className="size-14 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg shadow-red-500/30"
                onClick={() => {
                  const recording = handleStop();
                  handleSend(recording);
                }}
              >
                <Square className="size-5 text-white" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Idle state */}
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t('voice_tap_record', lang)}
                </p>
              </div>

              <button
                className="size-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-105"
                onClick={onRecordStart}
              >
                <Mic className="size-7 text-white" />
              </button>

              <p className="text-[11px] text-muted-foreground">
                {t('voice_record', lang)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Recordings list ── */}
      {recordings.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <AudioWaveform className="size-3 text-amber-500" />
            {recordings.length} {lang === 'sw' ? 'ujumbe wa sauti' : 'voice messages'}
          </p>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {recordings.map((recording) => {
              const isPlaying = playingId === recording.id;

              return (
                <div
                  key={recording.id}
                  className="glass rounded-xl p-3 space-y-2"
                >
                  {/* Waveform + controls */}
                  <div className="flex items-center gap-3">
                    <button
                      className="size-8 rounded-full bg-amber-500/20 flex items-center justify-center hover:bg-amber-500/30 transition-colors shrink-0"
                      onClick={() => togglePlayback(recording.id)}
                    >
                      {isPlaying ? (
                        <Pause className="size-3.5 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Play className="size-3.5 text-amber-600 dark:text-amber-400 ml-0.5" />
                      )}
                    </button>

                    {/* Mini waveform */}
                    <div className="flex-1 flex items-center gap-px h-6">
                      {generateWaveform(32).map((bar, i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex-1 rounded-full transition-all duration-200',
                            isPlaying ? 'bg-amber-500' : 'bg-muted-foreground/20'
                          )}
                          style={{ height: `${bar.height}%` }}
                        />
                      ))}
                    </div>

                    {/* Duration */}
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {formatDuration(recording.duration)}
                    </span>

                    {/* Send button */}
                    <Button
                      size="sm"
                      className="size-8 p-0 glass-button rounded-full"
                      onClick={() => handleSend(recording)}
                    >
                      <Send className="size-3.5" />
                    </Button>
                  </div>

                  {/* Transcription */}
                  <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <FileText className="size-3 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        {t('voice_transcription', lang)}
                      </p>
                      <p className="leading-relaxed">{recording.transcription}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Language note ── */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
        <AlertCircle className="size-3.5 text-amber-500 shrink-0" />
        <span>
          {t('voice_language', lang)}: {lang === 'sw' ? 'Kiswahili / Kiingereza' : 'Swahili / English'}
        </span>
      </div>
    </div>
  );
}
