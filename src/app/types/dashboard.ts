import type { ReactNode } from "react";

export type ModuleKey = "omzet" | "produk" | "transaksi" | "laporan";

export type ModuleNavItem = {
  key: ModuleKey;
  label: string;
  description: string;
  icon: ReactNode;
};
