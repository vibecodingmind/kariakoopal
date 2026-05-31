'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, DollarSign, Plus, Trash2, Edit3,
  TrendingUp, Calendar, FileText, Download, Shield,
  UserPlus, ChevronRight, BarChart3, Clock, AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CorporateMember {
  id: string;
  userId: string;
  role: string;
  spendLimit: number;
  canBook: boolean;
  canApprove: boolean;
}

interface Invoice {
  id: string;
  period: string;
  amount: number;
  transactionCount: number;
  status: string;
  createdAt: string;
}

const DEMO_MEMBERS: CorporateMember[] = [
  { id: 'm1', userId: 'john@company.com', role: 'admin', spendLimit: 0, canBook: true, canApprove: true },
  { id: 'm2', userId: 'sarah@company.com', role: 'manager', spendLimit: 500000, canBook: true, canApprove: true },
  { id: 'm3', userId: 'mike@company.com', role: 'member', spendLimit: 200000, canBook: true, canApprove: false },
  { id: 'm4', userId: 'lisa@company.com', role: 'member', spendLimit: 150000, canBook: true, canApprove: false },
];

const DEMO_INVOICES: Invoice[] = [
  { id: 'inv-2026-06', period: 'June 2026', amount: 3250000, transactionCount: 28, status: 'pending', createdAt: '2026-06-01' },
  { id: 'inv-2026-05', period: 'May 2026', amount: 2890000, transactionCount: 24, status: 'paid', createdAt: '2026-05-01' },
  { id: 'inv-2026-04', period: 'April 2026', amount: 1920000, transactionCount: 18, status: 'paid', createdAt: '2026-04-01' },
];

