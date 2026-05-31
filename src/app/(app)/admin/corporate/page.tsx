'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Users, DollarSign, AlertTriangle, CheckCircle,
  XCircle, Eye, Shield, TrendingUp, Calendar, Phone, Mail,
  MoreVertical, ChevronRight, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CorporateAccount {
  id: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  adminUserId: string;
  tier: string;
  teamSize: number;
  monthlyBudget: number;
  spentThisMonth: number;
  status: string;
  createdAt: string;
  members?: CorporateMember[];
}

interface CorporateMember {
  id: string;
  corporateId: string;
  userId: string;
  role: string;
  spendLimit: number;
  canBook: boolean;
  canApprove: boolean;
}

const DEMO_ACCOUNTS: CorporateAccount[] = [
  {
    id: 'corp1',
    companyName: 'Serengeti Tours Ltd',
    companyEmail: 'billing@serengetitours.co.tz',
    companyPhone: '+255 22 123 4567',
    adminUserId: 'admin1',
    tier: 'enterprise',
    teamSize: 15,
    monthlyBudget: 5000000,
    spentThisMonth: 3250000,
    status: 'active',
    createdAt: '2025-09-01',
    members: [
      { id: 'm1', corporateId: 'corp1', userId: 'u1', role: 'admin', spendLimit: 0, canBook: true, canApprove: true },
      { id: 'm2', corporateId: 'corp1', userId: 'u2', role: 'manager', spendLimit: 500000, canBook: true, canApprove: true },
      { id: 'm3', corporateId: 'corp1', userId: 'u3', role: 'member', spendLimit: 200000, canBook: true, canApprove: false },
    ],
  },
  {
    id: 'corp2',
    companyName: 'DarExpress Logistics',
    companyEmail: 'finance@darexpress.co.tz',
    companyPhone: '+255 22 987 6543',
    adminUserId: 'admin2',
    tier: 'business',
    teamSize: 5,
    monthlyBudget: 1500000,
    spentThisMonth: 890000,
    status: 'active',
    createdAt: '2026-01-15',
    members: [
      { id: 'm4', corporateId: 'corp2', userId: 'u4', role: 'admin', spendLimit: 0, canBook: true, canApprove: true },
      { id: 'm5', corporateId: 'corp2', userId: 'u5', role: 'member', spendLimit: 300000, canBook: true, canApprove: false },
    ],
  },
  {
    id: 'corp3',
    companyName: 'Kilimanjaro Adventures',
    companyEmail: 'ops@kiloadventures.co.tz',
    companyPhone: '+255 27 555 1234',
    adminUserId: 'admin3',
    tier: 'business',
    teamSize: 8,
    monthlyBudget: 2000000,
    spentThisMonth: 2100000,
    status: 'suspended',
    createdAt: '2025-11-20',
    members: [],
  },
];

export default function AdminCorporatePage() {
  const [accounts, setAccounts] = useState<CorporateAccount[]>(DEMO_ACCOUNTS);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/corporate');
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.accounts?.length) {
            setAccounts(data.accounts);
          }
        }
      } catch {
        // Use demo data
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = accounts.filter(a =>
    a.companyName.toLowerCase().includes(search.toLowerCase()) ||
    a.companyEmail.toLowerCase().includes(search.toLowerCase())
  );

  const selected = accounts.find(a => a.id === selectedId);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch('/api/corporate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
    } catch {
      // ignore
    }
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const totalSpend = accounts.reduce((a, c) => a + c.spentThisMonth, 0);
  const totalBudget = accounts.reduce((a, c) => a + c.monthlyBudget, 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold gradient-text-green">Corporate Accounts</h1>
        <p className="text-xs text-[#94A3B8] mt-1">Manage B2B accounts, teams, and spending</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Accounts', value: accounts.length, icon: Building2, color: '#34D399' },
          { label: 'Monthly Spend', value: `TZS ${(totalSpend / 1000000).toFixed(1)}M`, icon: DollarSign, color: '#F59E0B' },
          { label: 'Total Team', value: accounts.reduce((a, c) => a + c.teamSize, 0), icon: Users, color: '#A78BFA' },
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

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="w-full pl-9 bg-[#1E293B] border-[#334155] text-white"
        />
      </div>

      {/* Account list */}
      <div className="space-y-3">
        {filtered.map((account, i) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 cursor-pointer hover:border-[#065F46] transition-colors"
            onClick={() => setSelectedId(selectedId === account.id ? null : account.id)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#065F46]/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#34D399]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white truncate">{account.companyName}</p>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                    account.status === 'active'
                      ? 'bg-[#ECFDF5] text-[#065F46]'
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {account.status}
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-[#F59E0B]/10 text-[#F59E0B] uppercase">
                    {account.tier}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8]">{account.companyEmail}</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#94A3B8] transition-transform ${selectedId === account.id ? 'rotate-90' : ''}`} />
            </div>

            {/* Expanded details */}
            {selectedId === account.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-[#334155] space-y-4"
              >
                {/* Budget overview */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-[#0F172A] text-center">
                    <p className="text-xs font-bold text-white">TZS {(account.monthlyBudget / 1000).toFixed(0)}K</p>
                    <p className="text-[10px] text-[#94A3B8]">Budget</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0F172A] text-center">
                    <p className="text-xs font-bold text-[#F59E0B]">TZS {(account.spentThisMonth / 1000).toFixed(0)}K</p>
                    <p className="text-[10px] text-[#94A3B8]">Spent</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0F172A] text-center">
                    <p className={`text-xs font-bold ${account.spentThisMonth > account.monthlyBudget ? 'text-red-400' : 'text-[#34D399]'}`}>
                      TZS {((account.monthlyBudget - account.spentThisMonth) / 1000).toFixed(0)}K
                    </p>
                    <p className="text-[10px] text-[#94A3B8]">Remaining</p>
                  </div>
                </div>

                {/* Budget bar */}
                <div>
                  <div className="w-full h-2 bg-[#0F172A] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((account.spentThisMonth / account.monthlyBudget) * 100, 100)}%`,
                        background: account.spentThisMonth > account.monthlyBudget ? '#F87171' : '#34D399',
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[#94A3B8] mt-1 text-right">
                    {((account.spentThisMonth / account.monthlyBudget) * 100).toFixed(0)}% used
                  </p>
                </div>

                {/* Team */}
                <div>
                  <p className="text-xs font-bold text-white mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#A78BFA]" /> Team Members ({account.teamSize})
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(account.members || []).map(member => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-[#0F172A]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#065F46]/30 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-[#34D399]">{member.role[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-white">{member.userId}</p>
                            <p className="text-[8px] text-[#94A3B8]">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[8px]">
                          {member.canBook && <span className="text-[#34D399]">Book</span>}
                          {member.canApprove && <span className="text-[#F59E0B]">Approve</span>}
                          {member.spendLimit > 0 && (
                            <span className="text-[#94A3B8]">Limit: TZS {(member.spendLimit / 1000).toFixed(0)}K</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {account.status === 'active' ? (
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(account.id, 'suspended'); }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-9 text-xs"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" /> Suspend
                    </Button>
                  ) : (
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(account.id, 'active'); }}
                      className="flex-1 bg-[#065F46] text-white rounded-xl h-9 text-xs"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" /> Activate
                    </Button>
                  )}
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(account.id, 'cancelled'); }}
                    variant="outline"
                    className="flex-1 border-[#334155] text-[#94A3B8] rounded-xl h-9 text-xs"
                  >
                    <XCircle className="w-3 h-3 mr-1" /> Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
