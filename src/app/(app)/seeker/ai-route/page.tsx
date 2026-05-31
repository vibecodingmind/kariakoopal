'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Navigation, Clock, Users, Sparkles, Loader2,
  ChevronRight, Plus, Trash2, ArrowUpDown, Route,
  CheckCircle2, AlertTriangle, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';

// ─── Types ───────────────────────────────────────────────────────────

interface StopInput {
  id: string;
  vendorId: string;
  lat: string;
  lng: string;
  priority: string;
  label: string;
}

interface RouteResult {
  optimizedOrder: number[];
  totalDistance: number;
  totalTime: number;
  crowdData: {
    overallLevel: string;
    perStopCrowd: { stopIndex: number; level: string }[];
  };
  routeDescription: string;
  routeId: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────

const ZONES = [
  { id: 'zone-electronics', name: 'Electronics Zone', nameSw: 'Eneo la Elektroniki' },
  { id: 'zone-fabrics', name: 'Fabrics Zone', nameSw: 'Eneo la Vitenge' },
  { id: 'zone-wholesale', name: 'Wholesale Zone', nameSw: 'Eneo la Jumla' },
  { id: 'zone-spices', name: 'Spices Zone', nameSw: 'Eneo la Viungo' },
  { id: 'zone-kitchenware', name: 'Kitchenware Zone', nameSw: 'Eneo la Chombo' },
  { id: 'zone-artisanal', name: 'Artisanal Zone', nameSw: 'Eneo la Kisanii' },
];

const DEMO_VENDORS = [
  { id: 'v1', name: 'Zaki Electronics', lat: -6.8264, lng: 39.2695, zoneId: 'zone-electronics' },
  { id: 'v2', name: 'Mama Kanga Shop', lat: -6.8260, lng: 39.2690, zoneId: 'zone-fabrics' },
  { id: 'v3', name: 'Al-Falah Wholesale', lat: -6.8270, lng: 39.2700, zoneId: 'zone-wholesale' },
  { id: 'v4', name: 'Spice Paradise', lat: -6.8258, lng: 39.2688, zoneId: 'zone-spices' },
  { id: 'v5', name: 'Kitchen World', lat: -6.8255, lng: 39.2705, zoneId: 'zone-kitchenware' },
  { id: 'v6', name: 'Craft Masters', lat: -6.8272, lng: 39.2710, zoneId: 'zone-artisanal' },
];

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  { value: 'normal', label: 'Normal', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  { value: 'low', label: 'Low', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
];

const CROWD_COLORS: Record<string, string> = {
  low: 'bg-emerald-500',
  moderate: 'bg-amber-500',
  high: 'bg-red-500',
  very_high: 'bg-red-700',
};

const CROWD_LABELS: Record<string, { en: string; sw: string }> = {
  low: { en: 'Low', sw: 'Chini' },
  moderate: { en: 'Moderate', sw: 'Wastani' },
  high: { en: 'High', sw: 'Juu' },
  very_high: { en: 'Very High', sw: 'Juu Sana' },
};

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

let stopCounter = 0;
function createStop(vendorId?: string): StopInput {
  stopCounter++;
  const vendor = vendorId ? DEMO_VENDORS.find(v => v.id === vendorId) : null;
  return {
    id: `stop-${Date.now()}-${stopCounter}`,
    vendorId: vendorId || '',
    lat: vendor ? String(vendor.lat) : '-6.8264',
    lng: vendor ? String(vendor.lng) : '39.2695',
    priority: 'normal',
    label: vendor ? vendor.name : `Stop ${stopCounter}`,
  };
}

// ─── Main Component ─────────────────────────────────────────────

export default function AIRoutePage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';

  const [zoneId, setZoneId] = useState('');
  const [stops, setStops] = useState<StopInput[]>([createStop(), createStop()]);
  const [startLat, setStartLat] = useState('-6.8264');
  const [startLng, setStartLng] = useState('39.2695');
  const [result, setResult] = useState<RouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = zoneId !== '' && stops.length >= 2;

  const addStop = useCallback(() => {
    setStops(prev => [...prev, createStop()]);
  }, []);

  const removeStop = useCallback((id: string) => {
    setStops(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);
  }, []);

  const updateStop = useCallback((id: string, field: keyof StopInput, value: string) => {
    setStops(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      if (field === 'vendorId' && value) {
        const vendor = DEMO_VENDORS.find(v => v.id === value);
        if (vendor) {
          updated.lat = String(vendor.lat);
          updated.lng = String(vendor.lng);
          updated.label = vendor.name;
        }
      }
      return updated;
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/route-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId,
          stops: stops.map(s => ({
            vendorId: s.vendorId || undefined,
            lat: Number(s.lat),
            lng: Number(s.lng),
            priority: s.priority,
          })),
          startLat: Number(startLat),
          startLng: Number(startLng),
        }),
      });

