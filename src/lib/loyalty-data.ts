// ── Loyalty Points & Streaks — Demo Data & Constants ──

export const TIER_CONFIG = {
  bronze:   { name: 'Bronze',   nameSw: 'Shaba',     minPoints: 0,     color: '#CD7F32', bg: 'bg-amber-900/20',    border: 'border-amber-700/30',    icon: '🥉' },
  silver:   { name: 'Silver',   nameSw: 'Fedha',     minPoints: 2000,  color: '#C0C0C0', bg: 'bg-slate-400/20',    border: 'border-slate-400/30',    icon: '🥈' },
  gold:     { name: 'Gold',     nameSw: 'Dhahabu',   minPoints: 5000,  color: '#FFD700', bg: 'bg-yellow-400/20',   border: 'border-yellow-400/30',   icon: '🥇' },
  diamond:  { name: 'Diamond',  nameSw: 'Almasi',    minPoints: 10000, color: '#B9F2FF', bg: 'bg-cyan-300/20',     border: 'border-cyan-300/30',     icon: '💎' },
} as const;

export type TierName = keyof typeof TIER_CONFIG;

export function getTierForPoints(points: number): TierName {
  if (points >= 10000) return 'diamond';
  if (points >= 5000) return 'gold';
  if (points >= 2000) return 'silver';
  return 'bronze';
}

