export type Category = {
  id: number;
  name: string;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  categoryId: number;
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
