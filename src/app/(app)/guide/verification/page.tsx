'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Camera, Upload, CheckCircle2, XCircle, Loader2,
  ChevronRight, ChevronLeft, FileText, User, MapPin,
  AlertCircle, Clock, RefreshCw, Info, Eye, Home,
  ScanSearch, BadgeCheck, Fingerprint
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/stores/auth-store';

// ─── Types ──

type VerificationStatus = 'not_submitted' | 'pending' | 'under_review' | 'approved' | 'rejected';
type WizardStep = 'personal' | 'quiz' | 'selfie' | 'documents' | 'address_proof' | 'background_check' | 'status';

interface QuizQuestion {
  id: string;
  question: string;
  questionSw: string;
  options: string[];
  optionsSw: string[];
  correctIndex: number;
}

interface VerificationData {
  status: VerificationStatus;
  personalInfo: {
    fullName: string;
    idNumber: string;
    address: string;
  };
  quizScore: number | null;
  quizTotal: number;
  selfieUrl: string | null;
  documentFrontUrl: string | null;
  documentBackUrl: string | null;
  addressProofUrl: string | null;
  backgroundCheckStatus: string;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  vlmResult?: { verified: boolean; confidence: number; details: string } | null;
}

// ─── Animation variants ──

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

// ─── Default quiz questions (fallback) ──

const DEFAULT_QUIZ: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Where can you find the best selection of kanga fabrics in Kariakoo?',
    questionSw: 'Unaweza kupata uchaguzi bora wa kanga Kariakoo wapi?',
    options: ['Electronics Zone', 'Fabrics Zone', 'Spice Market', 'Food Court'],
    optionsSw: ['Eneo la Elektroniki', 'Eneo la Vitambaa', 'Soko la Viungo', 'Ukumbi wa Chakula'],
    correctIndex: 1,
  },
  {
    id: 'q2',
    question: 'What is the Swahili name for the central market area?',
    questionSw: 'Jina la Kiswahili la eneo kuu la soko ni nini?',
    options: ['Soko Kuu', 'Mnamboleo', 'Upeo Mashariki', 'Kariakoo Kusini'],
    optionsSw: ['Soko Kuu', 'Mnamboleo', 'Upeo Mashariki', 'Kariakoo Kusini'],
    correctIndex: 0,
  },
  {
    id: 'q3',
    question: 'Which zone is known for wholesale electronics and gadgets?',
    questionSw: 'Eneo lipi linajulikana kwa elektroniki na vifaa vya jumla?',
    options: ['Fabrics Zone', 'Spice Market', 'Electronics Zone', 'West Wing'],
    optionsSw: ['Eneo la Vitambaa', 'Soko la Viungo', 'Eneo la Elektroniki', 'Upeo Magharibi'],
    correctIndex: 2,
  },
  {
    id: 'q4',
    question: 'What is the typical market opening time for most vendors?',
    questionSw: 'Saa ya kawaida ya kufungua soko kwa wauzaji wengi ni ipi?',
    options: ['6:00 AM', '8:00 AM', '10:00 AM', '12:00 PM'],
    optionsSw: ['Saa 12 asubuhi', 'Saa 2 asubuhi', 'Saa 4 asubuhi', 'Saa 6 mchana'],
    correctIndex: 1,
  },
  {
    id: 'q5',
    question: 'What Swahili phrase should you use to ask for the wholesale price?',
    questionSw: 'Ni kauli gani ya Kiswahili unayotumia kuuliza bei ya jumla?',
    options: ['Bei gani?', 'Bei ya jumla?', 'Punguza bei', 'Nipe bei yako'],
    optionsSw: ['Bei gani?', 'Bei ya jumla?', 'Punguza bei', 'Nipe bei yako'],
    correctIndex: 1,
  },
];

// ─── Verification Badge Component ──

function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === 'approved') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] border border-[#34D399]/30">
        <BadgeCheck className="w-4 h-4 text-[#34D399]" />
        <span className="text-xs font-bold text-[#065F46] dark:text-[#34D399]">Verified</span>
      </div>
    );
  }
  if (status === 'pending' || status === 'under_review') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF3C7] dark:bg-[#422006] border border-[#F59E0B]/30">
        <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
        <span className="text-xs font-bold text-[#92400E] dark:text-[#FBBF24]">In Review</span>
      </div>
    );
  }
  return null;
}

// ─── Component ──

