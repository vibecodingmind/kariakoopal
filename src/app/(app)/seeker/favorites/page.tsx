'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Heart, Star, MapPin, Store, Compass, X, ShieldCheck, Trash2, Zap, Scissors, Package, Flower2, ChefHat, Paintbrush, Clock, FolderPlus, Share2, Plus, Folder, ChevronDown, Eye, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ZONE_COLORS: Record<string, string> = {
  electronics: '#0891B2', fabrics: '#7C3AED', wholesale: '#14B8A6',
  spices: '#EF4444', kitchenware: '#F59E0B', artisanal: '#8B5E3C',
};

const ZONE_ICONS: Record<string, typeof Zap> = {
  electronics: Zap, fabrics: Scissors, wholesale: Package,
  spices: Flower2, kitchenware: ChefHat, artisanal: Paintbrush,
};

// Recently viewed items (stored in localStorage)
const RECENTLY_VIEWED_KEY = 'chimbo-recently-viewed';
const MAX_RECENT = 10;

interface FavoriteItem {
  id: string;
  targetId: string;
  targetType: string;
  collection: string;
  note: string;
  createdAt: string;
  target: any;
}

interface Collection {
  name: string;
  count: number;
}

export default function FavoritesPage() {
  const { user, isAuthenticated, language } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [tab, setTab] = useState<'all' | 'guides' | 'vendors' | 'zones' | 'packages'>('all');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<string>('all');
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [shareLink, setShareLink] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'seeker') router.replace('/auth');
  }, [isAuthenticated, user, router]);

  // ── Load favorites from API ──
  const loadFavorites = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/favorites?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
        setCollections(data.collections || []);
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // ── Load recently viewed from localStorage ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored) setRecentlyViewed(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // ── Remove favorite ──
  const removeFavorite = async (favId: string, targetId: string, targetType: string) => {
    try {
      const res = await fetch(`/api/favorites?id=${favId}`, { method: 'DELETE' });
      if (res.ok) {
        setFavorites(prev => prev.filter(f => f.id !== favId));
        setCollections(prev => prev.map(c =>
          c.name === favorites.find(f => f.id === favId)?.collection
            ? { ...c, count: c.count - 1 }
            : c
        ).filter(c => c.count > 0));
      }
    } catch (err) {
      console.error('Remove favorite failed:', err);
    }
  };

  // ── Move to collection ──
  const moveToCollection = async (favId: string, collection: string) => {
    try {
      const res = await fetch('/api/favorites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: favId, collection }),
      });
      if (res.ok) {
        loadFavorites(); // Refresh
      }
    } catch (err) {
      console.error('Move to collection failed:', err);
    }
  };

  // ── Create new collection ──
  const createCollection = () => {
    if (!newCollectionName.trim()) return;
    setCollections(prev => [...prev, { name: newCollectionName.trim(), count: 0 }]);
    setNewCollectionName('');
    setShowNewCollection(false);
  };

  // ── Share favorites ──
  const shareFavorites = async () => {
    const shareData = {
      userId: user?.id,
      userName: user?.name,
      count: favorites.length,
      items: favorites.slice(0, 20).map(f => ({
        name: f.target?.name || 'Unknown',
        type: f.targetType,
      })),
    };

    const shareText = `${shareData.userName}'s Favorites on Chimbo Direct:\n${shareData.items.map(i => `• ${i.name} (${i.type})`).join('\n')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Chimbo Direct Favorites',
          text: shareText,
        });
      } catch { /* user cancelled */ }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setShareLink('Copied to clipboard!');
        setTimeout(() => setShareLink(null), 2000);
      } catch { /* ignore */ }
    }
  };

  // ── Filter favorites by tab and collection ──
  const filteredFavorites = favorites.filter(f => {
    const matchesType = tab === 'all' || f.targetType === tab.slice(0, -1); // 'guides' → 'guide'
    const matchesCollection = activeCollection === 'all' || f.collection === activeCollection;
    return matchesType && matchesCollection;
  });

  const guideFavorites = filteredFavorites.filter(f => f.targetType === 'guide');
  const vendorFavorites = filteredFavorites.filter(f => f.targetType === 'vendor');
  const zoneFavorites = filteredFavorites.filter(f => f.targetType === 'zone');
  const packageFavorites = filteredFavorites.filter(f => f.targetType === 'package');

  const tabs = [
    { key: 'all' as const, label: l('All', 'Yote'), count: filteredFavorites.length },
    { key: 'guides' as const, label: l('Guides', 'Miongozo'), count: guideFavorites.length },
    { key: 'vendors' as const, label: l('Vendors', 'Wauzaji'), count: vendorFavorites.length },
    { key: 'zones' as const, label: l('Zones', 'Maeneo'), count: zoneFavorites.length },
    { key: 'packages' as const, label: l('Packages', 'Pakiti'), count: packageFavorites.length },
  ];

  if (isLoading) {
    return (
      <div className="px-4 py-4 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#065F46]/20 border-t-[#065F46] animate-spin" />
          <p className="text-sm text-[#64748B]">{l('Loading favorites...', 'Inapakia vipendwa...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center">
            <Heart className="w-5 h-5 text-[#065F46] dark:text-[#34D399] fill-[#065F46] dark:fill-[#34D399]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0F172A] dark:text-[#F1F5F9]">{l('Favorites', 'Vipendwa')}</h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{favorites.length} {l('saved items', 'vitu vilivyohifadhiwa')}</p>
          </div>
        </div>
        <button
          onClick={shareFavorites}
          className="w-9 h-9 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center hover:bg-[#065F46]/10 transition-colors"
          title={l('Share favorites', 'Shiriki vipendwa')}
        >
          <Share2 className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
        </button>
      </div>

      {/* Share confirmation */}
      <AnimatePresence>
        {shareLink && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] border border-[#34D399]/30 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-[#34D399]" />
            <span className="text-xs text-[#065F46] dark:text-[#34D399] font-medium">{shareLink}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collections */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#065F46] dark:text-[#34D399] flex items-center gap-1.5">
            <Folder className="w-4 h-4" />
            {l('Collections', 'Makusanyo')}
          </h3>
          <button
            onClick={() => setShowNewCollection(!showNewCollection)}
            className="text-xs text-[#065F46] dark:text-[#34D399] font-medium flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            {l('New', 'Mpya')}
          </button>
        </div>

        {/* New collection input */}
        <AnimatePresence>
          {showNewCollection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  placeholder={l('Collection name', 'Jina la makusanyo')}
                  className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] text-sm outline-none focus:ring-2 focus:ring-[#065F46]/20"
                  onKeyDown={e => e.key === 'Enter' && createCollection()}
                />
                <Button onClick={createCollection} size="sm" className="bg-[#065F46] hover:bg-[#064E3B] text-white">
                  {l('Create', 'Unda')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collection chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCollection('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCollection === 'all'
                ? 'bg-[#065F46] text-white'
                : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B]'
            }`}
          >
            {l('All', 'Yote')}
            <span className="opacity-70">({favorites.length})</span>
          </button>
          {collections.map(col => (
            <button
              key={col.name}
              onClick={() => setActiveCollection(col.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCollection === col.name
                  ? 'bg-[#065F46] text-white'
                  : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B]'
              }`}
            >
              {col.name}
              <span className="opacity-70">({col.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-[#065F46] text-white' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'
            }`}
          >
            {t.label} <span className="opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {filteredFavorites.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 text-center rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
          >
            <Heart className="w-12 h-12 text-[#E2E8F0] dark:text-[#334155] mx-auto mb-3" />
            <p className="font-bold text-[#64748B]">{l('No favorites yet', 'Hakuna vipendwa bado')}</p>
            <p className="text-xs text-[#64748B] mt-1">{l('Browse and tap the heart to save', 'Tafuta na bonyeza moyo kuhifadhi')}</p>
            <Link href="/search" className="inline-flex items-center gap-1 mt-4 px-4 py-2 bg-[#065F46] text-white text-sm font-bold rounded-xl hover:bg-[#064E3B] transition-colors">
              {l('Explore', 'Vinjari')} <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {filteredFavorites.map((fav, i) => {
              const target = fav.target;
              if (!target) return null;

              return (
                <motion.div
                  key={fav.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] group"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm ${
                        fav.targetType === 'guide' ? 'bg-gradient-to-br from-[#F59E0B] to-[#F97316]' :
                        fav.targetType === 'vendor' ? 'bg-gradient-to-br from-[#065F46] to-[#059669]' :
                        fav.targetType === 'package' ? 'bg-gradient-to-br from-[#8B5CF6] to-[#A855F7]' :
                        'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4]'
                      }`}>
                        {target.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || '?'}
                      </div>
                      {fav.targetType === 'guide' && target.verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#10B981] flex items-center justify-center ring-2 ring-white dark:ring-[#1E293B]">
                          <ShieldCheck className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      {fav.targetType === 'guide' && target.status === 'online' && (
                        <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-white dark:border-[#1E293B]" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm truncate">{target.name}</h4>
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-[#065F46]/20 text-[#065F46] dark:text-[#34D399] dark:border-[#34D399]/20">
                          {fav.targetType}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#64748B] truncate">
                        {fav.targetType === 'guide' && (target.bio || target.languages?.join(', '))}
                        {fav.targetType === 'vendor' && (target.category || target.zone)}
                        {fav.targetType === 'zone' && (target.description?.substring(0, 50) || '')}
                        {fav.targetType === 'package' && (target.description?.substring(0, 50) || `${target.duration}h · TZS ${(target.price || 0).toLocaleString()}`)}
                      </p>
                      {target.rating > 0 && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                            <span className="text-xs font-bold">{target.rating.toFixed(1)}</span>
                          </div>
                          {fav.collection !== 'default' && (
                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-[#F59E0B]/30 text-[#F59E0B] bg-[#FEF3C7] dark:bg-[#422006]">
                              {fav.collection}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => moveToCollection(fav.id, prompt(l('Move to collection:', 'Hamisha kwenye makusanyo:'), fav.collection) || fav.collection)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B] transition-colors"
                        title={l('Move to collection', 'Hamisha kwenye makusanyo')}
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-[#64748B]" />
                      </button>
                      <button
                        onClick={() => removeFavorite(fav.id, fav.targetId, fav.targetType)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#FEE2E2] dark:hover:bg-[#2D1B1B] transition-colors"
                        title={l('Remove', 'Ondoa')}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#065F46] dark:text-[#34D399] flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {l('Recently Viewed', 'Uliotazama Hivi Karibu')}
            </h3>
            <button
              onClick={() => {
                setRecentlyViewed([]);
                localStorage.removeItem(RECENTLY_VIEWED_KEY);
              }}
              className="text-[10px] text-[#DC2626] hover:underline"
            >
              {l('Clear', 'Futa')}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentlyViewed.slice(0, 8).map((item, i) => (
              <div
                key={`${item.id}-${i}`}
                className="flex-shrink-0 w-20 p-2 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-center"
              >
                <div className={`w-10 h-10 rounded-lg mx-auto mb-1 flex items-center justify-center text-white text-[10px] font-bold ${
                  item.type === 'guide' ? 'bg-[#F59E0B]' :
                  item.type === 'vendor' ? 'bg-[#065F46]' :
                  item.type === 'zone' ? 'bg-[#0EA5E9]' :
                  'bg-[#8B5CF6]'
                }`}>
                  {item.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || '?'}
                </div>
                <p className="text-[10px] font-medium truncate">{item.name}</p>
                <p className="text-[8px] text-[#94A3B8] capitalize">{item.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorites count summary */}
      {favorites.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#ECFDF5] to-[#FEF3C7] dark:from-[#064E3B] dark:to-[#1E293B] border border-[#065F46]/10 dark:border-[#34D399]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">
                {l('Your Favorites Summary', 'Muhtasari Wa Vipendwa Vyako')}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                {collections.length} {l('collections', 'makusanyo')} · {favorites.length} {l('items', 'vitu')}
              </p>
            </div>
            <button onClick={shareFavorites} className="px-3 py-1.5 bg-[#065F46] text-white text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-[#064E3B] transition-colors">
              <Share2 className="w-3 h-3" />
              {l('Share', 'Shiriki')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
