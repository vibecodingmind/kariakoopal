'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, CheckCircle2, XCircle, AlertTriangle,
  Search, Download, PlayCircle, RotateCcw, Eye,
  Wallet, TrendingUp, DollarSign, XSquare,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ── Types ──

type PayoutStatus = 'pending' | 'completed' | 'failed';
type PaymentMethod = 'M-Pesa' | 'Tigo Pesa' | 'Airtel Money';

interface Payout {
  id: string;
  guideName: string;
  initials: string;
  amount: number;
  method: PaymentMethod;
  status: PayoutStatus;
  requestedDate: string;
  phone: string;
}

// ── Demo Data ──

const PAYOUTS: Payout[] = [
  {
    id: 'po1',
    guideName: 'Fatma Hassan',
    initials: 'FH',
    amount: 350000,
    method: 'M-Pesa',
    status: 'pending',
    requestedDate: '2025-06-01',
    phone: '+255 712 345 678',
  },
  {
    id: 'po2',
    guideName: 'Omar Said',
    initials: 'OS',
    amount: 520000,
    method: 'M-Pesa',
    status: 'pending',
    requestedDate: '2025-06-01',
    phone: '+255 713 456 789',
  },
  {
    id: 'po3',
    guideName: 'Amina Khalfan',
    initials: 'AK',
    amount: 180000,
    method: 'Tigo Pesa',
    status: 'pending',
    requestedDate: '2025-05-31',
    phone: '+255 654 321 098',
  },
  {
    id: 'po4',
    guideName: 'James Mwangi',
    initials: 'JM',
    amount: 450000,
    method: 'M-Pesa',
    status: 'completed',
    requestedDate: '2025-05-30',
    phone: '+255 714 567 890',
  },
  {
    id: 'po5',
    guideName: 'Mwanamvua Juma',
    initials: 'MJ',
    amount: 280000,
    method: 'Airtel Money',
    status: 'completed',
    requestedDate: '2025-05-29',
    phone: '+255 783 210 987',
  },
  {
    id: 'po6',
    guideName: 'Hassan Bakari',
    initials: 'HB',
    amount: 95000,
    method: 'M-Pesa',
    status: 'failed',
    requestedDate: '2025-05-28',
    phone: '+255 715 678 901',
  },
  {
    id: 'po7',
    guideName: 'Said Abdallah',
    initials: 'SA',
    amount: 320000,
    method: 'Tigo Pesa',
    status: 'completed',
    requestedDate: '2025-05-27',
    phone: '+255 655 432 109',
  },
  {
    id: 'po8',
    guideName: 'David Kimaro',
    initials: 'DK',
    amount: 150000,
    method: 'M-Pesa',
    status: 'failed',
    requestedDate: '2025-05-26',
    phone: '+255 716 789 012',
  },
];

// ── Helpers ──

