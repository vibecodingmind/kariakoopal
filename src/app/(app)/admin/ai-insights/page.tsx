'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  DollarSign,
  Users,
  BarChart3,
  Zap,
  Search,
  RefreshCw,
  ChevronRight,
  Send,
  Activity,
  FileText,
  Eye,
  Target,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { toast } from 'sonner';

// ── Types ──

interface KeyMetric {
  label: string;
  value: string;
  change: string;
  changeDirection: 'up' | 'down' | 'neutral';
}

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
}

interface AIInsight {
  summary?: string;
  rawText?: string;
  keyMetrics?: KeyMetric[];
  trendData?: { month: string; value: number }[];
  categoryData?: { name: string; value: number }[];
  flaggedItems?: { entity: string; riskScore: number; reason: string; severity: string }[];
  alertItems?: { severity: string; description: string; timestamp: string; entity: string }[];
  recommendations?: Recommendation[];
  projectedRevenue?: number;
  growthRate?: number;
  riskScore?: number;
  topRevenueStreams?: string[];
  riskFactors?: string[];
  opportunities?: string[];
  churnRisk?: number;
  engagementPatterns?: string[];
  featureAdoption?: string[];
  marketTrends?: string[];
  pricingInsights?: string[];
  demandForecast?: string[];
}

interface PlatformData {
  users: { total: number; seekers: number; guides: number; activeToday: number; newThisWeek: number; churnRisk: number };
  revenue: { totalMTZS: number; thisMonth: number; lastMonth: number; platformFees: number; avgSessionValue: number; projectedNextMonth: number };
  sessions: { active: number; total: number; completed: number; cancelled: number; avgDuration: number };
  fraud: { riskScore: number; flaggedAccounts: number; suspiciousPayouts: number; fakeProfiles: number; resolvedThisWeek: number };
  market: { topCategories: string[]; avgPriceChange: number; demandTrend: string; popularZones: string[] };
  ratings: { average: number; total: number; fiveStar: number; fourStar: number; threeStar: number; twoStar: number; oneStar: number };
}

interface AIAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  timestamp: string;
  entity: string;
}

type QueryType = 'revenue_forecast' | 'user_behavior' | 'fraud_detection' | 'market_intelligence' | 'general';

// ── Mock fallback data ──

const mockTrendData = [
  { month: 'Jul', value: 62000 },
  { month: 'Aug', value: 68000 },
  { month: 'Sep', value: 71000 },
  { month: 'Oct', value: 69000 },
  { month: 'Nov', value: 75000 },
  { month: 'Dec', value: 85000 },
];

const mockCategoryData = [
  { name: 'Electronics', value: 35 },
  { name: 'Fabrics', value: 25 },
  { name: 'Spices', value: 20 },
  { name: 'Kitchenware', value: 12 },
  { name: 'Wholesale', value: 8 },
];

