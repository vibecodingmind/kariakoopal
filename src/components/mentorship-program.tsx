'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  GraduationCap,
  Star,
  Users,
  CheckCircle2,
  Lock,
  Award,
  TrendingUp,
  ArrowRight,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

// ── Types ──

interface AvailableMentor {
  id: string;
  name: string;
  rating: number;
  specialties: string[];
  totalSessions: number;
  menteesCount: number;
}

interface MentorshipProgramProps {
  mentorId?: string;
  mentorName?: string;
  mentorRating?: number;
  menteeSessionsCompleted: number;
  menteeSessionsRequired: number;
  isEligible: boolean;
  isMentee: boolean;
  availableMentors: AvailableMentor[];
  onRequestMentor: (mentorId: string) => void;
  language?: 'sw' | 'en';
  className?: string;
}

// ── Helpers ──

function formatTZS(n: number): string {
  return n.toLocaleString('en-TZ');
}

// ── Component ──

export function MentorshipProgram({
  mentorId,
  mentorName,
  mentorRating,
  menteeSessionsCompleted,
  menteeSessionsRequired,
  isEligible,
  isMentee,
  availableMentors,
  onRequestMentor,
  language: languageProp,
  className,
}: MentorshipProgramProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const progressPercent = useMemo(
    () =>
      Math.min(100, Math.round((menteeSessionsCompleted / menteeSessionsRequired) * 100)),
    [menteeSessionsCompleted, menteeSessionsRequired]
  );

  const handleRequestMentor = useCallback(
    (mentorId: string) => {
      setRequestedIds((prev) => new Set(prev).add(mentorId));
      onRequestMentor(mentorId);
    },
    [onRequestMentor]
  );

  return (
    <div className={cn('glass-card gradient-border p-5 space-y-5', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <GraduationCap className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {t('mentorship_title', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('mentorship_progress', lang)}
            </p>
          </div>
        </div>
        <Badge
          className={cn(
            'text-[11px] font-medium px-2.5 py-0.5 border-0',
            isEligible
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          )}
        >
          {isEligible ? (
            <>
              <CheckCircle2 className="size-3 mr-0.5" />
              {t('mentorship_eligible', lang)}
            </>
          ) : (
            <>
              <Lock className="size-3 mr-0.5" />
              {t('mentorship_not_eligible', lang)}
            </>
          )}
        </Badge>
      </div>

      {/* ── Progress bar ── */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {t('mentorship_sessions', lang)}
          </span>
          <span className="font-semibold">
            {menteeSessionsCompleted} {t('mentorship_of', lang)} {menteeSessionsRequired}
          </span>
        </div>
        <Progress
          value={progressPercent}
          className="h-2.5"
        />
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">
            {menteeSessionsCompleted} {t('mentorship_completed', lang)}
          </span>
          <span
            className={cn(
              'font-semibold',
              progressPercent >= 100
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            )}
          >
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* ── My mentor card ── */}
      {isMentee && mentorName && (
        <div className="glass rounded-xl p-4 space-y-3 border border-amber-200 dark:border-amber-800">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <GraduationCap className="size-3 text-amber-500" />
            {t('mentorship_my_mentor', lang)}
          </p>
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <GraduationCap className="size-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{mentorName}</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {mentorRating && (
                  <span className="flex items-center gap-0.5">
                    <Star className="size-3 text-amber-500" />
                    {mentorRating.toFixed(1)}
                  </span>
                )}
                <span className="flex items-center gap-0.5">
                  <Award className="size-3 text-amber-500" />
                  {t('mentorship_bonus', lang)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Eligibility requirements ── */}
      {!isEligible && (
        <div className="glass rounded-xl p-4 space-y-2.5">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Lock className="size-3 text-amber-500" />
            {t('mentorship_eligibility', lang)}
          </p>
          <div className="space-y-2">
            {/* Rating requirement */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t('mentorship_rating_req', lang)}
              </span>
              <Lock className="size-3.5 text-muted-foreground/40" />
            </div>
            {/* Sessions requirement */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t('mentorship_sessions_req', lang)}
              </span>
              {menteeSessionsCompleted >= menteeSessionsRequired ? (
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              ) : (
                <Lock className="size-3.5 text-muted-foreground/40" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Bonus info ── */}
      <div className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-800">
        <div className="size-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <TrendingUp className="size-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {t('mentorship_bonus', lang)}
          </p>
          <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70">
            {t('mentorship_bonus_desc', lang)}
          </p>
        </div>
      </div>

      {/* ── Available mentors ── */}
      {isEligible && availableMentors.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Users className="size-3 text-amber-500" />
            {t('mentorship_available_mentors', lang)}
          </p>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {availableMentors.map((mentor) => {
              const isRequested = requestedIds.has(mentor.id);

              return (
                <div
                  key={mentor.id}
                  className="glass rounded-xl p-3 flex items-center gap-3"
                >
                  {/* Avatar */}
                  <div className="size-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {mentor.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{mentor.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Star className="size-3 text-amber-500" />
                        {mentor.rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <CheckCircle2 className="size-3 text-emerald-500" />
                        {mentor.totalSessions} {t('insights_sessions', lang)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Users className="size-3 text-blue-500" />
                        {mentor.menteesCount} {t('mentorship_mentees', lang)}
                      </span>
                    </div>
                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mentor.specialties.slice(0, 3).map((spec, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                        >
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Request button */}
                  {isRequested ? (
                    <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-0 text-[10px] px-2.5 py-0.5 shrink-0">
                      <CheckCircle2 className="size-3 mr-0.5" />
                      {lang === 'sw' ? 'Umeomba' : 'Requested'}
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8 text-[11px] font-semibold glass-button px-3 shrink-0"
                      onClick={() => handleRequestMentor(mentor.id)}
                    >
                      {t('mentorship_request', lang)}
                      <ArrowRight className="size-3 ml-1" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
