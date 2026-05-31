'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  AlertTriangle, Clock, User, MessageSquare, CheckCircle2,
  Search, Filter, Eye, ChevronDown, Shield, Camera,
  FileText, ArrowRight, X, Loader2, Send, Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// ── Types ──

interface Dispute {
  id: string;
  sessionId: string;
  filedBy: string;
  against: string;
  category: string;
  description: string;
  evidence: string[];
  status: string;
  resolution: string | null;
  resolvedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
  filedByName?: string;
  againstName?: string;
  sessionAmount?: number;
  autoEscalated?: boolean;
}

// ── Constants ──

const CATEGORIES = [
  { value: 'service_quality', label: 'Service Quality', icon: Star, color: '#F59E0B' },
  { value: 'no_show', label: 'No Show', icon: User, color: '#DC2626' },
  { value: 'overcharging', label: 'Overcharging', icon: AlertTriangle, color: '#7C3AED' },
  { value: 'safety_concern', label: 'Safety Concern', icon: Shield, color: '#DC2626' },
  { value: 'other', label: 'Other', icon: MessageSquare, color: '#64748B' },
] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  open: { label: 'Open', color: '#DC2626', bgColor: '#FEE2E2', borderColor: '#DC2626' },
  under_review: { label: 'Under Review', color: '#F59E0B', bgColor: '#FEF3C7', borderColor: '#F59E0B' },
  resolved: { label: 'Resolved', color: '#10B981', bgColor: '#ECFDF5', borderColor: '#10B981' },
};

const RESOLUTION_CONFIG: Record<string, { label: string; description: string; color: string }> = {
  refund: { label: 'Full Refund', description: 'Refund full amount to seeker', color: '#DC2626' },
  partial_refund: { label: 'Partial Refund', description: 'Split amount between parties', color: '#F59E0B' },
  no_action: { label: 'No Action', description: 'Release payment to guide', color: '#10B981' },
};

// ── Animation ──

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// ── Main Component ──