const mockInsights: Record<QueryType, AIInsight> = {
  revenue_forecast: {
    summary: 'Revenue is trending upward with a 18.1% month-over-month growth. Based on current session volume and market demand patterns, we project revenue to reach 95,000 TZS next month. Electronics and Fabric zones are the primary revenue drivers, while the Spice zone shows potential for high-margin growth.',
    keyMetrics: [
      { label: 'Projected Revenue', value: '95K TZS', change: '+18.1%', changeDirection: 'up' },
      { label: 'Growth Rate', value: '18.1%', change: '+3.2%', changeDirection: 'up' },
      { label: 'Avg Session Value', value: '35K TZS', change: '+5.4%', changeDirection: 'up' },
      { label: 'Platform Fees', value: '45K TZS', change: '+12%', changeDirection: 'up' },
    ],
    trendData: mockTrendData,
    categoryData: mockCategoryData,
    recommendations: [
      { title: 'Boost Electronics Zone Guides', description: 'Add 5 more verified guides to Electronics zone to meet 28% demand increase', priority: 'high', impact: '+15% revenue' },
      { title: 'Launch Premium Session Tier', description: 'Introduce premium pricing for specialized vendor negotiation sessions', priority: 'medium', impact: '+8% avg value' },
      { title: 'Optimize Guide Distribution', description: 'Redistribute guides from low-demand zones to high-demand areas during peak hours', priority: 'medium', impact: '+10% utilization' },
    ],
  },
  user_behavior: {
    summary: 'User engagement is strong with 3,200 daily active users (highest this quarter). However, 340 users show churn risk signals including declining session frequency and reduced in-app time. The buddy system feature has seen 45% adoption increase, while shopping list builder adoption remains low at 12%.',
    keyMetrics: [
      { label: 'Active Users Today', value: '3,200', change: '+8.2%', changeDirection: 'up' },
      { label: 'Churn Risk Users', value: '340', change: '-2.1%', changeDirection: 'down' },
      { label: 'Buddy Adoption', value: '45%', change: '+12%', changeDirection: 'up' },
      { label: 'New This Week', value: '180', change: '+15%', changeDirection: 'up' },
    ],
    trendData: [
      { month: 'Jul', value: 2800 },
      { month: 'Aug', value: 2950 },
      { month: 'Sep', value: 3000 },
      { month: 'Oct', value: 3100 },
      { month: 'Nov', value: 3050 },
      { month: 'Dec', value: 3200 },
    ],
    recommendations: [
      { title: 'Re-engagement Campaign', description: 'Send personalized push notifications to 340 churn-risk users with session discounts', priority: 'high', impact: 'Save 60% at-risk users' },
      { title: 'Shopping List Onboarding', description: 'Add in-app tutorial for shopping list builder to boost 12% adoption rate', priority: 'medium', impact: '+20% feature adoption' },
      { title: 'Session Reminder Automation', description: 'Implement automated session reminders 1 hour before scheduled sessions', priority: 'low', impact: '-15% no-shows' },
    ],
  },
  fraud_detection: {
    summary: 'Platform fraud risk score is 23/100 (LOW). However, 3 flagged items require immediate attention: unusual payout spike from 3 guides, 5 accounts registered from the same IP address, and price manipulation detected in the Spice zone with 45% above market average pricing.',
    keyMetrics: [
      { label: 'Risk Score', value: '23/100', change: '-5', changeDirection: 'down' },
      { label: 'Flagged Accounts', value: '5', change: '+3', changeDirection: 'up' },
      { label: 'Suspicious Payouts', value: '2', change: '+2', changeDirection: 'up' },
      { label: 'Resolved This Week', value: '8', change: '+3', changeDirection: 'up' },
    ],
    trendData: [
      { month: 'Jul', value: 35 },
      { month: 'Aug', value: 30 },
      { month: 'Sep', value: 28 },
      { month: 'Oct', value: 32 },
      { month: 'Nov', value: 25 },
      { month: 'Dec', value: 23 },
    ],
    flaggedItems: [
      { entity: 'Guide Hassan M.', riskScore: 85, reason: '5 cancelled sessions in 24h', severity: 'high' },
      { entity: 'Spice Zone Vendors', riskScore: 78, reason: 'Prices 45% above market avg', severity: 'high' },
      { entity: 'Bulk Registration IP', riskScore: 72, reason: '12 accounts from same IP', severity: 'medium' },
      { entity: 'Payout Anomaly Group', riskScore: 68, reason: '3 payouts > 500K TZS in 1h', severity: 'medium' },
    ],
    recommendations: [
      { title: 'Freeze Suspicious Payouts', description: 'Hold payouts for the 3 flagged guides pending manual review', priority: 'high', impact: 'Prevent ~1.5M TZS loss' },
      { title: 'Investigate Bulk Registrations', description: 'Verify 12 accounts from same IP - likely bot activity or fraud ring', priority: 'high', impact: 'Block potential fraud' },
      { title: 'Price Cap Enforcement', description: 'Implement automatic price cap alerts when vendor prices exceed 30% above average', priority: 'medium', impact: 'Prevent price manipulation' },
    ],
  },
  market_intelligence: {
    summary: 'Kariakoo Market shows strong demand growth in Electronics (+28%) and Fabric zones (+15%). Spice prices are volatile with 45% inflation above seasonal norms. Wholesale zone demand is stable. The market is trending toward increased digital payments and group buying patterns.',
    keyMetrics: [
      { label: 'Demand Trend', value: 'Increasing', change: '+12%', changeDirection: 'up' },
      { label: 'Avg Price Change', value: '+3.2%', change: '+1.8%', changeDirection: 'up' },
      { label: 'Electronics Growth', value: '+28%', change: '+8%', changeDirection: 'up' },
      { label: 'Popular Zones', value: '5', change: '+1', changeDirection: 'up' },
    ],
    trendData: [
      { month: 'Jul', value: 72 },
      { month: 'Aug', value: 75 },
      { month: 'Sep', value: 78 },
      { month: 'Oct', value: 82 },
      { month: 'Nov', value: 88 },
      { month: 'Dec', value: 95 },
    ],
    categoryData: mockCategoryData,
    recommendations: [
      { title: 'Expand Electronics Coverage', description: 'Onboard 10 more specialized electronics guides to capture growing demand', priority: 'high', impact: '+25% Electronics revenue' },
      { title: 'Spice Zone Price Monitoring', description: 'Deploy real-time price monitoring alerts for Spice zone volatility', priority: 'high', impact: 'Reduce buyer overpayment' },
      { title: 'Group Tour Packages', description: 'Create group tour packages for high-demand zones during peak hours', priority: 'medium', impact: '+18% session volume' },
    ],
  },
  general: {
    summary: 'Platform health is STRONG with 12,450 total users, 89 active sessions, and an 18.1% revenue growth rate. Key areas of concern: 340 users at churn risk, 5 fraud flags requiring attention, and Spice zone price manipulation. The buddy system and group tours features are gaining traction with 45% and 32% adoption respectively.',
    keyMetrics: [
      { label: 'Total Users', value: '12,450', change: '+4.2%', changeDirection: 'up' },
      { label: 'Active Sessions', value: '89', change: '+12%', changeDirection: 'up' },
      { label: 'Revenue Growth', value: '18.1%', change: '+3.2%', changeDirection: 'up' },
      { label: 'Avg Rating', value: '4.6/5', change: '+0.1', changeDirection: 'up' },
    ],
    trendData: mockTrendData,
    alertItems: [
      { severity: 'critical', description: 'Unusual payout spike: 3 guides > 500K TZS in 1 hour', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), entity: 'Payout System' },
      { severity: 'warning', description: 'Guide Hassan M. has 5 cancelled sessions in 24h', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), entity: 'Guide Hassan M.' },
      { severity: 'info', description: 'Electronics zone demand up 28% this week', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), entity: 'Electronics Zone' },
    ],
    recommendations: [
      { title: 'Address Payout Anomalies', description: 'Review and verify the 3 high-value payout requests immediately', priority: 'high', impact: 'Prevent fraud loss' },
      { title: 'Re-engage Churn-Risk Users', description: 'Launch targeted re-engagement campaign for 340 at-risk users', priority: 'high', impact: 'Retain ~200 users' },
      { title: 'Scale Electronics Guides', description: 'Add more guides to Electronics zone to capture demand surge', priority: 'medium', impact: '+25% zone revenue' },
    ],
  },
};

