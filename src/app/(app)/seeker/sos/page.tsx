'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, Phone, MapPin, Clock, CheckCircle, XCircle,
  ShieldAlert, Heart, Wallet, Eye, Navigation, Plus, ExternalLink
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import SOSButton from '@/components/sos-button';

const SOS_TYPE_ICONS: Record<string, typeof ShieldAlert> = {
  panic: ShieldAlert,
  medical: Heart,
  theft: Wallet,
  harassment: Eye,
  lost: Navigation,
};

const SOS_TYPE_COLORS: Record<string, string> = {
  panic: 'bg-red-100 text-red-700',
  medical: 'bg-amber-100 text-amber-700',
  theft: 'bg-purple-100 text-purple-700',
  harassment: 'bg-pink-100 text-pink-700',
  lost: 'bg-blue-100 text-blue-700',
};

interface SOSEventData {
  id: string;
  type: string;
  status: string;
  lat: number | null;
  lng: number | null;
  contactsNotified: string[];
  authorityNotified: boolean;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export default function SOSPage() {
  const { user, language } = useAuthStore();
  const sw = language === 'sw';
  const [events, setEvents] = useState<SOSEventData[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const fetchEvents = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/sos?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setActiveCount(data.activeCount || 0);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const resolveEvent = async (id: string, resolution: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/sos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId: user.id, resolution }),
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch {
      // Silent
    }
  };

  const activeEvents = events.filter((e) => e.status === 'active');
  const pastEvents = events.filter((e) => e.status !== 'active');

  const emergencyContacts = [
    { name: 'Police Emergency', phone: '112', icon: '🚔', color: 'bg-red-600' },
    { name: 'Ambulance', phone: '114', icon: '🚑', color: 'bg-amber-600' },
    { name: 'Fire Emergency', phone: '115', icon: '🚒', color: 'bg-orange-600' },
    { name: 'Tourist Police', phone: '+255222110000', icon: '👮', color: 'bg-[#065F46]' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#065F46] text-white p-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          {sw ? 'Kituo cha Dharura' : 'Emergency Center'}
        </h1>
        <p className="text-[#34D399] text-sm mt-1">
          {sw ? 'Usalama wako ni muhimu' : 'Your safety is our priority'}
        </p>
      </div>

      {/* Active Alert Banner */}
      {activeCount > 0 && (
        <div className="bg-red-600 text-white p-3 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold">
              {sw ? `${activeCount} Tahadhari Hai!` : `${activeCount} Active Alert(s)!`}
            </span>
          </div>
          <span className="text-xs">{sw ? 'Msaidie unahitajika' : 'Help needed'}</span>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Emergency Quick Dial */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-[#065F46] mb-3 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            {sw ? 'Nambari za Dharura' : 'Emergency Numbers'}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {emergencyContacts.map((contact) => (
              <a
                key={contact.phone}
                href={`tel:${contact.phone}`}
                className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">{contact.icon}</span>
                <div>
                  <p className="text-xs font-medium text-gray-700">{contact.name}</p>
                  <p className="text-xs text-[#065F46] font-bold">{contact.phone}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Map placeholder for last known location */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-[#065F46] mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {sw ? 'Eneo la Mwisho' : 'Last Known Location'}
          </h2>
          <div className="h-40 bg-gray-100 rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">
                {activeEvents.length > 0 && activeEvents[0].lat
                  ? `${activeEvents[0].lat.toFixed(4)}, ${activeEvents[0].lng?.toFixed(4)}`
                  : sw ? 'Hakuna eneo la dharura' : 'No emergency location'}
              </p>
            </div>
            {/* Decorative map grid */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full" style={{
                backgroundImage: 'linear-gradient(#065F46 1px, transparent 1px), linear-gradient(90deg, #065F46 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'active' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            {sw ? 'Hai' : 'Active'} {activeCount > 0 && `(${activeCount})`}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'history' ? 'bg-[#065F46] text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            {sw ? 'Historia' : 'History'}
          </button>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : activeTab === 'active' ? (
          activeEvents.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-gray-700">
                {sw ? 'Hakuna tahadhari hai' : 'No active alerts'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {sw ? 'Unasalama!' : "You're safe!"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeEvents.map((event) => {
                const Icon = SOS_TYPE_ICONS[event.type] || AlertTriangle;
                const colorClass = SOS_TYPE_COLORS[event.type] || 'bg-gray-100 text-gray-700';
                return (
                  <div key={event.id} className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-red-500">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{event.type}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(event.createdAt).toLocaleString(sw ? 'sw-TZ' : 'en-US')}
                          </p>
                        </div>
                      </div>
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {sw ? 'Hai' : 'Active'}
                      </span>
                    </div>
                    {event.lat && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" />
                        {event.lat.toFixed(4)}, {event.lng?.toFixed(4)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      <span>{event.contactsNotified.length} {sw ? 'watu waliarifiwa' : 'contacts notified'}</span>
                      {event.authorityNotified && (
                        <span className="text-amber-600 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          {sw ? 'Mamlada waliarifiwa' : 'Authority notified'}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => resolveEvent(event.id, 'safe')}
                        className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-medium"
                      >
                        {sw ? "Niko Salama" : "I'm Safe"}
                      </button>
                      <button
                        onClick={() => resolveEvent(event.id, 'false_alarm')}
                        className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium"
                      >
                        {sw ? 'Tahadhari ya Uongo' : 'False Alarm'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : pastEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-gray-400">
              {sw ? 'Hakuna historia ya SOS' : 'No SOS history'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pastEvents.map((event) => {
              const Icon = SOS_TYPE_ICONS[event.type] || AlertTriangle;
              const colorClass = SOS_TYPE_COLORS[event.type] || 'bg-gray-100 text-gray-700';
              const resolutionColors: Record<string, string> = {
                safe: 'bg-green-100 text-green-700',
                false_alarm: 'bg-gray-100 text-gray-600',
                escalated: 'bg-red-100 text-red-700',
                assisted: 'bg-blue-100 text-blue-700',
              };
              return (
                <div key={event.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 capitalize">{event.type}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(event.createdAt).toLocaleDateString(sw ? 'sw-TZ' : 'en-US')}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resolutionColors[event.resolution || 'safe']}`}>
                    {event.resolution?.replace('_', ' ') || 'resolved'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Safety Tips */}
        <div className="bg-[#065F46]/5 rounded-2xl p-4 border border-[#065F46]/10">
          <h3 className="font-bold text-[#065F46] mb-2 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            {sw ? 'Vidokezo vya Usalama' : 'Safety Tips'}
          </h3>
          <ul className="space-y-1.5 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-[#34D399] mt-0.5">•</span>
              {sw ? 'Shikilia kitufe cha SOS kwa muda mrefu kwa aina tofauti za dharura' : 'Long-press the SOS button for different emergency types'}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#34D399] mt-0.5">•</span>
              {sw ? 'Washa GPS yako kwa usaidizi wa eneo sahihi' : 'Keep your GPS on for accurate location assistance'}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#34D399] mt-0.5">•</span>
              {sw ? 'Ongeza watu wa kuaminia ili wapate tahadhari' : 'Add trusted contacts so they receive alerts'}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#34D399] mt-0.5">•</span>
              {sw ? 'Piga simu 112 kwa dharura za polisi' : 'Call 112 for police emergencies'}
            </li>
          </ul>
        </div>
      </div>

      {/* Floating SOS Button */}
      <SOSButton />
    </div>
  );
}
