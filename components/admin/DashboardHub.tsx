'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  AlertCircle,
  ShoppingBag,
  Truck,
  Megaphone,
  TrendingUp,
  IndianRupee,
  Lock,
  BarChart3,
} from 'lucide-react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function MetricCardSkeleton() {
  return (
    <div className="border border-white/10 p-6 animate-pulse">
      <div className="h-3 w-20 bg-white/10 rounded mb-4" />
      <div className="h-8 w-32 bg-white/10 rounded" />
    </div>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="border border-white/10 p-6 space-y-4 animate-pulse">
      <div className="h-4 w-40 bg-white/10 rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-white/10 rounded" />
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="border border-white/10 hover:border-white/20 p-6 transition-all group">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-accent" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          {label}
        </span>
      </div>
      <p className="text-3xl font-display font-bold tracking-tight">{value}</p>
    </div>
  );
}

export default function DashboardHub({ workosUserId }: { workosUserId: string }) {
  const metrics = useQuery(api.analytics.getDashboardMetrics, { workosUserId });
  const alerts = useQuery(api.analytics.getAlerts, { workosUserId });
  const topPerformers = useQuery(api.analytics.getTopPerformers, {
    workosUserId,
    limit: 5,
  });

  const pendingOrdersCount =
    useQuery(api.orders.countPendingVerification) ?? 0;

  return (
    <div className="space-y-8">
      {/* Financial Pulse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics === undefined ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              label="Total Revenue"
              value={formatCurrency(metrics.totalRevenue)}
              icon={IndianRupee}
            />
            <MetricCard
              label="Locked Dues"
              value={formatCurrency(metrics.lockedDues)}
              icon={Lock}
            />
            <MetricCard
              label="Avg Order Value"
              value={formatCurrency(metrics.averageOrderValue)}
              icon={BarChart3}
            />
            <MetricCard
              label="Total Orders"
              value={metrics.totalOrders.toLocaleString('en-IN')}
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      {/* Alerts + Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        {alerts === undefined ? (
          <ListSkeleton rows={3} />
        ) : (
          <div className="border border-white/10 p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
              <AlertTriangle size={14} className="text-accent" /> Attention
              Required
            </h3>
            {alerts.length === 0 ? (
              <p className="text-white/30 text-sm font-mono">
                All clear — no issues right now.
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 border-l-2 ${
                      alert.severity === 'critical'
                        ? 'border-l-red-500 bg-red-500/5'
                        : 'border-l-amber-500 bg-amber-500/5'
                    }`}
                  >
                    {alert.severity === 'critical' ? (
                      <AlertCircle
                        size={16}
                        className="text-red-400 mt-0.5 shrink-0"
                      />
                    ) : (
                      <AlertTriangle
                        size={16}
                        className="text-amber-400 mt-0.5 shrink-0"
                      />
                    )}
                    <p className="text-sm text-white/70">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Top Performers */}
        {topPerformers === undefined ? (
          <ListSkeleton rows={5} />
        ) : (
          <div className="border border-white/10 p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-accent" /> Top Performers
            </h3>
            {topPerformers.length === 0 ? (
              <p className="text-white/30 text-sm font-mono">
                No revenue data yet.
              </p>
            ) : (
              <div className="space-y-3">
                {topPerformers.map((item, i) => {
                  const maxRevenue = topPerformers[0]?.revenue || 1;
                  const barWidth = Math.round(
                    (item.revenue / maxRevenue) * 100
                  );
                  return (
                    <div key={item.productId} className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-white/30 w-4 text-right">
                        {i + 1}
                      </span>
                      <div className="relative w-8 h-8 bg-white/5 overflow-hidden shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/10" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display font-bold uppercase tracking-tight truncate">
                          {item.productName}
                        </p>
                        <div className="h-1 bg-white/5 mt-1 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-mono text-white/60 shrink-0">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/orders"
          className="border border-white/10 hover:border-accent p-5 transition-all group flex items-center gap-3"
        >
          <ShoppingBag
            size={20}
            className="text-white/40 group-hover:text-accent transition-colors"
          />
          <div className="flex-1">
            <p className="text-sm font-display font-bold uppercase tracking-tight">
              Orders
            </p>
            {pendingOrdersCount > 0 && (
              <p className="text-[10px] font-mono text-accent">
                {pendingOrdersCount} pending
              </p>
            )}
          </div>
          <span className="text-white/20 group-hover:text-accent transition-colors">
            &rarr;
          </span>
        </Link>

        <Link
          href="/admin/fulfillment"
          className="border border-white/10 hover:border-accent p-5 transition-all group flex items-center gap-3"
        >
          <Truck
            size={20}
            className="text-white/40 group-hover:text-accent transition-colors"
          />
          <div className="flex-1">
            <p className="text-sm font-display font-bold uppercase tracking-tight">
              Fulfillment
            </p>
          </div>
          <span className="text-white/20 group-hover:text-accent transition-colors">
            &rarr;
          </span>
        </Link>

        <Link
          href="/admin/campaigns"
          className="border border-white/10 hover:border-accent p-5 transition-all group flex items-center gap-3"
        >
          <Megaphone
            size={20}
            className="text-white/40 group-hover:text-accent transition-colors"
          />
          <div className="flex-1">
            <p className="text-sm font-display font-bold uppercase tracking-tight">
              Campaigns
            </p>
          </div>
          <span className="text-white/20 group-hover:text-accent transition-colors">
            &rarr;
          </span>
        </Link>
      </div>
    </div>
  );
}