const CHART_COLORS = ['#34D399', '#FBBF24', '#22D3EE', '#FB7185', '#A78BFA', '#F97316'];

// ── Priority badge color helper ──

function getPriorityBadge(priority: 'high' | 'medium' | 'low') {
  switch (priority) {
    case 'high':
      return <Badge className="bg-red-500/15 text-red-500 border-red-500/20 hover:bg-red-500/25 text-[10px] font-bold uppercase tracking-wider">High</Badge>;
    case 'medium':
      return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/20 hover:bg-amber-500/25 text-[10px] font-bold uppercase tracking-wider">Medium</Badge>;
    case 'low':
      return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/25 text-[10px] font-bold uppercase tracking-wider">Low</Badge>;
  }
}

// ── Alert severity styling ──

function getSeverityStyle(severity: 'critical' | 'warning' | 'info') {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-500', text: 'text-red-400' };
    case 'warning':
      return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-500', text: 'text-amber-400' };
    case 'info':
      return { bg: 'bg-sky-500/10', border: 'border-sky-500/30', dot: 'bg-sky-500', text: 'text-sky-400' };
  }
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Loading Skeleton Component ──

function InsightSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/80 p-6">
        <Skeleton className="h-4 w-3/4 mb-3 bg-[#334155]" />
        <Skeleton className="h-3 w-full mb-2 bg-[#334155]" />
        <Skeleton className="h-3 w-5/6 mb-6 bg-[#334155]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-[#0F172A]/50 p-4">
              <Skeleton className="h-3 w-20 mb-2 bg-[#334155]" />
              <Skeleton className="h-6 w-16 mb-1 bg-[#334155]" />
              <Skeleton className="h-3 w-12 bg-[#334155]" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/80 p-6">
        <Skeleton className="h-48 w-full bg-[#334155]" />
      </div>
      <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/80 p-6">
        <Skeleton className="h-4 w-32 mb-4 bg-[#334155]" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 mb-4">
            <Skeleton className="h-8 w-8 rounded-lg bg-[#334155]" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48 mb-1 bg-[#334155]" />
              <Skeleton className="h-3 w-full bg-[#334155]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ──

export default function AIInsightsPage() {
  const [activeTab, setActiveTab] = useState<QueryType>('general');
  const [insights, setInsights] = useState<Record<QueryType, AIInsight | null>>({
    revenue_forecast: null,
    user_behavior: null,
    fraud_detection: null,
    market_intelligence: null,
    general: null,
  });
  const [platformData, setPlatformData] = useState<PlatformData | null>(null);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [loading, setLoading] = useState<Record<QueryType, boolean>>({
    revenue_forecast: false,
    user_behavior: false,
    fraud_detection: false,
    market_intelligence: false,
    general: false,
  });
  const [initialLoad, setInitialLoad] = useState(true);
  const [aiActive, setAiActive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpResponses, setFollowUpResponses] = useState<Record<QueryType, string[]>>({
    revenue_forecast: [],
    user_behavior: [],
    fraud_detection: [],
    market_intelligence: [],
    general: [],
  });
  const [runningAction, setRunningAction] = useState<string | null>(null);

  // Fetch platform data
  const fetchPlatformData = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/insights');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPlatformData(data.platformData);
          setAlerts(data.alerts || []);
        }
      }
    } catch {
      // Use mock data on error
      setPlatformData({
        users: { total: 12450, seekers: 9950, guides: 2500, activeToday: 3200, newThisWeek: 180, churnRisk: 340 },
        revenue: { totalMTZS: 450000, thisMonth: 85000, lastMonth: 72000, platformFees: 45000, avgSessionValue: 35000, projectedNextMonth: 95000 },
        sessions: { active: 89, total: 15200, completed: 13800, cancelled: 1400, avgDuration: 45 },
        fraud: { riskScore: 23, flaggedAccounts: 5, suspiciousPayouts: 2, fakeProfiles: 3, resolvedThisWeek: 8 },
        market: { topCategories: ['Electronics', 'Fabrics', 'Spices', 'Kitchenware', 'Wholesale'], avgPriceChange: 3.2, demandTrend: 'increasing', popularZones: ['Vyombo', 'Electronics', 'Fabric'] },
        ratings: { average: 4.6, total: 8900, fiveStar: 5200, fourStar: 2400, threeStar: 900, twoStar: 300, oneStar: 100 },
      });
    }
  }, []);

  // Fetch AI insights for a given tab
  const fetchInsights = useCallback(async (queryType: QueryType) => {
    setLoading(prev => ({ ...prev, [queryType]: true }));
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformData, queryType }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.insights) {
          setInsights(prev => ({ ...prev, [queryType]: data.insights }));
          setLastUpdated(new Date());
          return;
        }
      }
    } catch {
      // Fall back to mock data
    }
    // Use mock data
    setInsights(prev => ({ ...prev, [queryType]: mockInsights[queryType] }));
    setLastUpdated(new Date());
    setLoading(prev => ({ ...prev, [queryType]: false }));
  }, [platformData]);

  // Follow-up question handler
  const handleAskAI = useCallback(async () => {
    if (!followUpQuestion.trim()) return;
    const question = followUpQuestion.trim();
    setFollowUpQuestion('');
    setFollowUpLoading(true);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformData, queryType: activeTab, followUpQuestion: question }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.insights) {
          const responseText = data.insights.summary || data.insights.rawText || JSON.stringify(data.insights);
          setFollowUpResponses(prev => ({
            ...prev,
            [activeTab]: [...(prev[activeTab] || []), `Q: ${question}`, `A: ${responseText}`],
          }));
        } else {
          setFollowUpResponses(prev => ({
            ...prev,
            [activeTab]: [...(prev[activeTab] || []), `Q: ${question}`, `A: Based on the current data analysis, I can provide further insights on this topic. Please check the main analysis section for detailed metrics.`],
          }));
        }
      } else {
        throw new Error('API error');
      }
    } catch {
      setFollowUpResponses(prev => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), `Q: ${question}`, `A: I'm currently analyzing this. Based on the available platform data, this is an interesting area to explore further. The key trends suggest continued growth in the current direction.`],
      }));
    }
    setFollowUpLoading(false);
  }, [followUpQuestion, activeTab, platformData]);

  // Quick AI action handler
  const handleQuickAction = useCallback(async (actionId: string, queryType: QueryType) => {
    setRunningAction(actionId);
    setActiveTab(queryType);
    await fetchInsights(queryType);
    setRunningAction(null);
    toast.success('AI analysis complete!');
  }, [fetchInsights]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setInitialLoad(true);
      await fetchPlatformData();
      setInitialLoad(false);
    };
    init();
  }, [fetchPlatformData]);

  // Load insights for the active tab when it changes or when platformData becomes available
  useEffect(() => {
    if (platformData && !insights[activeTab]) {
      fetchInsights(activeTab);
    }
  }, [activeTab, platformData, insights, fetchInsights]);

  // Pulse AI active indicator
  useEffect(() => {
    const interval = setInterval(() => setAiActive(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const currentInsight = insights[activeTab];
  const isLoading = loading[activeTab];

  const tabConfig: { key: QueryType; label: string; icon: typeof DollarSign }[] = [
    { key: 'general', label: 'General', icon: Brain },
    { key: 'revenue_forecast', label: 'Revenue', icon: DollarSign },
    { key: 'user_behavior', label: 'Users', icon: Users },
    { key: 'fraud_detection', label: 'Fraud', icon: Shield },
    { key: 'market_intelligence', label: 'Market', icon: Globe },
  ];

  const quickActions = [
    { id: 'action-revenue', title: 'Generate Revenue Report', description: 'AI-powered revenue analysis with forecasting', icon: DollarSign, queryType: 'revenue_forecast' as QueryType },
    { id: 'action-churn', title: 'Analyze User Churn', description: 'Identify at-risk users and retention strategies', icon: Users, queryType: 'user_behavior' as QueryType },
    { id: 'action-fraud', title: 'Detect Fraud Patterns', description: 'Scan for suspicious activities and anomalies', icon: Shield, queryType: 'fraud_detection' as QueryType },
    { id: 'action-market', title: 'Market Trend Analysis', description: 'Real-time market intelligence and pricing insights', icon: Globe, queryType: 'market_intelligence' as QueryType },
    { id: 'action-demand', title: "Predict Next Week's Demand", description: 'AI demand forecasting for all zones', icon: TrendingUp, queryType: 'market_intelligence' as QueryType },
    { id: 'action-distribute', title: 'Optimize Guide Distribution', description: 'Smart guide allocation recommendations', icon: Target, queryType: 'general' as QueryType },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9]">
      {/* ── AI Insights Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#065F46]/30 via-[#0F172A] to-[#1E293B]" />
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative px-4 pt-6 pb-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#065F46] to-[#34D399] flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                    AI Command Center
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  </h1>
                  <p className="text-sm text-[#94A3B8] mt-0.5">AI-powered platform intelligence</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className={`w-2 h-2 rounded-full ${aiActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-xs font-semibold text-emerald-400">AI Active</span>
                </div>
                <div className="text-xs text-[#94A3B8] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Updated {lastUpdated.toLocaleTimeString()}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { fetchPlatformData(); fetchInsights(activeTab); }}
                  className="text-[#94A3B8] hover:text-white hover:bg-white/5"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="px-4 pb-24 max-w-5xl mx-auto space-y-6 -mt-2">
        {/* ── AI Query Tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as QueryType)}>
            <TabsList className="w-full bg-[#1E293B] border border-[#334155] rounded-xl h-auto p-1.5 flex-wrap">
              {tabConfig.map(tab => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="flex-1 min-w-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#065F46] data-[state=active]:to-[#059669] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/20 text-[#94A3B8] rounded-lg text-xs sm:text-sm py-2 transition-all"
                >
                  <tab.icon className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {tabConfig.map(tab => (
              <TabsContent key={tab.key} value={tab.key}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab.key}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isLoading || initialLoad ? (
                      <InsightSkeleton />
                    ) : (
                      <InsightContent
                        insight={currentInsight}
                        queryType={activeTab}
                        followUpResponses={followUpResponses[activeTab]}
                        followUpQuestion={followUpQuestion}
                        followUpLoading={followUpLoading}
                        onFollowUpChange={setFollowUpQuestion}
                        onAskAI={handleAskAI}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>

        {/* ── AI Alert Panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              AI Alert Panel
            </h2>
            <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[10px] font-bold">
              {alerts.filter(a => a.severity === 'critical').length} Critical
            </Badge>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
            {alerts.map((alert, i) => {
              const style = getSeverityStyle(alert.severity);
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-xl ${style.bg} border ${style.border} p-3 flex items-start gap-3`}
                >
                  <div className={`w-2 h-2 rounded-full ${style.dot} mt-1.5 shrink-0 animate-pulse`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-[#64748B]">{formatTimeAgo(alert.timestamp)}</span>
                    </div>
                    <p className="text-sm text-[#CBD5E1] mt-1 leading-snug">{alert.description}</p>
                    <p className="text-[10px] text-[#64748B] mt-1 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> {alert.entity}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Quick AI Actions Grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-amber-400" />
            Quick AI Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map((action, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="group rounded-2xl border border-[#334155] bg-[#1E293B]/80 backdrop-blur-sm p-4 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#065F46]/40 to-[#059669]/20 flex items-center justify-center">
                    <action.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#475569] group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-emerald-300 transition-colors">{action.title}</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">{action.description}</p>
                <Button
                  size="sm"
                  onClick={() => handleQuickAction(action.id, action.queryType)}
                  disabled={runningAction === action.id}
                  className="w-full bg-gradient-to-r from-[#065F46] to-[#059669] hover:from-[#059669] hover:to-[#34D399] text-white text-xs font-semibold rounded-xl h-9 shadow-lg shadow-emerald-500/10"
                >
                  {runningAction === action.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Run AI
                    </>
                  )}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Insight Content Component ──

function InsightContent({
  insight,
  queryType,
  followUpResponses,
  followUpQuestion,
  followUpLoading,
  onFollowUpChange,
  onAskAI,
}: {
  insight: AIInsight | null;
  queryType: QueryType;
  followUpResponses: string[];
  followUpQuestion: string;
  followUpLoading: boolean;
  onFollowUpChange: (v: string) => void;
  onAskAI: () => void;
}) {
  if (!insight) return <InsightSkeleton />;

  const keyMetrics = insight.keyMetrics || [];
  const trendData = insight.trendData || mockTrendData;
  const categoryData = insight.categoryData || mockCategoryData;
  const recommendations = insight.recommendations || [];
  const summary = insight.summary || insight.rawText || 'Analysis complete. Explore the metrics below for detailed insights.';

  return (
    <div className="space-y-4">
      {/* ── AI Analysis Card ── */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-amber-500/10 to-emerald-500/20 rounded-2xl" />
        <div className="relative rounded-2xl bg-[#1E293B]/95 backdrop-blur-xl border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#065F46] to-[#34D399] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">AI Analysis</h3>
              <p className="text-[10px] text-emerald-400 font-medium">Powered by AI</p>
            </div>
          </div>
          <p className="text-sm text-[#CBD5E1] leading-relaxed mb-5">{summary}</p>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {keyMetrics.map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl bg-[#0F172A]/60 border border-[#334155]/50 p-3"
              >
                <p className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wider mb-1">{metric.label}</p>
                <p className="text-lg font-bold">{metric.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {metric.changeDirection === 'up' ? (
                    <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  ) : metric.changeDirection === 'down' ? (
                    <ArrowDownRight className="w-3 h-3 text-red-400" />
                  ) : null}
                  <span className={`text-xs font-semibold ${metric.changeDirection === 'up' ? 'text-emerald-400' : metric.changeDirection === 'down' ? 'text-red-400' : 'text-[#94A3B8]'}`}>
                    {metric.change}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Data Visualization Area ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Line Chart - Trends */}
        <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/80 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              {queryType === 'revenue_forecast' ? 'Revenue Trend' : queryType === 'user_behavior' ? 'User Activity Trend' : queryType === 'fraud_detection' ? 'Risk Score Trend' : queryType === 'market_intelligence' ? 'Market Demand Index' : 'Platform Trend'}
            </h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={{ stroke: '#334155' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={{ stroke: '#334155' }} />
                <RechartsTooltip
                  contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', color: '#F1F5F9', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#34D399"
                  strokeWidth={2.5}
                  dot={{ fill: '#34D399', strokeWidth: 0, r: 4 }}
                  activeDot={{ fill: '#34D399', strokeWidth: 2, stroke: '#0F172A', r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart or Donut Chart depending on tab */}
        <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/80 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              {queryType === 'fraud_detection' ? 'Flagged Items Risk Score' : 'Category Distribution'}
            </h3>
          </div>

          {queryType === 'fraud_detection' && insight.flaggedItems && insight.flaggedItems.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insight.flaggedItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={{ stroke: '#334155' }} />
                  <YAxis dataKey="entity" type="category" width={100} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={{ stroke: '#334155' }} />
                  <RechartsTooltip
                    contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', color: '#F1F5F9', fontSize: 12 }}
                  />
                  <Bar dataKey="riskScore" radius={[0, 6, 6, 0]}>
                    {insight.flaggedItems.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', color: '#F1F5F9', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-[#CBD5E1]">{cat.name}</span>
                    <span className="text-[#94A3B8] ml-auto">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── AI Recommendations ── */}
      {recommendations.length > 0 && (
        <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/80 backdrop-blur-sm p-5">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-emerald-400" />
            AI Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-[#0F172A]/40 border border-[#334155]/50 hover:border-emerald-500/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-sm">{rec.title}</h4>
                    {getPriorityBadge(rec.priority)}
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{rec.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-emerald-400 font-semibold">Impact: {rec.impact}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2"
                    >
                      Take Action <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ask AI More ── */}
      <div className="rounded-2xl border border-[#334155] bg-[#1E293B]/80 backdrop-blur-sm p-5">
        <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-amber-400" />
          Ask AI More
        </h3>

        {/* Follow-up conversation */}
        {followUpResponses.length > 0 && (
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
            {followUpResponses.map((msg, i) => (
              <div key={i} className={`rounded-xl p-3 text-sm leading-relaxed ${msg.startsWith('Q:') ? 'bg-[#065F46]/20 border border-emerald-500/20 text-emerald-200' : 'bg-[#0F172A]/60 border border-[#334155]/50 text-[#CBD5E1]'}`}>
                {msg}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={followUpQuestion}
            onChange={(e) => onFollowUpChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAskAI()}
            placeholder="Ask a follow-up question..."
            className="flex-1 bg-[#0F172A]/60 border-[#334155] focus:border-emerald-500/50 focus:ring-emerald-500/20 rounded-xl text-sm placeholder:text-[#475569]"
          />
          <Button
            onClick={onAskAI}
            disabled={followUpLoading || !followUpQuestion.trim()}
            className="bg-gradient-to-r from-[#065F46] to-[#059669] hover:from-[#059669] hover:to-[#34D399] text-white rounded-xl px-4 shadow-lg shadow-emerald-500/10"
          >
            {followUpLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
