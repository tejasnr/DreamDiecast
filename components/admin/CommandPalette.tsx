'use client';

import { useState, useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  ShoppingBag,
  Package,
  Users,
  ArrowRight,
  Plus,
  Loader2,
} from 'lucide-react';

export default function CommandPalette({
  onAddProduct,
}: {
  onAddProduct?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const workosUserId = user?.workosUserId;
  const hasQuery = debouncedSearch.length > 0;

  const orders = useQuery(
    api.search.searchOrders,
    hasQuery && workosUserId
      ? { query: debouncedSearch, workosUserId }
      : 'skip'
  );
  const products = useQuery(
    api.search.searchProducts,
    hasQuery && workosUserId
      ? { query: debouncedSearch, workosUserId }
      : 'skip'
  );
  const users = useQuery(
    api.search.searchUsers,
    hasQuery && workosUserId
      ? { query: debouncedSearch, workosUserId }
      : 'skip'
  );

  const isLoading = hasQuery && (orders === undefined || products === undefined || users === undefined);

  const handleSelect = useCallback(
    (action: () => void) => {
      setOpen(false);
      setSearch('');
      action();
    },
    []
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => {
          setOpen(false);
          setSearch('');
        }}
      />

      {/* Palette */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
        <Command
          className="bg-zinc-900 border border-white/10 rounded-sm shadow-2xl overflow-hidden"
          shouldFilter={false}
        >
          <div className="flex items-center gap-3 px-4 border-b border-white/10">
            <Search size={16} className="text-white/30" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search orders, products, customers..."
              className="flex-1 bg-transparent py-4 text-sm text-white placeholder:text-white/30 outline-none"
            />
            <kbd className="text-[8px] text-white/20 border border-white/10 px-1.5 py-0.5 rounded font-mono">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-white/30" />
              </div>
            )}

            {hasQuery && !isLoading && !orders?.length && !products?.length && !users?.length && (
              <Command.Empty className="py-6 text-center text-[10px] text-white/30 uppercase tracking-widest">
                No results for &quot;{search}&quot;
              </Command.Empty>
            )}

            {/* Quick Actions (always shown) */}
            {!hasQuery && (
              <Command.Group
                heading={
                  <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold px-2">
                    Quick Actions
                  </span>
                }
              >
                {onAddProduct && (
                  <Command.Item
                    onSelect={() => handleSelect(() => onAddProduct())}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer text-white/60 hover:bg-white/5 hover:text-white data-[selected=true]:bg-white/5 data-[selected=true]:text-white transition-colors"
                  >
                    <Plus size={14} className="text-accent" />
                    <span className="text-xs">Add New Product</span>
                    <ArrowRight size={12} className="ml-auto text-white/20" />
                  </Command.Item>
                )}
                <Command.Item
                  onSelect={() => handleSelect(() => router.push('/admin/campaigns'))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer text-white/60 hover:bg-white/5 hover:text-white data-[selected=true]:bg-white/5 data-[selected=true]:text-white transition-colors"
                >
                  <Package size={14} className="text-accent" />
                  <span className="text-xs">Go to Campaigns</span>
                  <ArrowRight size={12} className="ml-auto text-white/20" />
                </Command.Item>
                <Command.Item
                  onSelect={() => handleSelect(() => router.push('/admin/orders'))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer text-white/60 hover:bg-white/5 hover:text-white data-[selected=true]:bg-white/5 data-[selected=true]:text-white transition-colors"
                >
                  <ShoppingBag size={14} className="text-accent" />
                  <span className="text-xs">Go to Orders</span>
                  <ArrowRight size={12} className="ml-auto text-white/20" />
                </Command.Item>
                <Command.Item
                  onSelect={() => handleSelect(() => router.push('/admin/fulfillment'))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer text-white/60 hover:bg-white/5 hover:text-white data-[selected=true]:bg-white/5 data-[selected=true]:text-white transition-colors"
                >
                  <Package size={14} className="text-accent" />
                  <span className="text-xs">Go to Fulfillment</span>
                  <ArrowRight size={12} className="ml-auto text-white/20" />
                </Command.Item>
              </Command.Group>
            )}

            {/* Orders */}
            {orders && orders.length > 0 && (
              <Command.Group
                heading={
                  <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold px-2">
                    Orders
                  </span>
                }
              >
                {orders.map((o) => (
                  <Command.Item
                    key={o._id}
                    onSelect={() => handleSelect(() => router.push('/admin/orders'))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer text-white/60 hover:bg-white/5 hover:text-white data-[selected=true]:bg-white/5 data-[selected=true]:text-white transition-colors"
                  >
                    <ShoppingBag size={14} className="text-blue-400" />
                    <span className="text-xs font-mono">#{o._id.slice(-6)}</span>
                    <span className="text-[10px] text-white/40 truncate">{o.userEmail}</span>
                    <span className="ml-auto text-xs text-accent font-bold">
                      ₹{o.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Products */}
            {products && products.length > 0 && (
              <Command.Group
                heading={
                  <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold px-2">
                    Products
                  </span>
                }
              >
                {products.map((p) => (
                  <Command.Item
                    key={p._id}
                    onSelect={() => handleSelect(() => router.push('/admin?tab=products'))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer text-white/60 hover:bg-white/5 hover:text-white data-[selected=true]:bg-white/5 data-[selected=true]:text-white transition-colors"
                  >
                    <Package size={14} className="text-amber-400" />
                    <span className="text-xs truncate">{p.name}</span>
                    {p.sku && (
                      <span className="text-[10px] text-white/30 font-mono">{p.sku}</span>
                    )}
                    <span className="ml-auto text-[10px] text-white/30">{p.brand}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Customers */}
            {users && users.length > 0 && (
              <Command.Group
                heading={
                  <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold px-2">
                    Customers
                  </span>
                }
              >
                {users.map((u) => (
                  <Command.Item
                    key={u._id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer text-white/60 hover:bg-white/5 hover:text-white data-[selected=true]:bg-white/5 data-[selected=true]:text-white transition-colors"
                  >
                    <Users size={14} className="text-green-400" />
                    <span className="text-xs">{u.name}</span>
                    <span className="text-[10px] text-white/40">{u.email}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
