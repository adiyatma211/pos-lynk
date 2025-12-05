import { useState, useEffect } from "react";
import type { Transaction } from "@/types/pos";
import dashboardService from "@/services/dashboardService";
import { useAPI, API_ERROR_MESSAGES } from "@/utils/config";

interface WeeklyPoint {
  label: string;
  total: number;
}

interface OmzetModuleProps {
  todayTransactionsCount?: number;
  todayRevenue?: number;
  topProduct?: string;
  weeklyTrend?: WeeklyPoint[];
  maxWeeklyTotal?: number;
  latestTransactions?: Transaction[];
  totalRevenue?: number;
  averageOrder?: number;
  totalTransactions?: number;
  currency: (value: number) => string;
  formatDateTime: (value: string) => string;
  isLoading?: boolean;
  error?: string;
}

export function OmzetModule({
  todayTransactionsCount = 0,
  todayRevenue = 0,
  topProduct = "-",
  weeklyTrend = [],
  maxWeeklyTotal = 0,
  latestTransactions = [],
  totalRevenue = 0,
  averageOrder = 0,
  totalTransactions = 0,
  currency,
  formatDateTime,
  isLoading = false,
  error,
}: OmzetModuleProps) {
  const cardClass = "rounded-2xl border border-[var(--card-border)] bg-white/90 p-5 shadow-sm shadow-[#5e8c520a]";
  const softCardClass = "rounded-2xl border border-[var(--card-border)] bg-[var(--color-secondary)]/20 p-5 shadow-sm shadow-[#5e8c520a]";

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent"></div>
          <p className="text-sm text-[var(--text-muted)]">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="text-center">
          <p className="text-sm font-medium text-red-800">❌ {error}</p>
          <p className="mt-1 text-xs text-red-600">Tidak dapat memuat data dashboard. Silakan coba lagi nanti.</p>
        </div>
      </div>
    );
  }
  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <div className={cardClass}>
          <p className="text-sm font-medium text-[var(--text-muted)]">Transaksi hari ini</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--color-primary)]">{todayTransactionsCount}</p>
          <p className="text-xs text-[color:rgba(95,109,82,0.75)]">Jumlah transaksi tersimpan hari ini.</p>
        </div>
        <div className={cardClass}>
          <p className="text-sm font-medium text-[var(--text-muted)]">Pendapatan hari ini</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--color-primary)]">{currency(todayRevenue)}</p>
          <p className="text-xs text-[color:rgba(95,109,82,0.75)]">Total nilai transaksi tersimpan.</p>
        </div>
        <div className={cardClass}>
          <p className="text-sm font-medium text-[var(--text-muted)]">Produk terlaris</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{topProduct}</p>
          <p className="text-xs text-[color:rgba(95,109,82,0.75)]">Berdasarkan akumulasi qty terjual.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className={softCardClass}>
          <p className="text-sm font-medium text-[var(--text-muted)]">Total pendapatan</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-primary)]">{currency(totalRevenue)}</p>
          <p className="text-xs text-[color:rgba(95,109,82,0.75)]">Akumulasi seluruh transaksi</p>
        </div>
        <div className={softCardClass}>
          <p className="text-sm font-medium text-[var(--text-muted)]">Rata-rata order</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-primary)]">{currency(Math.round(averageOrder) || 0)}</p>
          <p className="text-xs text-[color:rgba(95,109,82,0.75)]">Pendapatan / jumlah transaksi</p>
        </div>
        <div className={softCardClass}>
          <p className="text-sm font-medium text-[var(--text-muted)]">Jumlah transaksi</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-primary)]">{totalTransactions.toLocaleString("id-ID")}</p>
          <p className="text-xs text-[color:rgba(95,109,82,0.75)]">Sejak memakai aplikasi</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 p-6 shadow-lg shadow-[#5e8c520a]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Grafik 7 Hari Terakhir</h2>
              <p className="text-sm text-[var(--text-muted)]">Pantau tren omzet per hari.</p>
            </div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">{currency(todayRevenue)}</p>
          </div>
          <div className="mt-6 flex items-end gap-3">
            {weeklyTrend.map((point) => {
              const height = point.total ? (point.total / maxWeeklyTotal) * 120 + 12 : 12;
              return (
                <div key={point.label} className="flex-1 text-center">
                  <div className="rounded-t-2xl bg-[var(--color-primary)]/40" style={{ height: `${height}px` }} />
                  <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">{point.label}</p>
                  <p className="text-[11px] text-[color:rgba(95,109,82,0.75)]">{point.total ? currency(point.total) : "-"}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 p-6 shadow-lg shadow-[#5e8c520a]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Transaksi Terbaru</h2>
          <p className="text-sm text-[var(--text-muted)]">5 transaksi terakhir tersimpan.</p>
          <div className="mt-4 space-y-3">
            {latestTransactions.length === 0 && <p className="text-sm text-[var(--text-muted)]">Belum ada transaksi.</p>}
            {latestTransactions.map((trx) => (
              <div key={trx.id} className="flex items-center justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--color-secondary)]/25 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{trx.id}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatDateTime(trx.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--color-primary)]">{currency(trx.total)}</p>
                  <p className="text-xs text-[color:rgba(95,109,82,0.75)]">{trx.items.length} item</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}


