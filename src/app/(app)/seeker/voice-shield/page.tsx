'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Mic, AlertTriangle, AlertCircle, CheckCircle2,
  Loader2, Phone, Volume2, X, Eye, EyeOff, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/lib/stores/auth-store';

// ─── Types ───────────────────────────────────────────────────────────

interface ShieldAlert {
  id?: string;
  alertType: string;
  confidence: number;
  transcript: string;
  advice: string;
  resolved?: boolean;
  createdAt?: string;
}

interface ShieldResult {
  alerts: ShieldAlert[];
  overallRisk: 'low' | 'medium' | 'high';
  action: 'none' | 'warn' | 'pause' | 'sos';
}

// ─── Constants ───────────────────────────────────────────────────────

const ALERT_TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof AlertTriangle; label: string; labelSw: string }> = {
  pressure: { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300 dark:border-amber-700', icon: AlertTriangle, label: 'Pressure', labelSw: 'Shinikizo' },
  scam: { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-700', icon: AlertCircle, label: 'Scam', labelSw: 'Dhiki' },
  threat: { color: 'text-red-900 dark:text-red-200', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-500 dark:border-red-600', icon: AlertTriangle, label: 'Threat', labelSw: 'Tishio' },
  unusual_request: { color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-700', icon: AlertCircle, label: 'Unusual Request', labelSw: 'Ombi Lisilo la Kawaida' },
  distraction: { color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-700', icon: AlertCircle, label: 'Distraction', labelSw: 'Tengevu' },
};

const RISK_CONFIG: Record<string, { color: string; bg: string; glow: string; label: string; labelSw: string }> = {
  low: { color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', glow: 'shadow-emerald-500/30', label: 'Low Risk', labelSw: 'Hatari Chini' },
  medium: { color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', glow: 'shadow-amber-500/30', label: 'Medium Risk', labelSw: 'Hatari Wastani' },
  high: { color: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20', glow: 'shadow-red-500/30', label: 'High Risk', labelSw: 'Hatari Juu' },
};

const DEMO_TRANSCRIPTS = [
  'You: "Habari! Bei gani hii?" Vendor: "TZS 150,000, special price for you my friend, only today! You must buy now, this is the last one!"',
  'You: "Can I see that phone?" Vendor: "Yes, but give me your phone first so I can check if they are compatible. Also, can you transfer money directly to my M-Pesa? I will give you a better price outside the app."',
  'You: "That is too expensive." Vendor: "Don\'t worry, just follow me to the back, I have much better products there. Leave your bag here, it will be safe."',
  'You: "I am looking for kanga fabric." Vendor: "I have the best kanga! This one is real silk, imported from Dubai, very rare! Only TZS 200,000. Normally it is 500,000 but I give you VIP discount. Buy now or someone else will take it!"',
  'You: "Thank you, I will think about it." Vendor: "No no, you must decide now. This price is only for you. If you walk away, I cannot give you this price again. Trust me, this is the best deal in all of Kariakoo."',
];

// ─── Traffic Light Component ─────────────────────────────────────

function TrafficLight({ risk }: { risk: string }) {
  const cfg = RISK_CONFIG[risk] || RISK_CONFIG.low;
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-5 h-5 rounded-full border-2 ${risk === 'low' ? 'bg-emerald-500 border-emerald-600 shadow-lg shadow-emerald-500/50' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`} />
      <div className={`w-5 h-5 rounded-full border-2 ${risk === 'medium' ? 'bg-amber-500 border-amber-600 shadow-lg shadow-amber-500/50' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`} />
      <div className={`w-5 h-5 rounded-full border-2 ${risk === 'high' ? 'bg-red-500 border-red-600 shadow-lg shadow-red-500/50 animate-pulse' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`} />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export default function VoiceShieldPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';

  const [sessionId, setSessionId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<ShieldResult | null>(null);
  const [alerts, setAlerts] = useState<ShieldAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(true);

  // Generate session ID
  useEffect(() => {
    setSessionId(`vs-${Date.now()}`);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!transcript.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/voice-shield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || `vs-${Date.now()}`,
          transcript,
        }),
      });

      if (!res.ok) throw new Error('Failed to analyze transcript');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Request failed');

      setResult(data);
      setAlerts(prev => [...data.alerts, ...prev]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [transcript, sessionId]);

  const handleResolve = useCallback(async (alertId: string) => {
    try {
      const res = await fetch(`/api/ai/voice-shield/${alertId}?XTransformPort=`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: true }),
      });

      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, resolved: true } : a));
      }
    } catch {
      // Silently fail
    }
  }, []);

  const loadDemoTranscript = useCallback(() => {
    const idx = Math.floor(Math.random() * DEMO_TRANSCRIPTS.length);
    setTranscript(DEMO_TRANSCRIPTS[idx]);
  }, []);

  const overallRisk = result?.overallRisk || 'low';
  const riskCfg = RISK_CONFIG[overallRisk];
  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #065F46 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#065F46]/10 dark:bg-[#34D399]/5 blur-3xl" />
        <div className="relative px-4 pt-8 pb-10 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-[#065F46]/10 dark:bg-[#34D399]/10 px-4 py-1.5 rounded-full mb-4">
              <Shield className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              <span className="text-xs font-semibold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider">
                Voice Shield
              </span>
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="text-[#065F46] dark:text-[#34D399]">{sw ? 'Ngao ya' : 'Fraud Voice'}</span>{' '}
            <span className="text-[#F59E0B] dark:text-[#FBBF24]">{sw ? 'Sauti' : 'Shield'}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto">
            {sw ? 'Linda dhidi ya udanganyifu kwa wakati halisi' : 'Real-time protection against fraud'}
          </motion.p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16 space-y-6">
        {/* Risk Level Indicator */}
        <div className={`rounded-2xl shadow-md border p-5 sm:p-6 ${riskCfg.bg} ${riskCfg.glow} transition-all duration-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-1">{sw ? 'Kiwango cha hatari' : 'Overall Risk Level'}</p>
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">{sw ? riskCfg.labelSw : riskCfg.label}</h2>
            </div>
            <TrafficLight risk={overallRisk} />
          </div>
          {result?.action && result.action !== 'none' && (
            <div className="mt-3 flex items-center gap-2">
              <Badge className={`${
                result.action === 'sos' ? 'bg-red-500 text-white border-0' :
                result.action === 'pause' ? 'bg-amber-500 text-white border-0' :
                'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-0'
              } text-xs font-bold`}>
                {result.action === 'sos' ? (sw ? 'SOS - HATARI!' : 'SOS - DANGER!') :
                 result.action === 'pause' ? (sw ? 'SIMAMA' : 'PAUSE') :
                 (sw ? 'TAHADHARI' : 'WARNING')}
              </Badge>
              {result.action === 'sos' && (
                <a href="tel:112" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors">
                  <Phone className="w-3 h-3" />
                  112
                </a>
              )}
            </div>
          )}
        </div>

        {/* Transcript Input */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-md border border-[#E2E8F0] dark:border-[#334155] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
              <Mic className="w-4 h-4 text-[#F59E0B]" />
              {sw ? 'Maandishi wa mazungumzo' : 'Conversation Transcript'}
            </label>
            <button onClick={() => setShowTranscript(!showTranscript)} className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#64748B] transition-colors">
              {showTranscript ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {showTranscript && (
            <Textarea
              placeholder={sw ? 'Weka maandishi wa mazungumzo hapa...' : 'Paste conversation transcript here...'}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[120px] rounded-xl border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm"
            />
          )}

          <div className="flex gap-2">
            <button onClick={loadDemoTranscript} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] text-xs font-semibold hover:bg-[#065F46] hover:text-white dark:hover:bg-[#34D399] dark:hover:text-[#022C22] transition-all">
              <Sparkles className="w-3 h-3" />
              {sw ? 'Onyesha mfano' : 'Load Demo'}
            </button>
            <button onClick={handleAnalyze} disabled={!transcript.trim() || isLoading} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#065F46] via-[#059669] to-[#065F46] bg-[length:200%_100%] hover:bg-right shadow-md shadow-[#065F46]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-2">
              {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />{sw ? 'Inachambua...' : 'Analyzing...'}</>) : (<><Shield className="w-4 h-4" />{sw ? 'Chambua' : 'Analyze'} </>)}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              {sw ? 'Tahadhari Zilizopo' : 'Active Alerts'} ({activeAlerts.length})
            </h3>
            <div className="space-y-3">
              {activeAlerts.map((alert, i) => {
                const cfg = ALERT_TYPE_CONFIG[alert.alertType] || ALERT_TYPE_CONFIG.pressure;
                const AlertIcon = cfg.icon;
                return (
                  <motion.div key={alert.id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} overflow-hidden`}>
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center`}>
                          <AlertIcon className={`w-5 h-5 ${cfg.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${cfg.bg} ${cfg.color} border ${cfg.border} text-xs font-bold capitalize`}>
                              {sw ? cfg.labelSw : cfg.label}
                            </Badge>
                            <Badge className="bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-[#94A3B8] border-0 text-xs">
                              {(alert.confidence * 100).toFixed(0)}% {sw ? 'hakika' : 'confidence'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Transcript excerpt */}
                      {alert.transcript && (
                        <div className="p-3 rounded-xl bg-white/60 dark:bg-[#0F172A]/40 border border-[#E2E8F0]/50 dark:border-[#334155]/50">
                          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-1 font-semibold">{sw ? 'Nukuu:' : 'Transcript:'}</p>
                          <p className="text-sm text-[#0F172A] dark:text-[#F1F5F9] italic">&ldquo;{alert.transcript}&rdquo;</p>
                        </div>
                      )}

                      {/* AI Advice */}
                      {alert.advice && (
                        <div className="p-3 rounded-xl bg-[#ECFDF5]/60 dark:bg-[#064E3B]/40 border border-[#A7F3D0]/30 dark:border-[#065F46]/30">
                          <p className="text-xs text-[#065F46] dark:text-[#34D399] font-semibold mb-1">{sw ? 'Ushauri wa AI:' : 'AI Advice:'}</p>
                          <p className="text-sm text-[#065F46] dark:text-[#34D399]">{alert.advice}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button onClick={() => alert.id && handleResolve(alert.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22] text-xs font-semibold hover:opacity-90 transition-all">
                          <CheckCircle2 className="w-3 h-3" />
                          {sw ? 'Tatua' : 'Resolve'}
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] text-xs font-semibold hover:bg-[#E2E8F0] dark:hover:bg-[#475569] transition-all">
                          <X className="w-3 h-3" />
                          {sw ? 'Futa' : 'Dismiss'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resolved Alerts */}
        {resolvedAlerts.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {sw ? 'Tahadhari Zilizotatuliwa' : 'Resolved Alerts'} ({resolvedAlerts.length})
            </h3>
            <div className="space-y-2">
              {resolvedAlerts.map((alert, i) => {
                const cfg = ALERT_TYPE_CONFIG[alert.alertType] || ALERT_TYPE_CONFIG.pressure;
                return (
                  <div key={alert.id || `resolved-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/50 opacity-70">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs capitalize`}>{sw ? cfg.labelSw : cfg.label}</Badge>
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8] flex-1 truncate">{alert.transcript?.slice(0, 60) || 'Alert'}...</span>
                    <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 text-xs">
                      {sw ? 'Imetatuliwa' : 'Resolved'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Safety Tips */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-[#065F46] to-[#059669] dark:from-[#022C22] dark:to-[#065F46] py-4 px-5">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-[#FBBF24]" />
              {sw ? 'Vidokezo vya Usalama' : 'Safety Tips'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
              {[
                { icon: '🔒', title: sw ? 'Weka miamala kwenye programu' : 'Keep transactions in the app', desc: sw ? 'Usitumie M-Pesa moja kwa moja kwa muuzaji' : "Don't send money directly to vendors outside the platform" },
                { icon: '👥', title: sw ? 'Kaa katika maeneo ya umma' : 'Stay in public areas', desc: sw ? 'Usimfuatilie muuzaji eneo la faragha' : "Don't follow vendors to private or hidden areas" },
                { icon: '📱', title: sw ? 'Shiriki eneo lako' : 'Share your location', desc: sw ? 'Wape marafiki zako eneo lako wakati unanunua' : 'Let trusted contacts know where you are while shopping' },
                { icon: '🚨', title: sw ? 'Tumia SOS kwa dharura' : 'Use SOS for emergencies', desc: sw ? 'Bonyeza kitufe cha SOS ikiwa unahisi hatarini' : 'Press the SOS button if you feel unsafe at any time' },
              ].map((tip, i) => (
                <div key={i} className="p-4 flex items-start gap-3">
                  <span className="text-lg">{tip.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{tip.title}</p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
