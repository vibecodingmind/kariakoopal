'use client';

import { motion } from 'framer-motion';
import {
  Shield, Database, Eye, Share2, Lock, Smartphone,
  Sparkles, Cookie, CheckCircle, Clock, Baby, RefreshCw,
  Mail, ChevronUp, FileText
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

// ─── Data ────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'collection',
    title: '1. Data Collection',
    icon: Database,
    content: `We collect information to provide and improve our Service. The types of data we collect include:

Information You Provide:
- Account information: name, email address, phone number, profile photo
- Identity verification: national ID, passport (for Guides only)
- Payment information: M-Pesa phone number, card details (processed by third parties)
- Session preferences: preferred zones, languages, item categories
- Communications: messages between Seekers and Guides, support requests

Information Collected Automatically:
- Device information: device type, operating system, unique device identifiers
- Location data: GPS coordinates during active sessions (with your consent)
- Usage data: pages visited, features used, session duration, click patterns
- Log data: IP address, browser type, access times, referring URLs

Information from Third Parties:
- Social login providers (Google, Facebook): name, email, profile photo
- Payment processors: transaction status and confirmation
- Mobile money providers (M-Pesa, Tigo Pesa): payment confirmation only

We only collect data that is necessary for the functioning of the Service. We do not collect data from persons under the age of 18.`,
  },
  {
    id: 'usage',
    title: '2. How We Use Data',
    icon: Eye,
    content: `We use the collected data for the following purposes:

Service Delivery:
- Creating and managing your account
- Matching Seekers with appropriate Guides
- Processing payments and escrow transactions
- Facilitating communication between users
- Providing AI-powered features (haggling, vision, translation)

Safety and Security:
- Verifying Guide identities and qualifications
- Monitoring for fraudulent or suspicious activity
- Providing emergency features and location sharing
- Enforcing our Terms of Service
- Investigating disputes and complaints

Improvement and Development:
- Analyzing usage patterns to improve the Service
- Training and improving our AI models
- Conducting research for new features
- A/B testing and personalization
- Generating anonymized analytics and reports

Communication:
- Sending booking confirmations and reminders
- Notifying you of safety alerts
- Providing customer support
- Sending promotional communications (with your consent)
- Delivering weekly digests and session summaries

We will not use your data for purposes materially different from those described without providing you with notice and, where required, obtaining your consent.`,
  },
  {
    id: 'sharing',
    title: '3. Data Sharing',
    icon: Share2,
    content: `We may share your information in the following circumstances:

Between Users:
- Guide profiles (name, photo, rating, languages, zones) are visible to Seekers
- Seeker first name and session preferences are shared with booked Guides
- Location data is shared with your booked Guide during active sessions
- Review content and ratings are publicly visible

With Service Providers:
- Payment processors (M-Pesa, card processors) for transaction processing
- Cloud hosting providers for data storage and processing
- Communication services for notifications and messages
- Analytics providers for usage analysis (anonymized where possible)

For Legal and Safety Reasons:
- To comply with applicable laws, regulations, or legal process
- To protect the rights, property, or safety of Kariako Guide, our users, or the public
- To investigate or prevent suspected fraud or security violations
- To enforce our Terms of Service

Business Transfers:
- In connection with any merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity

We do not sell your personal information to third parties for their marketing purposes. We require all third-party service providers to maintain the confidentiality and security of your data.`,
  },
  {
    id: 'security',
    title: '4. Data Security',
    icon: Lock,
    content: `We implement industry-standard security measures to protect your data:

Technical Safeguards:
- Encryption in transit using TLS 1.3 for all communications
- Encryption at rest using AES-256 for stored data
- Secure data centers with physical access controls
- Regular security audits and penetration testing
- Automated vulnerability scanning
- Secure API endpoints with authentication and rate limiting

Organizational Safeguards:
- Employee access is restricted on a need-to-know basis
- Regular security training for all team members
- Background checks for employees with data access
- Incident response plan and breach notification procedures
- Regular review of data access logs

Operational Safeguards:
- Two-factor authentication for administrative access
- Session timeouts for inactive accounts
- Regular data backup and disaster recovery procedures
- Secure development lifecycle practices

While we strive to protect your data, no method of transmission or storage is 100% secure. We cannot guarantee absolute security and are not responsible for unauthorized access that occurs despite our security measures.`,
  },
  {
    id: 'mpesa-data',
    title: '5. M-Pesa Data',
    icon: Smartphone,
    content: `We take special care with your mobile money data:

What We Collect:
- M-Pesa phone number for payment processing
- Transaction confirmation codes
- Payment status (success, failure, pending)

What We Do NOT Collect:
- M-Pesa PIN numbers (never requested or stored)
- Full bank account details
- Card CVV numbers

How We Process:
- Payment instructions are sent securely to M-Pesa via their official API
- Transaction confirmations are received directly from M-Pesa
- We maintain a record of transaction IDs for dispute resolution
- Payment data is stored in encrypted format

Retention:
- Transaction records are retained for 7 years as required by Tanzanian financial regulations
- M-Pesa phone numbers are retained while your account is active
- Upon account deletion, payment records are anonymized but transaction IDs are preserved for regulatory compliance

Third-Party Processing:
- M-Pesa processes payments according to their own privacy policy and terms
- We are not responsible for M-Pesa's data handling practices
- We recommend reviewing M-Pesa's privacy policy independently`,
  },
  {
    id: 'ai-data',
    title: '6. AI Features Data',
    icon: Sparkles,
    content: `Our AI features require specific data processing:

AI Haggling Assistant:
- We process item names, prices, and vendor types to provide negotiation advice
- Market price data is aggregated and anonymized for fair price estimation
- Your haggle history may be used to improve price range accuracy
- We do not share individual haggle data with third parties

AI Vision Scanner:
- Images are processed by our AI for item identification
- Images are not stored permanently and are deleted after analysis
- AI identification results may be used to improve our vision model
- You may opt out of image data usage for model training in Settings

AI Translation:
- Translation requests are processed in real-time
- We do not store individual translation requests permanently
- Anonymized translation patterns may be used to improve translation quality
- Common phrase caches are stored locally on your device

AI Recommendations:
- We use your session history, ratings, and preferences for personalized recommendations
- Recommendation data is processed on our secure servers
- You can reset your recommendation profile in Settings
- We do not share your recommendation profile with other users

Data Anonymization:
- All data used for AI training is anonymized and aggregated
- Individual user data is never used to identify or target specific users
- You may opt out of AI data collection in Settings > Privacy`,
  },
  {
    id: 'cookies',
    title: '7. Cookies & Tracking',
    icon: Cookie,
    content: `We use cookies and similar tracking technologies:

Essential Cookies:
- Session authentication and security
- Language and theme preferences
- Cart and booking state
- These cannot be disabled as they are necessary for the Service

Analytics Cookies:
- Usage patterns and feature adoption
- Performance monitoring
- Error tracking and debugging
- These can be disabled in Settings > Privacy

Marketing Cookies:
- Campaign attribution (only with your consent)
- Feature announcement targeting
- These require explicit consent and can be disabled at any time

Third-Party Tracking:
- We use minimal third-party analytics
- All third-party trackers are reviewed for privacy compliance
- We do not allow advertising trackers on our platform

Managing Cookies:
- You can manage cookie preferences in Settings > Privacy
- Most browsers allow you to block or delete cookies
- Some features may not work properly with cookies disabled
- We respect Do Not Track signals where technically feasible`,
  },
  {
    id: 'rights',
    title: '8. Your Rights',
    icon: CheckCircle,
    content: `You have the following rights regarding your personal data:

Access: You can request a copy of all personal data we hold about you. We will provide this within 30 days in a machine-readable format.

Correction: You can update or correct your personal information at any time through Settings > Profile. For information you cannot edit directly, contact support.

Deletion: You can request deletion of your account and associated data. Some data may be retained as required by law (e.g., financial transaction records). Upon deletion:
- Your profile is removed from public view immediately
- Personal data is deleted within 30 days
- Anonymized data may be retained for analytics
- Transaction records are retained as required by law

Portability: You can export your data in a standard format. Go to Settings > Privacy > Download My Data.

Objection: You can object to:
- Processing based on legitimate interests
- Direct marketing communications
- Automated decision-making

Restriction: You can request that we restrict processing of your data in certain circumstances, such as when you contest the accuracy of the data.

Withdrawal of Consent: Where processing is based on consent, you may withdraw your consent at any time without affecting the lawfulness of processing carried out before withdrawal.

To exercise any of these rights, contact us at privacy@kariako.guide or through Settings > Privacy > Data Rights.`,
  },
  {
    id: 'retention',
    title: '9. Data Retention',
    icon: Clock,
    content: `We retain your data for as long as necessary to provide the Service:

Active Account Data:
- Profile information: Retained while account is active
- Session history: Retained for 3 years after last activity
- Messages: Retained for 1 year after last activity
- Reviews: Retained indefinitely (anonymized upon account deletion)

Financial Data:
- Transaction records: 7 years (regulatory requirement)
- Payment method details: While account is active
- Receipts and invoices: 7 years

AI and Analytics Data:
- Anonymized usage data: Retained indefinitely for service improvement
- AI training data: Anonymized and retained indefinitely
- Individual usage patterns: 2 years

Safety and Dispute Data:
- Dispute records: 5 years after resolution
- Safety incident reports: 7 years
- Verification documents: While account is active + 1 year

When data is no longer needed, we securely delete it or anonymize it so it can no longer be associated with you. If you close your account, we will delete your data in accordance with this policy, except where retention is required by law.`,
  },
  {
    id: 'children',
    title: '10. Children\'s Privacy',
    icon: Baby,
    content: `Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children.

- Users must be at least 18 years old to create an account
- We do not allow minors to register as Seekers or Guides
- If we become aware that we have collected data from a person under 18, we will take steps to delete that information promptly
- Parents or guardians who believe their child has provided personal information to us should contact us immediately at privacy@kariako.guide
- We will promptly remove such information from our servers

We encourage parents and guardians to monitor their children's online activities and to help enforce this policy by not allowing minors to use the Service.`,
  },
  {
    id: 'changes',
    title: '11. Changes to This Policy',
    icon: RefreshCw,
    content: `We may update this Privacy Policy from time to time:

Notification:
- We will post the updated Privacy Policy on our website
- We will notify you via email or in-app notification for material changes
- Changes to data collection practices will be highlighted

Effective Date:
- Changes become effective 30 days after posting
- Your continued use of the Service after changes become effective constitutes acceptance of the revised policy
- If you do not agree with the changes, you may delete your account

Version History:
- Previous versions of this Privacy Policy are available upon request
- The "Last Updated" date at the top of this page indicates when changes were last made

We encourage you to review this Privacy Policy periodically to stay informed about how we collect, use, and protect your information.`,
  },
  {
    id: 'contact',
    title: '12. Contact Us',
    icon: Mail,
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

Kariako Guide Ltd.
Dar es Salaam, Tanzania

Data Protection Officer:
Email: privacy@kariako.guide
Phone: +255 123 456 789

General Support:
Email: support@kariako.guide
In-App: Help Center > Contact Support

Data Rights Requests:
Email: privacy@kariako.guide
Subject line: "Data Rights Request - [Your Name]"
Please include your account email for verification.

Response Time:
- Data access requests: 30 days
- Data correction requests: 7 days
- Data deletion requests: 30 days
- General inquiries: 48 hours

Regulatory Complaints:
If you are not satisfied with our response to a privacy concern, you may lodge a complaint with the Tanzanian Communications Regulatory Authority (TCRA) or other applicable regulatory body.

Last updated: January 1, 2025
Effective date: January 31, 2025`,
  },
];

// ─── Component ───────────────────────────────────────────────────────

export default function PrivacyPage() {
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
              <Shield className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
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
            <span className="gradient-text-green">Privacy</span>{' '}
            <span className="gradient-text-gold">Policy</span>
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
            <Link href="/legal/terms" className="kbtn-ghost inline-flex items-center gap-1 text-sm">
              <FileText className="w-4 h-4" />
              Terms of Service
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
