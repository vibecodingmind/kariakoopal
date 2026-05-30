'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  X,
  MapPin,
  Route,
  CheckCircle2,
  Package,
  Sparkles,
  Tag,
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
import { cn } from '@/lib/utils';

// ── Types ──

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  estimatedPrice: number;
  zoneId: string;
  checked: boolean;
}

interface ShoppingListProps {
  items?: ShoppingItem[];
  zones: { id: string; name: string; nameSw: string; nameKey: string; color: string }[];
  prices: { category: string; zoneId: string; min: number; max: number }[];
  language?: 'sw' | 'en';
  onItemsChange?: (items: ShoppingItem[]) => void;
  onOptimizeRoute?: (items: ShoppingItem[]) => void;
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

function getZoneColor(zones: ShoppingListProps['zones'], zoneId: string): string {
  const zone = zones.find((z) => z.id === zoneId);
  return zone?.color || '#f59e0b';
}

function getZoneName(zones: ShoppingListProps['zones'], zoneId: string, lang: Language): string {
  const zone = zones.find((z) => z.id === zoneId);
  if (!zone) return zoneId;
  return lang === 'sw' ? zone.nameSw : zone.name;
}

function getEstimatedPrice(prices: ShoppingListProps['prices'], category: string, zoneId: string): number {
  const price = prices.find((p) => p.category === category && p.zoneId === zoneId);
  return price ? Math.round((price.min + price.max) / 2) : 0;
}

// ── Component ──

export function ShoppingList({
  items: itemsProp,
  zones,
  prices,
  language: languageProp,
  onItemsChange,
  onOptimizeRoute,
  className,
}: ShoppingListProps) {
  const storeLanguage = useAuthStore((s) => s.language);
  const lang = languageProp || (storeLanguage as Language) || 'sw';

  // ── State ──
  const [internalItems, setInternalItems] = useState<ShoppingItem[]>([]);
  const items = itemsProp ?? internalItems;
  const setItems = itemsProp !== undefined
    ? (newItems: ShoppingItem[]) => onItemsChange?.(newItems)
    : setInternalItems;

  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('kanga');
  const [newItemZone, setNewItemZone] = useState(zones[0]?.id || '');

  // ── Computed ──
  const totalEstimated = useMemo(
    () => items.reduce((sum, item) => sum + item.estimatedPrice * item.quantity, 0),
    [items]
  );

  const checkedCount = useMemo(
    () => items.filter((item) => item.checked).length,
    [items]
  );

  // ── Handlers ──
  const handleAddItem = useCallback(() => {
    if (!newItemName.trim()) return;

    const estPrice = getEstimatedPrice(prices, newItemCategory, newItemZone);

    const newItem: ShoppingItem = {
      id: generateId(),
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: 1,
      estimatedPrice: estPrice,
      zoneId: newItemZone,
      checked: false,
    };

    const updated = [...items, newItem];
    setItems(updated);
    setNewItemName('');
  }, [newItemName, newItemCategory, newItemZone, prices, items, setItems]);

  const handleQuickAdd = useCallback(
    (catId: string) => {
      const catConfig = getCategoryConfig(catId);
      const estPrice = getEstimatedPrice(prices, catId, newItemZone);

      const newItem: ShoppingItem = {
        id: generateId(),
        name: lang === 'sw' ? catConfig.labelSw : catConfig.labelEn,
        category: catId,
        quantity: 1,
        estimatedPrice: estPrice,
        zoneId: newItemZone,
        checked: false,
      };

      const updated = [...items, newItem];
      setItems(updated);
    },
    [lang, newItemZone, prices, items, setItems]
  );

  const handleRemoveItem = useCallback(
    (id: string) => {
      const updated = items.filter((item) => item.id !== id);
      setItems(updated);
    },
    [items, setItems]
  );

  const handleToggleCheck = useCallback(
    (id: string) => {
      const updated = items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      setItems(updated);
    },
    [items, setItems]
  );

  const handleQuantityChange = useCallback(
    (id: string, delta: number) => {
      const updated = items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      );
      setItems(updated);
    },
    [items, setItems]
  );

  const handleMoveItem = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const idx = items.findIndex((item) => item.id === id);
      if (idx < 0) return;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= items.length) return;

      const updated = [...items];
      [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
      setItems(updated);
    },
    [items, setItems]
  );

  const handleOptimize = useCallback(() => {
    // Sort items by zone for optimal route
    const sorted = [...items].sort((a, b) => a.zoneId.localeCompare(b.zoneId));
    setItems(sorted);
    onOptimizeRoute?.(sorted);
  }, [items, setItems, onOptimizeRoute]);

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
              {t('shopping_list_title', lang)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {items.length > 0
                ? `${checkedCount}/${items.length} ${t('shopping_list_found', lang)}`
                : t('shopping_list_no_items', lang)}
          </p>
          </div>
        </div>
        {items.length > 0 && (
          <Badge variant="outline" className="text-[11px]">
            {formatTZS(totalEstimated)} TZS
          </Badge>
        )}
      </div>

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
              onClick={() => handleQuickAdd(cat.id)}
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
            className="glass-input h-9 text-sm"
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
          <Select value={newItemZone} onValueChange={setNewItemZone}>
            <SelectTrigger className="glass-input h-8 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {lang === 'sw' ? zone.nameSw : zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          {items.map((item, index) => {
            const catConfig = getCategoryConfig(item.category);
            const zoneColor = getZoneColor(zones, item.zoneId);

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
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                        style={{
                          backgroundColor: `${zoneColor}20`,
                          color: zoneColor,
                        }}
                      >
                        <MapPin className="size-2.5" />
                        {getZoneName(zones, item.zoneId, lang)}
                      </span>
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

                  {/* Reorder + Remove */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      className="size-5 rounded flex items-center justify-center hover:bg-muted/50 transition-colors disabled:opacity-30"
                      disabled={index === 0}
                      onClick={() => handleMoveItem(item.id, 'up')}
                      title={t('shopping_list_move_up', lang)}
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      className="size-5 rounded flex items-center justify-center hover:bg-muted/50 transition-colors disabled:opacity-30"
                      disabled={index === items.length - 1}
                      onClick={() => handleMoveItem(item.id, 'down')}
                      title={t('shopping_list_move_down', lang)}
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>

                  <button
                    className="size-5 rounded flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                    onClick={() => handleRemoveItem(item.id)}
                    title={t('shopping_list_remove', lang)}
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
          {/* Total */}
          <div className="glass rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm font-medium">{t('shopping_list_total', lang)}</span>
            <span className="text-lg font-bold gradient-text">
              {formatTZS(totalEstimated)} TZS
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-10 text-xs font-medium border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              onClick={handleOptimize}
            >
              <Route className="size-3.5 mr-1" />
              {t('shopping_list_optimize', lang)}
            </Button>
            <Button className="flex-1 h-10 text-xs font-semibold glass-button">
              <CheckCircle2 className="size-3.5 mr-1" />
              {t('shopping_list_add_session', lang)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