export default function SeekerCorporatePage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [members, setMembers] = useState<CorporateMember[]>(DEMO_MEMBERS);
  const [invoices, setInvoices] = useState<Invoice[]>(DEMO_INVOICES);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [newMemberLimit, setNewMemberLimit] = useState(200000);

  // Company stats
  const monthlyBudget = 5000000;
  const spentThisMonth = 3250000;
  const remaining = monthlyBudget - spentThisMonth;
  const usagePercent = (spentThisMonth / monthlyBudget) * 100;

  const bookingHistory = [
    { id: 'b1', date: 'Jun 4, 2026', guide: 'Amina K.', amount: 85000, status: 'completed' },
    { id: 'b2', date: 'Jun 3, 2026', guide: 'Hassan M.', amount: 120000, status: 'completed' },
    { id: 'b3', date: 'Jun 2, 2026', guide: 'Fatima S.', amount: 65000, status: 'completed' },
    { id: 'b4', date: 'Jun 1, 2026', guide: 'Joseph T.', amount: 95000, status: 'in_progress' },
    { id: 'b5', date: 'May 30, 2026', guide: 'Grace D.', amount: 110000, status: 'completed' },
  ];

  const handleAddMember = async () => {
    if (!newMemberEmail) return;
    try {
      await fetch('/api/corporate/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corporateId: 'current',
          userId: newMemberEmail,
          role: newMemberRole,
          spendLimit: newMemberLimit,
          canBook: true,
          canApprove: newMemberRole === 'admin' || newMemberRole === 'manager',
        }),
      });
    } catch {
      // ignore
    }
    setMembers(prev => [...prev, {
      id: `m${Date.now()}`,
      userId: newMemberEmail,
      role: newMemberRole,
      spendLimit: newMemberLimit,
      canBook: true,
      canApprove: newMemberRole === 'admin' || newMemberRole === 'manager',
    }]);
    setNewMemberEmail('');
    setShowAddMember(false);
  };

  const handleRemoveMember = async (id: string) => {
    try {
      await fetch(`/api/corporate/members?id=${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleGenerateInvoice = async () => {
    try {
      await fetch('/api/corporate/invoicing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corporateId: 'current' }),
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="px-4 py-4 space-y-5 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[#065F46] dark:text-[#34D399]" />
          <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">
            {l('Corporate Dashboard', 'Dashibodi ya Kampuni')}
          </h1>
        </div>
        <p className="text-sm text-[#64748B] mt-1">
          {l('Manage your team and company bookings', 'Simamia timu yako na mahifadhi ya kampuni')}
        </p>
      </motion.div>

      {/* Company overview card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="kcard-green p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-white/70" />
          <p className="text-sm font-bold text-white">Serengeti Tours Ltd</p>
          <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-[#F59E0B] text-white uppercase ml-auto">
            Enterprise
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-white/60">{l('Budget', 'Bajeti')}</p>
            <p className="text-sm font-bold text-white">TZS {(monthlyBudget / 1000000).toFixed(1)}M</p>
          </div>
          <div>
            <p className="text-xs text-white/60">{l('Spent', 'Matumizi')}</p>
            <p className="text-sm font-bold text-[#F59E0B]">TZS {(spentThisMonth / 1000000).toFixed(1)}M</p>
          </div>
          <div>
            <p className="text-xs text-white/60">{l('Remaining', 'Imesalia')}</p>
            <p className="text-sm font-bold text-[#34D399]">TZS {(remaining / 1000000).toFixed(1)}M</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#F59E0B]"
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/50">{usagePercent.toFixed(0)}% used</span>
            {usagePercent > 80 && (
              <span className="text-[10px] text-[#F87171] flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" /> {l('Over budget soon', 'Itazidi bajeti hivi karibuni')}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="team">
        <TabsList className="w-full bg-[#F1F5F9] dark:bg-[#1E293B] rounded-xl p-1">
          <TabsTrigger value="team" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-[#065F46] data-[state=active]:text-white">
            <Users className="w-3 h-3 mr-1" />
            {l('Team', 'Timu')}
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-[#065F46] data-[state=active]:text-white">
            <Calendar className="w-3 h-3 mr-1" />
            {l('Bookings', 'Mahifadhi')}
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-[#065F46] data-[state=active]:text-white">
            <FileText className="w-3 h-3 mr-1" />
            {l('Invoices', 'Ankara')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">
              {members.length} {l('Members', 'Wanachama')}
            </p>
            <Button
              onClick={() => setShowAddMember(!showAddMember)}
              className="bg-[#065F46] text-white rounded-xl h-8 text-xs"
            >
              <UserPlus className="w-3 h-3 mr-1" />
              {l('Add', 'Ongeza')}
            </Button>
          </div>

          {/* Add member form */}
          <AnimatePresence>
            {showAddMember && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="kcard p-4 space-y-3 border-2 border-[#065F46]/20"
              >
                <Input
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder={l('Email address', 'Barua pepe')}
                  className="w-full"
                />
                <div className="flex gap-2">
                  {['member', 'manager', 'admin'].map(role => (
                    <button
                      key={role}
                      onClick={() => setNewMemberRole(role)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        newMemberRole === role
                          ? 'bg-[#065F46] text-white'
                          : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B]'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8]">{l('Spend limit per booking (TZS)', 'Kikomo cha matumizi kwa kuhifadhi (TZS)')} — 0 = {l('unlimited', 'bila kikomo')}</label>
                  <Input
                    type="number"
                    value={newMemberLimit}
                    onChange={(e) => setNewMemberLimit(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <Button onClick={handleAddMember} className="w-full bg-[#065F46] text-white rounded-xl">
                  {l('Add Member', 'Ongeza Mwanachama')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Members list */}
          {members.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="kcard p-3 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-[#065F46]/10 flex items-center justify-center">
                <span className="text-xs font-bold text-[#065F46] dark:text-[#34D399]">
                  {member.userId[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{member.userId}</p>
                  <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-full capitalize ${
                    member.role === 'admin' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                    member.role === 'manager' ? 'bg-[#A78BFA]/10 text-[#A78BFA]' :
                    'bg-[#F1F5F9] text-[#64748B]'
                  }`}>
                    {member.role}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#94A3B8]">
                  {member.spendLimit > 0 && <span>Limit: TZS {(member.spendLimit / 1000).toFixed(0)}K</span>}
                  {member.canApprove && <span className="text-[#F59E0B]">Can Approve</span>}
                </div>
              </div>
              {member.role !== 'admin' && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="bookings" className="mt-4 space-y-3">
          <p className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">
            {l('Recent Bookings', 'Mahifadhi ya Hivi Karibu')}
          </p>
          {bookingHistory.map((booking, i) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="kcard p-3 flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                booking.status === 'completed' ? 'bg-[#ECFDF5]' : 'bg-[#FEF3C7]'
              }`}>
                <Clock className={`w-4 h-4 ${booking.status === 'completed' ? 'text-[#065F46]' : 'text-[#F59E0B]'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{booking.guide}</p>
                <p className="text-xs text-[#94A3B8]">{booking.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">TZS {booking.amount.toLocaleString()}</p>
                <span className={`text-[10px] font-bold ${booking.status === 'completed' ? 'text-[#065F46]' : 'text-[#F59E0B]'}`}>
                  {booking.status}
                </span>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="invoices" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">
              {l('Invoices', 'Ankara')}
            </p>
            <Button
              onClick={handleGenerateInvoice}
              className="bg-[#065F46] text-white rounded-xl h-8 text-xs"
            >
              <FileText className="w-3 h-3 mr-1" />
              {l('Generate', 'Tengeneza')}
            </Button>
          </div>

          {invoices.map((invoice, i) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="kcard p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{invoice.period}</p>
                  <p className="text-xs text-[#94A3B8]">{invoice.transactionCount} transactions</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#065F46] dark:text-[#34D399]">
                    TZS {invoice.amount.toLocaleString()}
                  </p>
                  <span className={`text-[10px] font-bold ${invoice.status === 'paid' ? 'text-[#065F46]' : 'text-[#F59E0B]'}`}>
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
              </div>
              {invoice.status === 'paid' && (
                <Button className="w-full mt-3 bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] rounded-xl h-8 text-xs">
                  <Download className="w-3 h-3 mr-1" />
                  {l('Download PDF', 'Pakua PDF')}
                </Button>
              )}
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
