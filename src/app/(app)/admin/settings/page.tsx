'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Brain, CreditCard, Shield, Bell, Save, Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// ── Section wrapper ──

function SettingsCard({
  icon: Icon,
  title,
  children,
  delay = 0,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay?: number;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden"
    >
      {/* Section header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#334155]">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}18` }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: accent }} />
        </div>
        <h2 className="text-[15px] font-bold text-white">{title}</h2>
      </div>

      {/* Section body */}
      <div className="px-6 py-5 space-y-5">{children}</div>
    </motion.div>
  );
}

// ── Toggle row ──

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#F1F5F9]">{label}</p>
        {description && (
          <p className="text-xs text-[#94A3B8] mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ── Number input row ──

function NumberRow({
  label,
  description,
  value,
  onChange,
  suffix,
  min = 0,
  max = 99999,
  step = 1,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#F1F5F9]">{label}</p>
        {description && (
          <p className="text-xs text-[#94A3B8] mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-28 h-9 bg-[#0F172A] border-[#475569] text-[#F1F5F9] text-sm rounded-lg text-right pr-3 focus:border-[#34D399] focus:ring-[#34D399]/20"
        />
        {suffix && (
          <span className="text-xs text-[#94A3B8] font-medium w-8">{suffix}</span>
        )}
      </div>
    </div>
  );
}

// ── Text input row ──

function TextInputRow({
  label,
  description,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-[#F1F5F9]">{label}</p>
        {description && (
          <p className="text-xs text-[#94A3B8] mt-0.5">{description}</p>
        )}
      </div>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 bg-[#0F172A] border-[#475569] text-[#F1F5F9] text-sm rounded-lg focus:border-[#34D399] focus:ring-[#34D399]/20"
      />
    </div>
  );
}

// ── Payment toggle with API key row ──

function PaymentToggleRow({
  label,
  checked,
  onCheckedChange,
  apiKey,
  onApiKeyChange,
  placeholder,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-[#F1F5F9]">{label}</p>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
      {checked && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-9 bg-[#0F172A] border-[#475569] text-[#F1F5F9] text-sm rounded-lg focus:border-[#34D399] focus:ring-[#34D399]/20"
          />
        </motion.div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// Main Page
// ══════════════════════════════════════

export default function AdminSettingsPage() {
  const router = useRouter();

  // ── Platform Configuration ──
  const [platformFee, setPlatformFee] = useState(15);
  const [minPayout, setMinPayout] = useState(10000);
  const [maxSession, setMaxSession] = useState(8);
  const [autoApproveGuides, setAutoApproveGuides] = useState(false);
  const [autoApproveVendors, setAutoApproveVendors] = useState(false);

  // ── AI Configuration ──
  const [aiTripPlanner, setAiPropertyPlanner] = useState(true);
  const [aiChatAssistant, setAiChatAssistant] = useState(true);
  const [aiPriceNegotiation, setAiPriceNegotiation] = useState(true);
  const [aiTranslation, setAiTranslation] = useState(true);
  const [aiGuideMatching, setAiGuideMatching] = useState(true);
  const [aiInsightsDashboard, setAiInsightsDashboard] = useState(true);
  const [aiTemperature, setAiTemperature] = useState([0.7]);

  // ── Payment Configuration ──
  const [mpesaEnabled, setMpesaEnabled] = useState(true);
  const [mpesaApiKey, setMpesaApiKey] = useState('');
  const [tigoEnabled, setTigoEnabled] = useState(false);
  const [tigoApiKey, setTigoApiKey] = useState('');
  const [airtelEnabled, setAirtelEnabled] = useState(false);
  const [airtelApiKey, setAirtelApiKey] = useState('');
  const [escrowPeriod, setEscrowPeriod] = useState(24);

  // ── Security ──
  const [twoFactorRequired, setTwoFactorRequired] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [ipWhitelist, setIpWhitelist] = useState('');

  // ── Notifications ──
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [slackWebhook, setSlackWebhook] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <button
          onClick={() => router.push('/admin')}
          className="w-9 h-9 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-white/60 hover:text-white hover:bg-[#334155] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold gradient-text-green">Platform Settings</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Configure your Chimbo Direct platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F59E0B] animate-pulse-dot" />
          <span className="text-xs font-medium text-[#F59E0B]">Live Config</span>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════
          Platform Configuration
          ══════════════════════════════════════ */}
      <SettingsCard icon={Settings} title="Platform Configuration" delay={0.05} accent="#34D399">
        <NumberRow
          label="Platform Fee (%)"
          description="Commission percentage taken from each transaction"
          value={platformFee}
          onChange={setPlatformFee}
          suffix="%"
          min={0}
          max={50}
        />
        <NumberRow
          label="Minimum Payout (TZS)"
          description="Minimum amount guides can request for withdrawal"
          value={minPayout}
          onChange={setMinPayout}
          min={0}
          step={1000}
        />
        <NumberRow
          label="Maximum Session Duration (hours)"
          description="Maximum allowed session length before auto-completion"
          value={maxSession}
          onChange={setMaxSession}
          suffix="hrs"
          min={1}
          max={24}
        />
        <ToggleRow
          label="Auto-approve Guides"
          description="Automatically verify new guide registrations"
          checked={autoApproveGuides}
          onCheckedChange={setAutoApproveGuides}
        />
        <ToggleRow
          label="Auto-approve Vendors"
          description="Automatically verify new vendor registrations"
          checked={autoApproveVendors}
          onCheckedChange={setAutoApproveVendors}
        />
      </SettingsCard>

      {/* ══════════════════════════════════════
          AI Configuration
          ══════════════════════════════════════ */}
      <SettingsCard icon={Brain} title="AI Configuration" delay={0.1} accent="#A78BFA">
        <ToggleRow
          label="AI Trip Planner"
          description="Enable intelligent trip planning for seekers"
          checked={aiTripPlanner}
          onCheckedChange={setAiPropertyPlanner}
        />
        <ToggleRow
          label="AI Chat Assistant"
          description="Enable 24/7 AI-powered chat support"
          checked={aiChatAssistant}
          onCheckedChange={setAiChatAssistant}
        />
        <ToggleRow
          label="AI Price Negotiation"
          description="Enable AI-assisted haggling and price negotiation"
          checked={aiPriceNegotiation}
          onCheckedChange={setAiPriceNegotiation}
        />
        <ToggleRow
          label="AI Translation"
          description="Enable real-time Swahili-English translation"
          checked={aiTranslation}
          onCheckedChange={setAiTranslation}
        />
        <ToggleRow
          label="AI Guide Matching"
          description="Enable AI-powered guide-seeker matching"
          checked={aiGuideMatching}
          onCheckedChange={setAiGuideMatching}
        />
        <ToggleRow
          label="AI Insights Dashboard"
          description="Enable AI-generated business insights and analytics"
          checked={aiInsightsDashboard}
          onCheckedChange={setAiInsightsDashboard}
        />

        {/* Temperature slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#F1F5F9]">AI Model Temperature</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Controls creativity vs. consistency (0 = deterministic, 1 = creative)
              </p>
            </div>
            <span className="text-sm font-bold text-[#A78BFA] tabular-nums min-w-[3ch] text-right">
              {aiTemperature[0].toFixed(1)}
            </span>
          </div>
          <Slider
            value={aiTemperature}
            onValueChange={setAiTemperature}
            min={0}
            max={1}
            step={0.1}
            className="w-full [&_[data-slot=slider-track]]:bg-[#334155] [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-[#7C3AED] [&_[data-slot=slider-range]]:to-[#A78BFA] [&_[data-slot=slider-thumb]]:border-[#A78BFA]"
          />
          <div className="flex justify-between text-[10px] text-[#64748B]">
            <span>Precise (0.0)</span>
            <span>Balanced (0.5)</span>
            <span>Creative (1.0)</span>
          </div>
        </div>
      </SettingsCard>

      {/* ══════════════════════════════════════
          Payment Configuration
          ══════════════════════════════════════ */}
      <SettingsCard icon={CreditCard} title="Payment Configuration" delay={0.15} accent="#22D3EE">
        <PaymentToggleRow
          label="M-Pesa Integration"
          checked={mpesaEnabled}
          onCheckedChange={setMpesaEnabled}
          apiKey={mpesaApiKey}
          onApiKeyChange={setMpesaApiKey}
          placeholder="Enter M-Pesa API key"
        />
        <PaymentToggleRow
          label="Tigo Pesa Integration"
          checked={tigoEnabled}
          onCheckedChange={setTigoEnabled}
          apiKey={tigoApiKey}
          onApiKeyChange={setTigoApiKey}
          placeholder="Enter Tigo Pesa API key"
        />
        <PaymentToggleRow
          label="Airtel Money Integration"
          checked={airtelEnabled}
          onCheckedChange={setAirtelEnabled}
          apiKey={airtelApiKey}
          onApiKeyChange={setAirtelApiKey}
          placeholder="Enter Airtel Money API key"
        />
        <NumberRow
          label="Escrow Holding Period (hours)"
          description="How long funds are held in escrow before release"
          value={escrowPeriod}
          onChange={setEscrowPeriod}
          suffix="hrs"
          min={1}
          max={168}
        />
      </SettingsCard>

      {/* ══════════════════════════════════════
          Security
          ══════════════════════════════════════ */}
      <SettingsCard icon={Shield} title="Security" delay={0.2} accent="#F87171">
        <ToggleRow
          label="Two-Factor Auth Required for Admins"
          description="Enforce 2FA for all admin accounts"
          checked={twoFactorRequired}
          onCheckedChange={setTwoFactorRequired}
        />
        <NumberRow
          label="Session Timeout (minutes)"
          description="Auto-logout after inactivity"
          value={sessionTimeout}
          onChange={setSessionTimeout}
          suffix="min"
          min={5}
          max={120}
        />
        <NumberRow
          label="Max Login Attempts"
          description="Account lockout after failed attempts"
          value={maxLoginAttempts}
          onChange={setMaxLoginAttempts}
          min={3}
          max={20}
        />
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-[#F1F5F9]">IP Whitelist</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              One IP address per line. Leave empty to allow all.
            </p>
          </div>
          <Textarea
            value={ipWhitelist}
            onChange={(e) => setIpWhitelist(e.target.value)}
            placeholder={"192.168.1.1\n10.0.0.1\n172.16.0.0/12"}
            className="w-full bg-[#0F172A] border-[#475569] text-[#F1F5F9] text-sm rounded-lg min-h-[100px] resize-y focus:border-[#F87171] focus:ring-[#F87171]/20 font-mono"
          />
        </div>
      </SettingsCard>

      {/* ══════════════════════════════════════
          Notifications
          ══════════════════════════════════════ */}
      <SettingsCard icon={Bell} title="Notifications" delay={0.25} accent="#FBBF24">
        <ToggleRow
          label="Email Notifications"
          description="Send email alerts for important events"
          checked={emailNotifications}
          onCheckedChange={setEmailNotifications}
        />
        <ToggleRow
          label="SMS Notifications"
          description="Send SMS alerts via mobile carriers"
          checked={smsNotifications}
          onCheckedChange={setSmsNotifications}
        />
        <ToggleRow
          label="Push Notifications"
          description="Send browser and mobile push notifications"
          checked={pushNotifications}
          onCheckedChange={setPushNotifications}
        />
        <TextInputRow
          label="Slack Integration"
          description="Webhook URL for Slack notifications"
          value={slackWebhook}
          onChange={setSlackWebhook}
          placeholder="https://hooks.slack.com/services/..."
          type="url"
        />
      </SettingsCard>

      {/* ── Save Button ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="sticky bottom-4 z-10"
      >
        <div className="bg-[#1E293B]/90 backdrop-blur-xl border border-[#334155] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {saved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-[#34D399]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">Settings saved!</span>
              </motion.div>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#065F46] to-[#059669] hover:from-[#059669] hover:to-[#34D399] text-white font-bold rounded-xl px-8 h-11 shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:scale-95"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save All Settings
              </div>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
