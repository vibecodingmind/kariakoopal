'use client';

import { motion } from 'framer-motion';
import {
  FileText, Scale, UserPlus, Users, Calendar, CreditCard,
  Smartphone, RotateCcw, Gavel, Sparkles, Shield,
  Lock, RefreshCw, Mail, ChevronUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

// ─── Data ────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    icon: Scale,
    content: `By accessing or using the Kariako Guide platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms constitute a legally binding agreement between you and Kariako Guide Ltd.

These Terms apply to all visitors, users, and others who access or use the Service. We reserve the right to update or modify these Terms at any time without prior notice. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.`,
  },
  {
    id: 'registration',
    title: '2. Account Registration',
    icon: UserPlus,
    content: `To use certain features of the Service, you must register for an account. When you register, you agree to:

(a) Provide accurate, current, and complete information during registration;
(b) Maintain and promptly update your account information to keep it accurate, current, and complete;
(c) Maintain the security and confidentiality of your login credentials;
(d) Accept responsibility for all activities that occur under your account;
(e) Immediately notify us if you discover any unauthorized use of your account.

You must be at least 18 years old to create an account. By creating an account, you represent and warrant that you are at least 18 years of age. We reserve the right to suspend or terminate your account if any information provided proves to be inaccurate, not current, or incomplete.`,
  },
  {
    id: 'roles',
    title: '3. User Roles',
    icon: Users,
    content: `Kariako Guide supports two primary user roles:

Seekers: Individuals who use the Service to find, book, and engage with Guides for market exploration, shopping assistance, and negotiation support in Kariakoo Market. Seekers are responsible for providing accurate information about their needs and preferences.

Guides: Local experts who offer their services through the platform to help Seekers navigate Kariakoo Market. Guides must complete our verification process, maintain up-to-date availability, provide quality service, and adhere to our Guide Code of Conduct.

Both Seekers and Guides must comply with all applicable laws and regulations while using the Service. Users may not maintain multiple accounts or misrepresent their identity or qualifications.`,
  },
  {
    id: 'booking',
    title: '4. Booking Terms',
    icon: Calendar,
    content: `When a Seeker books a Guide through the Service:

(a) The booking request is subject to the Guide's availability and acceptance;
(b) Both parties agree to the specified session date, time, duration, and meeting location;
(c) The Seeker's payment is held in escrow until the session is completed;
(d) Either party may cancel or reschedule up to 2 hours before the scheduled start time without penalty;
(e) Cancellations within 2 hours of the session may be subject to a cancellation fee;
(f) No-shows by the Seeker will result in forfeiture of the session payment;
(g) If a Guide fails to attend without notice, the Seeker will receive a full refund and may be eligible for a credit;
(h) Session extensions must be agreed upon by both parties through the platform;
(i) All communications regarding bookings should occur through the platform's messaging system.

Kariako Guide is not a party to the guide-seeker relationship and is not liable for the conduct of either party during a session.`,
  },
  {
    id: 'payment',
    title: '5. Payment Terms',
    icon: CreditCard,
    content: `All payments on the Kariako Guide platform are processed in Tanzanian Shillings (TZS). Payment terms include:

(a) Session fees are displayed on the Guide's profile and confirmed at the time of booking;
(b) Payment is collected at the time of booking and held in escrow;
(c) Upon successful completion of a session, payment is released to the Guide within 24-48 hours, minus the platform service fee (currently 15%);
(d) Guides are responsible for any applicable taxes on their earnings;
(e) Seekers may be charged additional fees for session extensions or add-on services;
(f) All fees are non-refundable except as described in the Cancellation & Refund section;
(g) We reserve the right to change our fee structure with 30 days' notice.

Price disputes should be reported within 48 hours of the session completion through the platform's dispute resolution system.`,
  },
  {
    id: 'mpesa',
    title: '6. M-Pesa Integration',
    icon: Smartphone,
    content: `Kariako Guide integrates with M-Pesa and other mobile money services for payment processing. By using M-Pesa through our Service:

(a) You authorize us to initiate payment instructions to M-Pesa on your behalf;
(b) You acknowledge that M-Pesa transactions are subject to M-Pesa's own terms and conditions;
(c) Transaction delays may occur due to M-Pesa system maintenance or network issues;
(d) We are not responsible for M-Pesa service outages, transaction failures, or delays caused by M-Pesa;
(e) M-Pesa PIN and account security are your responsibility;
(f) We never store your M-Pesa PIN or sensitive financial credentials;
(g) Transaction limits are subject to M-Pesa's prescribed limits;
(h) For international users, currency conversion is handled at the prevailing market rate at the time of transaction.

We also support Tigo Pesa and Airtel Money under similar terms. Credit/debit card payments are processed through secure third-party payment processors compliant with PCI DSS standards.`,
  },
  {
    id: 'cancellation',
    title: '7. Cancellation & Refund',
    icon: RotateCcw,
    content: `Our cancellation and refund policy is designed to be fair to both Seekers and Guides:

Cancellation by Seeker:
- More than 2 hours before session: Full refund
- Less than 2 hours before session: 50% refund
- No-show: No refund

Cancellation by Guide:
- Any time: Full refund to Seeker
- Repeated cancellations may result in account review

Refund Processing:
- Refunds are initiated within 24 hours of cancellation
- M-Pesa refunds typically arrive within 1-3 business days
- Card refunds may take 5-10 business days to appear on your statement
- Refunds are sent to the original payment method

Force Majeure: If a session cannot proceed due to events beyond either party's control (natural disasters, civil unrest, government restrictions, etc.), both parties will receive a full refund or credit.`,
  },
  {
    id: 'disputes',
    title: '8. Dispute Resolution',
    icon: Gavel,
    content: `If a dispute arises between a Seeker and a Guide:

(a) Both parties should first attempt to resolve the dispute through direct communication via the platform's messaging system;
(b) If unresolved within 48 hours, either party may escalate the dispute to Kariako Guide support;
(c) Our support team will review evidence from both parties, including chat logs, session recordings (if available), and any other relevant information;
(d) We will make a fair determination within 5 business days;
(e) Our determination may include partial or full refunds, account actions, or other remedies;
(f) Both parties agree to cooperate in good faith with any investigation;
(g) Our dispute resolution decisions are final and binding.

For legal disputes, both parties agree to first attempt mediation before pursuing litigation. Any legal proceedings shall be brought in the courts of Dar es Salaam, Tanzania.`,
  },
  {
    id: 'ai',
    title: '9. AI Features',
    icon: Sparkles,
    content: `Kariako Guide offers AI-powered features including but not limited to:

AI Haggling Assistant: Provides estimated fair price ranges and negotiation strategies based on market data. These are estimates only and do not guarantee specific outcomes. Market prices fluctuate and actual prices may vary.

AI Vision Scanner: Identifies items from photos and provides price and shopping advice. Identification accuracy is not guaranteed. Always verify item authenticity independently before purchasing.

AI Translation: Provides Swahili-English translations for market communication. Translations are approximate and may not capture all nuances. We recommend confirming important communications with native speakers.

AI Recommendations: Suggests guides, routes, and items based on your preferences. These are suggestions only and we do not guarantee satisfaction with recommended options.

Important: AI features are provided as assistance tools only. Users should exercise their own judgment and not rely solely on AI-generated advice for important decisions. We are not liable for any losses resulting from reliance on AI-generated information.`,
  },
  {
    id: 'liability',
    title: '10. Limitation of Liability',
    icon: Shield,
    content: `To the maximum extent permitted by law:

(a) The Service is provided "as is" and "as available" without warranties of any kind;
(b) We do not guarantee the quality, safety, or legality of any Guide's services;
(c) We are not responsible for the conduct of any user of the Service;
(d) We are not liable for any indirect, incidental, special, consequential, or punitive damages;
(e) Our total liability to you for any claim arising out of or relating to the Service shall not exceed the amount you paid to us in the 12 months preceding the claim;
(f) We are not liable for any losses arising from third-party payment processing failures;
(g) We are not liable for any losses arising from the use or reliance on AI-generated information;
(h) We are not responsible for any theft, loss, or damage to personal property during sessions;
(i) We do not guarantee continuous, uninterrupted, or secure access to the Service.

Nothing in these Terms excludes or limits our liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded by law.`,
  },
  {
    id: 'privacy',
    title: '11. Privacy',
    icon: Lock,
    content: `Your privacy is important to us. Our collection and use of personal information in connection with the Service is as described in our Privacy Policy, which is incorporated into these Terms by reference.

By using the Service, you consent to the collection and use of your information as described in our Privacy Policy. Key points include:

- We collect only the information necessary to provide the Service;
- We use industry-standard security measures to protect your data;
- We do not sell your personal information to third parties;
- You have the right to access, correct, and delete your personal data;
- Location data is collected only during active sessions with your consent;

Please review our complete Privacy Policy at kariako.guide/legal/privacy for detailed information.`,
  },
  {
    id: 'modifications',
    title: '12. Modifications',
    icon: RefreshCw,
    content: `We reserve the right to modify these Terms at any time. When we make changes:

(a) We will post the updated Terms on our website and app;
(b) We will notify registered users via email or in-app notification for material changes;
(c) Changes become effective 30 days after posting unless otherwise stated;
(d) Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms;
(e) If you do not agree to the revised Terms, you must stop using the Service and may request account deletion.

We encourage you to review these Terms periodically to stay informed of any updates.`,
  },
  {
    id: 'contact',
    title: '13. Contact',
    icon: Mail,
    content: `If you have any questions about these Terms of Service, please contact us:

Kariako Guide Ltd.
Dar es Salaam, Tanzania
Email: legal@kariako.guide
Phone: +255 123 456 789
In-App: Help Center > Contact Support

For dispute resolution, please use the in-app dispute system first. For urgent safety concerns, use the SOS feature in the app or call emergency services.

Our support team is available:
Monday - Friday: 8:00 AM - 8:00 PM (EAT)
Saturday: 9:00 AM - 5:00 PM (EAT)
Sunday: Emergency support only

Last updated: January 1, 2025`,
  },
];

