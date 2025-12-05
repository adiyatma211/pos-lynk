export type Category = {
  id: string;
  name: string;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  stock: number;
  photo?: string;
  createdAt: string;
};

export type TransactionItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
};

export type Transaction = {
  id: string;
  referenceId?: number;  // Database ID from backend
  createdAt: string;
  items: TransactionItem[];
  subtotal: number;
  total: number;
  paid: number;
  change: number;
};

export type StockLog = {
  id: string;
  productId: string;
  type: "in" | "out";
  amount: number;
  note: string;
  createdAt: string;
};

export type FlashMessage = {
  type: "success" | "error" | "info";
  text: string;
};
