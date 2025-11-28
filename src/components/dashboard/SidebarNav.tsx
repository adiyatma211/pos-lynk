/* eslint-disable @next/next/no-img-element */
import type { ModuleKey, ModuleNavItem } from "@/app/types/dashboard";

interface SidebarNavProps {
  storeName: string;
  summaryText: string;
  totalRevenueFormatted: string;
  items: ModuleNavItem[];
  activeModule: ModuleKey;
  onSelect: (key: ModuleKey) => void;
}

export function SidebarNav({
  storeName,
  summaryText,
  totalRevenueFormatted,
  items,
  activeModule,
  onSelect,
}: SidebarNavProps) {
  return (
    <aside className="w-full space-y-6 rounded-[32px] border border-[var(--card-border)] bg-white/70 p-6 shadow-xl shadow-[#5e8c5210] backdrop-blur lg:max-w-xs">
      <div className="rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 p-2 shadow-inner shadow-black/10">
            <img src="/assets/logo/logo_bg_color.svg" alt="Logo POS Lynk" className="h-10 w-10" loading="lazy" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Dashboard POS</p>
            <h1 className="text-2xl font-bold leading-snug">{storeName}</h1>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/85">{summaryText}</p>
      </div>
      <nav className="space-y-2">
        {items.map((item) => {
          const isActive = item.key === activeModule;
          return (
            <button
              key={item.key}
              type="button"
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm shadow-sm transition ${
                isActive
                  ? "border-transparent bg-[var(--color-primary)] text-white shadow-lg shadow-[#5e8c5230]"
                  : "border-[var(--card-border)] bg-white/85 text-[var(--text-muted)] hover:bg-[var(--color-secondary)]/20"
              }`}
              onClick={() => onSelect(item.key)}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-2xl text-base ${
                  isActive ? "bg-white/20 text-white" : "bg-[var(--color-secondary)]/40 text-[var(--color-primary)]"
                }`}
              >
                {item.icon}
              </span>
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className={`text-xs ${isActive ? "text-white/75" : "text-[var(--text-muted)]"}`}>{item.description}</p>
              </div>
            </button>
          );
        })}
      </nav>
      <div className="rounded-3xl border border-white/60 bg-white/95 p-5 text-[var(--text-muted)] shadow-inner shadow-[#5e8c520f]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em]">Total pendapatan</p>
        <p className="mt-2 text-3xl font-semibold text-[var(--color-primary)]">{totalRevenueFormatted}</p>
        <p className="text-xs">Sejak awal pencatatan</p>
      </div>
    </aside>
  );
}
