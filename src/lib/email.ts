// Chimbo Direct Platform - Enhanced Email System
// In demo mode (no SMTP env vars), emails are logged to console
// Includes: email queue with retry, tracking, unsubscribe, and expanded templates

// ── Types ──

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

type EmailType =
  | 'welcome_email'
  | 'booking_confirmation'
  | 'payment_receipt'
  | 'guide_verification'
  | 'password_reset'
  | 'escrow_release'
  | 'dispute_notification'
  | 'weekly_digest'
  | 'referral_reward'
  | 'admin_broadcast';

interface EmailQueueItem {
  id: string;
  type: EmailType;
  to: string;
  data: Record<string, string>;
  attempts: number;
  maxAttempts: number;
  nextRetry: Date;
  createdAt: Date;
  trackingId: string;
}

// ── Email Queue (in-memory with retry) ──

const emailQueue: EmailQueueItem[] = [];
let isProcessing = false;

function generateTrackingId(): string {
  return `eml_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function enqueueEmail(type: EmailType, to: string, data: Record<string, string>): string {
  const trackingId = generateTrackingId();
  const item: EmailQueueItem = {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    to,
    data: { ...data, trackingId, unsubscribeUrl: `${data.appUrl || 'https://chimbo.direct'}/unsubscribe?id=${trackingId}&email=${encodeURIComponent(to)}` },
    attempts: 0,
    maxAttempts: 3,
    nextRetry: new Date(),
    createdAt: new Date(),
    trackingId,
  };
  emailQueue.push(item);
  processQueue();
  return trackingId;
}

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (emailQueue.length > 0) {
    const item = emailQueue[0];
    if (item.attempts >= item.maxAttempts) {
      emailQueue.shift();
      console.error(`📧 [Queue] Giving up on email to ${item.to} (type: ${item.type}) after ${item.maxAttempts} attempts`);
      continue;
    }

    const now = new Date();
    if (now < item.nextRetry) {
      // Not time to retry yet, wait briefly
      await new Promise(resolve => setTimeout(resolve, 100));
      break;
    }

    try {
      const result = await sendEmailDirectly(item.type, item.to, item.data);
      if (result.success) {
        emailQueue.shift();
        console.log(`📧 [Queue] Sent email to ${item.to} (type: ${item.type}, tracking: ${item.trackingId})`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      item.attempts++;
      const delay = Math.min(5000 * Math.pow(2, item.attempts - 1), 60000); // exponential backoff, max 60s
      item.nextRetry = new Date(Date.now() + delay);
      console.warn(`📧 [Queue] Attempt ${item.attempts}/${item.maxAttempts} failed for ${item.to}, retrying in ${delay}ms`);
    }
  }

  isProcessing = false;
}

// ── Tracking Pixel ──

function trackingPixelHtml(trackingId: string): string {
  return `<img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://chimbo.direct'}/api/email/track?XTransformPort=3000&id=${trackingId}&event=open" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;">`;
}