      if (!res.ok) throw new Error('Failed to optimize route');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Request failed');

      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [zoneId, stops, startLat, startLng, isFormValid]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #065F46 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#065F46]/10 dark:bg-[#34D399]/5 blur-3xl" />
        <div className="relative px-4 pt-8 pb-10 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-[#065F46]/10 dark:bg-[#34D399]/10 px-4 py-1.5 rounded-full mb-4">
              <Navigation className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              <span className="text-xs font-semibold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider">
                AI Route
              </span>
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="text-[#065F46] dark:text-[#34D399]">{sw ? 'Njia bora' : 'Route'}</span>{' '}
            <span className="text-[#F59E0B] dark:text-[#FBBF24]">{sw ? 'ya AI' : 'Optimizer'}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto">
            {sw ? 'Pata njia fupi zaidi kupitia soko' : 'Find the shortest path through the market'}
          </motion.p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16 space-y-6">
        {/* Zone selection */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-md border border-[#E2E8F0] dark:border-[#334155] p-5 sm:p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
            <Route className="w-4 h-4 text-[#F59E0B]" />
            {sw ? 'Chagua Eneo' : 'Select Zone'}
          </label>
          <div className="flex flex-wrap gap-2">
            {ZONES.map(z => (
              <button key={z.id} onClick={() => setZoneId(p => p === z.id ? '' : z.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${zoneId === z.id ? 'bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22]' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8]'}`}>
                {sw ? z.nameSw : z.name}
              </button>
            ))}
          </div>
        </div>

        {/* Stops list */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-md border border-[#E2E8F0] dark:border-[#334155] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#F59E0B]" />
              {sw ? 'Vituo vyako' : 'Your Stops'}
            </h3>
            <button onClick={addStop} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] text-xs font-semibold hover:bg-[#065F46] hover:text-white dark:hover:bg-[#34D399] dark:hover:text-[#022C22] transition-all">
              <Plus className="w-3 h-3" />
              {sw ? 'Ongeza' : 'Add Stop'}
            </button>
          </div>

          {stops.map((stop, i) => (
            <motion.div key={stop.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#065F46] dark:bg-[#34D399] flex items-center justify-center text-white dark:text-[#022C22] text-sm font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <Input
                    placeholder={sw ? 'Jina la kituo' : 'Stop label'}
                    value={stop.label}
                    onChange={(e) => updateStop(stop.id, 'label', e.target.value)}
                    className="h-9 rounded-lg text-sm border-[#E2E8F0] dark:border-[#334155]"
                  />
                </div>
                <select
                  value={stop.vendorId}
                  onChange={(e) => updateStop(stop.id, 'vendorId', e.target.value)}
                  className="h-9 rounded-lg text-xs border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F1F5F9] px-2 max-w-[140px]"
                >
                  <option value="">{sw ? 'Chagua muuzaji' : 'Select vendor'}</option>
                  {DEMO_VENDORS.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <button onClick={() => removeStop(stop.id)} className="p-1.5 rounded-lg text-[#94A3B8] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-1 block">Lat</label>
                  <Input value={stop.lat} onChange={(e) => updateStop(stop.id, 'lat', e.target.value)} className="h-8 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-1 block">Lng</label>
                  <Input value={stop.lng} onChange={(e) => updateStop(stop.id, 'lng', e.target.value)} className="h-8 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-1 block">{sw ? 'Kipaumbele' : 'Priority'}</label>
                  <select value={stop.priority} onChange={(e) => updateStop(stop.id, 'priority', e.target.value)} className="h-8 rounded-lg text-xs border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F1F5F9] w-full px-2">
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Badge className={`${PRIORITY_OPTIONS.find(p => p.value === stop.priority)?.color || PRIORITY_OPTIONS[1].color} border-0 text-xs`}>
                    {PRIORITY_OPTIONS.find(p => p.value === stop.priority)?.label || 'Normal'}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Starting point */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-md border border-[#E2E8F0] dark:border-[#334155] p-5 sm:p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
            <Navigation className="w-4 h-4 text-[#F59E0B]" />
            {sw ? 'Mahali unapoanza' : 'Starting Point'}
          </label>
          <div className="grid grid-cols-2 gap-4 max-w-xs">
            <div>
              <label className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-1 block">Latitude</label>
              <Input value={startLat} onChange={(e) => setStartLat(e.target.value)} className="h-10 rounded-xl" />
            </div>
            <div>
              <label className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-1 block">Longitude</label>
              <Input value={startLng} onChange={(e) => setStartLng(e.target.value)} className="h-10 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!isFormValid || isLoading} className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[#065F46] via-[#059669] to-[#065F46] bg-[length:200%_100%] hover:bg-right shadow-lg shadow-[#065F46]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-2.5">
          {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />{sw ? 'Inahesabu njia...' : 'Optimizing route...'}</>) : (<><Sparkles className="w-5 h-5" />{sw ? 'Optimize Njia' : 'Optimize Route'}<ChevronRight className="w-4 h-4" /></>)}
        </button>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-6">
              {/* Route overview */}
              <div className="bg-gradient-to-r from-[#065F46] to-[#059669] dark:from-[#022C22] dark:to-[#065F46] rounded-2xl shadow-lg p-5 sm:p-6 text-white space-y-4">
                <div className="flex items-center gap-2">
                  <Route className="w-5 h-5 text-[#FBBF24]" />
                  <h2 className="text-lg font-bold">{sw ? 'Njia Iliyoboreshwa' : 'Optimized Route'}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/70 mb-1">{sw ? 'Jumla ya mbali' : 'Total Distance'}</p>
                    <p className="text-2xl font-extrabold">{formatDistance(result.totalDistance)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/70 mb-1">{sw ? 'Jumla ya muda' : 'Total Time'}</p>
                    <p className="text-2xl font-extrabold">{formatTime(result.totalTime)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${CROWD_COLORS[result.crowdData.overallLevel] || 'bg-amber-500'}`} />
                  <span className="text-sm">
                    {sw ? 'Hali ya watu' : 'Crowd level'}: <strong>{CROWD_LABELS[result.crowdData.overallLevel]?.[sw ? 'sw' : 'en'] || result.crowdData.overallLevel}</strong>
                  </span>
                </div>

                <p className="text-sm text-white/80 leading-relaxed">{result.routeDescription}</p>
              </div>

              {/* Optimized sequence */}
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#065F46] to-[#059669] dark:from-[#022C22] dark:to-[#065F46] py-4 px-5">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <ArrowUpDown className="w-4 h-4 text-[#FBBF24]" />
                    {sw ? 'Mpangilio Ulioboreshwa' : 'Optimized Sequence'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
                    {result.optimizedOrder.map((stopIndex, i) => {
                      const stop = stops[stopIndex];
                      if (!stop) return null;
                      const crowd = result.crowdData.perStopCrowd?.find(c => c.stopIndex === stopIndex);
                      const estimatedTime = Math.round(result.totalTime / stops.length);
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-4 flex items-center gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-[#065F46] dark:bg-[#34D399] flex items-center justify-center text-white dark:text-[#022C22] text-sm font-bold">
                              {i + 1}
                            </div>
                            {i < result.optimizedOrder.length - 1 && (
                              <div className="w-0.5 h-6 bg-[#E2E8F0] dark:bg-[#334155] mt-1" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{stop.label}</p>
                            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                              ({stop.lat}, {stop.lng})
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {crowd && (
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${CROWD_COLORS[crowd.level] || 'bg-amber-500'}`} />
                                <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">{CROWD_LABELS[crowd.level]?.[sw ? 'sw' : 'en'] || crowd.level}</span>
                              </div>
                            )}
                            <Badge className="bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] border-0 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              ~{estimatedTime}min
                            </Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
