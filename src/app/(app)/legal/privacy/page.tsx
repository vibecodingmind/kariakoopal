'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Eye, Lock, Bell, Globe, Database, UserCheck, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth-store';
import Link from 'next/link';

export default function PrivacyPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const sections = [
    {
      icon: Eye,
      title: l('1. Information We Collect', '1. Taarifa Tunazokusanya'),
      content: l(
        'We collect the following types of information:\n\n• Personal Information: Name, phone number, email address, and ID documents (for guide verification only).\n• Location Data: GPS coordinates during active sessions for safety and navigation.\n• Transaction Data: Payment history, wallet balance, and transaction records.\n• Usage Data: Pages visited, features used, search queries, and session duration.\n• Device Data: Device type, operating system, and app version.',
        'Tunakusanya aina zifuatazo za taarifa:\n\n• Taarifa za Kibinafsi: Jina, nambari ya simu, anwani ya barua, na nyaraka za kitambulisho (kwa uthibitisho wa mwongozo tu).\n• Data ya Mahali: Kianzi cha GPS wakati wa vikao vinavyoendelea kwa usalama na urambazaji.\n• Data ya Muamala: Historia ya malipo, salio la pochi, na rekodi za muamala.\n• Data ya Matumizi: Kurasa zilizotembelewa, vipengele vilivyotumika, maswali ya utafutaji, na muda wa kikao.\n• Data ya Kifaa: Aina ya kifaa, mfumo wa uendeshaji, na toleo la programu.'
      ),
    },
    {
      icon: Database,
      title: l('2. How We Use Your Information', '2. Jinsi Tunavyotumia Taarifa Zako'),
      content: l(
        'Your information is used to:\n\n• Provide and improve our guide matching and booking services\n• Process payments and manage escrow transactions\n• Verify guide identities for safety and trust\n• Send transactional notifications (booking confirmations, payment receipts)\n• Improve our AI features (Price Radar, Vision Scanner, Haggling Assistant)\n• Detect and prevent fraud or unauthorized activity\n• Comply with legal requirements in Tanzania',
        'Taarifa yako inatumika kwa:\n\n• Kutoa na kuboresha huduma zetu za kuunganisha na kubuka waongozaji\n• Kuchakata malipo na kusimamia muamala wa escrow\n• Kuthibitisha utambulisho wa mwongozo kwa usalama na tegemeo\n• Kutuma arifa za muamala (uthibitisho wa buku, risiti za malipo)\n• Kuboresha vipengele vyetu vya AI (Rada ya Bei, Kichungi cha Vision, Msaidizi wa Kujadiliana)\n• Kugundua na kuzuia udanganyifu au shughuli isiyoidhinishwa\n• Kufuata mahitaji ya kisheria nchini Tanzania'
      ),
    },
    {
      icon: Lock,
      title: l('3. Data Security', '3. Usalama wa Data'),
      content: l(
        'We implement industry-standard security measures to protect your data:\n\n• All data is encrypted in transit (TLS 1.3) and at rest (AES-256)\n• Payment information is processed through PCI-DSS compliant providers\n• ID documents are stored with encryption and access is restricted to verification team only\n• Two-factor authentication (2FA) is available for all accounts\n• PIN lock is available for wallet access\n• Regular security audits and penetration testing\n\nHowever, no system is 100% secure. We recommend using strong passwords and enabling 2FA.',
        'Tunatekeleza hatua za usalama za kiwango cha sekta kulinda data yako:\n\n• Data yote imesimbwa wakati wa usafirishaji (TLS 1.3) na wakati wa mapumziko (AES-256)\n• Taarifa za malipo zinachakatwa kupitia watoaji wanaolingana na PCI-DSS\n• Nyaraka za kitambulisho zinahifadhiwa kwa usimbaji na upatikanaji umepunguzwa kwa timu ya uthibitisho tu\n• Uthibitisho wa mambo mawili (2FA) unapatikana kwa akaunti zote\n• Kufuli ya PIN inapatikana kwa upatikanaji wa pochi\n• Ukaguzi wa kawaida wa usalama na upimaji wa kuingia\n\nHata hivyo, hakuna mfumo una salama 100%. Tunapendekeza kutumia nywila nguvu na kuwezesha 2FA.'
      ),
    },
    {
      icon: Globe,
      title: l('4. Data Sharing', '4. Kushiriki Data'),
      content: l(
        'We do not sell your personal data. We may share data with:\n\n• Guides: Your name and booking details when you make a booking\n• Seekers: Guide name, rating, and availability information\n• Payment Providers: Transaction data necessary for processing payments (Flutterwave, M-Pesa)\n• Law Enforcement: When required by Tanzanian law or in emergency situations\n• Analytics: Anonymized usage data for service improvement',
        'Hatuuzi data yako ya kibinafsi. Tunaweza kushiriki data na:\n\n• Waongozaji: Jina lako na maelezo ya buku unapofanya buku\n• Watafuta: Jina la mwongozo, ukadiriaji, na taarifa za upatikanaji\n• Watoa Malipo: Data ya muamala muhimu kwa ajili ya kuchakata malipo (Flutterwave, M-Pesa)\n• Polisi: Inapohitajika na sheria ya Tanzania au katika hali ya dharura\n• Uchambuzi: Data ya matumizi isiyo na jina kwa ajili ya kuboresha huduma'
      ),
    },
    {
      icon: UserCheck,
      title: l('5. Your Rights', '5. Haki Zako'),
      content: l(
        'You have the right to:\n\n• Access: Request a copy of your personal data\n• Correction: Update or correct your personal information\n• Deletion: Request deletion of your account and data (subject to legal retention requirements)\n• Portability: Export your data in a standard format\n• Objection: Opt out of non-essential data processing\n• Withdraw Consent: Revoke permission for specific data uses\n\nTo exercise these rights, contact privacy@chimbo.direct',
        'Una haki ya:\n\n• Upatikanaji: Kuomba nakala ya data yako ya kibinafsi\n• Marekebisho: Kusasisha au kurekebisha taarifa zako za kibinafsi\n• Ufutaji: Kuomba ufutaji wa akaunti yako na data (kulingana na mahitaji ya kisheria ya kuhifadhi)\n• Kubebeka: Kuhamisha data yako katika muundo wa kawaida\n• Pinga: Kutokea kwenye usindikaji wa data ambao si muhimu\n• Kubatilisha Ruhusa: Kuruhusu ruhusa kwa matumizi maalum ya data\n\nKutumia haki hizi, wasiliana na privacy@chimbo.direct'
      ),
    },
    {
      icon: Bell,
      title: l('6. Notifications & Communications', '6. Arifa na Mawasiliano'),
      content: l(
        'You will receive:\n\n• Transactional emails: Booking confirmations, payment receipts, verification updates\n• Push notifications: Session reminders, emergency alerts, guide availability\n• Marketing: Optional — you can opt out at any time\n\nWe respect your communication preferences. You can manage notification settings in your account settings.',
        'Utapata:\n\n• Barua za muamala: Uthibitisho wa buku, risiti za malipo, masasisho ya uthibitisho\n• Arifa za kushinikaza: Vikumbusho vya kikao, arifa za dharura, upatikanaji wa mwongozo\n• Masoko: Hiari — unaweza kutokea wakati wowote\n\nTunaheshimu mapendeleo yako ya mawasiliano. Unaweza kusimamia mipangilio ya arifa katika mipangilio ya akaunti yako.'
      ),
    },
    {
      icon: Shield,
      title: l('7. Data Retention', '7. Uhifadhi wa Data'),
      content: l(
        'We retain your data for as long as your account is active. If you delete your account:\n\n• Personal information is deleted within 30 days\n• Transaction records are retained for 5 years (legal requirement)\n• Session recordings are deleted after 30 days\n• Anonymized usage data may be retained indefinitely for analytics\n\nFor guide verification documents, data is retained for the duration of the guide\'s active status plus 1 year.',
        'Tunahifadhi data yako maadamu akaunti yako iko hai. Ukifuta akaunti yako:\n\n• Taarifa za kibinafsi zinafutwa ndani ya siku 30\n• Rekodi za muamala zinahifadhiwa kwa miaka 5 (mahitaji ya kisheria)\n• Rekodi za vikao zinafutwa baada ya siku 30\n• Data ya matumizi isiyo na jina inaweza kuhifadhiwa bila mpangilio kwa ajili ya uchambuzi\n\nKwa nyaraka za uthibitisho wa mwongozo, data inahifadhiwa kwa muda wa hali ya mwongozo aliye hai pamoja na mwaka 1.'
      ),
    },
    {
      icon: Mail,
      title: l('8. Contact Us', '8. Wasiliana Nasi'),
      content: l(
        'For privacy-related questions or concerns:\n\n• Email: privacy@chimbo.direct\n• Data Protection Officer: dpo@chimbo.direct\n• Phone: +255 123 456 789\n• Address: Kariakoo Market, Dar es Salaam, Tanzania\n\nLast updated: January 2025',
        'Kwa maswali au wasiwasi kuhusu faragha:\n\n• Barua: privacy@chimbo.direct\n• Afisa wa Ulinzi wa Data: dpo@chimbo.direct\n• Simu: +255 123 456 789\n• Anwani: Soko la Kariakoo, Dar es Salaam, Tanzania\n\nIlisasishwa mwisho: Januari 2025'
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
              <Shield className="w-5 h-5 text-[#34D399]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{l('Privacy Policy', 'Sera ya Faragha')}</h1>
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
                'At Chimbo Direct, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.',
                'Kwenye Chimbo Direct, tunachukua faragha yako kwa uzito. Sera hii ya Faragha inaeleza jinsi tunavyokusanya, kutumia, na kulinda taarifa zako za kibinafsi unapotumia jukwaa letu.'
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
          <Link href="/legal/terms">
            <span className="text-sm text-[#065F46] dark:text-[#34D399] font-medium hover:underline">
              {l('Read our Terms of Service →', 'Soma Sheria na Masharti yetu →')}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
