// Chimbo Direct Platform - Email System
// In demo mode (no SMTP env vars), emails are logged to console

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

type EmailType = 'welcome_email' | 'booking_confirmation' | 'payment_receipt' | 'guide_verification' | 'password_reset';

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
          <a href="${data.appUrl || 'https://chimbo.direct'}" style="display: inline-block; background: #065F46; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">
            Explore Kariakoo →
          </a>
        </div>
        <div style="text-align: center; padding: 16px; color: #94A3B8; font-size: 12px;">
          Chimbo Direct · Dar es Salaam, Tanzania<br/>
          Asili ya Kariakoo — Nguvu ya Soko
        </div>
      </div>
    `,
    text: `Karibu Chimbo Direct!\n\nJambo ${data.name || 'Friend'}!\n\nWelcome to Chimbo Direct — your trusted companion for navigating Kariakoo Market.\n\nGet started:\n- Browse market zones and vendors\n- Find a verified local guide\n- Check fair prices with Price Radar\n- Use AI Vision to identify items\n\nVisit: ${data.appUrl || 'https://chimbo.direct'}`,
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
            <p style="color: #92400E; font-size: 13px; margin: 0;">💡 <strong>Tip:</strong> Use the session code to confirm your meeting with the guide. Your payment is held safely in escrow until the session is complete.</p>
          </div>
        </div>
      </div>
    `,
    text: `Booking Confirmed!\n\nGuide: ${data.guideName}\nZone: ${data.zone}\nDate: ${data.date}\nTime: ${data.time}\nAmount: TZS ${data.amount}\nSession Code: ${data.sessionCode}\n\nYour payment is held in escrow until session completion.`,
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
      </div>
    `,
    text: `Payment Receipt\n\nTransaction ID: ${data.transactionId}\nType: ${data.type}\nAmount: TZS ${data.amount}\nStatus: ${data.status}\nDate: ${data.date}\nMethod: ${data.method}\n\nKeep this receipt for your records.`,
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
      </div>
    `,
    text: `Verification ${data.status}\n\n${data.status === 'approved' ? 'Congratulations! Your guide verification has been approved.' : data.status === 'rejected' ? `Your verification was not approved. Reason: ${data.reason || 'Please reapply.'}` : 'Your documents are being reviewed (24-48 hours).'}\n\nChimbo Direct`,
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
            <a href="${data.resetUrl || '#'}" style="display: inline-block; background: #065F46; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 12px; color: #94A3B8; text-align: center;">This link expires in 1 hour. If you did not request this reset, please ignore this email.</p>
          <div style="background: #FEF3C7; border-radius: 8px; padding: 12px; margin: 16px 0;">
            <p style="color: #92400E; font-size: 13px; margin: 0;">⚠️ For your security, never share this link with anyone.</p>
          </div>
        </div>
      </div>
    `,
    text: `Password Reset\n\nReset your password: ${data.resetUrl || '#'}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
  }),
};

// ── Check if SMTP is configured ──

function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// ── Send Email ──

export async function sendEmail(
  type: EmailType,
  to: string,
  data: Record<string, string> = {}
): Promise<{ success: boolean; message: string; demo?: boolean }> {
  const template = TEMPLATES[type];
  if (!template) {
    return { success: false, message: `Unknown email type: ${type}` };
  }

  const { subject, html, text } = template(data);

  const emailPayload: EmailTemplate = { to, subject, html, text };

  if (!isSmtpConfigured()) {
    // Demo mode - log to console
    console.log('📧 [DEMO EMAIL] ────────────────────────────────');
    console.log(`  Type: ${type}`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Text: ${text.substring(0, 200)}...`);
    console.log('───────────────────────────────────────────────');

    return { success: true, message: 'Email logged (demo mode - no SMTP configured)', demo: true };
  }

  // Production mode - would use nodemailer
  // Note: Install nodemailer package to enable real email sending
  try {
    console.log('📧 [SMTP] Attempting to send email via SMTP (nodemailer not installed - install to enable)');
    console.log(`📧 [SMTP] To: ${to}, Subject: ${subject}`);
    
    return { success: true, message: 'Email logged (install nodemailer for real sending)' };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, message: error.message };
  }
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