const METHOD_CONFIG: Record<PaymentMethod, { color: string; bg: string; icon: typeof Wallet }> = {
  'M-Pesa': { color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', icon: Wallet },
  'Tigo Pesa': { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)', icon: Wallet },
  'Airtel Money': { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.12)', icon: Wallet },
};

const STATUS_CONFIG: Record<PayoutStatus, { color: string; bg: string; label: string; icon: typeof Clock }> = {
  pending: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', label: 'Pending', icon: Clock },
  completed: { color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', label: 'Completed', icon: CheckCircle2 },
  failed: { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.12)', label: 'Failed', icon: XCircle },
};

const INITIALS_COLORS = [
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-rose-500 to-pink-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-pink-600',
  'from-sky-500 to-indigo-600',
];

function formatTZS(amount: number): string {
  return `TZS ${amount.toLocaleString()}`;
}

// ══════════════════════════════════════
// Main Page
// ══════════════════════════════════════

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingAll, setProcessingAll] = useState(false);

  // Filter payouts
  const filteredPayouts = PAYOUTS.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch = p.guideName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = PAYOUTS.filter((p) => p.status === 'pending').length;
  const failedCount = PAYOUTS.filter((p) => p.status === 'failed').length;

  const handleProcessAll = () => {
    setProcessingAll(true);
    setTimeout(() => setProcessingAll(false), 2000);
  };

  const exportCSV = () => {
    const headers = 'Guide Name,Amount (TZS),Method,Status,Requested Date,Phone\n';
    const rows = filteredPayouts
      .map(
        (p) =>
          `"${p.guideName}",${p.amount},${p.method},${p.status},${p.requestedDate},${p.phone}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chimbo-payouts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <button
          onClick={() => router.push('/admin')}
          className="w-9 h-9 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-white/60 hover:text-white hover:bg-[#334155] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold gradient-text-green">Payout Management</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Process and manage guide payouts
          </p>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════
          Summary Cards
          ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {[
          {
            icon: Clock,
            label: 'Pending Payouts',
            value: 'TZS 2,450,000',
            color: '#F59E0B',
            bg: 'rgba(245, 158, 11, 0.08)',
            border: 'rgba(245, 158, 11, 0.15)',
          },
          {
            icon: CheckCircle2,
            label: 'Completed This Month',
            value: 'TZS 12,800,000',
            color: '#059669',
            bg: 'rgba(5, 150, 105, 0.08)',
            border: 'rgba(5, 150, 105, 0.15)',
          },
          {
            icon: TrendingUp,
            label: 'Average Payout',
            value: 'TZS 85,000',
            color: '#22D3EE',
            bg: 'rgba(34, 211, 238, 0.08)',
            border: 'rgba(34, 211, 238, 0.15)',
          },
          {
            icon: XCircle,
            label: 'Failed Payouts',
            value: '3',
            color: '#DC2626',
            bg: 'rgba(220, 38, 38, 0.08)',
            border: 'rgba(220, 38, 38, 0.15)',
          },
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 + i * 0.04 }}
            className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 hover:border-opacity-50 transition-colors"
            style={{ borderColor: card.border }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: card.bg }}
              >
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-lg font-bold text-white">{card.value}</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ══════════════════════════════════════
          Filters & Search
          ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by guide name..."
            className="w-full h-10 bg-[#1E293B] border-[#334155] text-[#F1F5F9] text-sm rounded-xl pl-10 focus:border-[#34D399] focus:ring-[#34D399]/20 placeholder:text-[#64748B]"
          />
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10 bg-[#1E293B] border-[#334155] text-[#F1F5F9] text-sm rounded-xl focus:border-[#34D399] focus:ring-[#34D399]/20">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1E293B] border-[#334155] text-[#F1F5F9]">
            <SelectItem value="all" className="focus:bg-[#334155] focus:text-white">All Statuses</SelectItem>
            <SelectItem value="pending" className="focus:bg-[#334155] focus:text-white">Pending</SelectItem>
            <SelectItem value="completed" className="focus:bg-[#334155] focus:text-white">Completed</SelectItem>
            <SelectItem value="failed" className="focus:bg-[#334155] focus:text-white">Failed</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* ══════════════════════════════════════
          Bulk Actions
          ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-2"
      >
        <Button
          onClick={handleProcessAll}
          disabled={processingAll || pendingCount === 0}
          className="bg-gradient-to-r from-[#065F46] to-[#059669] hover:from-[#059669] hover:to-[#34D399] text-white font-semibold rounded-xl h-9 px-4 shadow-lg shadow-emerald-500/15 transition-all hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {processingAll ? (
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <PlayCircle className="w-4 h-4" />
              Process All Pending ({pendingCount})
            </div>
          )}
        </Button>
        <Button
          onClick={exportCSV}
          variant="outline"
          className="border-[#475569] text-[#94A3B8] hover:bg-[#334155] hover:text-white rounded-xl h-9 px-4 transition-colors"
        >
          <Download className="w-4 h-4 mr-1.5" />
          Export CSV
        </Button>
      </motion.div>

      {/* ══════════════════════════════════════
          Payouts Table
          ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden"
      >
        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-[#334155] hover:bg-transparent">
                <TableHead className="text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">
                  Guide
                </TableHead>
                <TableHead className="text-[#94A3B8] font-semibold text-xs uppercase tracking-wider text-right">
                  Amount
                </TableHead>
                <TableHead className="text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">
                  Method
                </TableHead>
                <TableHead className="text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">
                  Requested
                </TableHead>
                <TableHead className="text-[#94A3B8] font-semibold text-xs uppercase tracking-wider text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayouts.map((payout, i) => {
                const methodConf = METHOD_CONFIG[payout.method];
                const statusConf = STATUS_CONFIG[payout.status];
                const MethodIcon = methodConf.icon;
                const StatusIcon = statusConf.icon;
                const gradientIdx = i % INITIALS_COLORS.length;

                return (
                  <motion.tr
                    key={payout.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i }}
                    className="border-[#334155] hover:bg-[#334155]/30 transition-colors"
                  >
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${INITIALS_COLORS[gradientIdx]} flex items-center justify-center shrink-0 shadow-md`}
                        >
                          <span className="text-white text-xs font-bold">
                            {payout.initials}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#F1F5F9] truncate">
                            {payout.guideName}
                          </p>
                          <p className="text-[11px] text-[#64748B]">{payout.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 text-right">
                      <span className="text-sm font-bold text-white">
                        {formatTZS(payout.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{
                          background: methodConf.bg,
                          color: methodConf.color,
                        }}
                      >
                        <MethodIcon className="w-3.5 h-3.5" />
                        {payout.method}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{
                          background: statusConf.bg,
                          color: statusConf.color,
                        }}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConf.label}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <span className="text-sm text-[#94A3B8]">
                        {payout.requestedDate}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 text-right">
                      {payout.status === 'pending' && (
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs font-semibold bg-gradient-to-r from-[#065F46] to-[#059669] text-white rounded-lg hover:from-[#059669] hover:to-[#34D399] shadow-sm shadow-emerald-500/15 transition-all active:scale-95"
                        >
                          <PlayCircle className="w-3.5 h-3.5 mr-1" />
                          Process
                        </Button>
                      )}
                      {payout.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs font-semibold border-[#DC2626]/40 text-[#F87171] hover:bg-[#DC2626]/10 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Retry
                        </Button>
                      )}
                      {payout.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-[#334155] rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                      )}
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-[#334155]">
          {filteredPayouts.map((payout, i) => {
            const methodConf = METHOD_CONFIG[payout.method];
            const statusConf = STATUS_CONFIG[payout.status];
            const MethodIcon = methodConf.icon;
            const StatusIcon = statusConf.icon;
            const gradientIdx = i % INITIALS_COLORS.length;

            return (
              <motion.div
                key={payout.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
                className="p-4 space-y-3"
              >
                {/* Row 1: Avatar + Name + Amount */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${INITIALS_COLORS[gradientIdx]} flex items-center justify-center shrink-0 shadow-md`}
                    >
                      <span className="text-white text-xs font-bold">
                        {payout.initials}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#F1F5F9]">
                        {payout.guideName}
                      </p>
                      <p className="text-[11px] text-[#64748B]">{payout.phone}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {formatTZS(payout.amount)}
                  </span>
                </div>

                {/* Row 2: Method + Status + Date */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                    style={{ background: methodConf.bg, color: methodConf.color }}
                  >
                    <MethodIcon className="w-3 h-3" />
                    {payout.method}
                  </div>
                  <div
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                    style={{ background: statusConf.bg, color: statusConf.color }}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusConf.label}
                  </div>
                  <span className="text-[11px] text-[#64748B]">
                    {payout.requestedDate}
                  </span>
                </div>

                {/* Row 3: Action */}
                <div>
                  {payout.status === 'pending' && (
                    <Button
                      size="sm"
                      className="h-8 px-4 text-xs font-semibold bg-gradient-to-r from-[#065F46] to-[#059669] text-white rounded-lg hover:from-[#059669] hover:to-[#34D399] shadow-sm shadow-emerald-500/15 w-full active:scale-95"
                    >
                      <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                      Process Payout
                    </Button>
                  )}
                  {payout.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-4 text-xs font-semibold border-[#DC2626]/40 text-[#F87171] hover:bg-[#DC2626]/10 rounded-lg w-full"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Retry Payout
                    </Button>
                  )}
                  {payout.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-4 text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-[#334155] rounded-lg w-full"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View Details
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredPayouts.length === 0 && (
          <div className="py-16 text-center">
            <DollarSign className="w-10 h-10 text-[#475569] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#94A3B8]">No payouts found</p>
            <p className="text-xs text-[#64748B] mt-1">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </motion.div>

      {/* Footer stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex items-center justify-between text-xs text-[#64748B] px-1"
      >
        <span>
          Showing {filteredPayouts.length} of {PAYOUTS.length} payouts
        </span>
        {pendingCount > 0 && (
          <span className="text-[#F59E0B] font-medium">
            {pendingCount} pending &middot; {failedCount} failed
          </span>
        )}
      </motion.div>
    </div>
  );
}
