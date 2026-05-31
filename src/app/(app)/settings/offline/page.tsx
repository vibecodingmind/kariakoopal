'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, WifiOff, Download, Upload, Trash2, RefreshCw, CheckCircle2,
  AlertCircle, Smartphone, HardDrive, Cloud, CloudOff, Clock,
  MapPin, ShoppingBag, Users, FileText, Zap, Shield, ChevronRight,
  ArrowLeft, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useOffline } from '@/hooks/use-offline';
import Link from 'next/link';

interface CacheItem {
  key: string;
  category: string;
  size: string;
  lastSynced: string;
  status: 'cached' | 'stale' | 'pending';
}

export default function OfflineSettingsPage() {
  const { language, user } = useAuthStore();
  const { isOnline } = useOffline();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [autoSync, setAutoSync] = useState(true);
  const [offlineMode, setOfflineMode] = useState(true);
  const [lowDataMode, setLowDataMode] = useState(false);
  const [cacheItems, setCacheItems] = useState<CacheItem[]>([
    { key: 'zones', category: l('Market Zones', 'Maeneo ya Soko'), size: '2.4 MB', lastSynced: '2 min ago', status: 'cached' },
    { key: 'prices', category: l('Price Radar', 'Rada ya Bei'), size: '1.1 MB', lastSynced: '5 min ago', status: 'cached' },
    { key: 'guides', category: l('Guide Profiles', 'Profaili za Miongozo'), size: '3.7 MB', lastSynced: '15 min ago', status: 'stale' },
    { key: 'vendors', category: l('Vendor Directory', 'Orodha ya Wauzaji'), size: '1.8 MB', lastSynced: '10 min ago', status: 'cached' },
    { key: 'translations', category: l('Translations', 'Tafsiri'), size: '0.5 MB', lastSynced: '1 hr ago', status: 'cached' },
    { key: 'sessions', category: l('Session History', 'Historia ya Vikao'), size: '0.9 MB', lastSynced: '30 min ago', status: 'stale' },
    { key: 'map-tiles', category: l('Map Tiles (Kariakoo)', 'Ramani (Kariakoo)'), size: '8.2 MB', lastSynced: '1 hr ago', status: 'cached' },
    { key: 'cultural', category: l('Cultural Insights', 'Uelewa wa Utamaduni'), size: '0.3 MB', lastSynced: '2 hr ago', status: 'pending' },
  ]);
  const [totalCacheSize] = useState('18.9 MB');
  const [clearConfirm, setClearConfirm] = useState(false);
  const [lastFullSync] = useState(new Date(Date.now() - 300000));

  const handleSync = useCallback(async () => {
    if (!isOnline) return;
    setSyncing(true);
    setSyncProgress(0);

    // Simulate sync progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setSyncProgress(i);
    }

    // Update stale/pending items to cached
    setCacheItems(prev => prev.map(item => ({
      ...item,
      status: 'cached' as const,
      lastSynced: l('Just now', 'Sasa hivi'),
    })));

    setSyncing(false);
  }, [isOnline, l]);

  const handleClearCache = useCallback(async () => {
    try {
      await fetch('/api/offline/cache', { method: 'DELETE' });
      setCacheItems(prev => prev.map(item => ({
        ...item,
        status: 'pending' as const,
      })));
      setClearConfirm(false);
    } catch {
      // Silent fail
    }
  }, []);

  const statusIcon = (status: CacheItem['status']) => {
    switch (status) {
      case 'cached': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'stale': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'pending': return <CloudOff className="w-4 h-4 text-slate-400" />;
    }
  };

  const statusLabel = (status: CacheItem['status']) => {
    switch (status) {
      case 'cached': return l('Cached', 'Imehifadhiwa');
      case 'stale': return l('Stale', 'Imeisha');
      case 'pending': return l('Not Cached', 'Haijahifadhiwa');
    }
  };

  const cachedCount = cacheItems.filter(i => i.status === 'cached').length;
  const staleCount = cacheItems.filter(i => i.status === 'stale').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-[#E2E8F0] dark:border-[#334155]">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link href="/settings" className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-lg">{l('Offline Mode', 'Hali ya Nje ya Mtandao')}</h1>
            <p className="text-xs text-[#64748B]">{l('PWA & Cache Management', 'Usimamizi wa PWA na Akasili')}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">
        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`border-0 shadow-lg ${isOnline ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: isOnline ? [1, 1.1, 1] : 1 }}
                  transition={{ repeat: isOnline ? Infinity : 0, duration: 2 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isOnline ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}
                >
                  {isOnline ? (
                    <Wifi className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <WifiOff className="w-6 h-6 text-red-600 dark:text-red-400" />
                  )}
                </motion.div>
                <div className="flex-1">
                  <p className="font-bold text-sm">
                    {isOnline ? l('Online', 'Mtandaoni') : l('Offline', 'Nje ya Mtandao')}
                  </p>
                  <p className="text-xs text-[#64748B]">
                    {isOnline
                      ? l('Connected — data will sync automatically', 'Umeunganishwa — data itasawazishwa kiotomatiki')
                      : l('No connection — using cached data', 'Hakuna muunganisho — kutumia data iliyohifadhiwa')}
                  </p>
                </div>
                <Badge className={`${isOnline ? 'bg-emerald-500' : 'bg-red-500'} text-white text-[10px]`}>
                  {isOnline ? 'LIVE' : 'OFF'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sync Controls */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
                {l('Sync Controls', 'Vidhibiti vya Usawazishaji')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sync Now Button */}
              <Button
                onClick={handleSync}
                disabled={!isOnline || syncing}
                className="w-full bg-[#065F46] hover:bg-[#064E3B] text-white font-bold rounded-xl h-11"
              >
                {syncing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                    </motion.div>
                    {l('Syncing...', 'Inasawazisha...')} {syncProgress}%
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    {l('Sync Now', 'Sawazisha Sasa')}
                  </>
                )}
              </Button>

              {syncing && <Progress value={syncProgress} className="h-2" />}

              {/* Last Sync */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">{l('Last full sync', 'Usawazishaji wa mwisho')}</span>
                <span className="font-medium">{l('5 min ago', 'Dakika 5 zilizopita')}</span>
              </div>

              <Separator />

              {/* Auto-sync Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{l('Auto Sync', 'Usawazishaji wa Kiotomatiki')}</p>
                  <p className="text-xs text-[#64748B]">{l('Sync when online', 'Sawazisha ukiwa mtandaoni')}</p>
                </div>
                <Switch checked={autoSync} onCheckedChange={setAutoSync} />
              </div>

              {/* Offline Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{l('Offline Mode', 'Hali ya Nje ya Mtandao')}</p>
                  <p className="text-xs text-[#64748B]">{l('Cache data for offline use', 'Hifadhi data kwa matumizi ya nje ya mtandao')}</p>
                </div>
                <Switch checked={offlineMode} onCheckedChange={setOfflineMode} />
              </div>

              {/* Low Data Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{l('Low Data Mode', 'Hali ya Data Kidogo')}</p>
                  <p className="text-xs text-[#64748B]">{l('Reduce data usage', 'Punguza matumizi ya data')}</p>
                </div>
                <Switch checked={lowDataMode} onCheckedChange={setLowDataMode} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Storage Overview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
                {l('Storage', 'Hifadhi')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">{l('Cache Size', 'Ukubwa wa Akasili')}</span>
                <span className="font-bold text-sm text-[#065F46] dark:text-[#34D399]">{totalCacheSize}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{l('Items Cached', 'Vipengee vilivyohifadhiwa')}</span>
                <span className="font-medium text-sm">{cachedCount}/{cacheItems.length}</span>
              </div>
              {staleCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-600">{l('Stale Items', 'Vipengee vilivyopitwa')}</span>
                  <span className="font-medium text-sm text-amber-600">{staleCount}</span>
                </div>
              )}
              <Separator />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl text-xs"
                  onClick={() => setClearConfirm(true)}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {l('Clear Cache', 'Futa Akasili')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl text-xs"
                  onClick={() => {
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(regs => {
                        regs.forEach(reg => reg.update());
                      });
                    }
                  }}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  {l('Update PWA', 'Sasisha PWA')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cached Data Items */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Download className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
                {l('Cached Data', 'Data Iliyohifadhiwa')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {cacheItems.map((item, i) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.03 }}
                  className="flex items-center gap-3 py-2.5 px-1 hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] rounded-lg transition-colors"
                >
                  {statusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.category}</p>
                    <p className="text-[10px] text-[#64748B]">
                      {item.size} • {l('Synced', 'Kusawazishwa')} {item.lastSynced}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${
                    item.status === 'cached' ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400' :
                    item.status === 'stale' ? 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400' :
                    'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400'
                  }`}>
                    {statusLabel(item.status)}
                  </Badge>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* PWA Install */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-[#065F46] to-[#064E3B] text-white">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm mb-1">{l('Install as App', 'Sakinisha kama App')}</p>
                  <p className="text-xs text-white/70 leading-relaxed">
                    {l(
                      'Add Chimbo Direct to your home screen for a native app experience with offline support, push notifications, and faster loading.',
                      'Ongeza Chimbo Direct kwenye skrini yako ya nyumbani kwa uzoefu wa app ya asili na msaada wa nje ya mtandao, arifa, na upakiaji haraka.'
                    )}
                  </p>
                  <Button size="sm" className="mt-3 bg-white text-[#065F46] hover:bg-white/90 font-bold rounded-xl text-xs">
                    {l('Install App', 'Sakinisha App')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* USSD Fallback */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm mb-1">{l('USSD Fallback', 'USSD ya Dharura')}</p>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {l(
                      'When you have no data at all, dial *149# on any phone to access Chimbo Direct basic features via USSD — find guides, check prices, and request sessions.',
                      'Ukiwa huna data kabisa, bonyeza *149# kwenye simu yoyote kufikia vipengele vya msingi vya Chimbo Direct kupitia USSD — pata miongozo, angalia bei, na omba vikao.'
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Clear Cache Confirmation Dialog */}
      <AnimatePresence>
        {clearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-7 h-7 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold mb-1">{l('Clear All Cache?', 'Futa Akasili Yote?')}</h3>
                <p className="text-sm text-[#64748B] mb-4">
                  {l(
                    'This will remove all cached data. You will need an internet connection to re-sync.',
                    'Hii itaondoa data yote iliyohifadhiwa. Utahitaji muunganisho wa mtandao kusawazisha tena.'
                  )}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setClearConfirm(false)}
                  >
                    {l('Cancel', 'Ghairi')}
                  </Button>
                  <Button
                    className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                    onClick={handleClearCache}
                  >
                    {l('Clear', 'Futa')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
