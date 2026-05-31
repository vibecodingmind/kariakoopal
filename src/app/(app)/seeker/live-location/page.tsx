'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Navigation, Shield, Phone, Share2, Star,
  AlertTriangle, CheckCircle, Users, Clock, Eye,
  ChevronRight, Cross, MessageSquare, Siren,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ── Types ──

interface NearbyGuide {
  id: string;
  name: string;
  distance: string;
  rating: number;
  availability: 'available' | 'busy' | 'offline';
  specialty: string;
  verified: boolean;
}

interface SafetyZone {
  id: string;
  name: string;
  status: 'safe' | 'caution';
  description: string;
}

// ── Demo Data ──

const NEARBY_GUIDES: NearbyGuide[] = [
  { id: 'g1', name: 'Mwanamvua J.', distance: '120m', rating: 4.8, availability: 'available', specialty: 'Electronics', verified: true },
  { id: 'g2', name: 'Asha M.', distance: '250m', rating: 4.6, availability: 'available', specialty: 'Fabrics & Textiles', verified: true },
  { id: 'g3', name: 'Hassan K.', distance: '380m', rating: 4.9, availability: 'busy', specialty: 'Spices & Food', verified: true },
  { id: 'g4', name: 'Fatma H.', distance: '450m', rating: 4.4, availability: 'available', specialty: 'General Shopping', verified: false },
  { id: 'g5', name: 'Ramadhani S.', distance: '480m', rating: 4.7, availability: 'offline', specialty: 'Jewelry & Crafts', verified: true },
];

const SAFETY_ZONES: SafetyZone[] = [
  { id: 'z1', name: 'Kariakoo Market - Zone A', status: 'safe', description: 'Well-lit, high foot traffic' },
  { id: 'z2', name: 'Kisutu Street', status: 'safe', description: 'Active vendor area' },
  { id: 'z3', name: 'Mchikichini Back Alleys', status: 'caution', description: 'Low lighting, fewer people' },
];

// ── Animation ──

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// ── Map Placeholder Component ──

