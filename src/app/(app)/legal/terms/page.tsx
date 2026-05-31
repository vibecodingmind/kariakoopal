'use client';

import { motion } from 'framer-motion';
import { FileText, ArrowLeft, Scale, Shield, Users, CreditCard, AlertTriangle, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth-store';
import Link from 'next/link';

export default function TermsPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const sections = [
    {
      icon: Scale,
      title: l('1. Acceptance of Terms', '1. kukubaliana na Masharti'),
      content: l(
        'By accessing or using the Chimbo Direct platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service. These terms apply to all users, including seekers, guides, and administrators.',
        'Kwa kupata au kutumia jukwaa la Chimbo Direct ("Huduma"), unakubali kufungwa na Masharti hizi ya Huduma. Ukikubaliana na masharti hizi, tafadhali usitumie Huduma yetu. Masharti haya inatumika kwa watumiaji wote, ikiwa ni pamoja na watafuta, waongozaji, na wasimamizi.'
      ),
    },
    {
      icon: Users,
      title: l('2. User Accounts & Roles', '2. Akaunti za Watumiaji & Majukumu'),
      content: l(
        'You must provide accurate information when creating an account. There are two primary roles:\n\n• Seekers: Users looking for local guides to help navigate Kariakoo Market.\n• Guides: Verified local experts who provide navigation and bargaining assistance.\n\nGuides must complete our verification process (ID verification, zone knowledge quiz, selfie verification) before accepting bookings.',
        'Lazima utoe taarifa sahihi unapounda akaunti. Kuna majukumu mawili makuu:\n\n• Watafuta: Watumiaji wanaotafuta waongozaji wa ndani kuwasaidia kupitia Soko la Kariakoo.\n• Waongozaji: Wataalamu wa ndani waliothibitishwa ambao hutoa msaada wa urambazaji na kujadiliana.\n\nWaongozaji lazima wakamilishe mchakato wetu wa uthibitisho kabla ya kukubali buku.'
      ),
    },
    {
      icon: CreditCard,
      title: l('3. Payments & Escrow', '3. Malipo & Escrow'),
      content: l(
        'All payments are processed through our escrow system. When a seeker books a guide, the payment is held securely until the session is confirmed complete by both parties. The platform retains a 12% service fee on all completed transactions. Refunds are processed within 5-7 business days for cancelled sessions.',
        'Malipo yote yanachakatwa kupitia mfumo wetu wa escrow. Mtafuta anapobuka mwongozo, malipo yanashikiliwa kwa usalama hadi kikao kithibitishwe kuwa kimekamilika na pande zote. Jukwaa linaweka ada ya huduma ya 12% kwenye muamala wote uliokamilika. Rudi zinachakatwa ndani ya siku 5-7 za biashara kwa vikao vilivyoghairiwa.'
      ),
    },
    {
      icon: Shield,
      title: l('4. Safety & Conduct', '4. Usalama & Mwenendo'),
      content: l(
        'Users must conduct themselves respectfully and lawfully. The emergency button feature should only be used in genuine emergencies. False emergency reports will result in account suspension. Guides must not engage in price manipulation, harassment, or fraudulent behavior. Seekers must not abuse the escrow system or make false disputes.',
        'Watumiaji lazima wajitimize kwa heshima na kisheria. Kipengele cha kitufe cha dharura kinapaswa kutumika tu katika dharura halisi. Ripoti za dharura za uongo zitasababisha kusimamisha akaunti. Waongozaji hawapaswi kuhusika katika udanganyifu wa bei, unyanyasaji, au tabia ya udanganyifu. Watafuta hawapaswi kutumia vibaya mfumo wa escrow au kufanya mgogoro wa uongo.'
      ),
    },
    {
      icon: AlertTriangle,
      title: l('5. Dispute Resolution', '5. Suluhu ya Migogoro'),
      content: l(
        'If a dispute arises during a session, both parties should attempt to resolve it first. If unresolved, either party may raise a formal dispute through the platform. Our admin team will review the case within 48 hours. Decisions are final and binding. During dispute review, escrow funds are held until resolution.',
        'Ikiwa mgogoro unatokea wakati wa kikao, pande zote zinapaswa kujaribu kulitatua kwanza. Ikiwa hakuna suluhu, upande wowote unaweza kuza mgogoro rasmi kupitia jukwaa. Timu yetu ya usimamizi itakagua kesi ndani ya masaa 48. Maamuzi ni ya mwisho na yanafungwa. Wakati wa ukaguzi wa mgogoro, pesa za escrow zinashikiliwa hadi suluhu.'
      ),
    },
    {
      icon: FileText,
      title: l('6. Intellectual Property', '6. Mali ya Akili'),
      content: l(
        'All content on the Chimbo Direct platform, including but not limited to text, graphics, logos, and software, is the property of Chimbo Direct Ltd. Market data and price information are provided for personal use only. Commercial reproduction or distribution without written consent is prohibited.',
        'Yaliyomo yote kwenye jukwaa la Chimbo Direct, ikiwa ni pamoja na lakini sio mdogo na maandishi, michoro, nembo, na programu, ni mali ya Chimbo Direct Ltd. Data ya soko na taarifa za bei zinatolewa kwa matumizi ya kibinafsi tu. Uzalishaji au usambazaji wa kibiashara bila idhini ya maandishi unakatazwa.'
      ),
    },
    {
      icon: Shield,
      title: l('7. Limitation of Liability', '7. Kikomo cha Dhima'),
      content: l(
        'Chimbo Direct acts as an intermediary platform connecting seekers with guides. We are not responsible for the actions or conduct of individual guides or seekers. We do not guarantee the quality of products purchased in the market. Our liability is limited to the amount paid through the platform for the specific transaction in question.',
        'Chimbo Direct inafanya kazi kama jukwaa la kati linalounganisha watafuta na waongozaji. Hatuhusiki na vitendo au mwenendo wa waongozaji au watafuta binafsi. Hatuhakikishi ubora wa bidhaa zilizonunuliwa sokoni. Dhima yetu ni mdogo kwa kiasi kilicholipwa kupitia jukwaa kwa muamala maalum unaozingatiwa.'
      ),
    },
    {
      icon: Mail,
      title: l('8. Contact Information', '8. Taarifa za Mawasiliano'),
      content: l(
        'For questions about these Terms of Service, please contact us at:\n\n• Email: legal@chimbo.direct\n• Phone: +255 123 456 789\n• Address: Kariakoo Market, Dar es Salaam, Tanzania\n\nLast updated: January 2025',
        'Kwa maswali kuhusu Masharti hizi ya Huduma, tafadhali wasiliana nasi:\n\n• Barua: legal@chimbo.direct\n• Simu: +255 123 456 789\n• Anwani: Soko la Kariakoo, Dar es Salaam, Tanzania\n\nIlisasishwa mwisho: Januari 2025'
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#065F46] to-[#064E3B] dark:from-[#0F172A] dark:to-[#0F172A] px-4 pt-6 pb-8">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/help" className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {l('Back to Help', 'Rudi kwenye Msaada')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#34D399]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{l('Terms of Service', 'Sheria na Masharti')}</h1>
              <p className="text-xs text-[#34D399]">{l('Last updated: January 2025', 'Ilisasishwa: Januari 2025')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              {l(
                'Welcome to Chimbo Direct. These Terms of Service govern your use of our platform and services. Please read them carefully before using our service.',
                'Karibu Chimbo Direct. Masharti hizi ya Huduma zinaongoza matumizi yako ya jukwaa letu na huduma. Tafadhali zisome kwa uangalifu kabla ya kutumia huduma yetu.'
              )}
            </p>
          </CardContent>
        </Card>

        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-0 shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
                    </div>
                    <h3 className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">{section.title}</h3>
                  </div>
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        <div className="pt-4 pb-8 text-center">
          <Link href="/legal/privacy">
            <span className="text-sm text-[#065F46] dark:text-[#34D399] font-medium hover:underline">
              {l('Read our Privacy Policy →', 'Soma Sera yetu ya Faragha →')}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
