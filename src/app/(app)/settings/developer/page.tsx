'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  Webhook, Key, Plus, Trash2, Send, Eye, EyeOff, Copy,
  RefreshCw, CheckCircle, XCircle, Shield, Code, ExternalLink
} from 'lucide-react';

interface WebhookEndpoint {
  id: string;
  userId: string;
  url: string;
  events: string;
  secret: string;
  isActive: boolean;
  lastTriggered: string | null;
  failureCount: number;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  event: string;
  statusCode: number;
  success: boolean;
  retries: number;
  deliveredAt: string | null;
  createdAt: string;
}

interface ApiKey {
  id: string;
  name: string;
  apiKey: string;
  permissions: string;
  rateLimit: number;
  requestCount: number;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

const WEBHOOK_EVENTS = [
  'booking.created', 'booking.confirmed', 'booking.completed', 'booking.cancelled',
  'session.started', 'session.completed', 'session.disputed',
  'payment.received', 'payment.refunded', 'payment.escrow_released',
  'guide.verified', 'guide.online', 'guide.offline',
  'user.signup', 'review.submitted',
];

const API_PERMISSIONS = [
  'read_guides', 'read_sessions', 'read_bookings', 'read_payments',
  'write_bookings', 'write_reviews', 'read_prices', 'read_zones',
];

export default function DeveloperPage() {
  const { language, user } = useAuthStore();
  const sw = language === 'sw';

  const [activeTab, setActiveTab] = useState<'webhooks' | 'api-keys' | 'docs'>('webhooks');
  const [loading, setLoading] = useState(true);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, WebhookDelivery[]>>({});
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [whUrl, setWhUrl] = useState('');
  const [whEvents, setWhEvents] = useState<string[]>(['booking.created']);
  const [testingId, setTestingId] = useState<string | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showAddKey, setShowAddKey] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyPerms, setKeyPerms] = useState<string[]>(['read_guides', 'read_sessions']);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch(`/api/webhooks?userId=${user?.id || 'demo'}`);
      const data = await res.json();
      setWebhooks(data.endpoints || []);
    } catch (err) {
      console.error('Fetch webhooks error:', err);
    }
  }, [user?.id]);

  const fetchApiKeys = useCallback(async () => {
    try {
      const res = await fetch(`/api/developer/api-keys?userId=${user?.id || 'demo'}`);
      const data = await res.json();
      setApiKeys(data.keys || []);
    } catch (err) {
      console.error('Fetch API keys error:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    Promise.all([fetchWebhooks(), fetchApiKeys()]).finally(() => setLoading(false));
  }, [fetchWebhooks, fetchApiKeys]);

  const addWebhook = async () => {
    if (!whUrl) return;
    try {
      await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || 'demo', url: whUrl, events: whEvents }),
      });
      setShowAddWebhook(false);
      setWhUrl(''); setWhEvents(['booking.created']);
      fetchWebhooks();
    } catch (err) {
      console.error('Add webhook error:', err);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm(sw ? 'Futa webhook?' : 'Delete this webhook?')) return;
    try {
      await fetch(`/api/webhooks?id=${id}`, { method: 'DELETE' });
      fetchWebhooks();
    } catch (err) {
      console.error('Delete webhook error:', err);
    }
  };

  const testWebhook = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' });
      const data = await res.json();
      alert(data.success ? (sw ? 'Ukaguzi umefanikiwa!' : 'Test successful!') : (sw ? `Ukaguzi umeshindwa: ${data.statusCode}` : `Test failed: ${data.statusCode}`));
      // Load deliveries
      const delRes = await fetch(`/api/webhooks/${id}`);
      if (delRes.ok) {
        const delData = await delRes.json();
        setDeliveries(prev => ({ ...prev, [id]: delData.deliveries || [] }));
      }
    } catch (err) {
      console.error('Test webhook error:', err);
    } finally {
      setTestingId(null);
    }
  };

  const loadDeliveries = async (id: string) => {
    try {
      const res = await fetch(`/api/webhooks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDeliveries(prev => ({ ...prev, [id]: data.deliveries || [] }));
      }
    } catch (err) {
      console.error('Load deliveries error:', err);
    }
  };

  const addApiKey = async () => {
    if (!keyName) return;
    try {
      const res = await fetch('/api/developer/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'demo',
          name: keyName,
          permissions: keyPerms,
          rateLimit: 100,
        }),
      });
      const data = await res.json();
      setNewKeySecret(data.apiSecret || null);
      setShowAddKey(false);
      setKeyName(''); setKeyPerms(['read_guides', 'read_sessions']);
      fetchApiKeys();
    } catch (err) {
      console.error('Add API key error:', err);
    }
  };

  const revokeKey = async (id: string) => {
    if (!confirm(sw ? 'Futa ufunguo?' : 'Revoke this API key?')) return;
    try {
      await fetch(`/api/developer/api-keys?id=${id}`, { method: 'DELETE' });
      fetchApiKeys();
    } catch (err) {
      console.error('Revoke key error:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#065F46] flex items-center gap-2">
          <Code className="w-6 h-6" />
          {sw ? 'Mipangilio ya Msanidi' : 'Developer Settings'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {sw ? 'Simamia webhooks na funguo za API' : 'Manage webhooks, API keys & integrations'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'webhooks', label: sw ? 'Webhooks' : 'Webhooks', icon: Webhook },
          { key: 'api-keys', label: sw ? 'Funguo za API' : 'API Keys', icon: Key },
          { key: 'docs', label: sw ? 'Nyaraka' : 'Docs', icon: ExternalLink },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'webhooks' | 'api-keys' | 'docs')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-[#065F46] text-white shadow' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddWebhook(true)} className="kbtn flex items-center gap-1 px-4 py-2 bg-[#065F46] text-white rounded-lg text-sm hover:bg-[#065F46]/90">
              <Plus className="w-4 h-4" /> {sw ? 'Ongeza Webhook' : 'Add Webhook'}
            </button>
          </div>

          {/* Add Webhook Modal */}
          {showAddWebhook && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-[#065F46]">{sw ? 'Ongeza Webhook Mpya' : 'Add New Webhook'}</h3>
                <div>
                  <label className="text-sm font-medium text-gray-700">{sw ? 'URL ya Mwisho' : 'Endpoint URL'}</label>
                  <input value={whUrl} onChange={e => setWhUrl(e.target.value)} placeholder="https://your-app.com/api/webhook" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">{sw ? 'Matukio' : 'Events to Subscribe'}</label>
                  <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                    {WEBHOOK_EVENTS.map(evt => (
                      <label key={evt} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={whEvents.includes(evt)}
                          onChange={e => {
                            if (e.target.checked) setWhEvents([...whEvents, evt]);
                            else setWhEvents(whEvents.filter(e2 => e2 !== evt));
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="font-mono">{evt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddWebhook(false)} className="px-4 py-2 border rounded-lg text-sm">{sw ? 'Ghairi' : 'Cancel'}</button>
                  <button onClick={addWebhook} className="px-4 py-2 bg-[#065F46] text-white rounded-lg text-sm">{sw ? 'Ongeza' : 'Add'}</button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">{sw ? 'Hakuna webhooks' : 'No webhooks configured'}</div>
          ) : (
            <div className="space-y-3">
              {webhooks.map(wh => (
                <div key={wh.id} className="kcard p-4 bg-white rounded-xl border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${wh.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                      <span className="font-mono text-sm text-gray-700 truncate max-w-md">{wh.url}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => testWebhook(wh.id)} disabled={testingId === wh.id} className="px-2 py-1 text-xs border rounded hover:bg-gray-50 flex items-center gap-1">
                        <Send className="w-3 h-3" /> {testingId === wh.id ? '...' : (sw ? 'Jaribu' : 'Test')}
                      </button>
                      <button onClick={() => loadDeliveries(wh.id)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {sw ? 'Logi' : 'Log'}
                      </button>
                      <button onClick={() => deleteWebhook(wh.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {JSON.parse(wh.events || '[]').map((e: string) => (
                      <span key={e} className="px-1.5 py-0.5 bg-[#34D399]/20 text-[#065F46] rounded text-xs font-mono">{e}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{sw ? 'Ukosefu' : 'Failures'}: {wh.failureCount}</span>
                    {wh.lastTriggered && <span>{sw ? 'Mwisho' : 'Last'}: {new Date(wh.lastTriggered).toLocaleString()}</span>}
                  </div>
                  {deliveries[wh.id] && (
                    <div className="mt-3 border-t pt-3 space-y-1 max-h-32 overflow-y-auto">
                      <div className="text-xs font-medium text-gray-500 mb-1">{sw ? 'Historia ya Utoaji' : 'Delivery History'}</div>
                      {deliveries[wh.id].map(d => (
                        <div key={d.id} className="flex items-center gap-2 text-xs">
                          {d.success ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                          <span className="font-mono text-gray-500">{d.event}</span>
                          <span className="text-gray-400">{d.statusCode}</span>
                          <span className="text-gray-300 ml-auto">{new Date(d.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api-keys' && (
        <div className="space-y-4">
          {/* Show newly created secret */}
          {newKeySecret && (
            <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-[#F59E0B]" />
                <span className="font-bold text-[#92400E]">{sw ? 'Hifadhi siri hii!' : 'Save this secret now!'}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{sw ? 'Haitaonyeshwa tena.' : 'It won\'t be shown again.'}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white rounded text-xs font-mono break-all">{newKeySecret}</code>
                <button onClick={() => copyToClipboard(newKeySecret)} className="p-2 hover:bg-white rounded">
                  {copiedSecret ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
              <button onClick={() => setNewKeySecret(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-700">{sw ? 'Funga' : 'Dismiss'}</button>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={() => setShowAddKey(true)} className="kbtn flex items-center gap-1 px-4 py-2 bg-[#065F46] text-white rounded-lg text-sm hover:bg-[#065F46]/90">
              <Plus className="w-4 h-4" /> {sw ? 'Funguo Mpya' : 'New Key'}
            </button>
          </div>

          {showAddKey && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
                <h3 className="text-lg font-bold text-[#065F46]">{sw ? 'Funguo Mpya ya API' : 'New API Key'}</h3>
                <div>
                  <label className="text-sm font-medium text-gray-700">{sw ? 'Jina' : 'Name'}</label>
                  <input value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="Hotel Booking Integration" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">{sw ? 'Ruhusa' : 'Permissions'}</label>
                  <div className="grid grid-cols-2 gap-1">
                    {API_PERMISSIONS.map(p => (
                      <label key={p} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={keyPerms.includes(p)} onChange={e => {
                          if (e.target.checked) setKeyPerms([...keyPerms, p]);
                          else setKeyPerms(keyPerms.filter(pp => pp !== p));
                        }} className="rounded border-gray-300" />
                        <span className="font-mono">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddKey(false)} className="px-4 py-2 border rounded-lg text-sm">{sw ? 'Ghairi' : 'Cancel'}</button>
                  <button onClick={addApiKey} className="px-4 py-2 bg-[#065F46] text-white rounded-lg text-sm">{sw ? 'Unda' : 'Create'}</button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12 text-gray-400">{sw ? 'Hakuna funguo za API' : 'No API keys'}</div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map(k => (
                <div key={k.id} className="kcard p-4 bg-white rounded-xl border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#065F46]">{k.name}</div>
                      <div className="font-mono text-xs text-gray-500 mt-1">{k.apiKey}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${k.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {k.isActive ? (sw ? 'Hai' : 'Active') : (sw ? 'Imezimwa' : 'Revoked')}
                      </span>
                      <button onClick={() => revokeKey(k.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    {(JSON.parse(k.permissions || '[]') as string[]).map(p => (
                      <span key={p} className="px-1.5 py-0.5 bg-[#34D399]/10 text-[#065F46] rounded">{p}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{sw ? 'Maombi' : 'Requests'}: {k.requestCount}</span>
                    <span>{sw ? 'Kiwango' : 'Rate'}: {k.rateLimit}/min</span>
                    {k.lastUsedAt && <span>{sw ? 'Mwisho' : 'Last used'}: {new Date(k.lastUsedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Docs Tab */}
      {activeTab === 'docs' && (
        <div className="space-y-4">
          <div className="kcard p-6 bg-white rounded-xl border">
            <h3 className="text-lg font-bold text-[#065F46] mb-4">{sw ? 'Nyaraka za API' : 'API Documentation'}</h3>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-[#065F46] mb-2">{sw ? 'Matukio ya Webhook' : 'Webhook Events'}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left px-2 py-1">Event</th><th className="text-left px-2 py-1">{sw ? 'Maelezo' : 'Description'}</th></tr></thead>
                    <tbody>
                      {WEBHOOK_EVENTS.slice(0, 8).map(evt => (
                        <tr key={evt} className="border-b last:border-0"><td className="px-2 py-1 font-mono text-xs">{evt}</td><td className="px-2 py-1 text-gray-600">Triggered when {evt.replace('.', ' ')}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-[#065F46] mb-2">{sw ? 'Muundo wa Payload' : 'Payload Schema'}</h4>
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "event": "booking.created",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "bookingId": "clx...",
    "seekerId": "clx...",
    "guideId": "clx...",
    "amount": 15000,
    "currency": "TZS"
  }
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-[#065F46] mb-2">{sw ? 'Uthibitisho wa Saini' : 'Signature Verification'}</h4>
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
{`// Verify webhook signature
const crypto = require('crypto');
function verify(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const computed = 'sha256=' + hmac.digest('hex');
  return computed === signature;
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-[#065F46] mb-2">{sw ? 'Ruhusa za API' : 'API Permissions'}</h4>
                <div className="space-y-1">
                  {API_PERMISSIONS.map(p => (
                    <div key={p} className="flex items-center gap-2 text-sm">
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{p}</code>
                      <span className="text-gray-500">— {p.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
