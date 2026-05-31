import { NextResponse } from 'next/server';

// ── Subscription tiers ──
const tiers = {
  starter: {
    name: 'Starter',
    price: 0,
    priceDisplay: 'Free',
    color: '#6C757D',
    features: [
      { name: 'Basic profile', included: true },
      { name: 'Up to 2 zones', included: true },
      { name: 'Standard matching', included: true },
      { name: 'In-app messaging', included: true },
      { name: 'Session recordings', included: false },
      { name: 'Priority matching', included: false },
      { name: 'Featured listing', included: false },
      { name: 'Analytics dashboard', included: false },
      { name: 'Mentorship access', included: false },
      { name: 'Custom packages', included: false },
    ],
  },
  pro: {
    name: 'Pro',
    price: 15000,
    priceDisplay: 'TZS 15,000/mo',
    color: '#0A4D3C',
    features: [
      { name: 'Enhanced profile', included: true },
      { name: 'Up to 5 zones', included: true },
      { name: 'Priority matching', included: true },
      { name: 'In-app messaging', included: true },
      { name: 'Session recordings', included: true },
      { name: 'Featured in search', included: true },
      { name: 'Analytics dashboard', included: true },
      { name: 'Custom packages', included: true },
      { name: 'Mentorship access', included: false },
      { name: 'VIP support', included: false },
    ],
  },
  elite: {
    name: 'Elite',
    price: 35000,
    priceDisplay: 'TZS 35,000/mo',
    color: '#FFD23F',
    features: [
      { name: 'Premium profile', included: true },
      { name: 'All zones', included: true },
      { name: 'Top priority matching', included: true },
      { name: 'In-app messaging', included: true },
      { name: 'Session recordings', included: true },
      { name: 'Top featured listing', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Unlimited packages', included: true },
      { name: 'Mentorship access', included: true },
      { name: 'VIP 24/7 support', included: true },
    ],
  },
};

// ── Demo current subscription ──
const demoSubscription = {
  id: 'sub1',
  guideId: 'demo',
  tier: 'pro',
  startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 16).toISOString(),
  autoRenew: true,
  paymentRef: 'SUB-PRO-20260215',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  updatedAt: new Date().toISOString(),
};

const demoBillingHistory = [
  { id: 'b1', tier: 'pro', amount: 15000, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), status: 'paid', ref: 'SUB-PRO-20260215' },
  { id: 'b2', tier: 'starter', amount: 0, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 44).toISOString(), status: 'paid', ref: 'SUB-STARTER-20260115' },
  { id: 'b3', tier: 'starter', amount: 0, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 74).toISOString(), status: 'paid', ref: 'SUB-STARTER-20251215' },
];

// GET /api/subscriptions - Return current subscription with details
export async function GET() {
  const daysRemaining = Math.ceil(
    (new Date(demoSubscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return NextResponse.json({
    currentSubscription: {
      ...demoSubscription,
      daysRemaining: Math.max(0, daysRemaining),
      tierDetails: tiers[demoSubscription.tier as keyof typeof tiers],
    },
    tiers,
    billingHistory: demoBillingHistory,
  });
}

// POST /api/subscriptions - Upgrade/downgrade subscription
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tier, phone } = body;

    if (!tier || !['starter', 'pro', 'elite'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const tierDetails = tiers[tier as keyof typeof tiers];

    if (tierDetails.price === 0) {
      return NextResponse.json({
        success: true,
        message: 'Switched to Starter plan',
        subscription: {
          ...demoSubscription,
          tier: 'starter',
          price: 0,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    // Simulate payment processing
    return NextResponse.json({
      success: true,
      message: `Subscription upgraded to ${tierDetails.name}`,
      subscription: {
        ...demoSubscription,
        tier,
        price: tierDetails.price,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paymentRef: `SUB-${tier.toUpperCase()}-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      },
      payment: {
        amount: tierDetails.price,
        phone: phone || '255-XXX-XXXX',
        status: 'processing',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
