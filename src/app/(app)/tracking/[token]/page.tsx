'use client';

import { useState, useEffect } from 'react';
import {
  MapPin, Phone, User, Shield, Clock, AlertTriangle,
  Navigation, RefreshCw, ExternalLink
} from 'lucide-react';
import { useParams } from 'next/navigation';

interface TrackingData {
  seekerName: string;
  seekerAvatar: string | null;
  guideName: string;
  guideAvatar: string | null;
  sessionStatus: string;
  startedAt: string | null;
  completedAt: string | null;
  currentLocation: {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: string;
  } | null;
  routeHistory: Array<{ lat: number; lng: number; timestamp: string }>;
  canTrack: boolean;
  shareToken: string;
  expiresAt: string | null;
}

export default function PublicTrackingPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/trip-shares?shareToken=${token}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
        setError('');
      } else {
        const result = await res.json();
        setError(result.error || 'Failed to load tracking data');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const timeSinceUpdate = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#065F46] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {error.includes('expired') ? 'Tracking Expired' : 'Tracking Not Found'}
          </h2>
          <p className="text-sm text-gray-500">{error}</p>
          <p className="text-xs text-gray-400 mt-4">
            Contact the person who shared this link for a new one.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#065F46] text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Live Tracking
          </h1>
          <button
            onClick={handleRefresh}
            className="bg-white/20 rounded-lg p-2 hover:bg-white/30 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            {data.seekerAvatar ? (
              <img src={data.seekerAvatar} alt={data.seekerName} className="w-10 h-10 rounded-full" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="font-medium">{data.seekerName}</p>
            <p className="text-[#34D399] text-sm">
              {data.completedAt ? 'Trip Completed' : data.startedAt ? 'Trip In Progress' : 'Trip Starting'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Session info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#065F46]">Trip Details</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              data.sessionStatus === 'held' ? 'bg-amber-100 text-amber-700' :
              data.sessionStatus === 'released' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {data.sessionStatus}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-[#34D399]" />
              <span className="text-gray-500">Seeker:</span>
              <span className="font-medium text-gray-700">{data.seekerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-gray-500">Guide:</span>
              <span className="font-medium text-gray-700">{data.guideName}</span>
            </div>
            {data.startedAt && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Started:</span>
                <span className="text-gray-700">{new Date(data.startedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Map area */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-[#065F46] flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Current Location
            </h3>
            {data.currentLocation && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeSinceUpdate(data.currentLocation.timestamp)}
              </span>
            )}
          </div>
          <div className="h-64 bg-gray-100 relative">
            {data.canTrack && data.currentLocation ? (
              <>
                {/* Map grid background */}
                <div className="absolute inset-0 opacity-10">
                  <div className="w-full h-full" style={{
                    backgroundImage: 'linear-gradient(#065F46 1px, transparent 1px), linear-gradient(90deg, #065F46 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                  }} />
                </div>
                {/* Location marker */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative">
                      <div className="w-6 h-6 bg-[#065F46] rounded-full border-2 border-white shadow-lg mx-auto" />
                      <div className="absolute inset-0 w-6 h-6 bg-[#34D399] rounded-full animate-ping opacity-50 mx-auto" />
                    </div>
                    <div className="mt-3 bg-white/90 rounded-lg p-2 shadow text-xs">
                      <p className="font-bold text-[#065F46]">{data.seekerName}</p>
                      <p className="text-gray-500">{data.currentLocation.lat.toFixed(4)}, {data.currentLocation.lng.toFixed(4)}</p>
                      <p className="text-gray-400">±{data.currentLocation.accuracy}m</p>
                    </div>
                  </div>
                </div>
                {/* Route line */}
                {data.routeHistory.length > 1 && (
                  <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                    <polyline
                      points={data.routeHistory.map((p, i) => {
                        const x = ((p.lng - data.currentLocation!.lng) * 5000) + 200;
                        const y = ((p.lat - data.currentLocation!.lat) * 5000) + 130;
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#065F46"
                      strokeWidth="3"
                      strokeDasharray="8,4"
                      opacity="0.5"
                    />
                  </svg>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    {data.canTrack
                      ? 'No location data available yet'
                      : 'Live tracking is not enabled for this contact'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Route progress */}
        {data.canTrack && data.routeHistory.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-[#065F46] mb-3 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Route Progress
            </h3>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {data.routeHistory.slice(-10).map((point, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                  <div className={`w-2 h-2 rounded-full ${
                    idx === data.routeHistory.slice(-10).length - 1 ? 'bg-[#065F46]' : 'bg-gray-300'
                  }`} />
                  <span>{new Date(point.timestamp).toLocaleTimeString()}</span>
                  <span className="text-gray-400">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOS Concern Button */}
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
          <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Concerned About Safety?
          </h3>
          <p className="text-sm text-red-600 mb-3">
            If you believe the traveler may be in danger, you can raise a safety concern.
          </p>
          <div className="flex gap-2">
            <a
              href="tel:112"
              className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1"
            >
              <Phone className="w-4 h-4" /> Call 112
            </a>
            <a
              href={`https://maps.google.com/?q=${data.currentLocation?.lat || -6.8264},${data.currentLocation?.lng || 39.2695}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-white text-red-600 py-2 rounded-xl text-sm font-medium border border-red-200 flex items-center justify-center gap-1"
            >
              <ExternalLink className="w-4 h-4" /> Open in Maps
            </a>
          </div>
        </div>

        {/* Footer info */}
        {data.expiresAt && (
          <p className="text-xs text-center text-gray-400">
            This tracking link expires {new Date(data.expiresAt).toLocaleString()}
          </p>
        )}
        <p className="text-xs text-center text-gray-400">
          Chimbo Direct • Safety First
        </p>
      </div>
    </div>
  );
}
