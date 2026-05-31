'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  Globe, Search, Plus, Save, Download, Upload, RefreshCw,
  Languages, Check, X, Edit3, Trash2, Filter, Sprout
} from 'lucide-react';

const CATEGORIES = ['all', 'general', 'nav', 'auth', 'guide', 'seeker', 'admin'];

interface Translation {
  id: string;
  key: string;
  category: string;
  valueEn: string;
  valueSw: string;
  isEditable: boolean;
  updatedBy: string;
  updatedAt: string;
}

interface CategoryStat {
  category: string;
  count: number;
}

export default function TranslationsCMSPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';

  const [translations, setTranslations] = useState<Translation[]>([]);
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEn, setEditEn] = useState('');
  const [editSw, setEditSw] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newEn, setNewEn] = useState('');
  const [newSw, setNewSw] = useState('');
  const [newCat, setNewCat] = useState('general');
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTranslations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/translations?${params}`);
      const data = await res.json();
      setTranslations(data.translations || []);
      setStats(data.stats || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => { fetchTranslations(); }, [fetchTranslations]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/translations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: true }),
      });
      const data = await res.json();
      alert(sw ? `Imewekwa: ${data.total} funguo, ${data.created} mpya, ${data.updated} zilizosasishwa` : `Seeded: ${data.total} keys, ${data.created} new, ${data.updated} updated`);
      fetchTranslations();
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setSeeding(false);
    }
  };

  const startEdit = (t: Translation) => {
    setEditingId(t.id);
    setEditEn(t.valueEn);
    setEditSw(t.valueSw);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditEn('');
    setEditSw('');
  };

  const saveEdit = async (t: Translation) => {
    setSaving(true);
    try {
      await fetch('/api/admin/translations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: [{ key: t.key, valueEn: editEn, valueSw: editSw }] }),
      });
      setEditingId(null);
      fetchTranslations();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newKey) return;
    try {
      await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newKey, valueEn: newEn, valueSw: newSw, category: newCat }),
      });
      setShowAdd(false);
      setNewKey(''); setNewEn(''); setNewSw('');
      fetchTranslations();
    } catch (err) {
      console.error('Add error:', err);
    }
  };

  const exportJSON = () => {
    const enMap: Record<string, string> = {};
    const swMap: Record<string, string> = {};
    translations.forEach(t => {
      enMap[t.key] = t.valueEn;
      swMap[t.key] = t.valueSw;
    });
    const blob = new Blob([JSON.stringify({ en: enMap, sw: swMap }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chimbo-translations-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const updates: { key: string; valueEn: string; valueSw: string }[] = [];
        const keys = new Set([...Object.keys(data.en || {}), ...Object.keys(data.sw || {})]);
        keys.forEach(k => {
          updates.push({ key: k, valueEn: data.en?.[k] || '', valueSw: data.sw?.[k] || '' });
        });
        await fetch('/api/admin/translations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        });
        fetchTranslations();
        alert(sw ? `Kungeza ${updates.length} tafsiri` : `Imported ${updates.length} translations`);
      } catch {
        alert(sw ? 'Faili halipo sahihi' : 'Invalid JSON file');
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#065F46] flex items-center gap-2">
            <Languages className="w-6 h-6" />
            {sw ? 'Mfumo wa Lugha' : 'Multi-Language CMS'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {sw ? 'Simamia tafsiri za Kiswahili na Kiingereza' : 'Manage Swahili & English translations'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSeed} disabled={seeding} className="kbtn flex items-center gap-1 px-3 py-2 bg-[#065F46] text-white rounded-lg text-sm hover:bg-[#065F46]/90 disabled:opacity-50">
            <Sprout className="w-4 h-4" />
            {seeding ? (sw ? 'Inaweka...' : 'Seeding...') : (sw ? 'Weka Tafsiri' : 'Seed Defaults')}
          </button>
          <button onClick={exportJSON} className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Download className="w-4 h-4" /> {sw ? 'Hamisha' : 'Export'}
          </button>
          <button onClick={importJSON} className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Upload className="w-4 h-4" /> {sw ? 'Leta' : 'Import'}
          </button>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {CATEGORIES.filter(c => c !== 'all').map(cat => {
          const stat = stats.find(s => s.category === cat);
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`p-3 rounded-lg border text-center transition-all ${
                category === cat
                  ? 'bg-[#065F46] text-white border-[#065F46]'
                  : 'bg-white border-gray-200 hover:border-[#34D399]'
              }`}
            >
              <div className="text-xs font-medium uppercase">{cat}</div>
              <div className="text-lg font-bold">{stat?.count || 0}</div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={sw ? 'Tafuta funguo au thamani...' : 'Search key or value...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#34D399] focus:border-transparent"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#34D399]"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c === 'all' ? (sw ? 'Zote' : 'All Categories') : c}</option>
          ))}
        </select>
        <button
          onClick={() => setShowAdd(true)}
          className="kbtn flex items-center gap-1 px-4 py-2 bg-[#065F46] text-white rounded-lg text-sm hover:bg-[#065F46]/90"
        >
          <Plus className="w-4 h-4" /> {sw ? 'Ongeza' : 'Add Key'}
        </button>
      </div>

      {/* Add New Translation Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-[#065F46]">{sw ? 'Ongeza Tafsiri Mpya' : 'Add New Translation'}</h3>
            <div>
              <label className="text-sm font-medium text-gray-700">Key</label>
              <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="e.g. nav_home" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">English</label>
              <input value={newEn} onChange={e => setNewEn(e.target.value)} placeholder="English value" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Swahili</label>
              <input value={newSw} onChange={e => setNewSw(e.target.value)} placeholder="Thamani ya Kiswahili" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select value={newCat} onChange={e => setNewCat(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded-lg text-sm">{sw ? 'Ghairi' : 'Cancel'}</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-[#065F46] text-white rounded-lg text-sm">{sw ? 'Ongeza' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Translations Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#065F46] text-white">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Key</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">English</th>
                <th className="text-left px-4 py-3 font-medium">Swahili</th>
                <th className="text-left px-4 py-3 font-medium">Updated By</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : translations.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">{sw ? 'Hakuna tafsiri' : 'No translations found'}</td></tr>
              ) : (
                translations.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#065F46] font-medium">{t.key}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#34D399]/20 text-[#065F46]">{t.category}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {editingId === t.id ? (
                        <input value={editEn} onChange={e => setEditEn(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                      ) : (
                        <span className="truncate block">{t.valueEn || <span className="text-red-400 italic">empty</span>}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {editingId === t.id ? (
                        <input value={editSw} onChange={e => setEditSw(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                      ) : (
                        <span className="truncate block">{t.valueSw || <span className="text-red-400 italic">tupu</span>}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.updatedBy}</td>
                    <td className="px-4 py-3 text-right">
                      {editingId === t.id ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => saveEdit(t)} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEdit} className="p-1 text-red-500 hover:bg-red-50 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(t)} className="p-1 text-[#065F46] hover:bg-[#34D399]/20 rounded" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-gray-500">
        {sw ? `Jumla: ${translations.length} tafsiri` : `Total: ${translations.length} translations`}
      </div>
    </div>
  );
}
