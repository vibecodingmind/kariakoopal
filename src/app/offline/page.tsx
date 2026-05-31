'use client';

import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, MapPin, ShoppingBag, Phone, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function OfflinePage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const cachedFeatures = [
    {
      icon: MapPin,
      title: l('Market Zones', 'Maeneo ya Soko'),
      desc: l('Browse cached zone information', 'Vinjari taarifa za maeneo zilizohifadhiwa'),
    },
    {
      icon: ShoppingBag,
      title: l('Price Radar', 'Rada ya Bei'),
      desc: l('View last loaded prices', 'Tazama bei za mwisho kupakiwa'),
    },
    {
      icon: Phone,
      title: l('USSD Access', 'Upatikanaji wa USSD'),
      desc: l('Use USSD codes for basic features', 'Tumia kodi za USSD kwa vipengele vya msingi'),
    },
    {
      icon: Clock,
      title: l('Session History', 'Historia ya Vikao'),
      desc: l('View past session details', 'Tazama maelezo ya vikao vya zamani'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-6"
      >
        {/* Offline Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center mx-auto"
        >
          <WifiOff className="w-12 h-12 text-[#065F46] dark:text-[#34D399]" />
        </motion.div>

        {/* Message */}
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F1F5F9] mb-2">
            {l("You're Offline", 'Uko Nje ya Mtandao')}
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
            {l(
              "It looks like you've lost your internet connection. Don't worry — some features are still available with cached data.",
              'Inaonekana umepoteza muunganisho wako wa mtandao. Usijali — baadhi ya vipengele bado vinapatikana kwa data iliyohifadhiwa.'
            )}
          </p>
        </div>

        {/* Retry Button */}
        <Button
          onClick={handleRetry}
          size="lg"
          className="bg-[#065F46] hover:bg-[#064E3B] text-white font-bold rounded-xl px-8"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {l('Try Again', 'Jaribu Tena')}
        </Button>

        {/* Available Features */}
        <div>
          <h3 className="text-sm font-bold text-[#065F46] dark:text-[#34D399] mb-3">
            {l('Available Offline', 'Inapatikana Nje ya Mtandao')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {cachedFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <Card className="border-0 shadow-md text-center">
                    <CardContent className="p-4">
                      <Icon className="w-6 h-6 text-[#065F46] dark:text-[#34D399] mx-auto mb-2" />
                      <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-0.5">
                        {feature.title}
                      </p>
                      <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                        {feature.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* USSD Info */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                {l('USSD Access', 'Upatikanaji wa USSD')}
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              {l(
                'Dial *149# on your phone to access Chimbo Direct via USSD without internet.',
                'Bonyeza *149# kwenye simu yako kufikia Chimbo Direct kupitia USSD bila mtandao.'
              )}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
