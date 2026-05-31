'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Camera, MapPin, Upload, CheckCircle, Clock, XCircle,
  Shield, ChevronRight, ChevronLeft, User, AlertCircle, Award
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';

interface KYCData {
  id: string;
  status: string;
  documentType: string;
  documentNumber: string;
  documentFrontUrl: string | null;
  documentBackUrl: string | null;
  selfieUrl: string | null;
  selfieWithDocUrl: string | null;
  addressProofUrl: string | null;
  address: string;
  dateOfBirth: string;
  nationality: string;
  aiFaceMatchScore: number;
  aiDocAuthScore: number;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

const DOC_TYPES = [
  { value: 'national_id', label: 'National ID', labelSw: 'Kitambulisho cha Taifa' },
  { value: 'passport', label: 'Passport', labelSw: 'Pasipoti' },
  { value: 'drivers_license', label: "Driver's License", labelSw: 'Leseni ya Udereva' },
];

const STEPS = [
  { key: 'document_type', label: 'Document Type', labelSw: 'Aina ya Hati', icon: FileText },
  { key: 'id_upload', label: 'Upload ID', labelSw: 'Pakia Hati', icon: Upload },
  { key: 'selfie', label: 'Take Selfie', labelSw: 'Piga Picha', icon: Camera },
  { key: 'address', label: 'Address Proof', labelSw: 'Uthibitisho wa Anwani', icon: MapPin },
  { key: 'review', label: 'Review & Submit', labelSw: 'Kagua na Wasilisha', icon: CheckCircle },
];

export default function GuideKYCPage() {
  const { user, language } = useAuthStore();
  const sw = language === 'sw';
  const [kyc, setKyc] = useState<KYCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [docType, setDocType] = useState('national_id');
  const [docNumber, setDocNumber] = useState('');
  const [docFrontUrl, setDocFrontUrl] = useState('');
  const [docBackUrl, setDocBackUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [selfieWithDocUrl, setSelfieWithDocUrl] = useState('');
  const [addressProofUrl, setAddressProofUrl] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('Tanzanian');

  const fetchKYC = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/kyc?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'not_started') {
          setKyc(null);
        } else {
          setKyc(data);
          // Populate form from existing data
          setDocType(data.documentType || 'national_id');
          setDocNumber(data.documentNumber || '');
          setDocFrontUrl(data.documentFrontUrl || '');
          setDocBackUrl(data.documentBackUrl || '');
          setSelfieUrl(data.selfieUrl || '');
          setSelfieWithDocUrl(data.selfieWithDocUrl || '');
          setAddressProofUrl(data.addressProofUrl || '');
          setAddress(data.address || '');
          setDateOfBirth(data.dateOfBirth || '');
          setNationality(data.nationality || 'Tanzanian');
        }
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchKYC();
  }, [fetchKYC]);

  const handleSubmit = async () => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          documentType: docType,
          documentNumber: docNumber,
          documentFrontUrl: docFrontUrl,
          documentBackUrl: docBackUrl,
          selfieUrl,
          selfieWithDocUrl,
          addressProofUrl,
          address,
          dateOfBirth,
          nationality,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setKyc(data);
      }
    } catch {
      // Silent
    } finally {
      setSubmitting(false);
    }
  };

  const simulateUpload = (setter: (val: string) => void, prefix: string) => {
    setter(`https://storage.chimbodirect.com/kyc/${prefix}-${Date.now()}.jpg`);
  };

  const statusColors: Record<string, string> = {
    not_started: 'bg-gray-100 text-gray-600',
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-600',
  };

  const statusLabels: Record<string, { en: string; sw: string }> = {
    not_started: { en: 'Not Started', sw: 'Haujaanza' },
    pending: { en: 'Under Review', sw: 'Inakaguliwa' },
    approved: { en: 'Verified', sw: 'Imethibitishwa' },
    rejected: { en: 'Rejected', sw: 'Imekataliwa' },
    expired: { en: 'Expired', sw: 'Imeisha' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#065F46] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show status view if already submitted
  if (kyc && (kyc.status === 'pending' || kyc.status === 'approved')) {
    const statusInfo = statusLabels[kyc.status] || statusLabels.pending;
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-[#065F46] text-white p-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            {sw ? 'Uthibitisho wa Utambulisho' : 'Identity Verification'}
          </h1>
        </div>
        <div className="p-4">
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            {kyc.status === 'approved' ? (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-green-700 mb-2">
                  {sw ? 'Umethibitishwa!' : 'Verified!'}
                </h2>
                <p className="text-gray-500">
                  {sw ? 'Utambulisho wako umethibitishwa. Una beji ya uthibitisho!' : 'Your identity has been verified. You have a verified badge!'}
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-amber-600 animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-amber-700 mb-2">
                  {sw ? statusInfo.sw : statusInfo.en}
                </h2>
                <p className="text-gray-500">
                  {sw ? 'Hati zako zinakaguliwa. Utapata taarifa hivi karibuni.' : 'Your documents are under review. You will be notified soon.'}
                </p>
              </>
            )}
            <div className={`mt-4 inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[kyc.status]}`}>
              {sw ? statusInfo.sw : statusInfo.en}
            </div>
            {kyc.submittedAt && (
              <p className="text-xs text-gray-400 mt-3">
                {sw ? 'Iliwasilishwa' : 'Submitted'}: {new Date(kyc.submittedAt).toLocaleString(sw ? 'sw-TZ' : 'en-US')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show rejected status with resubmit option
  if (kyc && kyc.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-[#065F46] text-white p-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            {sw ? 'Uthibitisho wa Utambulisho' : 'Identity Verification'}
          </h1>
        </div>
        <div className="p-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-700 mb-2 text-center">
              {sw ? 'Imekataliwa' : 'Verification Rejected'}
            </h2>
            <div className="bg-red-50 rounded-xl p-3 mb-4">
              <p className="text-sm text-red-700 font-medium">
                {sw ? 'Sababu:' : 'Reason:'}
              </p>
              <p className="text-sm text-red-600">
                {kyc.rejectionReason || 'Documents did not meet verification requirements'}
              </p>
            </div>
            <button
              onClick={() => {
                setKyc(null);
                setCurrentStep(0);
              }}
              className="w-full bg-[#065F46] text-white py-3 rounded-xl font-medium"
            >
              {sw ? 'Wasilisha Tena' : 'Resubmit Documents'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step wizard
  const step = STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#065F46] text-white p-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          {sw ? 'Uthibitisho wa Utambulisho' : 'Identity Verification'}
        </h1>
        <p className="text-[#34D399] text-sm mt-1">
          {sw ? 'Hatua ya' : 'Step'} {currentStep + 1} {sw ? 'kati ya' : 'of'} {STEPS.length}: {sw ? step.labelSw : step.label}
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-4">
        <div className="flex gap-1 mb-4">
          {STEPS.map((s, idx) => (
            <div
              key={s.key}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                idx <= currentStep ? 'bg-[#065F46]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Step 1: Document Type */}
        {currentStep === 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-[#065F46] mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {sw ? 'Chagua Aina ya Hati' : 'Select Document Type'}
            </h3>
            <div className="space-y-2">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt.value}
                  onClick={() => setDocType(dt.value)}
                  className={`w-full p-4 rounded-xl text-left transition-colors flex items-center gap-3 ${
                    docType === dt.value
                      ? 'bg-[#065F46] text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <div>
                    <p className="font-medium">{sw ? dt.labelSw : dt.label}</p>
                    <p className={`text-xs ${docType === dt.value ? 'text-white/70' : 'text-gray-400'}`}>
                      {dt.value === 'national_id' ? 'NIDA ID' : dt.value === 'passport' ? 'International' : 'National'}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {sw ? 'Namba ya Hati' : 'Document Number'} *
              </label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder={sw ? 'Ingiza namba ya hati' : 'Enter document number'}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#065F46]/20 focus:border-[#065F46]"
              />
            </div>
          </div>
        )}

        {/* Step 2: Upload ID */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="font-bold text-[#065F46] mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {sw ? 'Pakia Hati yako' : 'Upload Your ID'}
            </h3>

            {/* Front */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {sw ? 'Mbele ya Hati' : 'Front of ID'}
              </p>
              {docFrontUrl ? (
                <div className="bg-green-50 rounded-lg p-3 flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700">{sw ? 'Imepakiwa' : 'Uploaded'}</span>
                </div>
              ) : (
                <button
                  onClick={() => simulateUpload(setDocFrontUrl, 'front')}
                  className="bg-[#065F46] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto"
                >
                  <Camera className="w-4 h-4" /> {sw ? 'Piga Picha / Pakia' : 'Take Photo / Upload'}
                </button>
              )}
            </div>

            {/* Back */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {sw ? 'Nyuma ya Hati' : 'Back of ID'}
              </p>
              {docBackUrl ? (
                <div className="bg-green-50 rounded-lg p-3 flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700">{sw ? 'Imepakiwa' : 'Uploaded'}</span>
                </div>
              ) : (
                <button
                  onClick={() => simulateUpload(setDocBackUrl, 'back')}
                  className="bg-[#065F46] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto"
                >
                  <Camera className="w-4 h-4" /> {sw ? 'Piga Picha / Pakia' : 'Take Photo / Upload'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Selfie */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="font-bold text-[#065F46] mb-2 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              {sw ? 'Piga Picha yako' : 'Take a Selfie'}
            </h3>
            <p className="text-sm text-gray-500">
              {sw ? 'Piga picha ya uso wako kwa uthibitisho' : 'Take a clear photo of your face for verification'}
            </p>

            {/* Selfie */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
              {selfieUrl ? (
                <div className="bg-green-50 rounded-lg p-4">
                  <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-700 font-medium">{sw ? 'Picha imepakiwa' : 'Selfie uploaded'}</p>
                </div>
              ) : (
                <div>
                  <div className="w-32 h-32 border-4 border-dashed border-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-300" />
                  </div>
                  <button
                    onClick={() => simulateUpload(setSelfieUrl, 'selfie')}
                    className="bg-[#065F46] text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 mx-auto"
                  >
                    <Camera className="w-4 h-4" /> {sw ? 'Piga Selfie' : 'Take Selfie'}
                  </button>
                </div>
              )}
            </div>

            {/* Selfie with document */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {sw ? 'Picha na Hati' : 'Selfie with Document'}
              </p>
              <p className="text-xs text-gray-400 mb-2">
                {sw ? 'Shikilia hati yako karibu na uso wako' : 'Hold your document next to your face'}
              </p>
              {selfieWithDocUrl ? (
                <div className="bg-green-50 rounded-lg p-3 flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700">{sw ? 'Imepakiwa' : 'Uploaded'}</span>
                </div>
              ) : (
                <button
                  onClick={() => simulateUpload(setSelfieWithDocUrl, 'selfie-doc')}
                  className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto"
                >
                  <Camera className="w-4 h-4" /> {sw ? 'Piga Picha' : 'Take Photo'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Address Proof */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="font-bold text-[#065F46] mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {sw ? 'Uthibitisho wa Anwani' : 'Address Proof'}
            </h3>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {sw ? 'Anwani kamili' : 'Full Address'}
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={sw ? 'Ingiza anwani yako kamili' : 'Enter your full address'}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#065F46]/20 focus:border-[#065F46] resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {sw ? 'Tarehe ya Kuzaliwa' : 'Date of Birth'}
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#065F46]/20 focus:border-[#065F46]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {sw ? 'Uraia' : 'Nationality'}
              </label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#065F46]/20 focus:border-[#065F46]"
              >
                <option value="Tanzanian">Tanzanian</option>
                <option value="Kenyan">Kenyan</option>
                <option value="Ugandan">Ugandan</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {sw ? 'Uthibitisho wa Anwani' : 'Address Proof Document'}
              </p>
              <p className="text-xs text-gray-400 mb-2">
                {sw ? 'Bili ya umeme, maji, au bank statement' : 'Utility bill, water bill, or bank statement'}
              </p>
              {addressProofUrl ? (
                <div className="bg-green-50 rounded-lg p-3 flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700">{sw ? 'Imepakiwa' : 'Uploaded'}</span>
                </div>
              ) : (
                <button
                  onClick={() => simulateUpload(setAddressProofUrl, 'address-proof')}
                  className="bg-[#065F46] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto"
                >
                  <Upload className="w-4 h-4" /> {sw ? 'Pakia Hati' : 'Upload Document'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-[#065F46] mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {sw ? 'Kagua na Wasilisha' : 'Review & Submit'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {sw ? 'Hakiki taarifa zako kabla ya kuwasilisha' : 'Review your information before submitting'}
            </p>

            <div className="space-y-2">
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">{sw ? 'Aina ya Hati' : 'Document Type'}</span>
                <span className="text-sm font-medium text-gray-700">{DOC_TYPES.find(d => d.value === docType)?.label || docType}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">{sw ? 'Namba' : 'Number'}</span>
                <span className="text-sm font-medium text-gray-700">{docNumber || '-'}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">{sw ? 'Hati ya Mbele' : 'Front ID'}</span>
                <span className={`text-sm font-medium ${docFrontUrl ? 'text-green-600' : 'text-red-500'}`}>
                  {docFrontUrl ? '✓' : '✗'}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">{sw ? 'Hati ya Nyuma' : 'Back ID'}</span>
                <span className={`text-sm font-medium ${docBackUrl ? 'text-green-600' : 'text-red-500'}`}>
                  {docBackUrl ? '✓' : '✗'}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">{sw ? 'Selfie' : 'Selfie'}</span>
                <span className={`text-sm font-medium ${selfieUrl ? 'text-green-600' : 'text-red-500'}`}>
                  {selfieUrl ? '✓' : '✗'}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">{sw ? 'Anwani' : 'Address'}</span>
                <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{address || '-'}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">{sw ? 'Tarehe ya Kuzaliwa' : 'Date of Birth'}</span>
                <span className="text-sm font-medium text-gray-700">{dateOfBirth || '-'}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">{sw ? 'Uraia' : 'Nationality'}</span>
                <span className="text-sm font-medium text-gray-700">{nationality}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 mt-4">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700">
                  {sw ? 'Tamko' : 'Declaration'}
                </p>
                <p className="text-xs text-amber-600">
                  {sw
                    ? 'Ninathibitisha kuwa taarifa zote nilizowasilisha ni za kweli na sahihi.'
                    : 'I declare that all information I have provided is true and accurate.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !docNumber || !docFrontUrl || !selfieUrl}
              className="w-full bg-[#065F46] text-white py-3 rounded-xl font-medium disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  {sw ? 'Wasilisha kwa Uthibitisho' : 'Submit for Verification'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-4">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-medium flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              {sw ? 'Rudi' : 'Back'}
            </button>
          )}
          {currentStep < STEPS.length - 1 && (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex-1 bg-[#065F46] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-1"
            >
              {sw ? 'Endelea' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