export default function GuideVerificationPage() {
  const { user, language } = useAuthStore();
  const sw = language === 'sw';

  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<WizardStep>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(DEFAULT_QUIZ);

  // Personal info
  const [fullName, setFullName] = useState(user?.name || '');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');

  // Quiz
  const [quizAnswers, setQuizAnswers] = useState<number[]>([-1, -1, -1, -1, -1]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Selfie
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  // Documents
  const [docFrontPreview, setDocFrontPreview] = useState<string | null>(null);
  const [docFrontBase64, setDocFrontBase64] = useState<string | null>(null);
  const [docBackPreview, setDocBackPreview] = useState<string | null>(null);
  const [docBackBase64, setDocBackBase64] = useState<string | null>(null);
  const docFrontRef = useRef<HTMLInputElement>(null);
  const docBackRef = useRef<HTMLInputElement>(null);

  // Address proof
  const [addressProofPreview, setAddressProofPreview] = useState<string | null>(null);
  const [addressProofBase64, setAddressProofBase64] = useState<string | null>(null);
  const addressProofRef = useRef<HTMLInputElement>(null);

  // VLM result
  const [vlmResult, setVlmResult] = useState<{ verified: boolean; confidence: number; details: string } | null>(null);

  const l = (en: string, swText: string) => (sw ? swText : en);

  // ── Load verification status ──
  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const guideId = user?.id || 'demo-guide';
        const res = await fetch(`/api/verification?guideId=${guideId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.verification) {
            setVerification(data.verification as VerificationData);
            if (data.quizQuestions) setQuizQuestions(data.quizQuestions);
            if (data.vlmResult) setVlmResult(data.vlmResult);
            const status = data.verification.status;
            if (status === 'pending' || status === 'under_review' || status === 'approved' || status === 'rejected') {
              setCurrentStep('status');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load verification:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVerification();
  }, [user?.id]);

  // ── Handle image selection ──
  const handleImageSelect = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (v: string | null) => void,
    setBase64: (v: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreview(dataUrl);
      setBase64(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  // ── Submit quiz ──
  const handleSubmitQuiz = useCallback(() => {
    let score = 0;
    quizAnswers.forEach((answer, index) => {
      if (quizQuestions[index] && answer === quizQuestions[index].correctIndex) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  }, [quizAnswers, quizQuestions]);

  // ── Submit verification ──
  const handleSubmitVerification = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const guideId = user?.id || 'demo-guide';
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideId,
          personalInfo: { fullName, idNumber, address },
          quizAnswers,
          selfieData: selfieBase64,
          documentFrontData: docFrontBase64,
          documentBackData: docBackBase64,
          addressProofData: addressProofBase64,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVerification(data.verification);
        if (data.vlmResult) setVlmResult(data.vlmResult);
        setCurrentStep('status');
      }
    } catch (err) {
      console.error('Verification submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, fullName, idNumber, address, quizAnswers, selfieBase64, docFrontBase64, docBackBase64, addressProofBase64]);

  // ── Refresh status ──
  const refreshStatus = useCallback(async () => {
    try {
      const guideId = user?.id || 'demo-guide';
      const res = await fetch(`/api/verification?guideId=${guideId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.verification) {
          setVerification(data.verification);
        }
      }
    } catch (err) {
      console.error('Failed to refresh:', err);
    }
  }, [user?.id]);

  // ── Steps config ──
  const steps: { id: WizardStep; label: string; labelSw: string; icon: any }[] = [
    { id: 'personal', label: 'Personal Info', labelSw: 'Taarifa Za Kibinafsi', icon: User },
    { id: 'quiz', label: 'Zone Quiz', labelSw: 'Jaribio La Eneo', icon: MapPin },
    { id: 'selfie', label: 'Selfie', labelSw: 'Picha Ya Kibinafsi', icon: Camera },
    { id: 'documents', label: 'ID Upload', labelSw: 'Pakia Kitambulisho', icon: FileText },
    { id: 'address_proof', label: 'Address Proof', labelSw: 'Uthibitisho Wa Anwani', icon: Home },
    { id: 'background_check', label: 'Background', labelSw: 'Ukaguzi', icon: Fingerprint },
    { id: 'status', label: 'Status', labelSw: 'Hali', icon: Shield },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const canProceedFromPersonal = fullName.trim() && idNumber.trim() && address.trim();
  const canProceedFromQuiz = quizSubmitted && quizScore >= 3;
  const canProceedFromSelfie = !!selfieBase64;
  const canProceedFromDocuments = !!(docFrontBase64 || docBackBase64);
  const canProceedFromAddress = !!addressProofBase64;
  const canSubmit = canProceedFromPersonal && canProceedFromQuiz && canProceedFromSelfie && canProceedFromDocuments;

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#065F46]/20 border-t-[#065F46] animate-spin" />
          <p className="text-sm text-[#64748B]">{l('Loading verification...', 'Inapakia uthibitisho...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#065F46] to-[#064E3B] dark:from-[#0F172A] dark:to-[#0F172A] px-4 pt-6 pb-8">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#34D399]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{l('Guide Verification', 'Uthibitisho Wa Mwongozo')}</h1>
                <p className="text-xs text-[#34D399]">{l('Get verified to start guiding', 'Thibitishwa kuanza kuongoza')}</p>
              </div>
            </div>
            <VerificationBadge status={verification?.status || 'not_submitted'} />
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
          {steps.map((step, i) => {
            const StepIcon = step.icon;
            const isActive = i === currentStepIndex;
            const isCompleted = i < currentStepIndex;
            return (
              <div key={step.id} className="flex-1 flex flex-col items-center gap-1 min-w-[40px]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isCompleted ? 'bg-[#34D399]' :
                  isActive ? 'bg-white/20 border-2 border-[#34D399]' :
                  'bg-white/10'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <StepIcon className={`w-3.5 h-3.5 ${isActive ? 'text-[#34D399]' : 'text-white/50'}`} />
                  )}
                </div>
                <span className={`text-[8px] leading-tight text-center ${isActive ? 'text-white font-semibold' : 'text-white/50'}`}>
                  {i + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 pb-8 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {/* ── Step 1: Personal Info ── */}
          {currentStep === 'personal' && (
            <motion.div key="personal" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-[#065F46] dark:text-[#34D399]">
                    <User className="w-5 h-5" />
                    {l('Personal Information', 'Taarifa Za Kibinafsi')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1.5 block">
                      {l('Full Name (as on ID)', 'Jina Kamili (kama kwenye kitambulisho)')}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder={l('Enter your full name', 'Weka jina lako kamili')}
                      className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] text-sm outline-none focus:ring-2 focus:ring-[#065F46]/20 focus:border-[#065F46] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1.5 block">
                      {l('ID Number (NIDA)', 'Nambari ya Kitambulisho (NIDA)')}
                    </label>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={e => setIdNumber(e.target.value)}
                      placeholder={l('e.g. 1234567890', 'Mfano: 1234567890')}
                      className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] text-sm outline-none focus:ring-2 focus:ring-[#065F46]/20 focus:border-[#065F46] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1.5 block">
                      {l('Address', 'Anwani')}
                    </label>
                    <textarea
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder={l('Your residential address', 'Anwani yako ya makazi')}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] text-sm outline-none focus:ring-2 focus:ring-[#065F46]/20 focus:border-[#065F46] transition-all resize-none"
                    />
                  </div>
                  <Button
                    onClick={() => setCurrentStep('quiz')}
                    disabled={!canProceedFromPersonal}
                    className="w-full bg-[#065F46] hover:bg-[#064E3B] text-white font-bold py-3.5 rounded-xl disabled:opacity-50"
                  >
                    {l('Continue to Quiz', 'Endelea kwenye Jaribio')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Step 2: Zone Knowledge Quiz ── */}
          {currentStep === 'quiz' && (
            <motion.div key="quiz" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-4">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-[#065F46] dark:text-[#34D399]">
                    <MapPin className="w-5 h-5" />
                    {l('Zone Knowledge Quiz', 'Jaribio La Ujuzi Wa Eneo')}
                  </CardTitle>
                  <p className="text-xs text-[#64748B]">
                    {l('Answer at least 3/5 correctly to proceed', 'Jibu angalau 3/5 kwa usahihi kuendelea')}
                  </p>
                </CardHeader>
              </Card>

              {quizQuestions.map((q, qi) => (
                <motion.div key={q.id} variants={itemVariants}>
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                        {qi + 1}. {sw ? q.questionSw : q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => {
                          const isSelected = quizAnswers[qi] === oi;
                          const isCorrect = quizSubmitted && oi === q.correctIndex;
                          const isWrong = quizSubmitted && isSelected && oi !== q.correctIndex;
                          return (
                            <button
                              key={oi}
                              onClick={() => {
                                if (!quizSubmitted) {
                                  const newAnswers = [...quizAnswers];
                                  newAnswers[qi] = oi;
                                  setQuizAnswers(newAnswers);
                                }
                              }}
                              disabled={quizSubmitted}
                              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
                                isCorrect ? 'bg-[#ECFDF5] dark:bg-[#064E3B] border-2 border-[#34D399] text-[#065F46] dark:text-[#34D399]' :
                                isWrong ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-400 text-red-700 dark:text-red-400' :
                                isSelected ? 'bg-[#ECFDF5] dark:bg-[#064E3B] border-2 border-[#065F46] dark:border-[#34D399]' :
                                'bg-[#F8FAFC] dark:bg-[#1E293B] border-2 border-transparent hover:border-[#E2E8F0] dark:hover:border-[#334155]'
                              }`}
                            >
                              <span className="font-medium">{sw ? q.optionsSw[oi] : opt}</span>
                              {isCorrect && <CheckCircle2 className="w-4 h-4 inline ml-2 text-[#34D399]" />}
                              {isWrong && <XCircle className="w-4 h-4 inline ml-2 text-red-500" />}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {quizSubmitted && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className={`p-4 rounded-xl border-2 ${
                    quizScore >= 3
                      ? 'bg-[#ECFDF5] dark:bg-[#064E3B] border-[#34D399]'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-400'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {quizScore >= 3 ? (
                        <CheckCircle2 className="w-5 h-5 text-[#34D399]" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`text-base font-bold ${quizScore >= 3 ? 'text-[#065F46] dark:text-[#34D399]' : 'text-red-700 dark:text-red-400'}`}>
                        {l(`Score: ${quizScore}/${quizQuestions.length}`, `Alama: ${quizScore}/${quizQuestions.length}`)}
                      </span>
                    </div>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                      {quizScore >= 3
                        ? l('Great job! You passed the quiz.', 'Vizuri! Umefaulu jaribio.')
                        : l('You need at least 3/5 to pass. Try again!', 'Unahitaji angalau 3/5 kufaulu. Jaribu tena!')
                      }
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('personal')}
                  className="flex-1 py-3.5 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {l('Back', 'Rudi')}
                </Button>
                {!quizSubmitted ? (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={quizAnswers.some(a => a === -1)}
                    className="flex-1 bg-[#065F46] hover:bg-[#064E3B] text-white font-bold py-3.5 rounded-xl disabled:opacity-50"
                  >
                    {l('Submit Quiz', 'Wasilisha Jaribio')}
                  </Button>
                ) : quizScore >= 3 ? (
                  <Button
                    onClick={() => setCurrentStep('selfie')}
                    className="flex-1 bg-[#065F46] hover:bg-[#064E3B] text-white font-bold py-3.5 rounded-xl"
                  >
                    {l('Continue', 'Endelea')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => { setQuizAnswers([-1, -1, -1, -1, -1]); setQuizSubmitted(false); }}
                    className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold py-3.5 rounded-xl"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {l('Retry Quiz', 'Jaribu Tena')}
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Selfie Verification ── */}
          {currentStep === 'selfie' && (
            <motion.div key="selfie" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-[#065F46] dark:text-[#34D399]">
                    <Camera className="w-5 h-5" />
                    {l('Selfie Verification', 'Uthibitisho Wa Picha')}
                  </CardTitle>
                  <p className="text-xs text-[#64748B]">
                    {l('Take a clear photo of your face for identity verification', 'Piga picha ya wazi ya uso wako kwa uthibitisho')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selfiePreview ? (
                    <div className="relative">
                      <img
                        src={selfiePreview}
                        alt="Selfie preview"
                        className="w-full max-h-64 object-contain rounded-xl border-2 border-[#E2E8F0] dark:border-[#334155]"
                      />
                      <button
                        onClick={() => { setSelfiePreview(null); setSelfieBase64(null); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-[#065F46] text-white px-2 py-1 rounded-lg text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        {l('Photo captured', 'Picha imechukuliwa')}
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-[#E2E8F0] dark:border-[#334155] rounded-xl p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center mx-auto mb-3">
                        <Camera className="w-8 h-8 text-[#065F46] dark:text-[#34D399]" />
                      </div>
                      <p className="text-sm text-[#64748B] mb-4">
                        {l('Take a selfie or upload a photo', 'Piga picha ya kibinafsi au pakia picha')}
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => selfieRef.current?.click()}
                          className="px-4 py-2 bg-[#065F46] text-white text-sm font-bold rounded-xl hover:bg-[#064E3B] transition-colors flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          {l('Take Photo', 'Piga Picha')}
                        </button>
                        <button
                          onClick={() => { if (selfieRef.current) { selfieRef.current.removeAttribute('capture'); selfieRef.current.click(); } }}
                          className="px-4 py-2 border border-[#065F46] text-[#065F46] dark:text-[#34D399] dark:border-[#34D399] text-sm font-bold rounded-xl hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B] transition-colors flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          {l('Upload', 'Pakia')}
                        </button>
                      </div>
                    </div>
                  )}
                  <input
                    ref={selfieRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={e => handleImageSelect(e, setSelfiePreview, setSelfieBase64)}
                    className="hidden"
                  />

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('quiz')}
                      className="flex-1 py-3.5 rounded-xl"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      {l('Back', 'Rudi')}
                    </Button>
                    <Button
                      onClick={() => setCurrentStep('documents')}
                      disabled={!selfieBase64}
                      className="flex-1 bg-[#065F46] hover:bg-[#064E3B] text-white font-bold py-3.5 rounded-xl disabled:opacity-50"
                    >
                      {l('Continue', 'Endelea')}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Step 4: ID Document Upload ── */}
          {currentStep === 'documents' && (
            <motion.div key="documents" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-[#065F46] dark:text-[#34D399]">
                    <FileText className="w-5 h-5" />
                    {l('ID Document Upload', 'Pakia Nyaraka Za Kitambulisho')}
                  </CardTitle>
                  <p className="text-xs text-[#64748B]">
                    {l('Upload front and back of your national ID', 'Pakia mbele na nyuma ya kitambulisho chako')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ID Front */}
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-2 block">
                      {l('ID Front', 'Mbele Ya Kitambulisho')}
                    </label>
                    {docFrontPreview ? (
                      <div className="relative">
                        <img src={docFrontPreview} alt="ID Front" className="w-full max-h-40 object-contain rounded-xl border border-[#E2E8F0] dark:border-[#334155]" />
                        <button onClick={() => { setDocFrontPreview(null); setDocFrontBase64(null); }} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center">
                          <XCircle className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-[#065F46] text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
                          <ScanSearch className="w-3 h-3" />
                          {l('AI Verified', 'AI Imethibitisha')}
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => docFrontRef.current?.click()} className="w-full border-2 border-dashed border-[#E2E8F0] dark:border-[#334155] rounded-xl p-6 text-center hover:border-[#065F46] dark:hover:border-[#34D399] transition-colors">
                        <Upload className="w-6 h-6 text-[#64748B] mx-auto mb-2" />
                        <p className="text-xs text-[#64748B]">{l('Upload ID front', 'Pakia mbele ya kitambulisho')}</p>
                      </button>
                    )}
                    <input ref={docFrontRef} type="file" accept="image/*" onChange={e => handleImageSelect(e, setDocFrontPreview, setDocFrontBase64)} className="hidden" />
                  </div>

                  {/* ID Back */}
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-2 block">
                      {l('ID Back', 'Nyuma Ya Kitambulisho')}
                    </label>
                    {docBackPreview ? (
                      <div className="relative">
                        <img src={docBackPreview} alt="ID Back" className="w-full max-h-40 object-contain rounded-xl border border-[#E2E8F0] dark:border-[#334155]" />
                        <button onClick={() => { setDocBackPreview(null); setDocBackBase64(null); }} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center">
                          <XCircle className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => docBackRef.current?.click()} className="w-full border-2 border-dashed border-[#E2E8F0] dark:border-[#334155] rounded-xl p-6 text-center hover:border-[#065F46] dark:hover:border-[#34D399] transition-colors">
                        <Upload className="w-6 h-6 text-[#64748B] mx-auto mb-2" />
                        <p className="text-xs text-[#64748B]">{l('Upload ID back', 'Pakia nyuma ya kitambulisho')}</p>
                      </button>
                    )}
                    <input ref={docBackRef} type="file" accept="image/*" onChange={e => handleImageSelect(e, setDocBackPreview, setDocBackBase64)} className="hidden" />
                  </div>

                  {/* Info note about AI verification */}
                  <div className="p-3 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-start gap-2">
                    <ScanSearch className="w-4 h-4 text-[#065F46] dark:text-[#34D399] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-[#065F46] dark:text-[#34D399] font-medium">
                        {l('AI-Powered Verification', 'Uthibitisho wa AI')}
                      </p>
                      <p className="text-[10px] text-[#065F46] dark:text-[#34D399]/80 mt-0.5">
                        {l('Your ID will be analyzed by AI to verify authenticity. Ensure clear, well-lit photos.', 'Kitambulisho chako kitaangaliwa na AI kuthibitisha uhalali. Hakikisha picha ni wazi.')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('selfie')}
                      className="flex-1 py-3.5 rounded-xl"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      {l('Back', 'Rudi')}
                    </Button>
                    <Button
                      onClick={() => setCurrentStep('address_proof')}
                      disabled={!canProceedFromDocuments}
                      className="flex-1 bg-[#065F46] hover:bg-[#064E3B] text-white font-bold py-3.5 rounded-xl disabled:opacity-50"
                    >
                      {l('Continue', 'Endelea')}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Step 5: Address Proof ── */}
          {currentStep === 'address_proof' && (
            <motion.div key="address_proof" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-[#065F46] dark:text-[#34D399]">
                    <Home className="w-5 h-5" />
                    {l('Address Proof', 'Uthibitisho Wa Anwani')}
                  </CardTitle>
                  <p className="text-xs text-[#64748B]">
                    {l('Upload a utility bill, bank statement, or official letter showing your address', 'Pakia bili ya matumizi, taarifa ya benki, au barua rasmi inayoonyesha anwani yako')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addressProofPreview ? (
                    <div className="relative">
                      <img src={addressProofPreview} alt="Address Proof" className="w-full max-h-48 object-contain rounded-xl border border-[#E2E8F0] dark:border-[#334155]" />
                      <button onClick={() => { setAddressProofPreview(null); setAddressProofBase64(null); }} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center">
                        <XCircle className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-[#065F46] text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        {l('Uploaded', 'Imepakiwa')}
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => addressProofRef.current?.click()} className="w-full border-2 border-dashed border-[#E2E8F0] dark:border-[#334155] rounded-xl p-8 text-center hover:border-[#065F46] dark:hover:border-[#34D399] transition-colors">
                      <div className="w-14 h-14 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center mx-auto mb-3">
                        <Home className="w-7 h-7 text-[#065F46] dark:text-[#34D399]" />
                      </div>
                      <p className="text-sm text-[#64748B]">{l('Upload address proof document', 'Pakia hati ya uthibitisho wa anwani')}</p>
                      <p className="text-[10px] text-[#94A3B8] mt-1">
                        {l('Utility bill, bank statement, or official letter', 'Bili ya matumizi, taarifa ya benki, au barua rasmi')}
                      </p>
                    </button>
                  )}
                  <input ref={addressProofRef} type="file" accept="image/*,.pdf" onChange={e => handleImageSelect(e, setAddressProofPreview, setAddressProofBase64)} className="hidden" />

                  <div className="p-3 rounded-xl bg-[#FEF3C7] dark:bg-[#422006] flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#92400E] dark:text-[#FBBF24]">
                      {l('This step is optional but helps speed up the review process.', 'Hatua hii si lazima lakini inasaidia kuharakisha mchakato wa ukaguzi.')}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('documents')}
                      className="flex-1 py-3.5 rounded-xl"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      {l('Back', 'Rudi')}
                    </Button>
                    <Button
                      onClick={() => setCurrentStep('background_check')}
                      className="flex-1 bg-[#065F46] hover:bg-[#064E3B] text-white font-bold py-3.5 rounded-xl"
                    >
                      {l('Continue', 'Endelea')}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Step 6: Background Check Consent ── */}
          {currentStep === 'background_check' && (
            <motion.div key="background_check" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-[#065F46] dark:text-[#34D399]">
                    <Fingerprint className="w-5 h-5" />
                    {l('Background Check', 'Ukaguzi Wa Usalama')}
                  </CardTitle>
                  <p className="text-xs text-[#64748B]">
                    {l('Final step before submission. Review and consent to the background check.', 'Hatua ya mwisho kabla ya kuwasilisha. Kagua na kubali ukaguzi wa usalama.')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary of uploaded documents */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                      {l('Submission Summary', 'Muhtasari Wa Mawasilisho')}
                    </h4>
                    {[
                      { icon: User, label: l('Personal Info', 'Taarifa Za Kibinafsi'), done: canProceedFromPersonal },
                      { icon: MapPin, label: l('Zone Quiz', 'Jaribio La Eneo'), done: canProceedFromQuiz, detail: `${quizScore}/5` },
                      { icon: Camera, label: l('Selfie Photo', 'Picha Ya Kibinafsi'), done: canProceedFromSelfie },
                      { icon: FileText, label: l('ID Documents', 'Nyaraka Za Kitambulisho'), done: canProceedFromDocuments },
                      { icon: Home, label: l('Address Proof', 'Uthibitisho Wa Anwani'), done: canProceedFromAddress },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${item.done ? 'bg-[#ECFDF5] dark:bg-[#064E3B]' : 'bg-[#F1F5F9] dark:bg-[#334155]'}`}>
                          <Icon className={`w-4 h-4 ${item.done ? 'text-[#065F46] dark:text-[#34D399]' : 'text-[#94A3B8]'}`} />
                          <span className={`text-sm flex-1 ${item.done ? 'text-[#065F46] dark:text-[#34D399]' : 'text-[#94A3B8]'}`}>{item.label}</span>
                          {item.detail && <Badge className="bg-[#065F46] text-white border-0 text-[10px]">{item.detail}</Badge>}
                          {item.done ? <CheckCircle2 className="w-4 h-4 text-[#34D399]" /> : <AlertCircle className="w-4 h-4 text-[#94A3B8]" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Background check consent */}
                  <div className="p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] space-y-3">
                    <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                      {l('Background Check Consent', 'Kibali Cha Ukaguzi Wa Usalama')}
                    </h4>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {l(
                        'By submitting, you consent to Chimbo Direct conducting a background check to verify your identity and ensure the safety of our community. This includes verification of your ID document and personal information.',
                        'Kwa kuwasilisha, unakubali Chimbo Direct kufanya ukaguzi wa usalama kuthibitisha utambulisho wako na kuhakikisha usalama wa jamii yetu. Hii inajumuisha uthibitisho wa kitambulisho chako na taarifa za kibinafsi.'
                      )}
                    </p>
                    <div className="flex items-start gap-2">
                      <input type="checkbox" id="bg-consent" defaultChecked className="mt-1 accent-[#065F46]" />
                      <label htmlFor="bg-consent" className="text-xs text-[#64748B]">
                        {l('I consent to the background check and verify that all information provided is accurate.', 'Nakubali ukaguzi wa usalama na nadhibitisha kuwa taarifa zote nilizotoa ni sahihi.')}
                      </label>
                    </div>
                  </div>

                  {/* Privacy note */}
                  <div className="p-3 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-start gap-2">
                    <Shield className="w-4 h-4 text-[#065F46] dark:text-[#34D399] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#065F46] dark:text-[#34D399]">
                      {l('Your documents are encrypted and stored securely. They will only be used for verification purposes.', 'Nyaraka zako zimesimbwa na kuhifadhiwa kwa usalama. Zitatumiwa tu kwa ajili ya uthibitisho.')}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('address_proof')}
                      className="flex-1 py-3.5 rounded-xl"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      {l('Back', 'Rudi')}
                    </Button>
                    <Button
                      onClick={handleSubmitVerification}
                      disabled={!canSubmit || isSubmitting}
                      className="flex-1 bg-[#065F46] hover:bg-[#064E3B] text-white font-bold py-3.5 rounded-xl disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          {l('Submitting...', 'Inawasilisha...')}
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          {l('Submit Verification', 'Wasilisha Uthibitisho')}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Step 7: Status ── */}
          {currentStep === 'status' && verification && (
            <motion.div key="status" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-4">
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className={`p-6 text-center ${
                  verification.status === 'approved' ? 'bg-gradient-to-b from-[#065F46] to-[#064E3B]' :
                  verification.status === 'rejected' ? 'bg-gradient-to-b from-red-600 to-red-700' :
                  verification.status === 'under_review' ? 'bg-gradient-to-b from-[#0891B2] to-[#0E7490]' :
                  'bg-gradient-to-b from-[#F59E0B] to-[#D97706]'
                }`}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3"
                  >
                    {verification.status === 'approved' ? (
                      <BadgeCheck className="w-10 h-10 text-[#34D399]" />
                    ) : verification.status === 'rejected' ? (
                      <XCircle className="w-10 h-10 text-white" />
                    ) : verification.status === 'under_review' ? (
                      <Eye className="w-10 h-10 text-white" />
                    ) : (
                      <Clock className="w-10 h-10 text-white animate-pulse" />
                    )}
                  </motion.div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {verification.status === 'approved'
                      ? l('Verified!', 'Imethibitishwa!')
                      : verification.status === 'rejected'
                        ? l('Not Approved', 'Hakijathibitishwa')
                        : verification.status === 'under_review'
                          ? l('Under Review', 'Inakaguliwa')
                          : l('Submitted', 'Imewasilishwa')
                    }
                  </h2>
                  <p className="text-white/80 text-sm">
                    {verification.status === 'approved'
                      ? l('You are now a verified guide!', 'Sasa uko mwongozo aliye thibitishwa!')
                      : verification.status === 'rejected'
                        ? l('Your verification was not approved', 'Uthibitisho wako haukukubaliwa')
                        : verification.status === 'under_review'
                          ? l('An admin is reviewing your documents', 'Msimamizi anakagua nyaraka zako')
                          : l('Your documents are waiting to be reviewed', 'Nyaraka zako zinasubiri kukaguliwa')
                    }
                  </p>
                </div>

                <CardContent className="p-5 space-y-4">
                  {/* VLM AI Verification Result */}
                  {vlmResult && (
                    <div className={`p-3 rounded-xl border ${
                      vlmResult.verified
                        ? 'bg-[#ECFDF5] dark:bg-[#064E3B] border-[#34D399]/30'
                        : 'bg-[#FEF3C7] dark:bg-[#422006] border-[#F59E0B]/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <ScanSearch className={`w-4 h-4 ${vlmResult.verified ? 'text-[#34D399]' : 'text-[#F59E0B]'}`} />
                        <span className={`text-xs font-bold ${vlmResult.verified ? 'text-[#065F46] dark:text-[#34D399]' : 'text-[#92400E] dark:text-[#FBBF24]'}`}>
                          {l('AI Document Analysis', 'Uchambuzi wa AI wa Hati')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-[#E2E8F0] dark:bg-[#334155] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${vlmResult.verified ? 'bg-[#34D399]' : 'bg-[#F59E0B]'}`}
                            style={{ width: `${vlmResult.confidence}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#64748B]">{vlmResult.confidence}%</span>
                      </div>
                      <p className="text-[10px] text-[#64748B] mt-1">{vlmResult.details.substring(0, 100)}</p>
                    </div>
                  )}

                  {verification.submittedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-[#64748B]" />
                      <span className="text-[#64748B]">
                        {l('Submitted:', 'Iliwasilishwa:')} {new Date(verification.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {verification.reviewedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4 text-[#64748B]" />
                      <span className="text-[#64748B]">
                        {l('Reviewed:', 'Ilikaguliwa:')} {new Date(verification.reviewedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Background check status */}
                  {verification.backgroundCheckStatus && verification.backgroundCheckStatus !== 'not_started' && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B]">
                      <span className="text-sm text-[#64748B]">{l('Background Check', 'Ukaguzi Wa Usalama')}</span>
                      <Badge className={`border-0 text-[10px] ${
                        verification.backgroundCheckStatus === 'passed' ? 'bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399]' :
                        verification.backgroundCheckStatus === 'failed' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                        'bg-[#FEF3C7] dark:bg-[#422006] text-[#92400E] dark:text-[#FBBF24]'
                      }`}>
                        {verification.backgroundCheckStatus === 'passed' ? l('Passed', 'Imefaulu') :
                         verification.backgroundCheckStatus === 'failed' ? l('Failed', 'Hakufaulu') :
                         verification.backgroundCheckStatus === 'in_progress' ? l('In Progress', 'Inaendelea') :
                         verification.backgroundCheckStatus}
                      </Badge>
                    </div>
                  )}

                  {verification.rejectionReason && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                        {l('Reason:', 'Sababu:')}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400/80">
                        {verification.rejectionReason}
                      </p>
                    </div>
                  )}

                  {verification.quizScore !== null && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B]">
                      <span className="text-sm text-[#64748B]">{l('Quiz Score', 'Alama Ya Jaribio')}</span>
                      <Badge className={`${
                        (verification.quizScore || 0) >= 3
                          ? 'bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399]'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      } border-0`}>
                        {verification.quizScore}/{verification.quizTotal}
                      </Badge>
                    </div>
                  )}

                  <Button
                    onClick={refreshStatus}
                    variant="outline"
                    className="w-full py-3 rounded-xl"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {l('Refresh Status', 'Pakia Upya Hali')}
                  </Button>
                </CardContent>
              </Card>

              {verification.status === 'rejected' && (
                <Button
                  onClick={() => {
                    setQuizAnswers([-1, -1, -1, -1, -1]);
                    setQuizSubmitted(false);
                    setSelfiePreview(null);
                    setSelfieBase64(null);
                    setDocFrontPreview(null);
                    setDocFrontBase64(null);
                    setDocBackPreview(null);
                    setDocBackBase64(null);
                    setAddressProofPreview(null);
                    setAddressProofBase64(null);
                    setCurrentStep('personal');
                  }}
                  className="w-full bg-[#065F46] hover:bg-[#064E3B] text-white font-bold py-3.5 rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {l('Reapply for Verification', 'Omba Uthibitisho Tena')}
                </Button>
              )}

              {verification.status === 'approved' && (
                <Card className="border-0 shadow-md bg-gradient-to-r from-[#ECFDF5] to-[#FEF3C7] dark:from-[#064E3B] dark:to-[#1E293B]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#065F46] flex items-center justify-center">
                        <BadgeCheck className="w-6 h-6 text-[#34D399]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#065F46] dark:text-[#34D399] text-sm">
                          {l('Verification Badge Active', 'Cheti Cha Uthibitisho Kiko Hai')}
                        </h4>
                        <p className="text-xs text-[#64748B]">
                          {l('Your verified badge is now visible on your profile', 'Cheti chako cha uthibitisho sasa kinaonekana kwenye wasifu wako')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
