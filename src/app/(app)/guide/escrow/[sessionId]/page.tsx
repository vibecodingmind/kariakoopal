'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, CheckCircle, Clock, MapPin, Unlock, Lock,
  DollarSign, AlertTriangle, RefreshCw, HandCoins
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

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; labelSw: string }> = {
  pending: { color: 'text-gray-500', bg: 'bg-gray-100', label: 'Pending', labelSw: 'Inasubiri' },
  verified: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Verified', labelSw: 'Imethibitishwa' },
  released: { color: 'text-green-600', bg: 'bg-green-100', label: 'Released', labelSw: 'Imefunguliwa' },
  skipped: { color: 'text-gray-400', bg: 'bg-gray-100', label: 'Skipped', labelSw: 'Imerukwa' },
};

const MILESTONE_ICONS: Record<string, typeof CheckCircle> = {
  meetup: MapPin,
  midpoint: CheckCircle,
  completion: Shield,
};

export default function GuideEscrowPage() {
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

  const handleVerify = async (milestoneId: string) => {
    if (!user?.id) return;
    setActionLoading(milestoneId);

    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // GPS not available
    }

    try {
      const res = await fetch('/api/escrow-milestones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          action: 'verify',
          userId: user.id,
          userRole: 'guide',
          lat,
          lng,
        }),
      });

      if (res.ok) {
        fetchData();
      } else {
        const result = await res.json();
        alert(result.error || 'Verification failed');
      }
    } catch {
      // Silent
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestRelease = async (milestoneId: string) => {
    if (!user?.id) return;
    setActionLoading(milestoneId);

    try {
      const res = await fetch('/api/escrow-milestones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          action: 'release',
          userId: user.id,
        }),
      });

      if (res.ok) {
        fetchData();
      } else {
        const result = await res.json();
        alert(result.error || 'Release failed');
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
          <HandCoins className="w-6 h-6" />
          {sw ? 'Escrow Yangu' : 'My Escrow'}
        </h1>
        <p className="text-[#34D399] text-sm mt-1">
          {sw ? 'Kipindi' : 'Session'}: {sessionId.slice(-8)}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Earnings Overview */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">{sw ? 'Jumla ya Kipindi' : 'Session Total'}</p>
              <p className="text-2xl font-bold text-[#065F46]">
                TZS {data.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{sw ? 'Ulipwako' : 'You Received'}</p>
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
          </div>
          <p className="text-xs text-gray-400 mt-1 text-center">
            {data.progressPercent}% {sw ? 'imepokelewa' : 'received'}
          </p>
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
              const MilestoneIcon = MILESTONE_ICONS[milestone.milestoneType] || Shield;
              const isLast = idx === data.milestones.length - 1;

              return (
                <div key={milestone.id} className="flex gap-3">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      milestone.status === 'released' ? 'bg-green-100' :
                      milestone.status === 'verified' ? 'bg-amber-100' : 'bg-gray-100'
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

                    {milestone.verifiedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {sw ? 'Imethibitishwa' : 'Verified'}: {new Date(milestone.verifiedAt).toLocaleString(sw ? 'sw-TZ' : 'en-US')}
                      </p>
                    )}

                    {milestone.releasedAt && (
                      <p className="text-xs text-green-500 mt-1">
                        {sw ? 'Imelipwa' : 'Paid'}: {new Date(milestone.releasedAt).toLocaleString(sw ? 'sw-TZ' : 'en-US')}
                      </p>
                    )}

                    {/* Guide actions */}
                    {milestone.status === 'pending' && (
                      <button
                        onClick={() => handleVerify(milestone.id)}
                        disabled={actionLoading === milestone.id}
                        className="mt-2 bg-[#065F46] text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                      >
                        {actionLoading === milestone.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            {sw ? 'Thibitisha Mkutano' : 'Confirm Meetup'}
                          </>
                        )}
                      </button>
                    )}
                    {milestone.status === 'verified' && (
                      <button
                        onClick={() => handleRequestRelease(milestone.id)}
                        disabled={actionLoading === milestone.id}
                        className="mt-2 bg-[#F59E0B] text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                      >
                        {actionLoading === milestone.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <HandCoins className="w-4 h-4" />
                            {sw ? 'Omba Malipo' : 'Request Release'}
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

        {/* Info */}
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <h3 className="font-bold text-amber-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {sw ? 'Taarifa' : 'Note'}
          </h3>
          <p className="text-sm text-amber-600">
            {sw
              ? 'Malipo yanafunguliwa kwa hatua. Thibitisha mkutano kuanza, kisha omba kufunguliwa kwa kila hatua.'
              : 'Payments are released in milestones. Confirm meetup to start, then request release at each milestone.'}
          </p>
        </div>
      </div>
    </div>
  );
}
