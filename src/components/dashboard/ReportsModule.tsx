import type { Dispatch, SetStateAction } from "react";
import type { Transaction } from "@/types/pos";

interface ReportsModuleProps {
  filteredTransactions: Transaction[];
  dateRange: { start: string; end: string };
  setDateRange: Dispatch<SetStateAction<{ start: string; end: string }>>;
  quickFilter: (range: "today" | "week" | "month" | "all") => void;
  shortDate: (value: string) => string;
  currency: (value: number) => string;
  setSelectedTransactionId: Dispatch<SetStateAction<string | null>>;
}

export function ReportsModule({
  filteredTransactions,
  dateRange,
  setDateRange,
  quickFilter,
  shortDate,
  currency,
  setSelectedTransactionId,
}: ReportsModuleProps) {
  return (
    <section className="rounded-3xl border border-[var(--card-border)] bg-white/90 p-6 shadow-lg shadow-[#5e8c520a]">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Riwayat Transaksi</h2>
          <p className="text-sm text-[var(--text-muted)]">Filter berdasarkan tanggal atau pilih rentang singkat.</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" className="rounded-full border border-[var(--card-border)] px-3 py-1 text-xs text-[var(--text-muted)] transition hover:bg-[var(--color-secondary)]/30" onClick={() => quickFilter("today")}>
            Hari ini
          </button>
          <button type="button" className="rounded-full border border-[var(--card-border)] px-3 py-1 text-xs text-[var(--text-muted)] transition hover:bg-[var(--color-secondary)]/30" onClick={() => quickFilter("week")}>
            7 hari
          </button>
          <button type="button" className="rounded-full border border-[var(--card-border)] px-3 py-1 text-xs text-[var(--text-muted)] transition hover:bg-[var(--color-secondary)]/30" onClick={() => quickFilter("month")}>
            Bulan ini
          </button>
          <button type="button" className="rounded-full border border-[var(--card-border)] px-3 py-1 text-xs text-[var(--text-muted)] transition hover:bg-[var(--color-secondary)]/30" onClick={() => quickFilter("all")}>
            Semua
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <input
          type="date"
          className="rounded-xl border border-[var(--card-border)] bg-white/85 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
          value={dateRange.start}
          onChange={(event) => setDateRange((prev) => ({ ...prev, start: event.target.value }))}
        />
        <input
          type="date"
          className="rounded-xl border border-[var(--card-border)] bg-white/85 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
          value={dateRange.end}
          onChange={(event) => setDateRange((prev) => ({ ...prev, end: event.target.value }))}
        />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="text-[color:rgba(95,109,82,0.7)]">
              <th className="px-2 py-2">Tanggal</th>
              <th className="px-2 py-2">ID</th>
              <th className="px-2 py-2">Produk</th>
              <th className="px-2 py-2">Total</th>
              <th className="px-2 py-2">Tunai</th>
              <th className="px-2 py-2">Kembalian</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-6 text-center text-[color:rgba(95,109,82,0.7)]">
                  Tidak ada transaksi pada rentang ini.
                </td>
              </tr>
            )}
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="border-t border-[var(--card-border)]">
                <td className="px-2 py-3">{shortDate(transaction.createdAt)}</td>
                <td className="px-2 py-3 font-medium">{transaction.id}</td>
                <td className="px-2 py-3 text-[var(--text-muted)]">{transaction.items.map((item) => item.name).join(", ")}</td>
                <td className="px-2 py-3 font-semibold">{currency(transaction.total)}</td>
                <td className="px-2 py-3">{currency(transaction.paid)}</td>
                <td className="px-2 py-3">{currency(transaction.change)}</td>
                <td className="px-2 py-3 text-right">
                  <button
                    type="button"
                    className="text-sm text-[var(--color-primary)] px-2 py-1 rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors duration-200"
                    onClick={() => setSelectedTransactionId(transaction.id)}
                  >
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}



