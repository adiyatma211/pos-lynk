import type { ModuleNavItem } from '@/app/types/dashboard';

interface ModuleNavigationProps {
  items: ModuleNavItem[];
  activeModule: string;
  onModuleSelect: (moduleKey: string) => void;
}

export function ModuleNavigation({ items, activeModule, onModuleSelect }: ModuleNavigationProps) {
  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onModuleSelect(item.key)}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
            activeModule === item.key
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-md'
              : 'border-[var(--card-border)] bg-white text-[var(--text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)]/20'
          }`}
        >
          <span className="h-4 w-4">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}