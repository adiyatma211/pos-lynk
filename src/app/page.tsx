"use client";

import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { OmzetModule } from "@/components/dashboard/OmzetModule";
import { ProductsModule } from "@/components/dashboard/ProductsModule";
import { TransactionsModule } from "@/components/dashboard/TransactionsModule";
import { ReceiptsModule } from "@/components/dashboard/ReceiptsModule";
import { ReportsModule } from "@/components/dashboard/ReportsModule";
import { TransactionModal } from "@/components/TransactionModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { currency, formatDateTime } from "@/utils/formatHelpers";
import { STORE_INFO } from "@/config/receiptConfig";
import { EnhancedHomeContainer } from "@/containers/EnhancedHomeContainer";

export default function Home() {
  const {
    // Navigation
    moduleNavItems,
    activeModule,
    setActiveModule,
    activeNav,

    // Loading states
    isLoading,

    // Module data
    omzetData,
    productsData,
    transactionsData,
    receiptsData,
    reportsData,

    // Modal state
    summaryModal,
    confirmSaveTransaction,
    cancelSaveTransaction,
  } = EnhancedHomeContainer();

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("Home page error:", error, errorInfo);
        // You could also log to a service here
      }}
    >
      <div className="min-h-screen py-12 text-[var(--foreground)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 lg:flex-row">
          <SidebarNav
            storeName={STORE_INFO.name}
            summaryText="Kelola transaksi, produk, laporan, dan omzet dari satu layar."
            totalRevenueFormatted={currency(omzetData.totalRevenue)}
            items={moduleNavItems}
            activeModule={activeModule}
            onSelect={setActiveModule}
          />
          <main className="flex-1 space-y-6">
            <header className="rounded-3xl border border-[var(--card-border)] bg-white/80 px-6 py-5 shadow-sm shadow-[#5e8c520f]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">
                Modul aktif
              </p>
              <h2 className="mt-1 text-3xl font-bold text-[var(--foreground)]">
                {activeNav?.label ?? "Omzet"}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                {activeNav?.description}
              </p>
            </header>

            {/* Flash messages are now handled by useFlashMessage hook in EnhancedHomeContainer */}

            {activeModule === "omzet" && (
              <ErrorBoundary fallback={<div>Error loading dashboard data</div>}>
                <OmzetModule {...omzetData} />
              </ErrorBoundary>
            )}

            {activeModule === "produk" && (
              <ErrorBoundary fallback={<div>Error loading products</div>}>
                <ProductsModule {...productsData} />
              </ErrorBoundary>
            )}

            {activeModule === "transaksi" && (
              <ErrorBoundary fallback={<div>Error loading transactions</div>}>
                <TransactionsModule {...transactionsData} />
              </ErrorBoundary>
            )}

            {activeModule === "nota" && (
              <ErrorBoundary fallback={<div>Error loading receipts</div>}>
                <ReceiptsModule {...receiptsData} />
              </ErrorBoundary>
            )}

            {activeModule === "laporan" && (
              <ErrorBoundary fallback={<div>Error loading reports</div>}>
                <ReportsModule {...reportsData} />
              </ErrorBoundary>
            )}
          </main>
        </div>

        {/* Summary Transaction Modal */}
        {summaryModal.show && summaryModal.transaction && (
          <ErrorBoundary>
            <TransactionModal
              transaction={summaryModal.transaction}
              onConfirm={confirmSaveTransaction}
              onCancel={cancelSaveTransaction}
            />
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  );
}