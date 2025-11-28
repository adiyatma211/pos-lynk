import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarNav } from "./SidebarNav";
import type { ModuleNavItem } from "@/app/types/dashboard";

describe("SidebarNav", () => {
  const baseItems: ModuleNavItem[] = [
    {
      key: "omzet",
      label: "Omzet",
      description: "Ringkasan pendapatan",
      icon: <span aria-hidden="true">📈</span>,
    },
    {
      key: "produk",
      label: "Barang",
      description: "Kelola produk",
      icon: <span aria-hidden="true">🧺</span>,
    },
  ];

  it("menampilkan nama toko, ringkasan, dan modul aktif", () => {
    render(
      <SidebarNav
        storeName="Sentosa POS"
        summaryText="Ringkas semuanya"
        totalRevenueFormatted="Rp 1.000.000"
        items={baseItems}
        activeModule="omzet"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByText("Sentosa POS")).toBeInTheDocument();
    expect(screen.getByText("Ringkas semuanya")).toBeInTheDocument();

    const activeButton = screen.getByRole("button", { name: /Omzet/i });
    expect(activeButton).toHaveClass("bg-[var(--color-primary)]", { exact: false });
  });

  it("memanggil onSelect saat modul lain dipilih", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <SidebarNav
        storeName="Sentosa POS"
        summaryText="Ringkas semuanya"
        totalRevenueFormatted="Rp 1.000.000"
        items={baseItems}
        activeModule="omzet"
        onSelect={handleSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Barang/i }));

    expect(handleSelect).toHaveBeenCalledWith("produk");
  });
});
