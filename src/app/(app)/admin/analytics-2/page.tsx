'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  BarChart3, Users, DollarSign, Star, TrendingUp, Activity,
  RefreshCw, Download, Brain, Eye, Clock, Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface RealtimeStats {
  activeSessions: number;
  onlineGuides: number;
  todayBookings: number;
  revenueToday: number;
  newSignups: number;
  avgRating: number;
}

interface AnalyticsEvent {
  id: string;
  eventType: string;
  userId: string | null;
  metadata: string;
  value: number;
  createdAt: string;
}

interface AnalyticsReport {
  id: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  data: string;
  insights: string;
  generatedBy: string;
  createdAt: string;
}

export default function AnalyticsDashboard2Page() {
  const { language } = useAuthStore();
  const sw = language === 'sw';

  const [realtime, setRealtime] = useState<RealtimeStats | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [revenueChart, setRevenueChart] = useState<Array<{ date: string; revenue: number; bookings: number }>>([]);
  const [topGuides, setTopGuides] = useState<Array<{ name: string; revenue: number; rating: number }>>([]);
  const [aiInsight, setAiInsight] = useState('');
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [realtimeRes, eventsRes, reportsRes] = await Promise.all([
        fetch('/api/admin/analytics/realtime'),
        fetch('/api/admin/analytics/events?limit=100'),
        fetch('/api/admin/analytics/reports'),
      ]);

      if (realtimeRes.ok) setRealtime(await realtimeRes.json());
      if (eventsRes.ok) {
        const eData = await eventsRes.json();
        setEvents(eData.events || []);
        processChartData(eData.events || []);
      }
      if (reportsRes.ok) {
        const rData = await reportsRes.json();
        setReports(rData.reports || []);
      }
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh realtime stats every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/analytics/realtime');
        if (res.ok) setRealtime(await res.json());
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const processChartData = (evts: AnalyticsEvent[]) => {
    // Build revenue chart from booking/tip events
    const dateMap: Record<string, { revenue: number; bookings: number }> = {};

    for (const e of evts) {
      if (e.eventType === 'booking' || e.eventType === 'tip') {
        const date = new Date(e.createdAt).toISOString().split('T')[0];
        if (!dateMap[date]) dateMap[date] = { revenue: 0, bookings: 0 };
        dateMap[date].revenue += e.value;
        if (e.eventType === 'booking') dateMap[date].bookings += 1;
      }
    }

    const chart = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date: date.slice(5), ...data }));

    setRevenueChart(chart.length > 0 ? chart : generateDemoChartData());

    // Top guides from demo data
    setTopGuides([
      { name: 'Amani Juma', revenue: 450000, rating: 4.9 },
      { name: 'Fatima Hassan', revenue: 380000, rating: 4.8 },
      { name: 'Joseph Mwangi', revenue: 320000, rating: 4.7 },
      { name: 'Grace Odhiambo', revenue: 290000, rating: 4.6 },
      { name: 'David Kimaro', revenue: 265000, rating: 4.5 },
    ]);
  };

  const generateDemoChartData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(d => ({
      date: d,
      revenue: Math.floor(Math.random() * 200000) + 100000,
      bookings: Math.floor(Math.random() * 15) + 5,
    }));
  };

  const generateAIInsight = async () => {
    setGeneratingInsight(true);
    try {
      const res = await fetch('/api/admin/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'weekly',
          periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          periodEnd: new Date().toISOString(),
          generatedBy: 'admin',
        }),
      });
      const data = await res.json();
      if (data.insights && Array.isArray(data.insights)) {
        setAiInsight(data.insights.join('\n\n'));
      } else {
        setAiInsight(sw ? 'Hakuna mapendekezo ya AI kwa sasa' : 'No AI insights available at this time');
      }
    } catch (err) {
      console.error('AI insight error:', err);
      setAiInsight(sw ? 'Imeshindwa kutengeneza mapendekezo' : 'Failed to generate insights');
    } finally {
      setGeneratingInsight(false);
    }
  };

  const exportReport = async () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      realtime,
      topGuides,
      recentEvents: events.slice(0, 50),
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // User funnel data
  const funnelData = [
    { stage: sw ? 'Usajili' : 'Signups', count: realtime?.newSignups || 156, pct: 100 },
    { stage: sw ? 'Buku ya Kwanza' : 'First Booking', count: 89, pct: 57 },
    { stage: sw ? 'Kurudia' : 'Repeat', count: 45, pct: 29 },
    { stage: sw ? 'Mteja wa Kudumu' : 'Loyal', count: 23, pct: 15 },
  ];

  // Cohort retention
  const cohortData = [
    { week: 'Week 1', w1: '100%', w2: '45%', w3: '28%', w4: '18%' },
    { week: 'Week 2', w1: '100%', w2: '52%', w3: '31%', w4: '-' },
    { week: 'Week 3', w1: '100%', w2: '48%', w3: '-', w4: '-' },
    { week: 'Week 4', w1: '100%', w2: '-', w3: '-', w4: '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#065F46] flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            {sw ? 'Uchambuzi 2.0' : 'Analytics Dashboard 2.0'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {sw ? 'Takwimu za wakati halisi na mapendekezo ya AI' : 'Real-time statistics & AI-powered insights'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> {sw ? 'Pakia upya' : 'Refresh'}
          </button>
          <button onClick={exportReport} className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
            <Download className="w-4 h-4" /> {sw ? 'Hamisha' : 'Export'}
          </button>
        </div>
      </div>

      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: sw ? 'Vikao Hai' : 'Active Sessions', value: realtime?.activeSessions || 0, icon: Activity, color: 'bg-[#065F46]', iconColor: 'text-white' },
          { label: sw ? 'Mapato Leo' : 'Revenue Today', value: `TZS ${(realtime?.revenueToday || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-[#F59E0B]', iconColor: 'text-white' },
          { label: sw ? 'Wanaoingia' : 'New Signups', value: realtime?.newSignups || 0, icon: Users, color: 'bg-[#34D399]', iconColor: 'text-[#065F46]' },
          { label: sw ? 'Ukadiriaji' : 'Avg Rating', value: (realtime?.avgRating || 0).toFixed(1), icon: Star, color: 'bg-purple-600', iconColor: 'text-white' },
        ].map((kpi, i) => (
          <div key={i} className="kcard p-4 bg-white rounded-xl border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-lg ${kpi.color} flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.iconColor}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#065F46]">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Additional KPI */}
      <div className="grid grid-cols-2 gap-4">
        <div className="kcard p-4 bg-white rounded-xl border">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-[#34D399]" />
            <span className="text-xs text-gray-500">{sw ? 'Waongozaji Mtandaoni' : 'Online Guides'}</span>
          </div>
          <div className="text-xl font-bold text-[#065F46]">{realtime?.onlineGuides || 0}</div>
        </div>
        <div className="kcard p-4 bg-white rounded-xl border">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-xs text-gray-500">{sw ? 'Buku Leo' : 'Today Bookings'}</span>
          </div>
          <div className="text-xl font-bold text-[#065F46]">{realtime?.todayBookings || 0}</div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#065F46]">{sw ? 'Chati ya Mapato' : 'Revenue Chart'}</h3>
          <div className="flex gap-1">
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <button key={p} onClick={() => setChartPeriod(p)} className={`px-2 py-1 rounded text-xs ${chartPeriod === p ? 'bg-[#065F46] text-white' : 'bg-gray-100 text-gray-600'}`}>
                {p === 'daily' ? (sw ? 'Kila siku' : 'Daily') : p === 'weekly' ? (sw ? 'Kila wiki' : 'Weekly') : (sw ? 'Kila mwezi' : 'Monthly')}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#065F46" strokeWidth={2} dot={false} name={sw ? 'Mapato' : 'Revenue'} />
            <Line type="monotone" dataKey="bookings" stroke="#F59E0B" strokeWidth={2} dot={false} name={sw ? 'Buku' : 'Bookings'} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Funnel */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-bold text-[#065F46] mb-4">{sw ? 'Bomba la Mtumiaji' : 'User Funnel'}</h3>
          <div className="space-y-3">
            {funnelData.map((step, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{step.stage}</span>
                  <span className="text-gray-500">{step.count} ({step.pct}%)</span>
                </div>
                <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${step.pct}%`,
                      backgroundColor: i === 0 ? '#065F46' : i === 1 ? '#34D399' : i === 2 ? '#F59E0B' : '#9CA3AF',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Guides */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-bold text-[#065F46] mb-4">{sw ? 'Waongozaji Bora' : 'Top Guides'}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topGuides} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#065F46" name={sw ? 'Mapato' : 'Revenue'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cohort Retention Table */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-bold text-[#065F46] mb-4">{sw ? 'Jedwali la Uhifadhi' : 'Cohort Retention'}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-3 py-2 text-gray-500">{sw ? 'Wiki' : 'Week'}</th>
                <th className="px-3 py-2 text-gray-500">Week 1</th>
                <th className="px-3 py-2 text-gray-500">Week 2</th>
                <th className="px-3 py-2 text-gray-500">Week 3</th>
                <th className="px-3 py-2 text-gray-500">Week 4</th>
              </tr>
            </thead>
            <tbody>
              {cohortData.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{row.week}</td>
                  {[row.w1, row.w2, row.w3, row.w4].map((val, j) => (
                    <td key={j} className="px-3 py-2 text-center">
                      {val === '-' ? <span className="text-gray-300">-</span> : (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          parseFloat(val) > 40 ? 'bg-[#34D399]/20 text-[#065F46]' :
                          parseFloat(val) > 20 ? 'bg-[#F59E0B]/20 text-[#92400E]' :
                          'bg-red-100 text-red-700'
                        }`}>{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-[#065F46] to-[#065F46]/80 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            {sw ? 'Mapendekezo ya AI' : 'AI Insights'}
          </h3>
          <button onClick={generateAIInsight} disabled={generatingInsight} className="px-3 py-1.5 bg-white/20 rounded-lg text-sm hover:bg-white/30 disabled:opacity-50 flex items-center gap-1">
            {generatingInsight ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {generatingInsight ? (sw ? 'Inatengeneza...' : 'Generating...') : (sw ? 'Tengeneza' : 'Generate')}
          </button>
        </div>
        {aiInsight ? (
          <div className="space-y-3 text-sm leading-relaxed">
            {aiInsight.split('\n\n').map((line, i) => (
              <div key={i} className="flex items-start gap-2">
                <Eye className="w-4 h-4 mt-0.5 text-[#34D399] flex-shrink-0" />
                <p>{line}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/70 text-sm">
            {sw ? 'Bonyeza "Tengeneza" kupata mapendekezo ya AI kuhusu data yako' : 'Click "Generate" to get AI-powered insights about your data'}
          </p>
        )}
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-bold text-[#065F46] mb-4">{sw ? 'Matukio ya Hivi Karibu' : 'Recent Events'}</h3>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {events.slice(0, 20).map(e => (
            <div key={e.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
              <div className={`w-2 h-2 rounded-full ${
                e.eventType === 'booking' ? 'bg-green-500' :
                e.eventType === 'signup' ? 'bg-blue-500' :
                e.eventType === 'cancellation' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
              <span className="font-medium text-[#065F46]">{e.eventType}</span>
              {e.value > 0 && <span className="text-gray-500">TZS {e.value.toLocaleString()}</span>}
              <span className="text-xs text-gray-400 ml-auto">{new Date(e.createdAt).toLocaleString()}</span>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-gray-400 text-center py-4">{sw ? 'Hakuna matukio' : 'No events recorded'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
