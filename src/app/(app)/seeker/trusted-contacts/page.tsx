'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Phone, Mail, Heart, UserCheck, Shield,
  MapPin, Bell, Trash2, Edit2, Share2, Eye, X, Check
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';

interface TrustedContactData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  relation: string;
  notifyOn: string[];
  canTrack: boolean;
  isActive: boolean;
  createdAt: string;
}

interface TripShareData {
  id: string;
  shareToken: string;
  contactId: string;
  contactName: string;
  contactRelation: string;
  sessionId: string;
  trackingUrl: string;
  expiresAt: string | null;
  isActive: boolean;
}

const RELATION_LABELS: Record<string, { en: string; sw: string; icon: typeof Heart }> = {
  family: { en: 'Family', sw: 'Familia', icon: Heart },
  friend: { en: 'Friend', sw: 'Rafiki', icon: Users },
  colleague: { en: 'Colleague', sw: 'Mwenzako', icon: UserCheck },
  other: { en: 'Other', sw: 'Mwingine', icon: Shield },
};

const RELATION_COLORS: Record<string, string> = {
  family: 'bg-pink-100 text-pink-700',
  friend: 'bg-blue-100 text-blue-700',
  colleague: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function TrustedContactsPage() {
  const { user, language } = useAuthStore();
  const sw = language === 'sw';
  const [contacts, setContacts] = useState<TrustedContactData[]>([]);
  const [shares, setShares] = useState<TripShareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<TrustedContactData | null>(null);
  const [activeTab, setActiveTab] = useState<'contacts' | 'tracking'>('contacts');

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRelation, setFormRelation] = useState('family');
  const [formCanTrack, setFormCanTrack] = useState(true);
  const [formNotifyOn, setFormNotifyOn] = useState<string[]>(['session_start', 'sos', 'offline']);

  const userId = user?.id;

  const fetchContacts = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/trusted-contacts?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch {
      // Silent
    }
  }, [userId]);

  const fetchShares = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/trip-shares?seekerId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setShares(data.shares || []);
      }
    } catch {
      // Silent
    }
  }, [userId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchContacts(), fetchShares()]);
      setLoading(false);
    };
    load();
  }, [fetchContacts, fetchShares]);

  const resetForm = () => {
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormRelation('family');
    setFormCanTrack(true);
    setFormNotifyOn(['session_start', 'sos', 'offline']);
    setEditingContact(null);
    setShowAddForm(false);
  };

  const handleSubmit = async () => {
    if (!userId || !formName || !formPhone) return;

    try {
      if (editingContact) {
        const res = await fetch('/api/trusted-contacts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingContact.id,
            userId: userId,
            name: formName,
            phone: formPhone,
            email: formEmail || null,
            relation: formRelation,
            notifyOn: formNotifyOn,
            canTrack: formCanTrack,
          }),
        });
        if (res.ok) fetchContacts();
      } else {
        const res = await fetch('/api/trusted-contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            name: formName,
            phone: formPhone,
            email: formEmail || null,
            relation: formRelation,
            notifyOn: formNotifyOn,
            canTrack: formCanTrack,
          }),
        });
        if (res.ok) fetchContacts();
      }
      resetForm();
    } catch {
      // Silent
    }
  };

  const deleteContact = async (id: string) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/trusted-contacts?id=${id}&userId=${userId}`, { method: 'DELETE' });
      if (res.ok) fetchContacts();
    } catch {
      // Silent
    }
  };

  const startEdit = (contact: TrustedContactData) => {
    setFormName(contact.name);
    setFormPhone(contact.phone);
    setFormEmail(contact.email || '');
    setFormRelation(contact.relation);
    setFormCanTrack(contact.canTrack);
    setFormNotifyOn(contact.notifyOn);
    setEditingContact(contact);
    setShowAddForm(true);
  };

  const toggleNotifyOn = (event: string) => {
    setFormNotifyOn((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const notifyEvents = [
    { key: 'session_start', label: sw ? 'Kipindi Kinaanza' : 'Session Starts' },
    { key: 'sos', label: sw ? 'Tahadhari ya SOS' : 'SOS Alert' },
    { key: 'offline', label: sw ? 'Nje ya Mtandao' : 'Goes Offline' },
    { key: 'session_end', label: sw ? 'Kipindi Kinaisha' : 'Session Ends' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#065F46] text-white p-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          {sw ? 'Watu wa Kuaminia' : 'Trusted Contacts'}
        </h1>
        <p className="text-[#34D399] text-sm mt-1">
          {sw ? 'Wasimamie watu unaowaamini kwa usalama wako' : 'Manage people you trust for your safety'}
        </p>
      </div>

      {/* Tabs */}
      <div className="p-4 flex gap-2">
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'contacts' ? 'bg-[#065F46] text-white' : 'bg-white text-gray-600 border'
          }`}
        >
          {sw ? 'Watendaji' : 'Contacts'} ({contacts.length})
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'tracking' ? 'bg-[#065F46] text-white' : 'bg-white text-gray-600 border'
          }`}
        >
          {sw ? 'Ufuatiliaji' : 'Tracking'} ({shares.length})
        </button>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : activeTab === 'contacts' ? (
        <div className="p-4 space-y-3">
          {/* Add button */}
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="w-full bg-[#065F46] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#065F46]/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {sw ? 'Ongeza Mtu wa Kuaminia' : 'Add Trusted Contact'}
          </button>

          {contacts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="font-medium text-gray-400">
                {sw ? 'Hakuna watu wa kuaminia bado' : 'No trusted contacts yet'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {sw ? 'Ongeza familia au marafiki ili wapate tahadhari za usalama' : 'Add family or friends to receive safety alerts'}
              </p>
            </div>
          ) : (
            contacts.map((contact) => {
              const relLabel = RELATION_LABELS[contact.relation] || RELATION_LABELS.other;
              const relColor = RELATION_COLORS[contact.relation] || RELATION_COLORS.other;
              const RelIcon = relLabel.icon;
              return (
                <div key={contact.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${relColor}`}>
                        <RelIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        <p className="text-xs text-gray-400">{sw ? relLabel.sw : relLabel.en}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(contact)} className="p-1.5 rounded-lg hover:bg-gray-100">
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button onClick={() => deleteContact(contact.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-xs bg-gray-50 px-2 py-1 rounded-full flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {contact.phone}
                    </span>
                    {contact.email && (
                      <span className="text-xs bg-gray-50 px-2 py-1 rounded-full flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {contact.email}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {contact.notifyOn.length} {sw ? 'taarifa' : 'notifications'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {contact.canTrack ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {sw ? 'Anafuatilia' : 'Tracking'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {sw ? 'Hafuatilii' : 'No tracking'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {shares.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="font-medium text-gray-400">
                {sw ? 'Hakuna viungo vya ufuatiliaji' : 'No tracking links yet'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {sw ? 'Viungo vya ufuatiliaji vitaundwa wakati wa kipindi' : 'Tracking links will be created during sessions'}
              </p>
            </div>
          ) : (
            shares.map((share) => (
              <div key={share.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{share.contactName}</p>
                    <p className="text-xs text-gray-400">
                      {sw ? 'Kipindi' : 'Session'}: {share.sessionId.slice(-6)}
                    </p>
                  </div>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                    {sw ? 'Hai' : 'Active'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={share.trackingUrl}
                    className="flex-1 bg-[#065F46] text-white py-2 rounded-xl text-sm font-medium text-center flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    {sw ? 'Fuatilia' : 'Track'}
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.origin + share.trackingUrl);
                    }}
                    className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <Share2 className="w-4 h-4" />
                    {sw ? 'Kopisha Kiungo' : 'Copy Link'}
                  </button>
                </div>
                {share.expiresAt && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    {sw ? 'Inaisha' : 'Expires'}: {new Date(share.expiresAt).toLocaleString(sw ? 'sw-TZ' : 'en-US')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingContact
                  ? sw ? 'Hariri Mtu wa Kuaminia' : 'Edit Trusted Contact'
                  : sw ? 'Ongeza Mtu wa Kuaminia' : 'Add Trusted Contact'}
              </h3>
              <button onClick={resetForm} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {sw ? 'Jina' : 'Name'} *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={sw ? 'Jina kamili' : 'Full name'}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#065F46]/20 focus:border-[#065F46]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {sw ? 'Simu' : 'Phone'} *
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+255 7XX XXX XXX"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#065F46]/20 focus:border-[#065F46]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {sw ? 'Barua Pepe' : 'Email'}
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder={sw ? 'Barua pepe (si lazima)' : 'Email (optional)'}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#065F46]/20 focus:border-[#065F46]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {sw ? 'Uhusiano' : 'Relation'}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(RELATION_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setFormRelation(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        formRelation === key
                          ? 'bg-[#065F46] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {sw ? label.sw : label.en}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {sw ? 'Arifu Kuhusu' : 'Notify About'}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {notifyEvents.map((evt) => (
                    <button
                      key={evt.key}
                      onClick={() => toggleNotifyOn(evt.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                        formNotifyOn.includes(evt.key)
                          ? 'bg-[#F59E0B] text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {formNotifyOn.includes(evt.key) && <Check className="w-3 h-3" />}
                      {evt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {sw ? 'Ruhusu Ufuatiliaji' : 'Allow Live Tracking'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {sw ? 'Mtu huyu ataweza kuona eneo lako' : 'This contact can see your live location'}
                  </p>
                </div>
                <button
                  onClick={() => setFormCanTrack(!formCanTrack)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    formCanTrack ? 'bg-[#065F46]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow ${
                    formCanTrack ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!formName || !formPhone}
                className="w-full bg-[#065F46] text-white py-3 rounded-xl font-medium disabled:opacity-50 hover:bg-[#065F46]/90 transition-colors"
              >
                {editingContact
                  ? sw ? 'Hifadhi Mabadiliko' : 'Save Changes'
                  : sw ? 'Ongeza Mtu' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
