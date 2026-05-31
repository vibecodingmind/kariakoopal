'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, MapPin, X, ChevronUp, Heart, ShieldAlert, Wallet, Eye, Navigation } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';

interface SOSButtonProps {
  sessionId?: string;
  onSOSCreated?: (event: Record<string, unknown>) => void;
}

const SOS_TYPES = [
  { type: 'panic', label: 'Panic', labelSw: 'Panic', icon: ShieldAlert, color: '#EF4444' },
  { type: 'medical', label: 'Medical', labelSw: 'Matibabu', icon: Heart, color: '#F59E0B' },
  { type: 'theft', label: 'Theft', labelSw: 'Wizi', icon: Wallet, color: '#8B5CF6' },
  { type: 'harassment', label: 'Harassment', labelSw: 'Vitisho', icon: Eye, color: '#EC4899' },
  { type: 'lost', label: 'Lost', labelSw: 'Mepotea', icon: Navigation, color: '#3B82F6' },
];

export default function SOSButton({ sessionId, onSOSCreated }: SOSButtonProps) {
  const { user, language } = useAuthStore();
  const sw = language === 'sw';
  const [expanded, setExpanded] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activeSOS, setActiveSOS] = useState<Record<string, unknown> | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedType, setSelectedType] = useState('panic');
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Get current GPS position
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGpsPosition(null)
      );
    }
  }, []);

  // Check for active SOS
  const checkActiveSOS = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/sos?userId=${user.id}&status=active`);
      if (res.ok) {
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          setActiveSOS(data.events[0]);
        }
      }
    } catch {
      // Silently fail
    }
  }, [user?.id]);

  useEffect(() => {
    checkActiveSOS();
  }, [checkActiveSOS]);

  const triggerSOS = async (type: string) => {
    if (!user?.id) return;
    setSelectedType(type);
    setShowConfirm(true);
  };

  const confirmSOS = async () => {
    if (!user?.id) return;
    setActivating(true);
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          sessionId: sessionId || null,
          type: selectedType,
          lat: gpsPosition?.lat,
          lng: gpsPosition?.lng,
        }),
      });

      if (res.ok) {
        const event = await res.json();
        setActiveSOS(event);
        onSOSCreated?.(event);
      }
    } catch {
      // Error handling
    } finally {
      setActivating(false);
      setShowConfirm(false);
      setExpanded(false);
    }
  };

  const resolveSOS = async (resolution: string) => {
    if (!activeSOS?.id || !user?.id) return;
    try {
      const res = await fetch('/api/sos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeSOS.id, userId: user.id, resolution }),
      });
      if (res.ok) {
        setActiveSOS(null);
      }
    } catch {
      // Error handling
    }
  };

  return (
    <>
      {/* Active SOS Banner */}
      <AnimatePresence>
        {activeSOS && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-3 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <AlertTriangle className="w-5 h-5" />
              </motion.div>
              <div>
                <p className="font-bold text-sm">
                  {sw ? 'SOS Hai!' : 'SOS Active!'}
                </p>
                <p className="text-xs opacity-90">
                  {sw ? `Aina: ${activeSOS.type}` : `Type: ${activeSOS.type}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="tel:112" className="bg-white text-red-600 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                <Phone className="w-3 h-3" /> 112
              </a>
              <button
                onClick={() => resolveSOS('safe')}
                className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold"
              >
                {sw ? 'Salama' : "I'm Safe"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating SOS Button */}
      {!activeSOS && (
        <div className="fixed bottom-24 right-4 z-40">
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl border border-red-200 p-3 w-56"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-[#065F46]">
                    {sw ? 'Aina ya SOS' : 'SOS Type'}
                  </p>
                  <button onClick={() => setExpanded(false)}>
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {SOS_TYPES.map((t) => (
                    <button
                      key={t.type}
                      onClick={() => triggerSOS(t.type)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: t.color + '20' }}>
                        <t.icon className="w-4 h-4" style={{ color: t.color }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {sw ? t.labelSw : t.label}
                      </span>
                    </button>
                  ))}
                </div>
                {gpsPosition && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    {sw ? 'Eneo limepatikana' : 'Location captured'}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setExpanded(!expanded)}
            className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center relative"
          >
            {expanded ? (
              <ChevronUp className="w-6 h-6" />
            ) : (
              <>
                <AlertTriangle className="w-6 h-6" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-red-400"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </>
            )}
          </motion.button>
          <p className="text-center text-xs font-bold text-red-600 mt-1">SOS</p>
        </div>
      )}

      {/* Confirm Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </motion.div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {sw ? 'Thibitisha SOS' : 'Confirm SOS Alert'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {sw
                    ? `Utuma tahadhari ya ${selectedType}. Watu wako wa kuaminia wataarifiwa.`
                    : `You are about to trigger a ${selectedType} alert. Your trusted contacts will be notified.`}
                </p>
                {gpsPosition && (
                  <div className="bg-green-50 rounded-lg p-2 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700">
                      {sw ? 'Eneo lako limepatikana' : 'Your location has been captured'}
                    </span>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm"
                  >
                    {sw ? 'Ghairi' : 'Cancel'}
                  </button>
                  <button
                    onClick={confirmSOS}
                    disabled={activating}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {activating
                      ? sw ? 'Inatuma...' : 'Sending...'
                      : sw ? 'Tuma SOS' : 'Send SOS'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
