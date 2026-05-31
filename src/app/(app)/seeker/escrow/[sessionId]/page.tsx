'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, CheckCircle, Clock, MapPin, Unlock, Lock,
  ArrowRight, DollarSign, AlertTriangle, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useParams } from 'next/navigation';

interface MilestoneData {
  id: string;
  milestoneType: string;
  label: string;
  percentage: number;
  amount: number;
  status: string;
  verifiedBy: string;
  lat: number | null;
  lng: number | null;
  gpsRadius: number;
  verifiedAt: string | null;
  releasedAt: string | null;
}

interface EscrowData {
  milestones: MilestoneData[];
  totalAmount: number;
  totalReleased: number;
  totalVerified: number;
  progressPercent: number;
}

const MILESTONE_ICONS: Record<string, typeof CheckCircle> = {
  meetup: MapPin,
  midpoint: CheckCircle,
  completion: Shield,
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof CheckCircle; label: string; labelSw: string }> = {
  pending: { color: 'text-gray-500', bg: 'bg-gray-100', icon: Clock, label: 'Pending', labelSw: 'Inasubiri' },
  verified: { color: 'text-amber-600', bg: 'bg-amber-100', icon: CheckCircle, label: 'Verified', labelSw: 'Imethibitishwa' },
  released: { color: 'text-green-600', bg: 'bg-green-100', icon: Unlock, label: 'Released', labelSw: 'Imefunguliwa' },
  skipped: { color: 'text-gray-400', bg: 'bg-gray-100', icon: AlertTriangle, label: 'Skipped', labelSw: 'Imerukwa' },
};

export default function SeekerEscrowPage() {
  const { user, language } = useAuthStore();
  const sw = language === 'sw';
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [data, setData] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/escrow-milestones?sessionId=${sessionId}`);
      if (res.ok) {
        const result = await res.json();
        if (result.milestones && result.milestones.length === 0) {
          // Auto-create milestones
          const createRes = await fetch('/api/escrow-milestones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          if (createRes.ok) {
            const created = await createRes.json();
            setData(created);
          }
        } else {
          setData(result);
        }
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (milestoneId: string, action: 'verify' | 'release') => {
    if (!user?.id) return;
    setActionLoading(milestoneId);

    // Get GPS position for verification
    let lat: number | undefined;
    let lng: number | undefined;
    if (action === 'verify') {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // GPS not available, continue without
      }
    }

    try {
      const res = await fetch('/api/escrow-milestones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          action,
          userId: user.id,
          userRole: 'seeker',
          lat,
          lng,
        }),
      });

      if (res.ok) {
        fetchData();
      } else {
        const result = await res.json();
        alert(result.error || 'Action failed');
      }
    } catch {
      // Silent
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#065F46] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 text-center max-w-sm w-full shadow-sm">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-gray-600">{sw ? 'Hakuna data ya escrow' : 'No escrow data found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#065F46] text-white p-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          {sw ? 'Escrow Salama' : 'Smart Escrow'}
        </h1>
        <p className="text-[#34D399] text-sm mt-1">
          {sw ? 'Kipindi' : 'Session'}: {sessionId.slice(-8)}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress Overview */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">{sw ? 'Jumla' : 'Total Amount'}</p>
              <p className="text-2xl font-bold text-[#065F46]">
                TZS {data.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{sw ? 'Imefunguliwa' : 'Released'}</p>
              <p className="text-lg font-bold text-green-600">
                TZS {data.totalReleased.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-[#065F46] rounded-full transition-all duration-500"
              style={{ width: `${data.progressPercent}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${((data.totalVerified) / data.totalAmount) * 100}%`, opacity: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">
              {data.progressPercent}% {sw ? 'imefunguliwa' : 'released'}
            </span>
            <span className="text-xs text-gray-400">
              TZS {(data.totalAmount - data.totalReleased - data.totalVerified).toLocaleString()} {sw ? 'inashikiliwa' : 'held'}
            </span>
          </div>
        </div>

        {/* Milestone Timeline */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-[#065F46] mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {sw ? 'Hatua za Malipo' : 'Payment Milestones'}
          </h3>

          <div className="space-y-0">
            {data.milestones.map((milestone, idx) => {
              const statusCfg = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              const MilestoneIcon = MILESTONE_ICONS[milestone.milestoneType] || Shield;
              const isLast = idx === data.milestones.length - 1;

              return (
                <div key={milestone.id} className="flex gap-3">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      milestone.status === 'released'
                        ? 'bg-green-100'
                        : milestone.status === 'verified'
                        ? 'bg-amber-100'
                        : 'bg-gray-100'
                    }`}>
                      {milestone.status === 'released' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : milestone.status === 'verified' ? (
                        <Unlock className="w-5 h-5 text-amber-600" />
                      ) : (
                        <MilestoneIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 min-h-8 ${
                        milestone.status === 'released' ? 'bg-green-300' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-4 ${isLast ? 'pb-0' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{milestone.label}</p>
                        <p className="text-sm text-gray-500">
                          TZS {milestone.amount.toLocaleString()} ({milestone.percentage}%)
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                        {sw ? statusCfg.labelSw : statusCfg.label}
                      </span>
                    </div>

                    {/* GPS verification indicator */}
                    {milestone.milestoneType === 'meetup' && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        {milestone.status === 'released' || milestone.status === 'verified'
                          ? sw ? 'Eneo limethibitishwa' : 'Location verified'
                          : sw ? 'Uthibitisho wa GPS unahitajika' : 'GPS verification required'}
                      </div>
                    )}

                    {/* Verification info */}
                    {milestone.verifiedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {sw ? 'Imethibitishwa' : 'Verified'}: {new Date(milestone.verifiedAt).toLocaleString(sw ? 'sw-TZ' : 'en-US')}
                        {milestone.verifiedBy && ` (${milestone.verifiedBy})`}
                      </p>
                    )}

                    {/* Action buttons */}
                    {milestone.status === 'pending' && (
                      <button
                        onClick={() => handleAction(milestone.id, 'verify')}
                        disabled={actionLoading === milestone.id}
                        className="mt-2 bg-[#065F46] text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                      >
                        {actionLoading === milestone.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            {sw ? 'Thibitisha' : 'Verify'}
                          </>
                        )}
                      </button>
                    )}
                    {milestone.status === 'verified' && (
                      <button
                        onClick={() => handleAction(milestone.id, 'release')}
                        disabled={actionLoading === milestone.id}
                        className="mt-2 bg-[#F59E0B] text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                      >
                        {actionLoading === milestone.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Unlock className="w-4 h-4" />
                            {sw ? 'Fungua Malipo' : 'Release Payment'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* How Escrow Works */}
        <div className="bg-[#065F46]/5 rounded-2xl p-4 border border-[#065F46]/10">
          <h3 className="font-bold text-[#065F46] mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {sw ? 'Escrow Inavyofanya Kazi' : 'How Escrow Works'}
          </h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <span className="bg-[#065F46] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">1</span>
              {sw ? 'Thibitisha mkutano (30% inafunguliwa)' : 'Confirm meetup (30% released)'}
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <span className="bg-[#065F46] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">2</span>
              {sw ? 'Ukaguzi wa kati (40% inafunguliwa)' : 'Midpoint check (40% released)'}
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <span className="bg-[#065F46] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">3</span>
              {sw ? 'Kipindi kinakamilika (30% ya mwisho)' : 'Session completes (final 30%)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
