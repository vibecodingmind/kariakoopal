'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Users, MapPin, Globe, Award, Zap, Target, TrendingUp,
  Briefcase, Download, ChevronRight, Star, Shield, Sparkles,
  Phone, Mail, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ─── Data ────────────────────────────────────────────────────────────

const TEAM_MEMBERS = [
  {
    name: 'Amani Juma',
    role: 'CEO & Co-Founder',
    bio: 'Born in Dar es Salaam, Amani vision is to make Kariakoo accessible to everyone through technology.',
    initials: 'AJ',
    color: 'bg-gradient-to-br from-[#065F46] to-[#059669]',
  },
  {
    name: 'Fatima Hassan',
    role: 'CTO & Co-Founder',
    bio: 'Former software engineer at a leading fintech. Leads our AI and platform development.',
    initials: 'FH',
    color: 'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]',
  },
  {
    name: 'David Mwangi',
    role: 'Head of Operations',
    bio: '10+ years in market logistics. Ensures smooth operations across all Kariakoo zones.',
    initials: 'DM',
    color: 'bg-gradient-to-br from-[#059669] to-[#34D399]',
  },
  {
    name: 'Zainab Ally',
    role: 'Head of Community',
    bio: 'Community builder who trains and supports our network of 500+ local guides.',
    initials: 'ZA',
    color: 'bg-gradient-to-br from-purple-500 to-purple-600',
  },
  {
    name: 'Joseph Kimaro',
    role: 'Lead AI Engineer',
    bio: 'AI specialist focused on NLP and computer vision for our haggling and vision tools.',
    initials: 'JK',
    color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
  },
  {
    name: 'Grace Mrema',
    role: 'Head of Safety',
    bio: 'Former security consultant. Oversees guide verification and user safety features.',
    initials: 'GM',
    color: 'bg-gradient-to-br from-red-500 to-red-600',
  },
];

const IMPACT_STATS = [
  { label: 'Active Seekers', value: '25,000+', icon: Users, color: 'text-[#065F46] dark:text-[#34D399]' },
  { label: 'Verified Guides', value: '500+', icon: Shield, color: 'text-[#F59E0B] dark:text-[#FBBF24]' },
  { label: 'Sessions Completed', value: '80,000+', icon: Zap, color: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Revenue Shared', value: 'TZS 2.5B+', icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400' },
];

const PARTNERS = [
  { name: 'M-Pesa', description: 'Primary payment partner', icon: Phone },
  { name: 'Tigo Pesa', description: 'Mobile money partner', icon: Phone },
  { name: 'Tanzania Tourist Board', description: 'Tourism promotion', icon: Globe },
  { name: 'Dar es Salaam City Council', description: 'Local government', icon: MapPin },
  { name: 'UNDP Tanzania', description: 'Sustainable development', icon: Target },
  { name: 'Kariakoo Traders Association', description: 'Market community', icon: Users },
];

const CAREERS = [
  {
    title: 'Senior Full-Stack Developer',
    type: 'Full-time',
    location: 'Dar es Salaam',
    department: 'Engineering',
  },
  {
    title: 'AI/ML Engineer',
    type: 'Full-time',
    location: 'Remote',
    department: 'AI Team',
  },
  {
    title: 'Community Manager',
    type: 'Full-time',
    location: 'Dar es Salaam',
    department: 'Community',
  },
  {
    title: 'Mobile Developer (React Native)',
    type: 'Full-time',
    location: 'Remote',
    department: 'Engineering',
  },
];

// ─── Animation variants ─────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─── Component ───────────────────────────────────────────────────────

export default function AboutPage() {
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
        <div className="absolute -bottom-32 -left-16 w-64 h-64 rounded-full bg-[#F59E0B]/10 dark:bg-[#FBBF24]/5 blur-3xl" />

        <div className="relative px-4 pt-8 pb-10 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#065F46]/10 dark:bg-[#34D399]/10 px-4 py-1.5 rounded-full mb-4">
              <Heart className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              <span className="text-xs font-semibold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider">
                Our Story
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3"
          >
            <span className="gradient-text-green">About</span>{' '}
            <span className="gradient-text-gold">Kariako</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-2xl mx-auto"
          >
            Empowering locals and visitors alike to navigate Africa&apos;s largest open market with confidence, fairness, and technology.
          </motion.p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16 space-y-12">
        {/* ── Mission ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="kcard-green p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.12),transparent_50%)] pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[#FBBF24]" />
                <h2 className="text-xl font-bold text-white">Our Mission</h2>
              </div>
              <p className="text-white/90 leading-relaxed text-sm sm:text-base">
                Kariako Guide was born from a simple observation: Kariakoo Market is a vibrant, complex ecosystem 
                that can be overwhelming for newcomers and even experienced shoppers. Our mission is to bridge 
                the gap between local expertise and global accessibility. We believe every transaction should be 
                fair, every visitor should feel safe, and every guide should be valued for their knowledge. 
                Through AI technology and human expertise, we&apos;re making Kariakoo Market work better for everyone.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Impact Stats ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h2 variants={itemVariants} className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-4">
            Our Impact
          </motion.h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {IMPACT_STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} variants={itemVariants}>
                  <div className="kcard p-5 text-center">
                    <Icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
                    <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F1F5F9] mb-1">
                      {stat.value}
                    </p>
                    <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Team ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h2 variants={itemVariants} className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-4">
            Our Team
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEAM_MEMBERS.map((member, i) => (
              <motion.div key={member.name} variants={itemVariants}>
                <div className="kcard p-5">
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-12 h-12 rounded-xl ${member.color} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                      {member.initials}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                        {member.name}
                      </h3>
                      <p className="text-xs text-[#065F46] dark:text-[#34D399] font-semibold">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Partners ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h2 variants={itemVariants} className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-4">
            Our Partners
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PARTNERS.map((partner, i) => {
              const Icon = partner.icon;
              return (
                <motion.div key={partner.name} variants={itemVariants}>
                  <div className="kcard p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-[#065F46] dark:text-[#34D399]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                        {partner.name}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {partner.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Careers ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#F59E0B]" />
              Open Positions
            </h2>
            <Badge className="bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] border-0 text-xs">
              {CAREERS.length} openings
            </Badge>
          </motion.div>
          <div className="kcard overflow-hidden">
            <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
              {CAREERS.map((career, i) => (
                <motion.div
                  key={career.title}
                  variants={itemVariants}
                  className="p-4 sm:p-5 hover:bg-[#F8FAFC]/50 dark:hover:bg-[#1E293B]/50 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] group-hover:text-[#065F46] dark:group-hover:text-[#34D399] transition-colors">
                      {career.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] border-0 text-xs">
                        {career.type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {career.location}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {career.department}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#065F46] dark:group-hover:text-[#34D399] transition-colors shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Press Kit ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <div className="kcard-glass p-6 sm:p-8 text-center">
              <Download className="w-10 h-10 text-[#065F46] dark:text-[#34D399] mx-auto mb-3" />
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-2">
                Press Kit
              </h3>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4 max-w-md mx-auto">
                Download our logos, brand guidelines, press releases, and media assets for coverage.
              </p>
              <button className="kbtn inline-flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Press Kit
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
