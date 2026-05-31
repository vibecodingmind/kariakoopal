'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, UserCircle2, Shield, ShieldAlert,
  Eye, Ban, CheckCircle2, ChevronDown, ArrowLeft, Phone, Mail, Calendar,
} from 'lucide-react';

type UserRole = 'seeker' | 'guide' | 'admin';
type UserStatus = 'active' | 'suspended';
type FilterTab = 'all' | 'seeker' | 'guide' | 'admin' | 'suspended';

interface DemoUser {
  id: string; name: string; phone: string; email: string;
  role: UserRole; status: UserStatus; joinedAt: string; initials: string;
}

const DEMO_USERS: DemoUser[] = [
  { id: 'u1', name: 'James Kikwete', phone: '+255 712 345 678', email: 'james.k@email.com', role: 'seeker', status: 'active', joinedAt: '2025-01-15', initials: 'JK' },
  { id: 'u2', name: 'Fatma Hassan', phone: '+255 744 567 890', email: 'fatma.h@email.com', role: 'guide', status: 'active', joinedAt: '2024-11-20', initials: 'FH' },
  { id: 'u3', name: 'Omar Selemani', phone: '+255 756 789 012', email: 'omar.s@email.com', role: 'guide', status: 'active', joinedAt: '2024-09-03', initials: 'OS' },
  { id: 'u4', name: 'Amina Swaleh', phone: '+255 723 890 123', email: 'amina.s@email.com', role: 'seeker', status: 'active', joinedAt: '2025-02-28', initials: 'AS' },
  { id: 'u5', name: 'Admin Mkuu', phone: '+255 700 111 222', email: 'admin@kariako.com', role: 'admin', status: 'active', joinedAt: '2024-01-01', initials: 'AM' },
  { id: 'u6', name: 'David Mwangi', phone: '+254 712 333 444', email: 'david.m@email.com', role: 'seeker', status: 'suspended', joinedAt: '2024-06-10', initials: 'DM' },
  { id: 'u7', name: 'Mwanamvua Juma', phone: '+255 745 555 666', email: 'mwanamvua.j@email.com', role: 'guide', status: 'active', joinedAt: '2025-03-14', initials: 'MJ' },
  { id: 'u8', name: 'Said Baraka', phone: '+255 778 777 888', email: 'said.b@email.com', role: 'guide', status: 'suspended', joinedAt: '2024-04-22', initials: 'SB' },
  { id: 'u9', name: 'Neema Kessy', phone: '+255 734 999 000', email: 'neema.k@email.com', role: 'seeker', status: 'active', joinedAt: '2025-05-01', initials: 'NK' },
  { id: 'u10', name: 'Hassan Miraji', phone: '+255 767 111 333', email: 'hassan.m@email.com', role: 'seeker', status: 'active', joinedAt: '2025-04-18', initials: 'HM' },
  { id: 'u11', name: 'Peter Odhiambo', phone: '+254 723 555 777', email: 'peter.o@email.com', role: 'seeker', status: 'suspended', joinedAt: '2024-08-12', initials: 'PO' },
  { id: 'u12', name: 'Halima Ramadhani', phone: '+255 741 888 999', email: 'halima.r@email.com', role: 'guide', status: 'active', joinedAt: '2025-01-05', initials: 'HR' },
];

const AVATAR_GRADIENT: Record<UserRole, string> = {
  seeker: 'from-emerald-500 to-teal-400',
  guide: 'from-amber-500 to-orange-400',
  admin: 'from-slate-600 to-slate-400',
};

const ROLE_BADGE: Record<UserRole, string> = {
  seeker: 'kbadge-live', guide: 'kbadge-gold', admin: 'kbadge-silver',
};

const ROLE_ICON: Record<UserRole, typeof UserCircle2> = {
  seeker: UserCircle2, guide: Shield, admin: ShieldAlert,
};