export default function AdminDisputesPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [disputeMessage, setDisputeMessage] = useState('');
  const [isFileOpen, setIsFileOpen] = useState(false);
  const [newDispute, setNewDispute] = useState({
    sessionId: '',
    category: 'service_quality',
    description: '',
    evidence: [] as string[],
  });

  // Fetch disputes
  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterCategory !== 'all') params.set('category', filterCategory);
      params.set('sortBy', sortBy === 'newest' ? 'createdAt' : 'status');
      params.set('sortOrder', sortBy === 'newest' ? 'desc' : 'asc');

      const res = await fetch(`/api/disputes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);
      }
    } catch {
      // Use demo data
      setDisputes([
        {
          id: 'disp1', sessionId: 'sess1', filedBy: 'demo-seeker-1', against: 'demo-guide-1',
          category: 'no_show', description: 'Guide did not show up at the agreed time and location.',
          evidence: ['Photo of empty meeting point'], status: 'open', resolution: null, resolvedBy: null,
          createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), resolvedAt: null,
          filedByName: 'Sarah Johnson', againstName: 'Hamisi Juma', sessionAmount: 25000,
        },
        {
          id: 'disp2', sessionId: 'sess2', filedBy: 'demo-seeker-1', against: 'demo-guide-2',
          category: 'overcharging', description: 'Was charged more than quoted price.',
          evidence: ['Screenshot of original quote', 'M-Pesa receipt'], status: 'under_review', resolution: null, resolvedBy: null,
          createdAt: new Date(Date.now() - 86400000).toISOString(), resolvedAt: null,
          filedByName: 'Sarah Johnson', againstName: 'Fatma Hassan', sessionAmount: 35000,
        },
        {
          id: 'disp3', sessionId: 'sess3', filedBy: 'demo-guide-3', against: 'demo-seeker-1',
          category: 'service_quality', description: 'Seeker was abusive during the tour session.',
          evidence: ['Chat screenshot'], status: 'open', resolution: null, resolvedBy: null,
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), resolvedAt: null,
          filedByName: 'Asha Mohamed', againstName: 'Sarah Johnson', sessionAmount: 40000,
          autoEscalated: true,
        },
        {
          id: 'disp4', sessionId: 'sess4', filedBy: 'demo-seeker-1', against: 'demo-guide-4',
          category: 'safety_concern', description: 'Guide took me to unsafe areas.',
          evidence: ['GPS route screenshot'], status: 'resolved', resolution: 'partial_refund', resolvedBy: 'admin',
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), resolvedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          filedByName: 'Sarah Johnson', againstName: 'Mwanaildi Juma', sessionAmount: 30000,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, filterCategory, sortBy]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  // Resolve dispute
  const handleResolve = useCallback(async (disputeId: string, resolution: string) => {
    setIsResolving(true);
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', disputeId, resolution, resolvedBy: 'admin' }),
      });
      if (res.ok) {
        await fetchDisputes();
        setSelectedDispute(null);
      }
    } catch {
      // Error handling
    } finally {
      setIsResolving(false);
    }
  }, [fetchDisputes]);

  // File new dispute
  const handleFileDispute = useCallback(async () => {
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'file',
          sessionId: newDispute.sessionId,
          filedBy: 'demo-seeker-1',
          against: 'demo-guide-1',
          category: newDispute.category,
          description: newDispute.description,
          evidence: newDispute.evidence,
        }),
      });
      if (res.ok) {
        await fetchDisputes();
        setIsFileOpen(false);
        setNewDispute({ sessionId: '', category: 'service_quality', description: '', evidence: [] });
      }
    } catch {
      // Error handling
    }
  }, [newDispute, fetchDisputes]);

  // Send message
  const handleSendMessage = useCallback(async (disputeId: string) => {
    if (!disputeMessage.trim()) return;
    try {
      await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'message', disputeId, message: disputeMessage }),
      });
      setDisputeMessage('');
    } catch {
      // Error handling
    }
  }, [disputeMessage]);

  // Stats
  const openCount = disputes.filter(d => d.status === 'open').length;
  const reviewCount = disputes.filter(d => d.status === 'under_review').length;
  const resolvedCount = disputes.filter(d => d.status === 'resolved').length;

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Disputes', 'Migogoro')}</h1>
        <p className="text-sm text-[#64748B] mt-1">{l('Review and resolve disputes', 'Kagua na suluhisha migogoro')}</p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: l('Open', 'Wazi'), count: openCount, color: '#DC2626', bg: '#FEE2E2' },
          { label: l('Reviewing', 'Inakaguliwa'), count: reviewCount, color: '#F59E0B', bg: '#FEF3C7' },
          { label: l('Resolved', 'Imesuluhishwa'), count: resolvedCount, color: '#10B981', bg: '#ECFDF5' },
        ].map((stat) => (
          <div key={stat.label} className="kcard p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.count}</p>
            <p className="text-[10px] text-[#64748B] font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[120px] h-9 text-xs">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="status">By Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dispute List */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-[#F1F5F9] dark:bg-[#334155] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <div className="kcard p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto mb-2" />
            <p className="text-sm font-medium">{l('No disputes found', 'Hakuna migogoro')}</p>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
            {disputes.map((dispute, i) => {
              const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
              const categoryConfig = CATEGORIES.find(c => c.value === dispute.category);
              const CategoryIcon = categoryConfig?.icon || AlertTriangle;

              return (
                <motion.div
                  key={dispute.id}
                  variants={itemVariants}
                  className={`kcard p-4 border-l-4`}
                  style={{ borderLeftColor: statusConfig.borderColor }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="text-[9px] h-5 px-2 border-0 font-bold" style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}>
                        {statusConfig.label.toUpperCase()}
                      </Badge>
                      {dispute.autoEscalated && (
                        <Badge className="text-[8px] h-5 px-1.5 bg-[#7C3AED]/10 text-[#7C3AED] border-0">
                          AUTO-ESCALATED
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-[#64748B] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Category & Description */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <CategoryIcon className="w-3.5 h-3.5" style={{ color: categoryConfig?.color || '#64748B' }} />
                    <span className="text-xs font-semibold" style={{ color: categoryConfig?.color || '#64748B' }}>
                      {categoryConfig?.label || dispute.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-2 line-clamp-2">{dispute.description}</p>

                  {/* Parties */}
                  <div className="flex items-center gap-3 text-xs text-[#64748B] mb-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {dispute.filedByName || dispute.filedBy} vs {dispute.againstName || dispute.against}
                    </span>
                    {dispute.sessionAmount && (
                      <span className="font-medium text-[#065F46]">TZS {dispute.sessionAmount.toLocaleString()}</span>
                    )}
                  </div>

                  {/* Evidence */}
                  {dispute.evidence && dispute.evidence.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Camera className="w-3 h-3 text-[#64748B]" />
                      {dispute.evidence.map((e, idx) => (
                        <Badge key={idx} variant="outline" className="text-[8px] h-4 px-1.5">
                          {e.length > 20 ? e.substring(0, 20) + '...' : e}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Resolution badge */}
                  {dispute.resolution && (
                    <div className="mb-3">
                      <Badge className="text-[9px] h-5 px-2 border-0" style={{
                        backgroundColor: RESOLUTION_CONFIG[dispute.resolution]?.color ? `${RESOLUTION_CONFIG[dispute.resolution].color}15` : '#F1F5F9',
                        color: RESOLUTION_CONFIG[dispute.resolution]?.color || '#64748B',
                      }}>
                        {RESOLUTION_CONFIG[dispute.resolution]?.label || dispute.resolution}
                      </Badge>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setSelectedDispute(dispute)}
                          className="kbtn flex-1 text-xs py-2 flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          {l('Review', 'Kagua')}
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-[#065F46] dark:text-[#34D399]">
                            <Shield className="w-5 h-5" />
                            Dispute Review
                          </DialogTitle>
                        </DialogHeader>
                        {selectedDispute && (
                          <DisputeReviewPanel
                            dispute={selectedDispute}
                            onResolve={handleResolve}
                            isResolving={isResolving}
                            message={disputeMessage}
                            setMessage={setDisputeMessage}
                            onSendMessage={handleSendMessage}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    {dispute.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolve(dispute.id, 'refund')}
                        disabled={isResolving}
                        className="kbtn-outline flex-1 text-xs py-2 flex items-center justify-center gap-1 border-[#10B981] text-[#10B981] hover:bg-[#ECFDF5]"
                      >
                        {isResolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        {l('Quick Resolve', 'Suluhisha Haraka')}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Dispute Review Panel ──

function DisputeReviewPanel({
  dispute,
  onResolve,
  isResolving,
  message,
  setMessage,
  onSendMessage,
}: {
  dispute: Dispute;
  onResolve: (id: string, resolution: string) => Promise<void>;
  isResolving: boolean;
  message: string;
  setMessage: (v: string) => void;
  onSendMessage: (id: string) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      {/* Dispute details */}
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">Status</span>
            <span className="font-semibold" style={{ color: STATUS_CONFIG[dispute.status]?.color }}>
              {STATUS_CONFIG[dispute.status]?.label}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">Category</span>
            <span className="font-semibold">{CATEGORIES.find(c => c.value === dispute.category)?.label}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">Filed by</span>
            <span className="font-semibold">{dispute.filedByName || dispute.filedBy}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">Against</span>
            <span className="font-semibold">{dispute.againstName || dispute.against}</span>
          </div>
          {dispute.sessionAmount && (
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Amount</span>
              <span className="font-semibold text-[#065F46]">TZS {dispute.sessionAmount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-[#64748B] mb-1">Description</p>
          <p className="text-sm">{dispute.description}</p>
        </div>

        {/* Evidence */}
        {dispute.evidence.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#64748B] mb-1">Evidence</p>
            <div className="flex flex-wrap gap-2">
              {dispute.evidence.map((e, i) => (
                <Badge key={i} variant="outline" className="text-xs">{e}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Messaging */}
        <div>
          <p className="text-xs font-semibold text-[#64748B] mb-2">Message Parties</p>
          <div className="flex gap-2">
            <Input
              placeholder="Type a message to both parties..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-xs"
            />
            <Button
              size="sm"
              onClick={() => onSendMessage(dispute.id)}
              disabled={!message.trim()}
              className="bg-[#065F46] hover:bg-[#059669]"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Resolution options */}
        {dispute.status !== 'resolved' && (
          <div>
            <p className="text-xs font-semibold text-[#64748B] mb-2">Resolve Dispute</p>
            <div className="space-y-2">
              {Object.entries(RESOLUTION_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => onResolve(dispute.id, key)}
                  disabled={isResolving}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-[#E2E8F0] dark:border-[#334155] hover:border-[#065F46] dark:hover:border-[#34D399] transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                  <div>
                    <p className="text-sm font-semibold">{config.label}</p>
                    <p className="text-xs text-[#64748B]">{config.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
