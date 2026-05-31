'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  DollarSign, Plus, Trash2, ToggleLeft, ToggleRight, Zap,
  Tag, Clock, Calendar, TrendingUp, TrendingDown, Calculator, RefreshCw
} from 'lucide-react';

interface PricingRule {
  id: string;
  zoneId: string;
  guideTier: string;
  ruleType: string;
  multiplier: number;
  conditions: string;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
}

const RULE_TYPES = [
  { value: 'surge', label: 'Surge', icon: TrendingUp, color: 'text-red-500' },
  { value: 'discount', label: 'Discount', icon: TrendingDown, color: 'text-green-500' },
  { value: 'seasonal', label: 'Seasonal', icon: Calendar, color: 'text-[#F59E0B]' },
  { value: 'time_based', label: 'Time-based', icon: Clock, color: 'text-blue-500' },
];

const GUIDE_TIERS = ['all', 'free', 'pro', 'elite'];

export default function PricingAdminPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';

  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [calcBase, setCalcBase] = useState('');
  const [calcZone, setCalcZone] = useState('');
  const [calcTier, setCalcTier] = useState('all');
  const [calcResult, setCalcResult] = useState<Record<string, unknown> | null>(null);

  // New rule form
  const [form, setForm] = useState({
    zoneId: '', guideTier: 'all', ruleType: 'surge', multiplier: 1.5,
    dayOfWeek: '', startTime: '', endTime: '', priority: 0,
    startDate: '', endDate: '',
  });

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pricing-rules');
      const data = await res.json();
      setRules(data.rules || []);
    } catch (err) {
      console.error('Fetch rules error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleAddRule = async () => {
    try {
      const conditions: Record<string, unknown> = {};
      if (form.dayOfWeek) conditions.dayOfWeek = parseInt(form.dayOfWeek);
      if (form.startTime) conditions.startTime = parseInt(form.startTime);
      if (form.endTime) conditions.endTime = parseInt(form.endTime);

      await fetch('/api/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: form.zoneId,
          guideTier: form.guideTier,
          ruleType: form.ruleType,
          multiplier: form.multiplier,
          conditions,
          priority: form.priority,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      });
      setShowAdd(false);
      setForm({ zoneId: '', guideTier: 'all', ruleType: 'surge', multiplier: 1.5, dayOfWeek: '', startTime: '', endTime: '', priority: 0, startDate: '', endDate: '' });
      fetchRules();
    } catch (err) {
      console.error('Add rule error:', err);
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/pricing-rules?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchRules();
    } catch (err) {
      console.error('Toggle rule error:', err);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm(sw ? 'Futa kanuni hii?' : 'Delete this rule?')) return;
    try {
      await fetch(`/api/pricing-rules?id=${id}`, { method: 'DELETE' });
      fetchRules();
    } catch (err) {
      console.error('Delete rule error:', err);
    }
  };

  const calculatePrice = async () => {
    if (!calcBase) return;
    try {
      const res = await fetch('/api/pricing-rules/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basePrice: parseFloat(calcBase),
          zoneId: calcZone || undefined,
          guideTier: calcTier,
        }),
      });
      const data = await res.json();
      setCalcResult(data);
    } catch (err) {
      console.error('Calculate error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#065F46] flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            {sw ? 'Bei ya Dynamiki' : 'Dynamic Pricing Engine'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {sw ? 'Simamia kanuni za bei, ongeza au punguza' : 'Manage pricing rules, surge & discount logic'}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="kbtn flex items-center gap-1 px-4 py-2 bg-[#065F46] text-white rounded-lg text-sm hover:bg-[#065F46]/90">
          <Plus className="w-4 h-4" /> {sw ? 'Kanuni Mpya' : 'New Rule'}
        </button>
      </div>

      {/* Active Rules Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {RULE_TYPES.map(rt => {
          const count = rules.filter(r => r.ruleType === rt.type && r.isActive).length;
          const Icon = rt.icon;
          return (
            <div key={rt.value} className="kcard p-4 bg-white rounded-xl border">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-5 h-5 ${rt.color}`} />
                <span className="text-sm font-medium text-gray-700">{rt.label}</span>
              </div>
              <div className="text-2xl font-bold text-[#065F46]">{count}</div>
              <div className="text-xs text-gray-400">{sw ? 'kanuni hai' : 'active rules'}</div>
            </div>
          );
        })}
      </div>

      {/* Add Rule Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#065F46]">{sw ? 'Ongeza Kanuni Mpya' : 'Add New Pricing Rule'}</h3>
            <div>
              <label className="text-sm font-medium text-gray-700">{sw ? 'Aina ya Kanuni' : 'Rule Type'}</label>
              <select value={form.ruleType} onChange={e => setForm(f => ({ ...f, ruleType: e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                {RULE_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{sw ? 'Kizidishi' : 'Multiplier'}</label>
              <input type="number" step="0.1" value={form.multiplier} onChange={e => setForm(f => ({ ...f, multiplier: parseFloat(e.target.value) || 1 }))} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              <p className="text-xs text-gray-400 mt-1">1.5 = 50% surge, 0.8 = 20% discount</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{sw ? 'Eneo (tupo kwa zote)' : 'Zone ID (empty = all)'}</label>
              <input value={form.zoneId} onChange={e => setForm(f => ({ ...f, zoneId: e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{sw ? 'Daraja la Mwongozo' : 'Guide Tier'}</label>
              <select value={form.guideTier} onChange={e => setForm(f => ({ ...f, guideTier: e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                {GUIDE_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{sw ? 'Kipaumbele' : 'Priority'}</label>
              <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">{sw ? 'Saa ya Kuanza' : 'Start Time'}</label>
                <input type="number" min="0" max="23" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} placeholder="0-23" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{sw ? 'Saa ya Mwisho' : 'End Time'}</label>
                <input type="number" min="0" max="23" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} placeholder="0-23" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">{sw ? 'Tarehe ya Kuanza' : 'Start Date'}</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{sw ? 'Tarehe ya Mwisho' : 'End Date'}</label>
                <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded-lg text-sm">{sw ? 'Ghairi' : 'Cancel'}</button>
              <button onClick={handleAddRule} className="px-4 py-2 bg-[#065F46] text-white rounded-lg text-sm">{sw ? 'Ongeza' : 'Add Rule'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#065F46] text-white">
              <tr>
                <th className="text-left px-4 py-3">{sw ? 'Aina' : 'Type'}</th>
                <th className="text-left px-4 py-3">{sw ? 'Kizidishi' : 'Multiplier'}</th>
                <th className="text-left px-4 py-3">{sw ? 'Eneo' : 'Zone'}</th>
                <th className="text-left px-4 py-3">{sw ? 'Daraja' : 'Tier'}</th>
                <th className="text-left px-4 py-3">{sw ? 'Kipaumbele' : 'Priority'}</th>
                <th className="text-left px-4 py-3">{sw ? 'Hali' : 'Status'}</th>
                <th className="text-right px-4 py-3">{sw ? 'Vitendo' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : rules.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">{sw ? 'Hakuna kanuni' : 'No pricing rules'}</td></tr>
              ) : (
                rules.map(r => {
                  const rt = RULE_TYPES.find(t => t.value === r.ruleType);
                  return (
                    <tr key={r.id} className={`hover:bg-gray-50 ${!r.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {rt && <rt.icon className={`w-4 h-4 ${rt.color}`} />}
                          <span className="font-medium">{rt?.label || r.ruleType}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono font-bold ${r.multiplier > 1 ? 'text-red-500' : r.multiplier < 1 ? 'text-green-500' : 'text-gray-500'}`}>
                          {r.multiplier}x
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{r.zoneId || (sw ? 'Zote' : 'All')}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-[#34D399]/20 text-[#065F46]">{r.guideTier}</span></td>
                      <td className="px-4 py-3 font-mono">{r.priority}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleRule(r.id, r.isActive)}>
                          {r.isActive ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteRule(r.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price Calculator */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-bold text-[#065F46] flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5" /> {sw ? 'Kihesabu Bei' : 'Price Calculator'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">{sw ? 'Bei ya Msingi (TZS)' : 'Base Price (TZS)'}</label>
            <input type="number" value={calcBase} onChange={e => setCalcBase(e.target.value)} placeholder="15000" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{sw ? 'Eneo' : 'Zone ID'}</label>
            <input value={calcZone} onChange={e => setCalcZone(e.target.value)} placeholder="(optional)" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{sw ? 'Daraja' : 'Tier'}</label>
            <select value={calcTier} onChange={e => setCalcTier(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
              {GUIDE_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={calculatePrice} className="w-full px-4 py-2 bg-[#F59E0B] text-white rounded-lg text-sm font-medium hover:bg-[#F59E0B]/90">
              {sw ? 'Hesabu' : 'Calculate'}
            </button>
          </div>
        </div>
        {calcResult && (
          <div className="mt-4 p-4 bg-[#065F46]/5 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500">{sw ? 'Bei ya Msingi' : 'Base Price'}</div>
                <div className="text-lg font-bold text-gray-700">TZS {(calcResult.basePrice as number).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">{sw ? 'Marekebisho' : 'Adjustments'}</div>
                <div className="text-sm">
                  {((calcResult.adjustments as Array<{ruleType: string; multiplier: number}>) || []).map((a, i) => (
                    <span key={i} className="inline-block mr-2 px-2 py-0.5 rounded text-xs bg-white border">
                      {a.ruleType}: {a.multiplier}x
                    </span>
                  ))}
                  {(!calcResult.adjustments || (calcResult.adjustments as unknown[]).length === 0) && <span className="text-gray-400">None</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">{sw ? 'Bei ya Mwisho' : 'Final Price'}</div>
                <div className="text-lg font-bold text-[#065F46]">TZS {(calcResult.finalPrice as number).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
