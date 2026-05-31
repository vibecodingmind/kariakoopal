'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Sparkles, Star, ChevronRight, MapPin,
  DollarSign, ShoppingBag, Utensils, Camera, Landmark,
  Compass, Loader2,
} from 'lucide-react';

// ── Types ──

export interface AIRecommendation {
  id: string;
  name: string;
  category: string;
  description: string;
  estimatedCost: string;
  rating: number;
  zone: string;
  gradient: string;
  icon: React.ElementType;
}

export interface AIRecommendationsProps {
  userId?: string;
  location?: string;
  limit?: number;
  category?: string;
}

// ── Demo Data ──

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  food: Utensils,
  shopping: ShoppingBag,
  experiences: Camera,
  'cultural-sites': Landmark,
  'hidden-gems': Compass,
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  food: 'from-[#DC2626] to-[#F97316]',
  shopping: 'from-[#065F46] to-[#059669]',
  experiences: 'from-[#7C3AED] to-[#A78BFA]',
  'cultural-sites': 'from-[#0891B2] to-[#22D3EE]',
  'hidden-gems': 'from-[#F59E0B] to-[#FBBF24]',
};

const DEMO_RECOMMENDATIONS: AIRecommendation[] = [
  { id: 'r1', name: 'Mama Asha\'s Spice Corner', category: 'food', description: 'Authentic Tanzanian spices with the best prices in Zone A', estimatedCost: '5,000-15,000 TZS', rating: 4.9, zone: 'Zone A', gradient: CATEGORY_GRADIENTS['food'], icon: CATEGORY_ICONS['food'] },
  { id: 'r2', name: 'Kariakoo Electronics Hub', category: 'shopping', description: 'Best deals on phones and accessories - haggle for 30% off', estimatedCost: '50,000-200,000 TZS', rating: 4.6, zone: 'Zone B', gradient: CATEGORY_GRADIENTS['shopping'], icon: CATEGORY_ICONS['shopping'] },
  { id: 'r3', name: 'Sunset Rooftop View', category: 'experiences', description: 'Hidden rooftop with panoramic views of the market', estimatedCost: 'Free', rating: 4.8, zone: 'Zone C', gradient: CATEGORY_GRADIENTS['experiences'], icon: CATEGORY_ICONS['experiences'] },
  { id: 'r4', name: 'Historic Indian Quarter', category: 'cultural-sites', description: 'Colonial-era architecture and cultural landmarks', estimatedCost: 'Free', rating: 4.7, zone: 'Zone D', gradient: CATEGORY_GRADIENTS['cultural-sites'], icon: CATEGORY_ICONS['cultural-sites'] },
  { id: 'r5', name: 'Underground Fabric Market', category: 'hidden-gems', description: 'Wholesale fabrics at 60% below retail - locals only know', estimatedCost: '10,000-50,000 TZS', rating: 4.5, zone: 'Zone A', gradient: CATEGORY_GRADIENTS['hidden-gems'], icon: CATEGORY_ICONS['hidden-gems'] },
  { id: 'r6', name: 'Fresh Juice Alley', category: 'food', description: 'Freshly squeezed sugar cane and passion fruit juices', estimatedCost: '1,000-3,000 TZS', rating: 4.8, zone: 'Zone B', gradient: CATEGORY_GRADIENTS['food'], icon: CATEGORY_ICONS['food'] },
  { id: 'r7', name: 'Vintage Camera Shop', category: 'shopping', description: 'Rare and vintage cameras at unbelievable prices', estimatedCost: '20,000-100,000 TZS', rating: 4.4, zone: 'Zone C', gradient: CATEGORY_GRADIENTS['shopping'], icon: CATEGORY_ICONS['shopping'] },
  { id: 'r8', name: 'Street Art Walk', category: 'experiences', description: 'Guided tour through Dar\'s vibrant street art scene', estimatedCost: '15,000 TZS', rating: 4.9, zone: 'Zone D', gradient: CATEGORY_GRADIENTS['experiences'], icon: CATEGORY_ICONS['experiences'] },
];

// ── Main Component ──

export function AIRecommendations({ userId, location, limit = 6, category }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      if (location) params.set('location', location);
      if (category) params.set('category', category);
      params.set('limit', limit.toString());

      const res = await fetch(`/api/ai/recommendations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
          setRecommendations(
            data.recommendations.slice(0, limit).map((r: Record<string, unknown>, i: number) => ({
              id: r.id || `ai-${i}`,
              name: r.name || 'Unknown',
              category: r.category || 'shopping',
              description: r.description || '',
              estimatedCost: r.estimatedCost || 'N/A',
              rating: r.rating || 4.0,
              zone: r.zone || 'Zone A',
              gradient: CATEGORY_GRADIENTS[(r.category as string) || 'shopping'] || CATEGORY_GRADIENTS.shopping,
              icon: CATEGORY_ICONS[(r.category as string) || 'shopping'] || CATEGORY_ICONS.shopping,
            }))
          );
          return;
        }
      }
      // Fallback to demo data
      const filtered = category
        ? DEMO_RECOMMENDATIONS.filter(r => r.category === category)
        : DEMO_RECOMMENDATIONS;
      setRecommendations(filtered.slice(0, limit));
    } catch {
      // Fallback to demo data
      const filtered = category
        ? DEMO_RECOMMENDATIONS.filter(r => r.category === category)
        : DEMO_RECOMMENDATIONS;
      setRecommendations(filtered.slice(0, limit));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, location, limit, category]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Shuffle and re-fetch
    const shuffled = [...DEMO_RECOMMENDATIONS].sort(() => Math.random() - 0.5);
    const filtered = category ? shuffled.filter(r => r.category === category) : shuffled;
    setTimeout(() => {
      setRecommendations(filtered.slice(0, limit));
      setRefreshing(false);
    }, 800);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#F59E0B]" />
          <h3 className="font-bold text-sm">AI Picks for You</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shrink-0 w-44 h-52 rounded-2xl shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#F59E0B]" />
          <h3 className="font-bold text-sm">AI Picks for You</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-7 h-7 rounded-lg bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center hover:bg-[#E2E8F0] dark:hover:bg-[#475569] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="text-xs text-[#065F46] dark:text-[#34D399] font-semibold flex items-center gap-0.5">
            See All
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Scrollable Cards */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        <AnimatePresence mode="popLayout">
          {recommendations.map((rec, i) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              className="shrink-0 w-44"
            >
              <div className="kcard overflow-hidden group cursor-pointer">
                {/* Image placeholder with gradient */}
                <div className={`relative h-24 bg-gradient-to-br ${rec.gradient} flex items-center justify-center`}>
                  <rec.icon className="w-10 h-10 text-white/40 group-hover:text-white/60 transition-colors" />
                  {/* AI Pick badge */}
                  <div className="absolute top-2 left-2">
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/30 backdrop-blur-sm text-[8px] font-bold text-white">
                      <Sparkles className="w-2.5 h-2.5 text-[#FBBF24]" />
                      AI Pick
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 space-y-1.5">
                  <p className="text-xs font-semibold truncate">{rec.name}</p>

                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399]">
                      {rec.category}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-[#F59E0B] text-[#F59E0B]" />
                      <span className="text-[9px] font-bold">{rec.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#64748B]">
                    <DollarSign className="w-2.5 h-2.5" />
                    <span className="text-[9px] truncate">{rec.estimatedCost}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[#64748B]">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="text-[9px]">{rec.zone}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
