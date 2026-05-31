import { db } from '@/lib/db';

export interface PriceCalculation {
  basePrice: number;
  adjustments: { ruleId: string; ruleType: string; multiplier: number }[];
  finalPrice: number;
}

export async function getActiveRules(zoneId?: string) {
  const where: Record<string, unknown> = { isActive: true };
  if (zoneId) {
    where.OR = [{ zoneId }, { zoneId: '' }];
  }
  return db.pricingRule.findMany({
    where,
    orderBy: { priority: 'desc' },
  });
}

export async function applyRules(
  basePrice: number,
  zoneId?: string,
  guideTier?: string,
  dateTime?: string
): Promise<PriceCalculation> {
  const rules = await getActiveRules(zoneId);
  let currentPrice = basePrice;
  const adjustments: { ruleId: string; ruleType: string; multiplier: number }[] = [];
  const dt = dateTime ? new Date(dateTime) : new Date();
  const dayOfWeek = dt.getDay();
  const hour = dt.getHours();

  for (const rule of rules) {
    const conditions = JSON.parse(rule.conditions || '{}');

    // Check guide tier match
    if (rule.guideTier !== 'all' && rule.guideTier !== guideTier) continue;

    // Check zone match
    if (rule.zoneId && rule.zoneId !== zoneId) continue;

    // Check schedule
    if (rule.startDate && new Date(rule.startDate) > dt) continue;
    if (rule.endDate && new Date(rule.endDate) < dt) continue;

    // Check time-based conditions
    if (conditions.dayOfWeek !== undefined && conditions.dayOfWeek !== dayOfWeek) continue;
    if (conditions.startTime !== undefined && conditions.endTime !== undefined) {
      if (hour < conditions.startTime || hour >= conditions.endTime) continue;
    }

    // Apply multiplier
    currentPrice = currentPrice * rule.multiplier;
    adjustments.push({ ruleId: rule.id, ruleType: rule.ruleType, multiplier: rule.multiplier });
  }

  return { basePrice, adjustments, finalPrice: Math.round(currentPrice) };
}

export async function calculateDynamicPrice(
  basePrice: number,
  zoneId?: string,
  guideTier?: string,
  dateTime?: string
): Promise<PriceCalculation> {
  return applyRules(basePrice, zoneId, guideTier, dateTime);
}
