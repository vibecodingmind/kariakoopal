'use client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import { Store, ShieldCheck, QrCode, CheckCircle2, XCircle, Clock } from 'lucide-react';

const PENDING_VENDORS = [
  { id: 'pv1', name: 'Spice Paradise', zone: 'Spices Zone', stall: 'D-22', submitted: '2 hours ago' },
  { id: 'pv2', name: 'Basket Weavers', zone: 'Artisanal Zone', stall: 'F-12', submitted: '1 day ago' },
];
const VERIFIED_VENDORS = [
  { id: 'vv1', name: 'Zaki Electronics', zone: 'Electronics', stall: 'A-12', verified: true, expires: 'Dec 2026' },
  { id: 'vv2', name: 'Mama Kanga Shop', zone: 'Fabrics', stall: 'B-45', verified: true, expires: 'Nov 2026' },
  { id: 'vv3', name: 'Al-Falah Wholesale', zone: 'Wholesale', stall: 'C-08', verified: true, expires: 'Jan 2027' },
];

export default function AdminVendorsPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Manage Vendors', 'Simamia Wauzaji')}</h1>
      </motion.div>

      <div>
        <h2 className="text-sm font-bold text-[#F59E0B] mb-2">{l('Pending Verification', 'Inasubiri Uthibitishaji')} ({PENDING_VENDORS.length})</h2>
        <div className="space-y-3">
          {PENDING_VENDORS.map((vendor, i) => (
            <motion.div key={vendor.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kcard p-4 border-l-4 border-[#F59E0B]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#F59E0B] font-bold">{vendor.name.charAt(0)}</div>
                <div><h4 className="font-semibold text-sm">{vendor.name}</h4><p className="text-xs text-[#64748B]">{vendor.zone} · {l('Stall', 'Duka')} {vendor.stall} · {vendor.submitted}</p></div>
              </div>
              <div className="flex gap-2">
                <button className="kbtn flex-1 text-xs py-2 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" />{l('Verify', 'Thibitisha')}</button>
                <button className="kbtn-danger flex-1 text-xs py-2 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" />{l('Reject', 'Kataa')}</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold mb-2 flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-[#065F46]" />{l('Verified Vendors', 'Wauzaji Waliothibitishwa')} ({VERIFIED_VENDORS.length})</h2>
        <div className="space-y-2">
          {VERIFIED_VENDORS.map((vendor, i) => (
            <div key={vendor.id} className="kcard p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#065F46] font-bold text-xs">{vendor.name.charAt(0)}</div>
                <div><p className="text-sm font-medium">{vendor.name}</p><p className="text-xs text-[#64748B]">{vendor.zone} · {vendor.stall} · {l('Expires', 'Inaisha')} {vendor.expires}</p></div>
              </div>
              <QrCode className="w-4 h-4 text-[#065F46]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
