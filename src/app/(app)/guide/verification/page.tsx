'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle2, Clock, XCircle, Upload, Camera,
  FileText, MapPin, Globe, ChevronRight, Loader2, Info,
  Award, Star, TrendingUp, Eye, Users, BadgeCheck, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

// ─── Types ───────────────────────────────────────────────────────────

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

interface VerificationForm {
  idDocument: File | null;
  idDocumentPreview: string | null;
  selfieWithId: File | null;
  selfieWithIdPreview: string | null;
  certificates: File[];
  certificatePreviews: string[];
  zones: string[];
  languages: string[];
}

// ─── Data ────────────────────────────────────────────────────────────

const ZONES = [
  'Electronics Zone',
  'Fabrics & Textiles',
  'Spices & Herbs',
  'Kitchenware',
  'Fresh Produce',
  'Wholesale Area',
  'Jewelry & Crafts',
  'Clothing & Fashion',
  'Food & Restaurants',
  'General Market',
];

const LANGUAGES = [
  'Swahili',
  'English',
  'Arabic',
  'French',
  'Hindi',
  'Gujarati',
  'Chinese (Mandarin)',
  'Portuguese',
  'German',
  'Japanese',
];

const VERIFICATION_BENEFITS = [
  {
    icon: Star,
    title: 'Priority in Search',
    description: 'Verified guides appear first in search results',
  },
  {
    icon: TrendingUp,
    title: 'Higher Earnings',
    description: 'Charge up to 40% more than unverified guides',
  },
  {
    icon: BadgeCheck,
    title: 'Trust Badge',
    description: 'Display a verified badge on your profile',
  },
  {
    icon: Eye,
    title: 'More Visibility',
    description: 'Get featured in recommendations and promotions',
  },
  {
    icon: Users,
    title: 'More Bookings',
    description: 'Seekers prefer verified guides 3:1',
  },
  {
    icon: Award,
    title: 'Premium Features',
    description: 'Access advanced analytics and tools',
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

export default function GuideVerificationPage() {
  const [status, setStatus] = useState<VerificationStatus>('unverified');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<VerificationForm>({
    idDocument: null,
    idDocumentPreview: null,
    selfieWithId: null,
    selfieWithIdPreview: null,
    certificates: [],
    certificatePreviews: [],
    zones: [],
    languages: [],
  });

  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);

  // ── Calculate progress ──
  const calculateProgress = useCallback(() => {
    let progress = 0;
    if (form.idDocument) progress += 30;
    if (form.selfieWithId) progress += 30;
    if (form.zones.length > 0) progress += 20;
    if (form.languages.length > 0) progress += 20;
    return progress;
  }, [form]);

  const progress = calculateProgress();

  // ── Handle file selection ──
  const handleIdDocument = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, idDocument: file, idDocumentPreview: preview }));
    e.target.value = '';
  }, []);

  const handleSelfieWithId = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, selfieWithId: file, selfieWithIdPreview: preview }));
    e.target.value = '';
  }, []);

  const handleCertificate = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const previews = files.map((f) => URL.createObjectURL(f));
    setForm((prev) => ({
      ...prev,
      certificates: [...prev.certificates, ...files],
      certificatePreviews: [...prev.certificatePreviews, ...previews],
    }));
    e.target.value = '';
  }, []);

  // ── Toggle zone ──
  const toggleZone = useCallback((zone: string) => {
    setForm((prev) => ({
      ...prev,
      zones: prev.zones.includes(zone)
        ? prev.zones.filter((z) => z !== zone)
        : [...prev.zones, zone],
    }));
  }, []);

  // ── Toggle language ──
  const toggleLanguage = useCallback((language: string) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  }, []);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (!form.idDocument || !form.selfieWithId || form.zones.length === 0 || form.languages.length === 0) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setStatus('pending');
    setIsSubmitting(false);
  }, [form]);

  // ── Status config ──
  const statusConfig: Record<VerificationStatus, { label: string; color: string; icon: React.ElementType; description: string }> = {
    unverified: {
      label: 'Unverified',
      color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
      icon: XCircle,
      description: 'Complete the verification form below to get verified',
    },
    pending: {
      label: 'Pending Review',
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
      icon: Clock,
      description: 'Your verification is being reviewed. This usually takes 24-48 hours.',
    },
    verified: {
      label: 'Verified',
      color: 'bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399]',
      icon: CheckCircle2,
      description: 'You are a verified guide! Enjoy all the benefits.',
    },
    rejected: {
      label: 'Rejected',
      color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      icon: XCircle,
      description: 'Your verification was not approved. Please review and resubmit.',
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

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
              <Shield className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              <span className="text-xs font-semibold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider">
                Verification
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3"
          >
            <span className="gradient-text-green">Guide</span>{' '}
            <span className="gradient-text-gold">Verification</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto"
          >
            Get verified to unlock premium features and earn more
          </motion.p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16 space-y-8">
        {/* ── Status Badge ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={`kcard p-5 flex items-center gap-4 ${status === 'verified' ? 'border-2 border-[#065F46]/20 dark:border-[#34D399]/20' : ''}`}>
            <div className={`w-14 h-14 rounded-2xl ${currentStatus.color} flex items-center justify-center shrink-0`}>
              <StatusIcon className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                  Verification Status
                </h3>
                <Badge className={`${currentStatus.color} border-0 text-xs font-bold`}>
                  {currentStatus.label}
                </Badge>
              </div>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                {currentStatus.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Progress Bar ── */}
        {status === 'unverified' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="kcard p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                  Verification Progress
                </span>
                <span className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-2">
                Complete all sections to submit for review
              </p>
            </div>
          </motion.div>
        )}

        {status === 'unverified' && (
          <>
            {/* ── ID Document Upload ── */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="kcard-glass p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#F59E0B]" />
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    ID Document
                  </h3>
                  <Badge className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-0 text-xs">
                    Required
                  </Badge>
                </div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">
                  Upload your national ID card or passport for identity verification.
                </p>

                {form.idDocumentPreview ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-[#065F46]/20 dark:border-[#34D399]/20 bg-black/5">
                    <img
                      src={form.idDocumentPreview}
                      alt="ID Document preview"
                      className="w-full max-h-48 object-contain"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-center justify-between">
                      <span className="text-xs text-white font-medium">{form.idDocument?.name}</span>
                      <button
                        onClick={() => setForm((prev) => ({ ...prev, idDocument: null, idDocumentPreview: null }))}
                        className="w-7 h-7 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <CheckCircle2 className="absolute top-3 right-3 w-6 h-6 text-[#34D399]" />
                  </div>
                ) : (
                  <button
                    onClick={() => idInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#E2E8F0] dark:border-[#334155] rounded-xl p-6 text-center hover:border-[#065F46] dark:hover:border-[#34D399] transition-colors"
                  >
                    <Upload className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Upload ID Document</p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">National ID or Passport (JPG, PNG, PDF)</p>
                  </button>
                )}
                <input
                  ref={idInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleIdDocument}
                  className="hidden"
                />
              </motion.div>
            </motion.div>

            {/* ── Selfie with ID ── */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="kcard-glass p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="w-5 h-5 text-[#F59E0B]" />
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    Selfie with ID
                  </h3>
                  <Badge className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-0 text-xs">
                    Required
                  </Badge>
                </div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">
                  Take a selfie holding your ID document next to your face for identity verification.
                </p>

                {form.selfieWithIdPreview ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-[#065F46]/20 dark:border-[#34D399]/20 bg-black/5">
                    <img
                      src={form.selfieWithIdPreview}
                      alt="Selfie with ID preview"
                      className="w-full max-h-48 object-contain"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-center justify-between">
                      <span className="text-xs text-white font-medium">{form.selfieWithId?.name}</span>
                      <button
                        onClick={() => setForm((prev) => ({ ...prev, selfieWithId: null, selfieWithIdPreview: null }))}
                        className="w-7 h-7 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <CheckCircle2 className="absolute top-3 right-3 w-6 h-6 text-[#34D399]" />
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        if (selfieInputRef.current) {
                          selfieInputRef.current.setAttribute('capture', 'environment');
                          selfieInputRef.current.click();
                        }
                      }}
                      className="flex-1 border-2 border-dashed border-[#E2E8F0] dark:border-[#334155] rounded-xl p-6 text-center hover:border-[#065F46] dark:hover:border-[#34D399] transition-colors"
                    >
                      <Camera className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Take Selfie</p>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">Use camera</p>
                    </button>
                    <button
                      onClick={() => {
                        if (selfieInputRef.current) {
                          selfieInputRef.current.removeAttribute('capture');
                          selfieInputRef.current.click();
                        }
                      }}
                      className="flex-1 border-2 border-dashed border-[#E2E8F0] dark:border-[#334155] rounded-xl p-6 text-center hover:border-[#065F46] dark:hover:border-[#34D399] transition-colors"
                    >
                      <Upload className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Upload Photo</p>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">From gallery</p>
                    </button>
                  </div>
                )}
                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelfieWithId}
                  className="hidden"
                />
              </motion.div>
            </motion.div>

            {/* ── Certificate Upload (Optional) ── */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="kcard-glass p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-[#F59E0B]" />
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    Certifications
                  </h3>
                  <Badge className="bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] border-0 text-xs">
                    Optional
                  </Badge>
                </div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">
                  Upload any relevant certifications (tourism, first aid, language, etc.) to boost your profile.
                </p>

                {form.certificatePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {form.certificatePreviews.map((preview, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={preview}
                          alt={`Certificate ${i + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-[#E2E8F0] dark:border-[#334155]"
                        />
                        <button
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              certificates: prev.certificates.filter((_, idx) => idx !== i),
                              certificatePreviews: prev.certificatePreviews.filter((_, idx) => idx !== i),
                            }));
                          }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => certificateInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#E2E8F0] dark:border-[#334155] rounded-xl p-4 text-center hover:border-[#065F46] dark:hover:border-[#34D399] transition-colors"
                >
                  <Upload className="w-6 h-6 text-[#94A3B8] mx-auto mb-1" />
                  <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Add Certificate</p>
                </button>
                <input
                  ref={certificateInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleCertificate}
                  className="hidden"
                />
              </motion.div>
            </motion.div>

            {/* ── Zone Selection ── */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="kcard-glass p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-[#F59E0B]" />
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    Zones You Can Guide In
                  </h3>
                  <Badge className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-0 text-xs">
                    Required
                  </Badge>
                </div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">
                  Select all the zones in Kariakoo Market where you can guide seekers.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ZONES.map((zone) => {
                    const isActive = form.zones.includes(zone);
                    return (
                      <motion.button
                        key={zone}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleZone(zone)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22] shadow-md'
                            : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#475569]'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        {zone}
                      </motion.button>
                    );
                  })}
                </div>
                {form.zones.length > 0 && (
                  <p className="text-xs text-[#065F46] dark:text-[#34D399] font-semibold mt-3">
                    {form.zones.length} zone{form.zones.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </motion.div>
            </motion.div>

            {/* ── Languages Spoken ── */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="kcard-glass p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-[#F59E0B]" />
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    Languages You Speak
                  </h3>
                  <Badge className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-0 text-xs">
                    Required
                  </Badge>
                </div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">
                  Select all languages you can communicate in during a session.
                </p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((language) => {
                    const isActive = form.languages.includes(language);
                    return (
                      <motion.button
                        key={language}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleLanguage(language)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22] shadow-md'
                            : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#475569]'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {language}
                      </motion.button>
                    );
                  })}
                </div>
                {form.languages.length > 0 && (
                  <p className="text-xs text-[#065F46] dark:text-[#34D399] font-semibold mt-3">
                    {form.languages.length} language{form.languages.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </motion.div>
            </motion.div>

            {/* ── Submit Button ── */}
            <motion.div
              variants={itemVariants}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={handleSubmit}
                disabled={!form.idDocument || !form.selfieWithId || form.zones.length === 0 || form.languages.length === 0 || isSubmitting}
                className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[#065F46] via-[#059669] to-[#065F46] bg-[length:200%_100%] hover:bg-right shadow-lg shadow-[#065F46]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-2.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting for Review…
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Submit for Review
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {(!form.idDocument || !form.selfieWithId || form.zones.length === 0 || form.languages.length === 0) && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Please complete all required sections (ID Document, Selfie with ID, Zones, and Languages) before submitting.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* ── Verification Benefits ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h2 variants={itemVariants} className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-4">
            Why Get Verified?
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VERIFICATION_BENEFITS.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <motion.div key={benefit.title} variants={itemVariants}>
                  <div className="kcard p-5">
                    <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
                    </div>
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