// ─── Component ───────────────────────────────────────────────────────

export default function TermsPage() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, #065F46 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#065F46]/10 dark:bg-[#34D399]/5 blur-3xl" />

        <div className="relative px-4 pt-8 pb-10 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#065F46]/10 dark:bg-[#34D399]/10 px-4 py-1.5 rounded-full mb-4">
              <FileText className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              <span className="text-xs font-semibold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider">
                Legal
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3"
          >
            <span className="gradient-text-green">Terms of</span>{' '}
            <span className="gradient-text-gold">Service</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm text-[#64748B] dark:text-[#94A3B8]"
          >
            Last updated: January 1, 2025 · Effective date: January 31, 2025
          </motion.p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-16 space-y-6">
        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="kcard p-5 sm:p-6">
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-4 uppercase tracking-wider">
              Table of Contents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B] transition-colors text-sm text-[#0F172A] dark:text-[#F1F5F9] font-medium"
                  >
                    <Icon className="w-4 h-4 text-[#065F46] dark:text-[#34D399] shrink-0" />
                    <span className="truncate">{section.title}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Content Sections */}
        {SECTIONS.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i + 0.4 }}
            >
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-[#065F46] to-[#059669] dark:from-[#022C22] dark:to-[#065F46] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-[#FBBF24]" />
                    <h2 className="text-base font-bold text-white">{section.title}</h2>
                  </div>
                </div>
                <CardContent className="p-5 sm:p-6">
                  <div className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Back to top + Related links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <button
            onClick={scrollToTop}
            className="kbtn-outline inline-flex items-center gap-2"
          >
            <ChevronUp className="w-4 h-4" />
            Back to Top
          </button>
          <div className="flex gap-3">
            <Link href="/legal/privacy" className="kbtn-ghost inline-flex items-center gap-1 text-sm">
              <Lock className="w-4 h-4" />
              Privacy Policy
            </Link>
            <Link href="/help" className="kbtn-ghost inline-flex items-center gap-1 text-sm">
              <Mail className="w-4 h-4" />
              Help Center
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