export function getNextTier(tier: TierName): TierName | null {
  const order: TierName[] = ['bronze', 'silver', 'gold', 'diamond'];
  const idx = order.indexOf(tier);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

export function getTierProgress(points: number): { tier: TierName; nextTier: TierName | null; nextTierPoints: number; progressPercent: number } {
  const tier = getTierForPoints(points);
  const nextTier = getNextTier(tier);
  const currentMin = TIER_CONFIG[tier].minPoints;
  const nextMin = nextTier ? TIER_CONFIG[nextTier].minPoints : currentMin;
  const range = nextMin - currentMin;
  const progress = range > 0 ? Math.min(((points - currentMin) / range) * 100, 100) : 100;
  return { tier, nextTier, nextTierPoints: nextMin, progressPercent: progress };
}

export const EARN_ACTIONS = [
  { reason: 'session_completed', label: 'Complete a Session', labelSw: 'Maliza Kipindi', points: 100, icon: 'CheckCircle2' },
  { reason: 'review_written', label: 'Write a Review', labelSw: 'Andika Mapitio', points: 50, icon: 'MessageSquare' },
  { reason: 'daily_login', label: 'Daily Login', labelSw: 'Kuingia Kila Siku', points: 10, icon: 'LogIn' },
  { reason: 'referral_completed', label: 'Refer a Friend', labelSw: 'Mwalike Rafiki', points: 200, icon: 'UserPlus' },
  { reason: 'social_share', label: 'Share on Social', labelSw: 'Shiriki kwenye Mitandao', points: 25, icon: 'Share2' },
  { reason: 'shopping_list_completed', label: 'Complete Shopping List', labelSw: 'Maliza Orodha ya Ununuzi', points: 30, icon: 'ShoppingCart' },
] as const;

export const DEMO_LOYALTY_ACCOUNT = {
  id: 'loyalty-demo-seeker-1',
  userId: 'demo-seeker-1',
  points: 2450,
  lifetimePoints: 8200,
  currentStreak: 7,
  longestStreak: 14,
  lastActivityDate: new Date().toISOString().split('T')[0],
  tier: 'silver' as TierName,
};

export const DEMO_LOYALTY_TRANSACTIONS = [
  { id: 'lt1', accountId: 'loyalty-demo-seeker-1', points: 100, type: 'earn',    reason: 'session_completed',   referenceId: 's1', metadata: '{"guideName":"Hamisi Juma"}',     createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'lt2', accountId: 'loyalty-demo-seeker-1', points: 50,  type: 'earn',    reason: 'review_written',      referenceId: 'r1', metadata: '{}',                             createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'lt3', accountId: 'loyalty-demo-seeker-1', points: 10,  type: 'earn',    reason: 'daily_login',         referenceId: null, metadata: '{}',                             createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'lt4', accountId: 'loyalty-demo-seeker-1', points: 200, type: 'earn',    reason: 'referral_completed',  referenceId: 'ref1', metadata: '{"referredName":"Mike T."}',    createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 'lt5', accountId: 'loyalty-demo-seeker-1', points: 25,  type: 'earn',    reason: 'social_share',        referenceId: null, metadata: '{}',                             createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'lt6', accountId: 'loyalty-demo-seeker-1', points: -500,type: 'redeem',  reason: 'redeemed_discount',   referenceId: 'r1', metadata: '{"rewardName":"5% Discount"}',    createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: 'lt7', accountId: 'loyalty-demo-seeker-1', points: 100, type: 'earn',    reason: 'session_completed',   referenceId: 's2', metadata: '{"guideName":"Fatma Hassan"}',    createdAt: new Date(Date.now() - 86400000 * 8).toISOString() },
  { id: 'lt8', accountId: 'loyalty-demo-seeker-1', points: 50,  type: 'bonus',   reason: 'streak_bonus_7day',   referenceId: null, metadata: '{}',                             createdAt: new Date(Date.now() - 86400000 * 9).toISOString() },
  { id: 'lt9', accountId: 'loyalty-demo-seeker-1', points: 100, type: 'earn',    reason: 'session_completed',   referenceId: 's3', metadata: '{"guideName":"Asha Mohamed"}',    createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: 'lt10',accountId: 'loyalty-demo-seeker-1', points: 30,  type: 'earn',    reason: 'shopping_list_completed', referenceId: 'sl1', metadata: '{}',                          createdAt: new Date(Date.now() - 86400000 * 11).toISOString() },
];

export const DEMO_REWARDS = [
  { id: 'r1', name: '5% Session Discount',      nameSw: 'Punguzo la 5% la Kipindi',           description: 'Get 5% off your next guided session',         descriptionSw: 'Pata punguzo la 5% kwenye kipindi kinachofuata',   pointsCost: 500,  type: 'discount',       value: 5,    isActive: true, icon: 'Percent',   createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'r2', name: '10% Session Discount',     nameSw: 'Punguzo la 10% la Kipindi',          description: 'Get 10% off your next guided session',        descriptionSw: 'Pata punguzo la 10% kwenye kipindi kinachofuata',  pointsCost: 1000, type: 'discount',       value: 10,   isActive: true, icon: 'Percent',   createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'r3', name: 'Free Translation',         nameSw: 'Tafsiri Bure',                       description: 'Unlock a free AI translation session',         descriptionSw: 'Fungua kipindi cha tafsiri ya AI bure',            pointsCost: 200,  type: 'feature_unlock', value: 1,    isActive: true, icon: 'Languages', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'r4', name: 'TZS 5,000 Cashback',      nameSw: 'TZS 5,000 Rudi',                     description: 'Get TZS 5,000 back in your wallet',            descriptionSw: 'Pata TZS 5,000 kurudi kwenye mkoba wako',         pointsCost: 1500, type: 'cashback',       value: 5000, isActive: true, icon: 'Wallet',    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'r5', name: 'Priority Matching',        nameSw: 'Ulinganishaji wa Kipaumbele',        description: 'Get matched with top-rated guides first',      descriptionSw: 'Pata kulinganishwa na miongozo bora kwanza',      pointsCost: 300,  type: 'feature_unlock', value: 1,    isActive: true, icon: 'Crown',     createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'r6', name: 'Free Mini Session',        nameSw: 'Kipindi Kidogo Bure',                description: '30-minute free guided session',                descriptionSw: 'Kipindi cha dakika 30 cha mwongozo bure',          pointsCost: 3000, type: 'free_session',   value: 30,   isActive: true, icon: 'Clock',     createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
