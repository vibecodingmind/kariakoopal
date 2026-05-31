import { db } from '@/lib/db';

export interface CommissionCalcResult {
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
}

/**
 * Calculate commission for a given amount, tier, and category.
 * Falls back to 15% if no rule is found.
 */
export async function calculateCommission(
  amount: number,
  tier: string,
  category: string
): Promise<CommissionCalcResult> {
  const rule = await db.commissionRule.findUnique({
    where: { tier_category: { tier, category } },
  });

  const rate = rule && rule.isActive ? rule.rate : 0.15;

  // Apply min/max caps
  let effectiveAmount = amount;
  if (rule) {
    if (rule.minAmount > 0 && amount < rule.minAmount) {
      effectiveAmount = rule.minAmount;
    }
    if (rule.maxAmount && amount > rule.maxAmount) {
      effectiveAmount = rule.maxAmount;
    }
  }

  const commissionAmount = Math.round(effectiveAmount * rate);
  const netAmount = amount - commissionAmount;

  return {
    grossAmount: amount,
    commissionRate: rate,
    commissionAmount,
    netAmount: netAmount > 0 ? netAmount : 0,
  };
}

/**
 * Apply commission: calculate and record in ledger.
 * Returns the commission result.
 */
export async function applyCommission(
  amount: number,
  tier: string,
  category: string,
  fromUserId: string,
  toUserId: string,
  sessionId?: string,
  description?: string
): Promise<CommissionCalcResult> {
  const result = await calculateCommission(amount, tier, category);

  await recordCommissionLedger({
    sessionId: sessionId || null,
    fromUserId,
    toUserId,
    grossAmount: result.grossAmount,
    commissionRate: result.commissionRate,
    commissionAmount: result.commissionAmount,
    netAmount: result.netAmount,
    description: description || `Commission on ${category} for tier ${tier}`,
  });

  return result;
}

/**
 * Record a commission ledger entry.
 */
export async function recordCommissionLedger(data: {
  sessionId: string | null;
  fromUserId: string;
  toUserId: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  description?: string;
}) {
  return db.commissionLedger.create({
    data: {
      sessionId: data.sessionId,
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      grossAmount: data.grossAmount,
      commissionRate: data.commissionRate,
      commissionAmount: data.commissionAmount,
      netAmount: data.netAmount,
      description: data.description || '',
    },
  });
}
