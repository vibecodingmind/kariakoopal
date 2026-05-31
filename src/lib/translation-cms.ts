import { db } from '@/lib/db';
import { en } from '@/lib/i18n/en';
import { sw } from '@/lib/i18n/sw';

const CATEGORIES = ['general', 'nav', 'auth', 'guide', 'seeker', 'admin'] as const;

function inferCategory(key: string): string {
  if (key.startsWith('nav_')) return 'nav';
  if (key.startsWith('auth_') || key.startsWith('role_') || key.startsWith('welcome_') || key.startsWith('social_') || key.startsWith('sign_in_') || key.startsWith('login') || key.startsWith('register') || key.startsWith('forgot_') || key.startsWith('no_account') || key.startsWith('have_account') || key.startsWith('email_') || key.startsWith('password_') || key.startsWith('name_') || key.startsWith('phone_') || key.startsWith('send_otp') || key.startsWith('verify_otp') || key.startsWith('otp_') || key.startsWith('demo_mode') || key.startsWith('or_')) return 'auth';
  if (key.startsWith('guide_') || key.startsWith('online_') || key.startsWith('go_online') || key.startsWith('go_offline') || key.startsWith('busy_') || key.startsWith('live_r') || key.startsWith('accept_request') || key.startsWith('active_session_g') || key.startsWith('session_timer') || key.startsWith('session_checklist') || key.startsWith('mark_complete') || key.startsWith('earnings_') || key.startsWith('pending_') || key.startsWith('released_') || key.startsWith('weekly_total') || key.startsWith('payout_history') || key.startsWith('my_badges') || key.startsWith('leaderboard') || key.startsWith('guide_of_week') || key.startsWith('insights_') || key.startsWith('verification_') || key.startsWith('recording_') || key.startsWith('mentorship_')) return 'guide';
  if (key.startsWith('seeker_') || key.startsWith('post_request') || key.startsWith('request_') || key.startsWith('my_requests') || key.startsWith('active_session') || key.startsWith('session_history') || key.startsWith('find_guides') || key.startsWith('guide_profile') || key.startsWith('guide_rating') || key.startsWith('guide_badges') || key.startsWith('accept_guide') || key.startsWith('session_complete') || key.startsWith('rate_guide') || key.startsWith('leave_review') || key.startsWith('shopping_') || key.startsWith('haggling_') || key.startsWith('buddy_') || key.startsWith('group_tour_') || key.startsWith('route_') || key.startsWith('heatmap_') || key.startsWith('timeout_') || key.startsWith('currency_') || key.startsWith('stories_') || key.startsWith('ussd_') || key.startsWith('ai_vision_') || key.startsWith('help_') || key.startsWith('sub_') || key.startsWith('package_') || key.startsWith('offline_')) return 'seeker';
  if (key.startsWith('admin_') || key.startsWith('verification_queue') || key.startsWith('approve_') || key.startsWith('reject_') || key.startsWith('zone_management') || key.startsWith('price_radar_mgmt') || key.startsWith('analytics') || key.startsWith('user_management') || key.startsWith('dispute_resolution') || key.startsWith('total_users') || key.startsWith('active_sessions_a') || key.startsWith('total_revenue') || key.startsWith('avg_rating') || key.startsWith('fraud_')) return 'admin';
  return 'general';
}

export async function getTranslations(category?: string) {
  const where = category ? { category } : {};
  return db.translationKey.findMany({ where, orderBy: [{ category: 'asc' }, { key: 'asc' }] });
}

export async function updateTranslation(key: string, valueEn: string, valueSw: string, updatedBy: string = 'admin') {
  return db.translationKey.upsert({
    where: { key },
    update: { valueEn, valueSw, updatedBy },
    create: { key, valueEn, valueSw, category: inferCategory(key), updatedBy },
  });
}

export async function bulkUpdateTranslations(updates: { key: string; valueEn: string; valueSw: string }[], updatedBy: string = 'admin') {
  const results = [];
  for (const u of updates) {
    const r = await db.translationKey.upsert({
      where: { key },
      update: { valueEn: u.valueEn, valueSw: u.valueSw, updatedBy },
      create: { key: u.key, valueEn: u.valueEn, valueSw: u.valueSw, category: inferCategory(u.key), updatedBy },
    });
    results.push(r);
  }
  return results;
}

export async function seedDefaultTranslations() {
  const keys = Object.keys(en);
  let created = 0;
  let updated = 0;

  for (const key of keys) {
    const valueEn = en[key] || '';
    const valueSw = sw[key] || '';
    const category = inferCategory(key);

    const existing = await db.translationKey.findUnique({ where: { key } });
    if (existing) {
      if (!existing.valueEn || !existing.valueSw) {
        await db.translationKey.update({
          where: { key },
          data: { valueEn: existing.valueEn || valueEn, valueSw: existing.valueSw || valueSw },
        });
        updated++;
      }
    } else {
      await db.translationKey.create({
        data: { key, valueEn, valueSw, category, updatedBy: 'system' },
      });
      created++;
    }
  }

  return { total: keys.length, created, updated };
}

export { CATEGORIES };
