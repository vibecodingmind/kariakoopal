'use client';

import { useState, useEffect, useCallback } from 'react';
import { t, type Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ── Interfaces ──

interface MarketStory {
  id: string;
  guideName: string;
  vendorName: string;
  zoneName: string;
  audioUrl?: string;
  text: string;
  textSw: string;
  tags: string[];
  createdAt: string;
}

interface MarketStoriesProps {
  stories: MarketStory[];
  language?: Language;
  onPlayAudio?: (storyId: string) => void;
  onAddStory?: () => void;
  className?: string;
}

// ── Time Ago Helper ──

function timeAgo(dateStr: string, lang: Language): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 60) return `${diffMin} ${t('stories_minutes_ago', lang)} ${t('stories_ago', lang)}`;
  if (diffHrs < 24) return `${diffHrs} ${t('stories_hours_ago', lang)} ${t('stories_ago', lang)}`;
  return `${diffDays} ${t('stories_days_ago', lang)} ${t('stories_ago', lang)}`;
}

// ── Animated Waveform Bars ──

function WaveformBars({ playing, color = 'text-amber-500' }: { playing: boolean; color?: string }) {
  const bars = 5;
  return (
    <div className="flex items-center gap-[3px] h-5">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-[3px] rounded-full bg-current transition-all',
            color,
            playing ? 'animate-pulse' : 'opacity-40'
          )}
          style={{
            height: playing ? `${10 + Math.random() * 14}px` : '6px',
            animationDelay: playing ? `${i * 0.15}s` : undefined,
            animationDuration: playing ? `${0.4 + Math.random() * 0.4}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}

// ── Story Card ──

function StoryCard({
  story,
  language,
  playingId,
  onPlay,
}: {
  story: MarketStory;
  language: Language;
  playingId: string | null;
  onPlay: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPlaying = playingId === story.id;
  const displayText = language === 'sw' ? story.textSw : story.text;
  const isLong = displayText.length > 160;

  return (
    <div className="glass-card gradient-border p-4 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Guide Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {story.guideName.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">{story.guideName}</span>
            <span className="text-muted-foreground text-xs">{t('stories_by_guide', language)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="glass text-xs px-2 py-0.5 rounded-full text-amber-600 dark:text-amber-400 font-medium">
              {story.vendorName}
            </span>
            <span className="glass text-xs px-2 py-0.5 rounded-full text-foreground/70">
              {story.zoneName}
            </span>
          </div>
        </div>

        {/* Audio Button */}
        {story.audioUrl && (
          <button
            onClick={() => onPlay(story.id)}
            className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-amber-500/20 transition-all flex-shrink-0"
            title={isPlaying ? t('stories_pause_audio', language) : t('stories_play_audio', language)}
          >
            {isPlaying ? (
              <WaveformBars playing />
            ) : (
              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Story Text */}
      <div className="relative">
        <p
          className={cn(
            'text-sm text-foreground/80 leading-relaxed',
            !expanded && isLong && 'max-h-20 overflow-hidden'
          )}
        >
          {displayText}
        </p>
        {!expanded && isLong && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--glass)] to-transparent pointer-events-none" />
        )}
      </div>

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-amber-500 text-xs font-medium mt-1 hover:underline"
        >
          {expanded ? t('stories_read_less', language) : t('stories_read_more', language)}
        </button>
      )}

      {/* Tags */}
      {story.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {story.tags.map((tag) => (
            <span
              key={tag}
              className="glass text-[11px] px-2.5 py-0.5 rounded-full text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <p className="text-[11px] text-muted-foreground mt-2">{timeAgo(story.createdAt, language)}</p>
    </div>
  );
}

// ── Main Component ──

export default function MarketStories({
  stories,
  language = 'sw',
  onPlayAudio,
  onAddStory,
  className,
}: MarketStoriesProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Stop playing after 10s mock
  useEffect(() => {
    if (!playingId) return;
    const timer = setTimeout(() => setPlayingId(null), 10000);
    return () => clearTimeout(timer);
  }, [playingId]);

  const handlePlay = useCallback(
    (id: string) => {
      if (playingId === id) {
        setPlayingId(null);
      } else {
        setPlayingId(id);
        onPlayAudio?.(id);
      }
    },
    [playingId, onPlayAudio]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold gradient-text">{t('stories_title', language)}</h2>
        {onAddStory && (
          <button onClick={onAddStory} className="glass-button text-sm px-4 py-2">
            {t('stories_share', language)}
          </button>
        )}
      </div>

      {/* Story List */}
      {stories.length === 0 ? (
        <div className="glass-card gradient-border p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full glass flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">{t('stories_no_stories', language)}</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-3 pr-1" style={{ scrollbarWidth: 'thin' }}>
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              language={language}
              playingId={playingId}
              onPlay={handlePlay}
            />
          ))}
        </div>
      )}
    </div>
  );
}
