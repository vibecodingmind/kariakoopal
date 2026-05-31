'use client';
import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import { Package, Clock, DollarSign, Plus, Edit, Trash2, Star } from 'lucide-react';

const PACKAGES = [
  { id: 'p1', title: 'Kanga Shopping Tour', duration: 2, price: 25000, completed: 45, active: true },
  { id: 'p2', title: 'Full Fabrics Experience', duration: 4, price: 45000, completed: 28, active: true },
  { id: 'p3', title: 'Wholesale Quick Tour', duration: 2, price: 30000, completed: 68, active: false },
];

export default function GuidePackagesPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="px-4 py-4 space-y-5">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[#312E81] dark:text-[#818CF8]">{l('Package Deals', 'Pakiti za Biashara')}</h1>
          <p className="text-sm text-[#78716C] mt-1">{l('Create curated tour packages for seekers', 'Unda pakiti za ziara kwa watafutaji')}</p>
        </motion.div>
        <button onClick={() => setShowCreate(!showCreate)} className="kbtn text-xs py-1.5 px-3"><Plus className="w-3 h-3" />{l('New', 'Mpya')}</button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-4 space-y-3">
          <h3 className="font-semibold text-sm">{l('Create Package', 'Unda Pakiti')}</h3>
          <input placeholder={l('Package title', 'Jina la pakiti')} className="kinput w-full" />
          <textarea placeholder={l('Description...', 'Maelezo...')} className="kinput w-full h-20 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium mb-1 block">{l('Duration (hours)', 'Muda (masaa)')}</label><input type="number" placeholder="2" className="kinput w-full" /></div>
            <div><label className="text-xs font-medium mb-1 block">{l('Price (TZS)', 'Bei (TZS)')}</label><input type="number" placeholder="25000" className="kinput w-full" /></div>
          </div>
          <div className="flex gap-2">
            <button className="kbtn flex-1 text-sm">{l('Create', 'Unda')}</button>
            <button onClick={() => setShowCreate(false)} className="kbtn-outline flex-1 text-sm">{l('Cancel', 'Ghairi')}</button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {PACKAGES.map((pkg, i) => (
          <motion.div key={pkg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kcard p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">{pkg.title}</h4>
              <span className={`kbadge ${pkg.active ? 'kbadge-verified' : 'kbadge-pending'}`}>{pkg.active ? l('Active', 'Inayoendelea') : l('Inactive', 'Haiendelei')}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#78716C] mb-3">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pkg.duration}h</span>
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />TZS {pkg.price.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3" />{pkg.completed} {l('done', 'zimefanyika')}</span>
            </div>
            <div className="flex gap-2">
              <button className="kbtn-outline text-xs py-1.5 px-3 flex items-center gap-1"><Edit className="w-3 h-3" />{l('Edit', 'Hariri')}</button>
              <button className="text-xs py-1.5 px-3 border border-[#DC2626] text-[#DC2626] rounded-lg flex items-center gap-1"><Trash2 className="w-3 h-3" />{l('Delete', 'Futa')}</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
