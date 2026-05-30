'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  MapPin,
  CheckCircle2,
  Package,
  Sparkles,
  Tag,
  Copy,
  Check,
  Download,
  Share2,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { priceRadarApi, zonesApi, shoppingListsApi, type PriceRadarEntry, type Zone, type ShoppingListData } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Types ──

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  estimatedPrice: number;
  zone: string;
  category: string;
  checked: boolean;
}

interface ShoppingListBuilderProps {
  className?: string;
}

// ── Helpers ──

function formatTZS(n: number): string {
  return n.toLocaleString('en-TZ');
}

let idCounter = 0;
function generateId(): string {
  return `item-${Date.now()}-${++idCounter}`;
}

const STORAGE_KEY = 'kariako-shopping-lists';
const ACTIVE_LIST_KEY = 'kariako-active-list-id';

interface SavedList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: string;
  updatedAt: string;
}

// ── Category config ──

const categoryOptions: { id: string; emoji: string; labelSw: string; labelEn: string; color: string }[] = [
  { id: 'kanga', emoji: '🧶', labelSw: 'Kanga', labelEn: 'Kanga', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
  { id: 'fabric', emoji: '👔', labelSw: 'Vitambaa', labelEn: 'Fabric', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  { id: 'electronics', emoji: '📱', labelSw: 'Elektroniki', labelEn: 'Electronics', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  { id: 'spices', emoji: '🌶️', labelSw: 'Viungo', labelEn: 'Spices', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { id: 'vyombo', emoji: '🥘', labelSw: 'Vyombo', labelEn: 'Utensils', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { id: 'wholesale', emoji: '📦', labelSw: 'Jumla', labelEn: 'Wholesale', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
];

function getCategoryConfig(catId: string) {
  return categoryOptions.find((c) => c.id === catId) || categoryOptions[0];
}

// ── Zone suggestions by category ──

function suggestZone(category: string, priceData: PriceRadarEntry[]): string {
  // Find the zone with the best (lowest average) prices for this category
  const categoryEntries = priceData.filter((p) => p.category === category);
  if (categoryEntries.length === 0) return '';
  const bestEntry = categoryEntries.reduce((best, entry) =>
    entry.priceMax < best.priceMax ? entry : best
  );
  return bestEntry.zoneId;
}

// ── Component ──

export function ShoppingListBuilder({ className }: ShoppingListBuilderProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = (storeLanguage as Language) || 'sw';
  const userId = useAuthStore((s) => s.user?.id) || '';

  // ── Load initial data from localStorage lazily ──
  const loadInitialLists = (): SavedList[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* noop */ }
    return [];
  };

  const loadInitialActiveListId = (): string | null => {
    try {
      return localStorage.getItem(ACTIVE_LIST_KEY);
    } catch { /* noop */ }
    return null;
  };

  const loadInitialItems = (initialLists: SavedList[], initialActiveId: string | null): ShoppingItem[] => {
    if (!initialActiveId) return [];
    const activeList = initialLists.find((l) => l.id === initialActiveId);
    return activeList?.items ?? [];
  };

  const initialLists = loadInitialLists();
  const initialActiveId = loadInitialActiveListId();
  const initialItems = loadInitialItems(initialLists, initialActiveId);

  // ── State ──
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [zones, setZones] = useState<Zone[]>([]);
  const [priceData, setPriceData] = useState<PriceRadarEntry[]>([]);
  const [savedLists, setSavedLists] = useState<SavedList[]>(initialLists);
  const [activeListId, setActiveListId] = useState<string | null>(initialActiveId);
  const [showSavedLists, setShowSavedLists] = useState(false);
  // Map from local list IDs to API list IDs
  const [apiListIdMap, setApiListIdMap] = useState<Map<string, string>>(new Map());

  // Form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemZone, setNewItemZone] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('kanga');

  // Toast state
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // ── Map API list to local type ──
  const mapApiListToLocal = useCallback((apiList: ShoppingListData): SavedList => {
    const apiItems: ShoppingItem[] = (apiList.items || []).map((i, idx) => ({
      id: `item-${apiList.id}-${idx}`,
      name: i.name,
      quantity: i.quantity,
      estimatedPrice: i.price,
      zone: i.zone,
      category: i.category,
      checked: i.purchased,
    }));
    return {
      id: apiList.id,
      name: apiList.name,
      items: apiItems,
      createdAt: apiList.createdAt,
      updatedAt: apiList.updatedAt,
    };
  }, []);

  // ── Map local items to API items format ──
  const mapLocalItemsToApi = useCallback((localItems: ShoppingItem[]) => {
    return localItems.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.estimatedPrice,
      category: i.category,
      zone: i.zone,
      purchased: i.checked,
    }));
  }, []);

  // ── Load data ──
  useEffect(() => {
    async function loadData() {
      try {
        const [zoneResult, priceResult] = await Promise.all([
          zonesApi.list(),
          priceRadarApi.list(),
        ]);
        setZones(zoneResult);
        setPriceData(priceResult);
        if (zoneResult.length > 0 && !newItemZone) {
          setNewItemZone(zoneResult[0].id);
        }
      } catch {
        // API not available
      }

      // Load shopping lists from API
      if (userId) {
        try {
          const listResult = await shoppingListsApi.list({ userId });
          if (listResult.items && listResult.items.length > 0) {
            const mapped: SavedList[] = listResult.items.map(mapApiListToLocal);
            const idMap = new Map<string, string>();
            listResult.items.forEach((apiList) => {
              const local = mapped.find((m) => m.name === apiList.name && m.createdAt === apiList.createdAt);
              if (local) idMap.set(local.id, apiList.id);
            });
            setSavedLists(mapped);
            setApiListIdMap(idMap);
            // Auto-load the most recent list
            if (!activeListId && mapped.length > 0) {
              const latest = mapped[0];
              setItems(latest.items);
              setActiveListId(latest.id);
              try {
                localStorage.setItem(ACTIVE_LIST_KEY, latest.id);
              } catch { /* noop */ }
            }
          }
        } catch {
          // API not available, keep localStorage data
        }
      }
    }
    loadData();
  }, [userId]);

  // ── Auto-suggest zone when category changes (computed, not effect) ──
  const autoSuggestedZone = useMemo(
    () => (priceData.length > 0 ? suggestZone(newItemCategory, priceData) : ''),
    [newItemCategory, priceData]
  );

  // ── Auto-fill estimated price from price radar ──
  const estimatedPriceForCategory = useMemo(() => {
    const zoneId = newItemZone || autoSuggestedZone;
    const entry = priceData.find(
      (p) => p.category === newItemCategory && p.zoneId === zoneId
    );
    if (entry) return Math.round((entry.priceMin + entry.priceMax) / 2);
    return 0;
  }, [newItemCategory, newItemZone, autoSuggestedZone, priceData]);

  // ── Computed ──
  const totalEstimated = useMemo(
    () => items.reduce((sum, item) => sum + item.estimatedPrice * item.quantity, 0),
    [items]
  );

  const checkedTotal = useMemo(
    () =>
      items
        .filter((item) => item.checked)
        .reduce((sum, item) => sum + item.estimatedPrice * item.quantity, 0),
    [items]
  );

  const checkedCount = useMemo(
    () => items.filter((item) => item.checked).length,
    [items]
  );

  const getZoneName = useCallback(
    (zoneId: string): string => {
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return zoneId;
      return lang === 'sw' ? zone.nameSw : zone.name;
    },
    [zones, lang]
  );

  // ── Handlers ──
  const handleAddItem = useCallback(() => {
    if (!newItemName.trim()) return;

    const price = parseFloat(newItemPrice) || estimatedPriceForCategory || 0;
    const zone = newItemZone || autoSuggestedZone || '';

    const newItem: ShoppingItem = {
      id: generateId(),
      name: newItemName.trim(),
      quantity: parseInt(newItemQuantity) || 1,
      estimatedPrice: price,
      zone,
      category: newItemCategory,
      checked: false,
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemQuantity('1');
    setNewItemPrice('');
  }, [newItemName, newItemQuantity, newItemPrice, newItemZone, newItemCategory, estimatedPriceForCategory, autoSuggestedZone]);

  const handleQuickAdd = useCallback(
    (catId: string) => {
      const catConfig = getCategoryConfig(catId);
      const zone = autoSuggestedZone || newItemZone || '';
      const entry = priceData.find((p) => p.category === catId && p.zoneId === zone);
      const price = entry ? Math.round((entry.priceMin + entry.priceMax) / 2) : 0;

      const newItem: ShoppingItem = {
        id: generateId(),
        name: lang === 'sw' ? catConfig.labelSw : catConfig.labelEn,
        quantity: 1,
        estimatedPrice: price,
        zone,
        category: catId,
        checked: false,
      };

      setItems((prev) => [...prev, newItem]);
    },
    [lang, autoSuggestedZone, newItemZone, priceData]
  );

  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleToggleCheck = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }, []);

  const handleQuantityChange = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  }, []);

  const handleSaveList = useCallback(async () => {
    const listName = lang === 'sw'
      ? `Orodha ya ${new Date().toLocaleDateString('sw')}`
      : `List ${new Date().toLocaleDateString()}`;

    const list: SavedList = {
      id: activeListId || `list-${Date.now()}`,
      name: listName,
      items,
      createdAt: activeListId ? (savedLists.find((l) => l.id === activeListId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedLists = activeListId
      ? savedLists.map((l) => (l.id === activeListId ? list : l))
      : [...savedLists, list];

    setSavedLists(updatedLists);
    setActiveListId(list.id);

    // Save to localStorage as cache
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLists));
      localStorage.setItem(ACTIVE_LIST_KEY, list.id);
    } catch {
      // localStorage not available
    }

    // Save to API
    if (userId) {
      try {
        const apiItems = mapLocalItemsToApi(items);
        const existingApiId = apiListIdMap.get(list.id) || (activeListId ? apiListIdMap.get(activeListId) : null);

        if (existingApiId) {
          // Update existing list
          await shoppingListsApi.update(existingApiId, { name: listName, items: apiItems });
        } else {
          // Create new list
          const result = await shoppingListsApi.create({ userId, name: listName, items: apiItems });
          if (result.item) {
            setApiListIdMap((prev) => {
              const next = new Map(prev);
              next.set(list.id, result.item.id);
              return next;
            });
          }
        }
      } catch {
        // API save failed, localStorage is the fallback
      }
    }

    setSaveMessage(lang === 'sw' ? 'Imehifadhiwa!' : 'Saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  }, [items, activeListId, savedLists, lang, userId, apiListIdMap, mapLocalItemsToApi]);

  const handleLoadList = useCallback((list: SavedList) => {
    setItems(list.items);
    setActiveListId(list.id);
    setShowSavedLists(false);
    try {
      localStorage.setItem(ACTIVE_LIST_KEY, list.id);
    } catch {
      // localStorage not available
    }
  }, []);

  const handleNewList = useCallback(() => {
    setItems([]);
    setActiveListId(null);
    try {
      localStorage.removeItem(ACTIVE_LIST_KEY);
    } catch {
      // localStorage not available
    }
  }, []);

  const handleShareList = useCallback(async () => {
    const lines = items.map(
      (item) =>
        `${item.checked ? '✅' : '⬜'} ${item.name} x${item.quantity} — ${formatTZS(item.estimatedPrice * item.quantity)} TZS${item.zone ? ` (${getZoneName(item.zone)})` : ''}`
    );
    const total = `\n${lang === 'sw' ? 'Jumla' : 'Total'}: ${formatTZS(totalEstimated)} TZS`;
    const text = `${lang === 'sw' ? '🛒 Orodha ya Ununuzi - Kariako Guide' : '🛒 Shopping List - Kariako Guide'}\n\n${lines.join('\n')}${total}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [items, totalEstimated, lang, getZoneName]);

  const handleExportText = useCallback(() => {
    const lines = items.map(
      (item) =>
        `${item.checked ? '[x]' : '[ ]'} ${item.name} x${item.quantity} @ ${formatTZS(item.estimatedPrice)} = ${formatTZS(item.estimatedPrice * item.quantity)} TZS${item.zone ? ` | Zone: ${getZoneName(item.zone)}` : ''}`
    );
    const header = lang === 'sw' ? 'ORODHA YA UNUNUZI - KARIKO GUIDE' : 'SHOPPING LIST - KARIKO GUIDE';
    const total = `${lang === 'sw' ? 'JUMLA' : 'TOTAL'}: ${formatTZS(totalEstimated)} TZS`;
    const checked = `${lang === 'sw' ? 'Imenunuliwa' : 'Purchased'}: ${formatTZS(checkedTotal)} TZS (${checkedCount}/${items.length})`;
    const text = `${header}\n${'='.repeat(40)}\n\n${lines.join('\n')}\n\n${'─'.repeat(40)}\n${total}\n${checked}`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kariako-shopping-list-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [items, totalEstimated, checkedTotal, checkedCount, lang, getZoneName]);

  // ── Render ──
  return (
    <div className={cn('glass-card gradient-border p-5 space-y-4', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShoppingCart className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm gradient-text">
              {lang === 'sw' ? 'Jenga Orodha ya Ununuzi' : 'Shopping List Builder'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {items.length > 0
                ? `${checkedCount}/${items.length} ${lang === 'sw' ? 'imenunuliwa' : 'purchased'}`
                : lang === 'sw' ? 'Angeza bidhaa unazohitaji' : 'Add items you need'}
            </p>
          </div>
        </div>
        {items.length > 0 && (
          <Badge variant="outline" className="text-[11px]">
            {formatTZS(totalEstimated)} TZS
          </Badge>
        )}
      </div>

      {/* ── Save/Load Controls ── */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-[11px] font-medium border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          onClick={handleSaveList}
          disabled={items.length === 0}
        >
          <Save className="size-3 mr-1" />
          {saveMessage || (lang === 'sw' ? 'Hifadhi' : 'Save')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-[11px] font-medium border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          onClick={() => setShowSavedLists(!showSavedLists)}
        >
          <RotateCcw className="size-3 mr-1" />
          {lang === 'sw' ? 'Pakia' : 'Load'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[11px] font-medium border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 px-2"
          onClick={handleNewList}
        >
          <Plus className="size-3" />
        </Button>
      </div>

      {/* ── Saved Lists Panel ── */}
      {showSavedLists && (
        <div className="glass rounded-xl p-3 space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground">
            {lang === 'sw' ? 'Orodha zilizohifadhiwa' : 'Saved Lists'}
          </p>
          {savedLists.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-2 text-center">
              {lang === 'sw' ? 'Hakuna orodha iliyohifadhiwa' : 'No saved lists'}
            </p>
          ) : (
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
              {savedLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleLoadList(list)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] transition-colors hover:bg-amber-50/50 dark:hover:bg-amber-900/10',
                    list.id === activeListId && 'ring-1 ring-amber-300 dark:ring-amber-700'
                  )}
                >
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium truncate">{list.name}</p>
                    <p className="text-muted-foreground">
                      {list.items.length} {lang === 'sw' ? 'bidhaa' : 'items'} • {formatTZS(list.items.reduce((s, i) => s + i.estimatedPrice * i.quantity, 0))} TZS
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0 text-red-400 hover:text-red-500 shrink-0"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const updated = savedLists.filter((l) => l.id !== list.id);
                      setSavedLists(updated);
                      try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                      } catch { /* noop */ }
                      // Delete from API
                      const apiId = apiListIdMap.get(list.id);
                      if (apiId && userId) {
                        try {
                          await shoppingListsApi.delete(apiId);
                          setApiListIdMap((prev) => {
                            const next = new Map(prev);
                            next.delete(list.id);
                            return next;
                          });
                        } catch {
                          // API delete failed
                        }
                      }
                      if (list.id === activeListId) handleNewList();
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Quick-add buttons ── */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
          <Sparkles className="size-3 text-amber-500" />
          {t('shopping_list_quick_add', lang)}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {categoryOptions.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setNewItemCategory(cat.id);
                handleQuickAdd(cat.id);
              }}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all duration-200 hover:scale-105',
                'border-border/50 hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-900/10',
                cat.color
              )}
            >
              {cat.emoji} {lang === 'sw' ? cat.labelSw : cat.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* ── Add item form ── */}
      <div className="glass rounded-xl p-3 space-y-2.5">
        <div className="flex gap-2">
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={t('shopping_list_item_name', lang)}
            className="glass-input h-9 text-sm flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <Button
            size="sm"
            className="shrink-0 glass-button h-9 px-3"
            onClick={handleAddItem}
            disabled={!newItemName.trim()}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          {/* Quantity */}
          <div className="w-20">
            <Input
              type="number"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              placeholder={lang === 'sw' ? 'Kiasi' : 'Qty'}
              className="glass-input h-8 text-xs"
              min="1"
            />
          </div>
          {/* Price */}
          <div className="flex-1">
            <Input
              type="number"
              value={newItemPrice || (estimatedPriceForCategory ? estimatedPriceForCategory.toString() : '')}
              onChange={(e) => setNewItemPrice(e.target.value)}
              placeholder={`${lang === 'sw' ? 'Bei' : 'Price'}${estimatedPriceForCategory ? ` (~${formatTZS(estimatedPriceForCategory)})` : ''}`}
              className="glass-input h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {/* Category */}
          <Select value={newItemCategory} onValueChange={setNewItemCategory}>
            <SelectTrigger className="glass-input h-8 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.emoji} {lang === 'sw' ? cat.labelSw : cat.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Zone */}
          <div className="flex-1 relative">
            <Select value={newItemZone || autoSuggestedZone} onValueChange={setNewItemZone}>
              <SelectTrigger className="glass-input h-8 text-xs">
                <SelectValue placeholder={lang === 'sw' ? 'Chagua eneo' : 'Select zone'} />
              </SelectTrigger>
              <SelectContent>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {lang === 'sw' ? zone.nameSw : zone.name}
                    {autoSuggestedZone === zone.id && ' ⭐'}
                  </SelectItem>
                ))}
                {zones.length === 0 && (
                  <>
                    <SelectItem value="zone-vyombo">⭐ Vyombo / Utensils</SelectItem>
                    <SelectItem value="zone-fabric">Vitambaa / Fabric</SelectItem>
                    <SelectItem value="zone-electronics">Elektroniki / Electronics</SelectItem>
                    <SelectItem value="zone-spices">⭐ Viungo / Spices</SelectItem>
                    <SelectItem value="zone-wholesale">⭐ Jumla / Wholesale</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            {autoSuggestedZone && (
              <p className="text-[9px] text-amber-500 mt-0.5 pl-1">
                {lang === 'sw' ? '⭐ Eneo lililopendekezwa' : '⭐ Suggested zone'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Items list ── */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Package className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {t('shopping_list_empty_desc', lang)}
          </p>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {items.map((item) => {
            const catConfig = getCategoryConfig(item.category);

            return (
              <div
                key={item.id}
                className={cn(
                  'glass rounded-xl p-3 transition-all duration-200',
                  item.checked && 'opacity-60'
                )}
              >
                <div className="flex items-start gap-2.5">
                  {/* Checkbox */}
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => handleToggleCheck(item.id)}
                    className="mt-0.5 shrink-0"
                  />

                  {/* Item details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={cn(
                          'text-sm font-medium truncate',
                          item.checked && 'line-through'
                        )}
                      >
                        {item.name}
                      </span>
                      <Badge
                        className={cn(
                          'text-[10px] px-1.5 py-0 border shrink-0',
                          catConfig.color
                        )}
                      >
                        {catConfig.emoji}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {/* Zone tag */}
                      {item.zone && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                          <MapPin className="size-2.5" />
                          {getZoneName(item.zone)}
                        </span>
                      )}
                      {/* Price */}
                      <span className="flex items-center gap-0.5">
                        <Tag className="size-2.5" />
                        {formatTZS(item.estimatedPrice * item.quantity)} TZS
                      </span>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      className="size-6 rounded-md glass flex items-center justify-center hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
                      onClick={() => handleQuantityChange(item.id, -1)}
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      className="size-6 rounded-md glass flex items-center justify-center hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
                      onClick={() => handleQuantityChange(item.id, 1)}
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  <button
                    className="size-5 rounded flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Total + actions ── */}
      {items.length > 0 && (
        <div className="space-y-3 pt-1">
          {/* Total breakdown */}
          <div className="glass rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('shopping_list_total', lang)}</span>
              <span className="text-lg font-bold gradient-text">
                {formatTZS(totalEstimated)} TZS
              </span>
            </div>
            {checkedCount > 0 && (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-emerald-500" />
                  {lang === 'sw' ? 'Imenunuliwa' : 'Purchased'}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {formatTZS(checkedTotal)} TZS ({checkedCount}/{items.length})
                </span>
              </div>
            )}
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-[11px] font-medium border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              onClick={handleShareList}
            >
              {copied ? (
                <Check className="size-3 mr-1 text-emerald-500" />
              ) : (
                <Share2 className="size-3 mr-1" />
              )}
              {copied
                ? t('copied', lang)
                : lang === 'sw' ? 'Shiriki' : 'Share'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-[11px] font-medium border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              onClick={handleExportText}
            >
              <Download className="size-3 mr-1" />
              {lang === 'sw' ? 'Hamisha' : 'Export'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-[11px] font-medium border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              onClick={handleSaveList}
            >
              <Save className="size-3 mr-1" />
              {saveMessage || (lang === 'sw' ? 'Hifadhi' : 'Save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
