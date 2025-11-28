import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportsModule } from "./ReportsModule";
import type { Transaction } from "@/types/pos";
import type { Dispatch, SetStateAction } from "react";

describe("ReportsModule", () => {
  const noopDispatch = (() => undefined) as Dispatch<SetStateAction<{ start: string; end: string }>>;

  const baseProps = {
    dateRange: { start: "", end: "" },
    setDateRange: noopDispatch,
    quickFilter: () => undefined,
    shortDate: (value: string) => value,
    currency: (value: number) => `Rp ${value}`,
  } as const;

  it("menampilkan pesan kosong saat tidak ada transaksi", () => {
    render(
      <ReportsModule
        {...baseProps}
        filteredTransactions={[]}
        setSelectedTransactionId={() => undefined}
      />,
    );

    expect(screen.getByText(/Tidak ada transaksi/i)).toBeInTheDocument();
  });

  it("memanggil setSelectedTransactionId saat tombol detail ditekan", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    const transactions: Transaction[] = [
      {
        id: "TRX-1",
        items: [{ productId: "1", name: "Produk A", price: 1000, qty: 1 }],
        total: 1000,
        paid: 1000,
        change: 0,
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ];

    render(
      <ReportsModule
        {...baseProps}
        filteredTransactions={transactions}
        setSelectedTransactionId={handleSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: /detail/i }));

    expect(handleSelect).toHaveBeenCalledWith("TRX-1");
  });
});