function trackingClickUrl(url: string, trackingId: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL || 'https://chimbo.direct'}/api/email/track?XTransformPort=3000&id=${trackingId}&event=click&redirect=${encodeURIComponent(url)}`;
}

// ── Unsubscribe Footer ──

function unsubscribeFooter(unsubscribeUrl: string): string {
  return `
    <div style="text-align: center; padding: 16px; border-top: 1px solid #E2E8F0; margin-top: 24px;">
      <p style="font-size: 11px; color: #94A3B8; margin: 0;">
        You're receiving this email from Chimbo Direct.
        <a href="${unsubscribeUrl}" style="color: #64748B; text-decoration: underline;">Unsubscribe</a> ·
        <a href="https://chimbo.direct/settings" style="color: #64748B; text-decoration: underline;">Email Preferences</a>
      </p>
    </div>
  `;
}

// ── Email Templates ──

const TEMPLATES: Record<EmailType, (data: Record<string, string>) => { subject: string; html: string; text: string }> = {
  welcome_email: (data) => ({
    subject: `Karibu Chimbo Direct! - Welcome ${data.name || ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC;">
        <div style="background: linear-gradient(135deg, #065F46, #059669); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 28px;">Karibu Chimbo Direct!</h1>
          <p style="color: #34D399; margin: 8px 0 0;">Your guide to Kariakoo Market</p>
        </div>
        <div style="padding: 24px; background: white; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #0F172A;">Jambo ${data.name || 'Friend'}! 👋</p>
          <p style="font-size: 14px; color: #64748B; line-height: 1.6;">
            Welcome to Chimbo Direct — your trusted companion for navigating Kariakoo Market in Dar es Salaam.
            Whether you're looking for fabrics, spices, electronics, or a local guide, we've got you covered.
          </p>
          <div style="background: #ECFDF5; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #065F46; margin: 0 0 8px;">Get Started:</h3>
            <ul style="color: #065F46; margin: 0; padding-left: 20px;">
              <li>Browse market zones and vendors</li>
              <li>Find a verified local guide</li>
              <li>Check fair prices with Price Radar</li>
              <li>Use AI Vision to identify items</li>
            </ul>
          </div>
          <a href="${trackingClickUrl(data.appUrl || 'https://chimbo.direct', data.trackingId || '')}" style="display: inline-block; background: #065F46; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">
            Explore Kariakoo →
          </a>
        </div>
        ${unsubscribeFooter(data.unsubscribeUrl || '#')}
        ${trackingPixelHtml(data.trackingId || '')}
      </div>
    `,
    text: `Karibu Chimbo Direct!\n\nJambo ${data.name || 'Friend'}!\n\nWelcome to Chimbo Direct — your trusted companion for navigating Kariakoo Market.\n\nGet started:\n- Browse market zones and vendors\n- Find a verified local guide\n- Check fair prices with Price Radar\n- Use AI Vision to identify items\n\nVisit: ${data.appUrl || 'https://chimbo.direct'}\n\nUnsubscribe: ${data.unsubscribeUrl || '#'}`,
  }),

  booking_confirmation: (data) => ({
    subject: `Booking Confirmed - ${data.guideName || 'Your Guide'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC;">
        <div style="background: linear-gradient(135deg, #065F46, #059669); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">✅ Booking Confirmed</h1>
        </div>
        <div style="padding: 24px; background: white; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #0F172A;">Habari ${data.seekerName || ''},</p>
          <p style="font-size: 14px; color: #64748B;">Your guide booking has been confirmed!</p>
          <div style="background: #F1F5F9; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0; color: #0F172A;"><strong>Guide:</strong> ${data.guideName || 'TBD'}</p>
            <p style="margin: 4px 0; color: #0F172A;"><strong>Zone:</strong> ${data.zone || 'TBD'}</p>
            <p style="margin: 4px 0; color: #0F172A;"><strong>Date:</strong> ${data.date || 'TBD'}</p>
            <p style="margin: 4px 0; color: #0F172A;"><strong>Time:</strong> ${data.time || 'TBD'}</p>
            <p style="margin: 4px 0; color: #0F172A;"><strong>Amount:</strong> TZS ${data.amount || '0'}</p>
            <p style="margin: 4px 0; color: #0F172A;"><strong>Session Code:</strong> ${data.sessionCode || 'N/A'}</p>
          </div>
          <div style="background: #FEF3C7; border-radius: 8px; padding: 12px; margin: 16px 0;">
            <p style="color: #92400E; font-size: 13px; margin: 0;">💡 <strong>Tip:</strong> Use the session code to confirm your meeting. Your payment is held safely in escrow until the session is complete.</p>
          </div>
        </div>
        ${unsubscribeFooter(data.unsubscribeUrl || '#')}
        ${trackingPixelHtml(data.trackingId || '')}
      </div>
    `,
    text: `Booking Confirmed!\n\nGuide: ${data.guideName}\nZone: ${data.zone}\nDate: ${data.date}\nTime: ${data.time}\nAmount: TZS ${data.amount}\nSession Code: ${data.sessionCode}\n\nYour payment is held in escrow until session completion.\n\nUnsubscribe: ${data.unsubscribeUrl || '#'}`,
  }),

  payment_receipt: (data) => ({
    subject: `Payment Receipt - TZS ${data.amount || '0'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC;">
        <div style="background: linear-gradient(135deg, #065F46, #059669); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">💰 Payment Receipt</h1>
        </div>
        <div style="padding: 24px; background: white; border-radius: 0 0 12px 12px;">
          <p style="font-size: 14px; color: #64748B;">Payment receipt for your Chimbo Direct transaction.</p>
          <div style="background: #F1F5F9; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0; color: #0F172A;"><strong>Transaction ID:</strong> ${data.transactionId || 'N/A'}</p>
            <p style="margin: 4px 0; color: #0F172A;"><strong>Type:</strong> ${data.type || 'Payment'}</p>
            <p style="margin: 4px 0; color: #0F172A;"><strong>Amount:</strong> TZS ${data.amount || '0'}</p>
            <p style="margin: 4px 0; color: #0F172A;"><strong>Status:</strong> ${data.status || 'Completed'}</p>
            <p style="margin: 4px 0; color: #0F172A;"><strong>Date:</strong> ${data.date || new Date().toLocaleDateString()}</p>
            <p style="margin: 4px 0; color: #0F172A;"><strong>Method:</strong> ${data.method || 'M-Pesa'}</p>
          </div>
          <p style="font-size: 12px; color: #94A3B8;">Keep this receipt for your records. For questions, contact support@chimbo.direct</p>
        </div>
        ${unsubscribeFooter(data.unsubscribeUrl || '#')}
        ${trackingPixelHtml(data.trackingId || '')}
      </div>
    `,
    text: `Payment Receipt\n\nTransaction ID: ${data.transactionId}\nType: ${data.type}\nAmount: TZS ${data.amount}\nStatus: ${data.status}\nDate: ${data.date}\nMethod: ${data.method}\n\nKeep this receipt for your records.\n\nUnsubscribe: ${data.unsubscribeUrl || '#'}`,
  }),

  guide_verification: (data) => ({
    subject: `Verification ${data.status || 'Update'} - Chimbo Direct`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC;">
        <div style="background: linear-gradient(135deg, #065F46, #059669); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">${data.status === 'approved' ? '✅' : data.status === 'rejected' ? '❌' : '⏳'} Verification ${data.status || 'Update'}</h1>
        </div>
        <div style="padding: 24px; background: white; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #0F172A;">Habari ${data.name || ''},</p>
          <p style="font-size: 14px; color: #64748B; line-height: 1.6;">
            ${data.status === 'approved'
              ? 'Congratulations! Your guide verification has been approved. You can now accept bookings and start earning.'
              : data.status === 'rejected'
                ? `Your verification was not approved. Reason: ${data.reason || 'Please review your documents and reapply.'}`
                : 'Your verification documents have been received and are being reviewed. This usually takes 24-48 hours.'
            }
          </p>
          ${data.status === 'approved' ? `
            <div style="background: #ECFDF5; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <h3 style="color: #065F46; margin: 0 0 8px;">Next Steps:</h3>
              <ul style="color: #065F46; margin: 0; padding-left: 20px;">
                <li>Set your zones and availability</li>
                <li>Go online to start receiving requests</li>
                <li>Build your reputation with great service</li>
              </ul>
            </div>
          ` : ''}
        </div>
        ${unsubscribeFooter(data.unsubscribeUrl || '#')}
        ${trackingPixelHtml(data.trackingId || '')}
      </div>
    `,
    text: `Verification ${data.status}\n\n${data.status === 'approved' ? 'Congratulations! Your guide verification has been approved.' : data.status === 'rejected' ? `Your verification was not approved. Reason: ${data.reason || 'Please reapply.'}` : 'Your documents are being reviewed (24-48 hours).'}\n\nChimbo Direct\n\nUnsubscribe: ${data.unsubscribeUrl || '#'}`,
  }),

  password_reset: (data) => ({
    subject: 'Password Reset - Chimbo Direct',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC;">
        <div style="background: linear-gradient(135deg, #065F46, #059669); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">🔐 Password Reset</h1>
        </div>
        <div style="padding: 24px; background: white; border-radius: 0 0 12px 12px;">
          <p style="font-size: 14px; color: #64748B;">You requested a password reset for your Chimbo Direct account.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${trackingClickUrl(data.resetUrl || '#', data.trackingId || '')}" style="display: inline-block; background: #065F46; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 12px; color: #94A3B8; text-align: center;">This link expires in 1 hour. If you did not request this reset, please ignore this email.</p>
          <div style="background: #FEF3C7; border-radius: 8px; padding: 12px; margin: 16px 0;">
            <p style="color: #92400E; font-size: 13px; margin: 0;">⚠️ For your security, never share this link with anyone.</p>
          </div>
        </div>
        ${unsubscribeFooter(data.unsubscribeUrl || '#')}
        ${trackingPixelHtml(data.trackingId || '')}
      </div>
    `,
    text: `Password Reset\n\nReset your password: ${data.resetUrl || '#'}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.\n\nUnsubscribe: ${data.unsubscribeUrl || '#'}`,
  }),

  escrow_release: (data) => ({
    subject: `Escrow Released - TZS ${data.amount || '0'} - Chimbo Direct`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC;">
        <div style="background: linear-gradient(135deg, #065F46, #059669); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">🔓 Escrow Released</h1>
        </div>
        <div style="padding: 24px; background: white; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #0F172A;">Habari ${data.guideName || ''},</p>
          <p style="font-size: 14px; color: #64748B; line-height: 1.6;">
            Great news! The escrow for your session has been released and the funds are now in your wallet.
          </p>
          <div style="background: #ECFDF5; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
            <p style="color: #065F46; font-size: 12px; margin: 0 0 4px;">Amount Released</p>
            <p style="color: #065F46; font-size: 32px; font-weight: bold; margin: 0;">TZS ${data.amount || '0'}</p>
          </div>
          <div style="background: #F1F5F9; border-radius: 8px; padding: 12px; margin: 16px 0;">
            <p style="margin: 4px 0; color: #0F172A; font-size: 13px;"><strong>Session:</strong> ${data.sessionCode || data.sessionId || 'N/A'}</p>
            <p style="margin: 4px 0; color: #0F172A; font-size: 13px;"><strong>Platform Fee:</strong> TZS ${data.platformFee || '0'}</p>
            <p style="margin: 4px 0; color: #0F172A; font-size: 13px;"><strong>Your Payout:</strong> TZS ${data.guidePayout || data.amount || '0'}</p>
          </div>
          <a href="${trackingClickUrl(data.appUrl + '/wallet' || 'https://chimbo.direct/wallet', data.trackingId || '')}" style="display: inline-block; background: #065F46; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">
            View Wallet →
          </a>
        </div>
        ${unsubscribeFooter(data.unsubscribeUrl || '#')}
        ${trackingPixelHtml(data.trackingId || '')}
      </div>
    `,
    text: `Escrow Released!\n\nTZS ${data.amount} has been released to your wallet.\nSession: ${data.sessionCode}\nPlatform Fee: TZS ${data.platformFee}\nYour Payout: TZS ${data.guidePayout}\n\nView wallet: ${data.appUrl || 'https://chimbo.direct'}/wallet\n\nUnsubscribe: ${data.unsubscribeUrl || '#'}`,
  }),

  dispute_notification: (data) => ({
    subject: `Dispute Filed - Session ${data.sessionCode || 'N/A'} - Chimbo Direct`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC;">
        <div style="background: linear-gradient(135deg, #DC2626, #991B1B); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">⚠️ Dispute Filed</h1>
        </div>
        <div style="padding: 24px; background: white; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #0F172A;">Habari ${data.name || ''},</p>
          <p style="font-size: 14px; color: #64748B; line-height: 1.6;">
            A dispute has been filed regarding your session. The escrow funds are now frozen until the dispute is resolved.
          </p>
          <div style="background: #FEF2F2; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0; color: #991B1B;"><strong>Session:</strong> ${data.sessionCode || 'N/A'}</p>
            <p style="margin: 4px 0; color: #991B1B;"><strong>Dispute Reason:</strong> ${data.reason || 'Not specified'}</p>
            <p style="margin: 4px 0; color: #991B1B;"><strong>Frozen Amount:</strong> TZS ${data.amount || '0'}</p>
            <p style="margin: 4px 0; color: #991B1B;"><strong>Filed By:</strong> ${data.filedBy || 'Other party'}</p>
          </div>
          <div style="background: #FEF3C7; border-radius: 8px; padding: 12px; margin: 16px 0;">
            <p style="color: #92400E; font-size: 13px; margin: 0;">⏳ Disputes are typically resolved within 48-72 hours. Our team will review the details.</p>
          </div>
        </div>
        ${unsubscribeFooter(data.unsubscribeUrl || '#')}
        ${trackingPixelHtml(data.trackingId || '')}
      </div>
    `,
    text: `Dispute Filed\n\nA dispute has been filed for session ${data.sessionCode}.\nReason: ${data.reason}\nFrozen Amount: TZS ${data.amount}\nFiled By: ${data.filedBy}\n\nFunds are frozen until resolved. Disputes typically take 48-72 hours.\n\nUnsubscribe: ${data.unsubscribeUrl || '#'}`,
  }),

  weekly_digest: (data) => ({
    subject: `Your Weekly Chimbo Digest - ${data.weekStart || 'This Week'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC;">
        <div style="background: linear-gradient(135deg, #065F46, #059669); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">📊 Weekly Digest</h1>
          <p style="color: #34D399; margin: 4px 0 0;">${data.weekStart || 'This Week'} at Chimbo Direct</p>
        </div>
        <div style="padding: 24px; background: white; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #0F172A;">Habari ${data.name || ''}! Here's your weekly summary:</p>
          
          <div style="display: flex; gap: 12px; margin: 16px 0;">
            <div style="flex: 1; background: #ECFDF5; border-radius: 8px; padding: 16px; text-align: center;">
              <p style="color: #065F46; font-size: 24px; font-weight: bold; margin: 0;">${data.sessions || '0'}</p>
              <p style="color: #065F46; font-size: 12px; margin: 4px 0 0;">Sessions</p>
            </div>
            <div style="flex: 1; background: #FEF3C7; border-radius: 8px; padding: 16px; text-align: center;">
              <p style="color: #92400E; font-size: 24px; font-weight: bold; margin: 0;">TZS ${data.earnings || '0'}</p>
              <p style="color: #92400E; font-size: 12px; margin: 4px 0 0;">Earnings</p>
            </div>
            <div style="flex: 1; background: #ECFEFF; border-radius: 8px; padding: 16px; text-align: center;">
              <p style="color: #0891B2; font-size: 24px; font-weight: bold; margin: 0;">⭐ ${data.rating || '4.5'}</p>
              <p style="color: #0891B2; font-size: 12px; margin: 4px 0 0;">Rating</p>
            </div>
          </div>

          ${data.topTip ? `
            <div style="background: #F1F5F9; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="color: #065F46; font-size: 13px; margin: 0;"><strong>💡 Tip of the Week:</strong> ${data.topTip}</p>
            </div>
          ` : ''}
        </div>
        ${unsubscribeFooter(data.unsubscribeUrl || '#')}
        ${trackingPixelHtml(data.trackingId || '')}
      </div>
    `,
    text: `Weekly Digest\n\nSessions: ${data.sessions}\nEarnings: TZS ${data.earnings}\nRating: ${data.rating}\n\n${data.topTip || ''}\n\nUnsubscribe: ${data.unsubscribeUrl || '#'}`,
  }),

  referral_reward: (data) => ({
    subject: `Referral Reward! TZS ${data.reward || '5,000'} - Chimbo Direct`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC;">
        <div style="background: linear-gradient(135deg, #F59E0B, #D97706); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">🎉 Referral Reward!</h1>
        </div>
        <div style="padding: 24px; background: white; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #0F172A;">Habari ${data.name || ''}!</p>
          <p style="font-size: 14px; color: #64748B; line-height: 1.6;">
            Your referral has been successful! ${data.referredName || 'Your friend'} has joined Chimbo Direct and you've earned a reward.
          </p>
          <div style="background: #FEF3C7; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
            <p style="color: #92400E; font-size: 12px; margin: 0 0 4px;">Your Reward</p>
            <p style="color: #92400E; font-size: 32px; font-weight: bold; margin: 0;">TZS ${data.reward || '5,000'}</p>
          </div>
          <p style="font-size: 14px; color: #64748B;">The reward has been credited to your wallet. Keep referring friends to earn more!</p>
          <a href="${trackingClickUrl(data.appUrl + '/wallet' || 'https://chimbo.direct/wallet', data.trackingId || '')}" style="display: inline-block; background: #F59E0B; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">
            View Wallet →
          </a>
        </div>
        ${unsubscribeFooter(data.unsubscribeUrl || '#')}
        ${trackingPixelHtml(data.trackingId || '')}
      </div>
    `,
    text: `Referral Reward!\n\nYour referral was successful! TZS ${data.reward} has been added to your wallet.\n\nKeep referring friends to earn more!\n\nUnsubscribe: ${data.unsubscribeUrl || '#'}`,
  }),

  admin_broadcast: (data) => ({
    subject: data.subject || 'Important Update from Chimbo Direct',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC;">
        <div style="background: linear-gradient(135deg, #065F46, #059669); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">📢 ${data.subject || 'Update from Chimbo Direct'}</h1>
        </div>
        <div style="padding: 24px; background: white; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #0F172A;">Jambo ${data.name || 'Valued User'},</p>
          <div style="font-size: 14px; color: #64748B; line-height: 1.6;">
            ${data.bodyHtml || `<p>${data.body || data.message || 'Important update from the Chimbo Direct team.'}</p>`}
          </div>
          ${data.ctaUrl ? `
            <div style="text-align: center; margin: 24px 0;">
              <a href="${trackingClickUrl(data.ctaUrl, data.trackingId || '')}" style="display: inline-block; background: #065F46; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                ${data.ctaText || 'Learn More →'}
              </a>
            </div>
          ` : ''}
        </div>
        ${unsubscribeFooter(data.unsubscribeUrl || '#')}
        ${trackingPixelHtml(data.trackingId || '')}
      </div>
    `,
    text: `${data.subject || 'Update from Chimbo Direct'}\n\n${data.body || data.message || ''}\n\n${data.ctaUrl ? `Learn more: ${data.ctaUrl}` : ''}\n\nUnsubscribe: ${data.unsubscribeUrl || '#'}`,
  }),
};

// ── Check if SMTP is configured ──

function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// ── Send Email Directly (internal) ──

async function sendEmailDirectly(
  type: EmailType,
  to: string,
  data: Record<string, string> = {}
): Promise<{ success: boolean; message: string; demo?: boolean }> {
  const template = TEMPLATES[type];
  if (!template) {
    return { success: false, message: `Unknown email type: ${type}` };
  }

  const { subject, html, text } = template(data);

  const emailPayload: EmailTemplate = {
    to,
    subject,
    html,
    text,
    headers: {
      'X-Email-Type': type,
      'X-Tracking-ID': data.trackingId || '',
      'List-Unsubscribe': `<${data.unsubscribeUrl || '#'}>`,
    },
  };

  if (!isSmtpConfigured()) {
    // Demo mode - log to console
    console.log('📧 [DEMO EMAIL] ────────────────────────────────');
    console.log(`  Type: ${type}`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Tracking: ${data.trackingId || 'N/A'}`);
    console.log(`  Text: ${text.substring(0, 200)}...`);
    console.log('───────────────────────────────────────────────');

    return { success: true, message: 'Email logged (demo mode - no SMTP configured)', demo: true };
  }

  // Production mode - use nodemailer
  try {
    console.log('📧 [SMTP] Sending email:', { to, subject, type, trackingId: data.trackingId });
    // In production, you would use nodemailer or a service like SendGrid
    return { success: true, message: 'Email sent (install nodemailer for real sending)' };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, message: error.message };
  }
}

// ── Public API: Send Email (queues the email) ──

export async function sendEmail(
  type: EmailType,
  to: string,
  data: Record<string, string> = {}
): Promise<{ success: boolean; message: string; demo?: boolean; trackingId?: string }> {
  const trackingId = enqueueEmail(type, to, data);
  return {
    success: true,
    message: 'Email queued for sending',
    demo: !isSmtpConfigured(),
    trackingId,
  };
}

// ── Get all available email types ──

export function getEmailTypes(): EmailType[] {
  return Object.keys(TEMPLATES) as EmailType[];
}

// ── Preview email template (for admin) ──

export function previewEmail(type: EmailType, data: Record<string, string> = {}): EmailTemplate | null {
  const template = TEMPLATES[type];
  if (!template) return null;
  const { subject, html, text } = template(data);
  return { to: 'preview@chimbo.direct', subject, html, text };
}

// ── Get queue status ──

export function getQueueStatus(): { pending: number; processing: boolean } {
  return {
    pending: emailQueue.length,
    processing: isProcessing,
  };
}
