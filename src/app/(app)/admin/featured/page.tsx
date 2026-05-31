'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket, Star, Eye, MousePointerClick, CheckCircle, XCircle,
  Pause, Play, Search, TrendingUp, DollarSign, Calendar
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface FeaturedListing {
  id: string;
  guideId: string;
  type: string;
  targetId: string;
  zoneId: string;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  cost: number;
  status: string;
  createdAt: string;
}

const DEMO_LISTINGS: FeaturedListing[] = [
  { id: 'f1', guideId: 'g1', type: 'profile', targetId: '', zoneId: 'zone1', startDate: '2026-06-01', endDate: '2026-06-07', impressions: 567, clicks: 45, cost: 35000, status: 'active', createdAt: '2026-06-01' },
  { id: 'f2', guideId: 'g2', type: 'package', targetId: 'pkg1', zoneId: '', startDate: '2026-06-02', endDate: '2026-06-09', impressions: 312, clicks: 22, cost: 21000, status: 'active', createdAt: '2026-06-02' },
  { id: 'f3', guideId: 'g3', type: 'profile', targetId: '', zoneId: 'zone2', startDate: '2026-06-03', endDate: '2026-06-05', impressions: 189, clicks: 8, cost: 20000, status: 'paused', createdAt: '2026-06-03' },
  { id: 'f4', guideId: 'g4', type: 'tour', targetId: 'tour1', zoneId: 'zone1', startDate: '2026-05-20', endDate: '2026-05-25', impressions: 890, clicks: 72, cost: 24000, status: 'expired', createdAt: '2026-05-20' },
];

export default function AdminFeaturedPage() {
  const [listings, setListings] = useState<FeaturedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Pricing configuration
  const [profilePrice, setProfilePrice] = useState(5000);
  const [packagePrice, setPackagePrice] = useState(3000);
  const [tourPrice, setTourPrice] = useState(4000);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/featured?status=active');
        if (!cancelled && res.ok) {
          const data = await res.json();
          setListings(data.listings?.length ? data.listings : DEMO_LISTINGS);
        } else if (!cancelled) {
          setListings(DEMO_LISTINGS);
        }
      } catch {
        if (!cancelled) setListings(DEMO_LISTINGS);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = listings.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false;
    return true;
  });

  const totalImpressions = listings.reduce((a, b) => a + b.impressions, 0);
  const totalClicks = listings.reduce((a, b) => a + b.clicks, 0);
  const totalRevenue = listings.reduce((a, b) => a + b.cost, 0);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/featured/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    } catch {
      // Fallback: update locally
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold gradient-text-green">Featured Listings</h1>
        <p className="text-xs text-[#94A3B8] mt-1">Manage boost requests, pricing, and analytics</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Impressions', value: totalImpressions.toLocaleString(), icon: Eye, color: '#34D399' },
          { label: 'Clicks', value: totalClicks.toLocaleString(), icon: MousePointerClick, color: '#F59E0B' },
          { label: 'Revenue', value: `TZS ${(totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, color: '#A78BFA' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#1E293B] border border-[#334155] rounded-xl p-3 text-center"
          >
            <stat.icon className="w-4 h-4 mx-auto mb-1" style={{ color: stat.color }} />
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-[#94A3B8]">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Pricing Config */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[#334155]">
          <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <h2 className="text-sm font-bold text-white">Boost Pricing</h2>
        </div>
        <div className="px-5 py-4 space-y-3">
          {[
            { label: 'Profile Boost / day', value: profilePrice, setter: setProfilePrice },
            { label: 'Package Boost / day', value: packagePrice, setter: setPackagePrice },
            { label: 'Tour Boost / day', value: tourPrice, setter: setTourPrice },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between gap-3">
              <p className="text-sm text-[#F1F5F9]">{item.label}</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={item.value}
                  onChange={(e) => item.setter(Number(e.target.value))}
                  className="w-28 h-8 bg-[#0F172A] border-[#475569] text-[#F1F5F9] text-sm text-right"
                />
                <span className="text-xs text-[#94A3B8]">TZS</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {['all', 'active', 'paused', 'expired'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              filter === tab
                ? 'bg-[#065F46] text-white'
                : 'bg-[#1E293B] text-[#94A3B8] border border-[#334155]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Listings */}
      <div className="space-y-3">
        {filtered.map((listing, i) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-[#1E293B] border border-[#334155] rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#065F46] text-[#34D399] uppercase">
                  {listing.type}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  listing.status === 'active' ? 'bg-[#ECFDF5] text-[#065F46]' :
                  listing.status === 'paused' ? 'bg-[#FEF3C7] text-[#92400E]' :
                  'bg-[#F1F5F9] text-[#64748B]'
                }`}>
                  {listing.status}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {listing.status === 'active' && (
                  <button
                    onClick={() => handleStatusChange(listing.id, 'paused')}
                    className="p-1.5 rounded-lg bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A] transition-colors"
                    title="Pause"
                  >
                    <Pause className="w-3 h-3" />
                  </button>
                )}
                {listing.status === 'paused' && (
                  <button
                    onClick={() => handleStatusChange(listing.id, 'active')}
                    className="p-1.5 rounded-lg bg-[#ECFDF5] text-[#065F46] hover:bg-[#D1FAE5] transition-colors"
                    title="Resume"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => handleStatusChange(listing.id, 'cancelled')}
                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  title="Cancel"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="p-2 rounded-lg bg-[#0F172A] text-center">
                <Eye className="w-3 h-3 text-[#64748B] mx-auto" />
                <p className="text-xs font-bold text-white mt-1">{listing.impressions}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#0F172A] text-center">
                <MousePointerClick className="w-3 h-3 text-[#64748B] mx-auto" />
                <p className="text-xs font-bold text-white mt-1">{listing.clicks}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#0F172A] text-center">
                <TrendingUp className="w-3 h-3 text-[#64748B] mx-auto" />
                <p className="text-xs font-bold text-white mt-1">{listing.impressions > 0 ? ((listing.clicks / listing.impressions) * 100).toFixed(1) : '0'}%</p>
              </div>
              <div className="p-2 rounded-lg bg-[#0F172A] text-center">
                <DollarSign className="w-3 h-3 text-[#64748B] mx-auto" />
                <p className="text-xs font-bold text-[#F59E0B] mt-1">{(listing.cost / 1000).toFixed(0)}K</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#64748B]">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(listing.startDate).toLocaleDateString()} — {new Date(listing.endDate).toLocaleDateString()}
              </div>
              <span>Guide: {listing.guideId.slice(0, 8)}...</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
