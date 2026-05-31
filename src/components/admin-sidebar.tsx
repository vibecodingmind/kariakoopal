'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Brain, Users, UserCheck, Store, Gavel,
  DollarSign, Wallet, Shield, FileText, Megaphone, Bell,
  BarChart3, Settings, ChevronLeft, ChevronRight, ArrowLeft,
  Menu, X,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/stores/auth-store';

// ── Navigation Structure ──

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  category: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    category: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'AI Command Center', href: '/admin/ai-insights', icon: Brain },
    ],
  },
  {
    category: 'Management',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Guides', href: '/admin/guides', icon: UserCheck },
      { label: 'Vendors', href: '/admin/vendors', icon: Store },
      { label: 'Disputes', href: '/admin/disputes', icon: Gavel },
    ],
  },
  {
    category: 'Finance',
    items: [
      { label: 'Revenue', href: '/admin/revenue', icon: DollarSign },
      { label: 'Payouts', href: '/admin/payouts', icon: Wallet },
    ],
  },
  {
    category: 'Security',
    items: [
      { label: 'Fraud Detection', href: '/admin/fraud', icon: Shield },
      { label: 'Audit Log', href: '/admin/audit', icon: FileText },
    ],
  },
  {
    category: 'Communication',
    items: [
      { label: 'Broadcast', href: '/admin/broadcast', icon: Megaphone },
      { label: 'Notifications', href: '/notifications', icon: Bell },
    ],
  },
  {
    category: 'Platform',
    items: [
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

// ── Sidebar Content (shared between desktop & mobile) ──

function SidebarContent({ collapsed, pathname }: { collapsed: boolean; pathname: string }) {
  const { user } = useAuthStore();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AD';
  const displayName = user?.name || 'Admin User';
  const roleLabel = user?.role === 'admin' ? 'Super Admin' : 'Admin';

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <AnimatePresence>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="Chimbo Direct"
                className="h-8 w-auto brightness-0 invert"
              />
              <p className="text-white/40 text-[10px] font-medium mt-0.5">Admin Panel</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="Chimbo Direct"
                className="h-5 w-auto brightness-0 invert"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        <TooltipProvider delayDuration={0}>
          {NAV_GROUPS.map((group) => (
            <div key={group.category} className="mb-2">
              <AnimatePresence>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-4 mb-1 text-[10px] font-bold uppercase tracking-wider text-white/30"
                  >
                    {group.category}
                  </motion.p>
                )}
              </AnimatePresence>
              {collapsed && (
                <div className="mx-3 my-1 h-px bg-white/10" />
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                const linkContent = (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-emerald-500/20 text-white'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="admin-sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r-full"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-white/40 group-hover:text-white/70'
                    }`} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-[#1E293B] text-white border-[#334155]">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return <div key={item.href}>{linkContent}</div>;
              })}
            </div>
          ))}
        </TooltipProvider>
      </div>

      {/* Bottom section */}
      <div className="border-t border-white/10 p-3 space-y-2">
        {/* Back to App */}
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all text-sm"
        >
          <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Back to App
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap flex items-center gap-2"
              >
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{displayName}</p>
                  <p className="text-white/30 text-[10px]">{roleLabel}</p>
                </div>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shrink-0">
                  Admin
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-white shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-gradient-to-b from-[#022C22] to-[#0F172A] border-r border-white/10">
          <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
          <SidebarContent collapsed={false} pathname={pathname} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar - STICKY instead of fixed, inside flex flow */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col sticky top-[3.5rem] h-[calc(100vh-3.5rem)] bg-gradient-to-b from-[#022C22] to-[#0F172A] border-r border-white/10 z-40 overflow-hidden shrink-0 rounded-tr-2xl"
      >
        <SidebarContent collapsed={collapsed} pathname={pathname} />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-5 -right-3 w-6 h-6 rounded-full bg-[#1E293B] border border-[#334155] flex items-center justify-center text-white/60 hover:text-white hover:bg-emerald-600 transition-colors z-10 shadow-md"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>
    </>
  );
}
