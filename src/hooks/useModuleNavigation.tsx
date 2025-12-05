import { useState, useCallback } from 'react';
import { TrendingUp, Package, CreditCard, Receipt, FileText } from 'lucide-react';
import type { ModuleKey } from '@/app/types/dashboard';
import type { ModuleNavItem } from '@/app/types/dashboard';

interface UseModuleNavigationReturn {
  activeModule: ModuleKey;
  setActiveModule: (module: ModuleKey) => void;
  moduleNavItems: ModuleNavItem[];
  getActiveModule: () => ModuleNavItem | undefined;
  isActive: (moduleKey: ModuleKey) => boolean;
}

const moduleNavItems: ModuleNavItem[] = [
  {
    key: "omzet",
    label: "Omzet",
    description: "Ringkasan pendapatan & grafik mini",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    key: "produk",
    label: "Barang",
    description: "Katalog produk & kategori",
    icon: <Package className="w-5 h-5" />,
  },
  {
    key: "transaksi",
    label: "Transaksi",
    description: "Kasir realtime + stok otomatis",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    key: "nota",
    label: "Nota",
    description: "Daftar nota & cetak struk",
    icon: <Receipt className="w-5 h-5" />,
  },
  {
    key: "laporan",
    label: "Laporan",
    description: "Riwayat transaksi lengkap",
    icon: <FileText className="w-5 h-5" />,
  },
];

export function useModuleNavigation(initialModule: ModuleKey = "omzet"): UseModuleNavigationReturn {
  const [activeModule, setActiveModuleState] = useState<ModuleKey>(initialModule);

  const setActiveModule = useCallback((module: ModuleKey) => {
    setActiveModuleState(module);
  }, []);

  const getActiveModule = useCallback(() => {
    return moduleNavItems.find(item => item.key === activeModule);
  }, [activeModule]);

  const isActive = useCallback((moduleKey: ModuleKey) => {
    return activeModule === moduleKey;
  }, [activeModule]);

  return {
    activeModule,
    setActiveModule,
    moduleNavItems,
    getActiveModule,
    isActive,
  };
}