import { db } from '@/lib/db';

interface TrustFactors {
  reviewScore: number;
  reviewWeight: number;
  disputeRate: number;
  disputeWeight: number;
  priceFairness: number;
  priceWeight: number;
  timeInMarket: number;
  timeWeight: number;
  repeatCustomerRate: number;
  repeatWeight: number;
  responseTime: number;
  responseWeight: number;
}

const DEFAULT_WEIGHTS: TrustFactors = {
  reviewScore: 0,
  reviewWeight: 0.35,
  disputeRate: 0,
  disputeWeight: 0.20,
  priceFairness: 0,
  priceWeight: 0.15,
  timeInMarket: 0,
  timeWeight: 0.10,
  repeatCustomerRate: 0,
  repeatWeight: 0.10,
  responseTime: 0,
  responseWeight: 0.10,
};

/**
 * Compute a vendor's trust score from various factors.
 * Score ranges from 0 to 100.
 */
export async function computeVendorTrustScore(vendorId: string): Promise<{
  overallScore: number;
  factors: TrustFactors;
  breakdown: Record<string, number>;
}> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
  });

  if (!vendor) {
    return {
      overallScore: 0,
      factors: DEFAULT_WEIGHTS,
      breakdown: {},
    };
  }

  // 1. Review Score (0-100, based on avg rating * 20)
  const reviews = await db.review.findMany({
    where: { revieweeId: vendorId },
  });
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const reviewScore = Math.min(100, avgRating * 20);

  // 2. Dispute Rate (lower is better, disputes per 100 interactions)
  const disputeCount = await db.dispute.count({
    where: { against: vendorId },
  });
  const totalInteractions = Math.max(1, vendor.recommendations + reviews.length);
  const disputeRate = Math.min(100, (disputeCount / totalInteractions) * 100);
  const disputeScore = Math.max(0, 100 - disputeRate * 2);

  // 3. Price Fairness (0-1, compared to PriceRadar data)
  const categories: string[] = JSON.parse(vendor.categories || '[]');
  let priceFairness = 0.5; // default neutral
  if (categories.length > 0) {
    const priceData = await db.priceRadar.findMany({
      where: { zoneId: vendor.zoneId, category: { in: categories } },
    });
    if (priceData.length > 0) {
      priceFairness = priceData.reduce((sum, p) => {
        const midPrice = (p.priceMin + p.priceMax) / 2;
        // Vendors in the mid range are considered fair
        return sum + 0.5;
      }, 0) / priceData.length;
    }
  }
  const priceScore = priceFairness * 100;

  // 4. Time in Market (months since creation)
  const createdDate = vendor.createdAt;
  const monthsInMarket = Math.max(0,
    (Date.now() - new Date(createdDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const timeScore = Math.min(100, monthsInMarket * 2); // Max out at 50 months

  // 5. Repeat Customer Rate
  const uniqueSeekers = new Set(reviews.map((r) => r.reviewerId));
  const repeatCustomerRate = reviews.length > 1 && uniqueSeekers.size > 0
    ? Math.min(1, (reviews.length - uniqueSeekers.size) / reviews.length)
    : 0;
  const repeatScore = repeatCustomerRate * 100;

  // 6. Response Time (simulated - based on vendor having contact info)
  const hasContact = vendor.contact && vendor.contact.length > 0;
  const responseScore = hasContact ? 70 : 30;

  const factors: TrustFactors = {
    reviewScore,
    reviewWeight: DEFAULT_WEIGHTS.reviewWeight,
    disputeRate: disputeScore,
    disputeWeight: DEFAULT_WEIGHTS.disputeWeight,
    priceFairness: priceScore,
    priceWeight: DEFAULT_WEIGHTS.priceWeight,
    timeInMarket: timeScore,
    timeWeight: DEFAULT_WEIGHTS.timeWeight,
    repeatCustomerRate: repeatScore,
    repeatWeight: DEFAULT_WEIGHTS.repeatWeight,
    responseTime: responseScore,
    responseWeight: DEFAULT_WEIGHTS.responseWeight,
  };

  // Compute weighted overall score
  const overallScore = Math.round(
    factors.reviewScore * factors.reviewWeight +
    factors.disputeRate * factors.disputeWeight +
    factors.priceFairness * factors.priceWeight +
    factors.timeInMarket * factors.timeWeight +
    factors.repeatCustomerRate * factors.repeatWeight +
    factors.responseTime * factors.responseWeight
  );

  const breakdown = {
    reviewScore: Math.round(reviewScore),
    disputeScore: Math.round(disputeScore),
    priceScore: Math.round(priceScore),
    timeScore: Math.round(timeScore),
    repeatScore: Math.round(repeatScore),
    responseScore: Math.round(responseScore),
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews: reviews.length,
    totalDisputes: disputeCount,
    monthsInMarket: Math.round(monthsInMarket),
    repeatCustomerRate: Math.round(repeatCustomerRate * 100),
  };

  return { overallScore: Math.max(0, Math.min(100, overallScore)), factors, breakdown };
}

/**
 * Save or update a vendor's trust score in the database
 */
export async function saveVendorTrustScore(vendorId: string): Promise<{
  overallScore: number;
  breakdown: Record<string, number>;
}> {
  const { overallScore, breakdown } = await computeVendorTrustScore(vendorId);

  const factors = {
    reviewScore: breakdown.reviewScore,
    disputeRate: breakdown.disputeScore,
    priceFairness: breakdown.priceScore,
    responseTime: breakdown.responseScore,
    repeatCustomerRate: breakdown.repeatScore,
    timeInMarket: breakdown.monthsInMarket,
  };

  await db.vendorTrustScore.upsert({
    where: { vendorId },
    create: {
      vendorId,
      overallScore,
      reviewScore: breakdown.avgRating,
      disputeRate: breakdown.totalDisputes,
      priceFairness: breakdown.priceScore / 100,
      responseTime: breakdown.responseScore,
      repeatCustomerRate: breakdown.repeatCustomerRate / 100,
      timeInMarket: breakdown.monthsInMarket,
      factors: JSON.stringify(factors),
      lastCalculated: new Date(),
    },
    update: {
      overallScore,
      reviewScore: breakdown.avgRating,
      disputeRate: breakdown.totalDisputes,
      priceFairness: breakdown.priceScore / 100,
      responseTime: breakdown.responseScore,
      repeatCustomerRate: breakdown.repeatCustomerRate / 100,
      timeInMarket: breakdown.monthsInMarket,
      factors: JSON.stringify(factors),
      lastCalculated: new Date(),
    },
  });

  return { overallScore, breakdown };
}

/**
 * Get the trust tier label based on score
 */
export function getTrustTier(score: number): {
  tier: string;
  color: string;
  bgColor: string;
  textColor: string;
  label: string;
  labelSw: string;
} {
  if (score >= 81) {
    return {
      tier: 'gold',
      color: '#F59E0B',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
      label: 'Gold Trusted',
      labelSw: 'Dhahabu Muaminifu',
    };
  }
  if (score >= 61) {
    return {
      tier: 'green',
      color: '#065F46',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      label: 'Trusted',
      labelSw: 'Muaminifu',
    };
  }
  if (score >= 31) {
    return {
      tier: 'yellow',
      color: '#F59E0B',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      label: 'Building Trust',
      labelSw: 'Inajenga Tumaini',
    };
  }
  return {
    tier: 'red',
    color: '#EF4444',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    label: 'New Vendor',
    labelSw: 'Muuzaji Mpya',
  };
}