export default function AdminUsersPage() {
  const { user, language, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [users, setUsers] = useState(DEMO_USERS);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') router.replace('/auth');
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isAuthenticated) return null;

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || u.phone.includes(searchQuery) || u.email.toLowerCase().includes(q);
    const matchTab = activeTab === 'all' ? true : activeTab === 'suspended' ? u.status === 'suspended' : u.role === activeTab;
    return matchSearch && matchTab;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const newThisMonth = users.filter((u) => u.joinedAt.startsWith('2025-05') || u.joinedAt.startsWith('2025-04')).length;
  const suspendedUsers = users.filter((u) => u.status === 'suspended').length;

  const toggleSuspend = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === 'suspended' ? 'active' as UserStatus : 'suspended' as UserStatus } : u));
    setOpenMenuId(null);
  };

  const changeRole = (id: string, newRole: UserRole) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: newRole } : u));
    setOpenMenuId(null);
  };

  const tabs: { key: FilterTab; label: string; labelSw: string }[] = [
    { key: 'all', label: 'All', labelSw: 'Wote' },
    { key: 'seeker', label: 'Seekers', labelSw: 'Watafuta' },
    { key: 'guide', label: 'Guides', labelSw: 'Miongozo' },
    { key: 'admin', label: 'Admins', labelSw: 'Wasimamizi' },
    { key: 'suspended', label: 'Suspended', labelSw: 'Walisimamishwa' },
  ];

  return (
    <div className="px-4 py-4 space-y-5 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button onClick={() => router.push('/admin')} className="kbtn-ghost p-2 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold gradient-text-green">{l('User Management', 'Usimamizi wa Watumiaji')}</h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{l('Manage all platform users', 'Simamia watumiaji wote wa jukwaa')}</p>
        </div>
      </motion.div>

      {/* Stats Row — kcard-glass */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: l('Total Users', 'Watumiaji'), value: totalUsers, color: '#065F46' },
          { icon: CheckCircle2, label: l('Active', 'Hai'), value: activeUsers, color: '#059669' },
          { icon: UserCircle2, label: l('New This Month', 'Wapya Mwezi'), value: newThisMonth, color: '#F59E0B' },
          { icon: Ban, label: l('Suspended', 'Walisimamishwa'), value: suspendedUsers, color: '#DC2626' },
        ].map((stat, i) => (
          <div key={i} className="kcard-glass p-4">
            <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Search Bar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ksearch flex items-center gap-2 px-4 py-3">
        <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
        <input
          type="text" placeholder={l('Search by name, phone, or email...', 'Tafuta kwa jina, simu, au barua pepe...')}
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#94A3B8]"
        />
      </motion.div>

      {/* Filter Tabs */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="flex gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`ktag whitespace-nowrap ${activeTab === tab.key ? 'ktag-active' : 'ktag-inactive'}`}>
            {sw ? tab.labelSw : tab.label}
          </button>
        ))}
      </motion.div>

      {/* User Cards List */}
      <div className="space-y-3 pb-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((u, i) => {
            const RoleIcon = ROLE_ICON[u.role];
            return (
              <motion.div key={u.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }} className="kcard p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${AVATAR_GRADIENT[u.role]} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md`}>
                    {u.initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm truncate">{u.name}</h4>
                      <span className={`kbadge ${ROLE_BADGE[u.role]}`}>{u.role}</span>
                      {u.status === 'suspended' && <span className="kbadge kbadge-urgent">{l('SUSPENDED', 'AMESIMAMISHWA')}</span>}
                    </div>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone}</span>
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</span>
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1"><Calendar className="w-3 h-3" />{l('Joined', 'Alijiunga')} {u.joinedAt}</span>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="relative shrink-0" ref={openMenuId === u.id ? menuRef : null}>
                    <button onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                      className="p-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors">
                      <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${openMenuId === u.id ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {openMenuId === u.id && (
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -4 }}
                          className="absolute right-0 top-10 z-50 kcard p-2 min-w-[190px] shadow-xl">
                          <button onClick={() => setOpenMenuId(null)}
                            className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#334155] flex items-center gap-2 transition-colors">
                            <Eye className="w-3.5 h-3.5 text-[#065F46] dark:text-[#34D399]" />
                            {l('View Profile', 'Tazama Wasifu')}
                          </button>
                          <button onClick={() => toggleSuspend(u.id)}
                            className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#334155] flex items-center gap-2 transition-colors">
                            {u.status === 'suspended' ? (
                              <><CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />{l('Activate', 'Washa')}</>
                            ) : (
                              <><Ban className="w-3.5 h-3.5 text-[#DC2626]" />{l('Suspend', 'Simamisha')}</>
                            )}
                          </button>
                          <div className="border-t border-[#E2E8F0] dark:border-[#334155] my-1" />
                          <div className="px-3 py-1.5 flex items-center gap-1.5">
                            <RoleIcon className="w-3 h-3 text-[#64748B] dark:text-[#94A3B8]" />
                            <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-semibold">{l('Change Role', 'Badilisha Nafasi')}</span>
                          </div>
                          {(['seeker', 'guide', 'admin'] as UserRole[]).filter((r) => r !== u.role).map((role) => (
                            <button key={role} onClick={() => changeRole(u.id, role)}
                              className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#334155] flex items-center gap-2 transition-colors capitalize">
                              <ChevronDown className="w-3 h-3" />{role}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="kcard p-8 text-center">
            <Users className="w-10 h-10 mx-auto text-[#94A3B8] mb-2" />
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{l('No users found', 'Hakuna watumiaji walio patikana')}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