function MapPlaceholder() {
  return (
    <div className="relative w-full h-64 rounded-2xl bg-gradient-to-br from-[#065F46]/10 via-[#ECFDF5] to-[#F1F5F9] dark:from-[#022C22] dark:via-[#064E3B] dark:to-[#1E293B] overflow-hidden border border-[#E2E8F0] dark:border-[#334155]">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(rgba(6,95,70,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,95,70,0.3) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />

      {/* Simulated roads */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#94A3B8]/20" />
      <div className="absolute top-0 bottom-0 left-1/3 w-1 bg-[#94A3B8]/20" />
      <div className="absolute top-0 bottom-0 right-1/4 w-0.5 bg-[#94A3B8]/15" />
      <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-[#94A3B8]/15" />

      {/* Zone markers */}
      <div className="absolute top-8 left-12 w-20 h-16 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center">
        <span className="text-[8px] font-bold text-[#10B981]">ZONE A</span>
      </div>
      <div className="absolute top-16 right-16 w-24 h-14 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center">
        <span className="text-[8px] font-bold text-[#10B981]">ZONE B</span>
      </div>
      <div className="absolute bottom-16 left-20 w-20 h-14 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center">
        <span className="text-[8px] font-bold text-[#F59E0B]">CAUTION</span>
      </div>

      {/* Guide markers */}
      <div className="absolute top-14 left-24">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-3 h-3 rounded-full bg-[#F59E0B] ring-2 ring-white shadow-md" />
      </div>
      <div className="absolute top-20 right-28">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className="w-3 h-3 rounded-full bg-[#F59E0B] ring-2 ring-white shadow-md" />
      </div>
      <div className="absolute bottom-24 right-20">
        <div className="w-2.5 h-2.5 rounded-full bg-[#94A3B8] ring-2 ring-white" />
      </div>

      {/* Current location */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -inset-4 rounded-full bg-[#065F46]/20"
        />
        <div className="relative w-4 h-4 rounded-full bg-[#065F46] ring-3 ring-white shadow-lg z-10">
          <div className="absolute inset-0 rounded-full bg-[#065F46]" />
        </div>
      </div>

      {/* Compass indicator */}
      <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
        <Navigation className="w-4 h-4 text-[#065F46] dark:text-[#34D399] rotate-45" />
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <button className="w-7 h-7 rounded-md bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-sm flex items-center justify-center text-sm font-bold text-[#065F46] dark:text-[#34D399] shadow-sm">+</button>
        <button className="w-7 h-7 rounded-md bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-sm flex items-center justify-center text-sm font-bold text-[#065F46] dark:text-[#34D399] shadow-sm">−</button>
      </div>
    </div>
  );
}

// ── Main Component ──

export default function LiveLocationPage() {
  const [sosExpanded, setSosExpanded] = useState(false);
  const [locationSharing, setLocationSharing] = useState(false);

  const currentZone = SAFETY_ZONES[0]; // Currently in safe zone

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="px-4 py-4 space-y-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">Live Location</h1>
        <p className="text-sm text-[#64748B] mt-1">Find nearby guides and stay safe</p>
      </motion.div>

      {/* Map Area */}
      <motion.div variants={itemVariants}>
        <MapPlaceholder />
      </motion.div>

      {/* Safety Zone Indicator */}
      <motion.div variants={itemVariants}>
        <div className={`kcard p-4 flex items-center gap-3 ${
          currentZone.status === 'safe'
            ? 'border-l-4 border-l-[#10B981]'
            : 'border-l-4 border-l-[#F59E0B]'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            currentZone.status === 'safe' ? 'bg-[#ECFDF5] dark:bg-[#064E3B]' : 'bg-[#FEF3C7] dark:bg-[#422006]'
          }`}>
            {currentZone.status === 'safe'
              ? <Shield className="w-5 h-5 text-[#10B981]" />
              : <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
            }
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold">
                {currentZone.status === 'safe' ? 'Safe Zone' : 'Caution Zone'}
              </p>
              <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${
                currentZone.status === 'safe'
                  ? 'border-[#10B981]/30 text-[#10B981] bg-[#ECFDF5] dark:bg-[#064E3B]'
                  : 'border-[#F59E0B]/30 text-[#F59E0B] bg-[#FEF3C7] dark:bg-[#422006]'
              }`}>
                {currentZone.name}
              </Badge>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">{currentZone.description}</p>
          </div>
        </div>
      </motion.div>

      {/* Nearby Guides */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
            Nearby Guides
          </h3>
          <span className="text-xs text-[#64748B]">Within 500m</span>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {NEARBY_GUIDES.map((guide, i) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="kcard p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white ${
                    guide.availability === 'available' ? 'bg-gradient-to-br from-[#065F46] to-[#059669]' :
                    guide.availability === 'busy' ? 'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]' :
                    'bg-[#94A3B8]'
                  }`}>
                    {guide.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {guide.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#10B981] flex items-center justify-center ring-2 ring-white dark:ring-[#1E293B]">
                      <CheckCircle className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium">{guide.name}</p>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                      <span className="text-[10px] font-semibold">{guide.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#64748B]">{guide.specialty}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-1 text-[#065F46] dark:text-[#34D399]">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs font-bold">{guide.distance}</span>
                </div>
                <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${
                  guide.availability === 'available'
                    ? 'border-[#10B981]/30 text-[#10B981] bg-[#ECFDF5] dark:bg-[#064E3B]'
                    : guide.availability === 'busy'
                    ? 'border-[#F59E0B]/30 text-[#F59E0B] bg-[#FEF3C7] dark:bg-[#422006]'
                    : 'border-[#94A3B8]/30 text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#334155]'
                }`}>
                  {guide.availability}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Share Location */}
      <motion.div variants={itemVariants} className="kcard p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0891B2]/10 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-[#0891B2]" />
            </div>
            <div>
              <p className="text-sm font-semibold">Share Live Location</p>
              <p className="text-xs text-[#64748B]">Let trusted contacts track you</p>
            </div>
          </div>
          <Button
            variant={locationSharing ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLocationSharing(!locationSharing)}
            className={locationSharing ? 'bg-[#0891B2] hover:bg-[#0E7490]' : ''}
          >
            {locationSharing ? 'Sharing' : 'Share'}
          </Button>
        </div>
        {locationSharing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 rounded-xl bg-[#0891B2]/5 border border-[#0891B2]/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-[#0891B2] animate-pulse" />
              <span className="text-xs font-semibold text-[#0891B2]">Live sharing active</span>
            </div>
            <div className="space-y-1.5">
              {['Trusted Contact 1', 'Trusted Contact 2'].map((contact, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full bg-[#0891B2]/10 flex items-center justify-center">
                    <Eye className="w-3 h-3 text-[#0891B2]" />
                  </div>
                  <span className="text-[#64748B]">{contact}</span>
                  <CheckCircle className="w-3 h-3 text-[#10B981] ml-auto" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Emergency SOS Button */}
      <motion.div variants={itemVariants} className="relative">
        <motion.button
          onClick={() => setSosExpanded(!sosExpanded)}
          className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
            sosExpanded
              ? 'bg-[#DC2626] rounded-t-2xl rounded-b-none'
              : 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] shadow-lg shadow-red-600/30'
          }`}
          whileTap={{ scale: 0.98 }}
        >
          <Siren className="w-5 h-5" />
          <span className="text-lg">SOS</span>
          {!sosExpanded && <span className="text-sm font-medium opacity-80">Emergency</span>}
        </motion.button>

        <AnimatePresence>
          {sosExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#FEE2E2] dark:bg-[#2D1B1B] rounded-b-2xl overflow-hidden"
            >
              <div className="p-4 space-y-2">
                <p className="text-xs font-semibold text-[#DC2626] mb-3">Choose emergency option:</p>
                {[
                  { icon: Phone, label: 'Call Emergency (112)', desc: 'Contact local emergency services' },
                  { icon: MessageSquare, label: 'Alert Trusted Contacts', desc: 'Send your location to saved contacts' },
                  { icon: Cross, label: 'Nearest Hospital', desc: 'Get directions to closest medical facility' },
                  { icon: Shield, label: 'Report Incident', desc: 'File a safety report with ChimboDirect' },
                ].map((option, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#1E293B] hover:bg-[#FEE2E2] dark:hover:bg-[#3D2B2B] transition-colors active:scale-[0.98]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
                      <option.icon className="w-4 h-4 text-[#DC2626]" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="text-[10px] text-[#64748B]">{option.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#64748B] ml-auto" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
