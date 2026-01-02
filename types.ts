
export type AppMode = 'sandbox' | 'live';

export type AccountType = 'receivable' | 'income' | 'payable' | 'asset' | 'cash' | 'bank' | 'equity';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
}

export interface CreditBillEntry {
  customerId: string;
  customerName: string;
  amount: number;
}

export interface ShiftExpense {
  id: string;
  category: string;
  description: string;
  amount: number;
}

export interface ShiftInjection {
  id: string;
  source: string; // e.g., 'business_bank', 'owner_equity'
  amount: number;
}

export interface ShiftFlowConfig {
  salesAccount: string;      // Usually Main Sales Income
  cardsAccount: string;      // Usually Business Bank
  hikingAccount: string;     // Usually Hiking Bar Rec
  fxAccount: string;         // Usually FX Reserve
  billsAccount: string;      // Usually Bills to Receive
  cashAccount: string;       // Usually Main Cash Till
  varianceAccount: string;   // Usually Expense or Loss account
}

export interface Shift {
  id: string;
  status: 'open' | 'closed';
  startTime: string;
  endTime?: string;
  accountingDate: string; // The date this shift actually represents
  openingFloat: number;
  totalSales: number;
  // Non-cash breakdown
  cards: number;
  hikingBar: number;
  foreignCurrency: {
    value: number;
    comment: string;
  };
  creditBills: CreditBillEntry[];
  injections: ShiftInjection[];
  expenses: ShiftExpense[];
  // Calculated
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  closedBy?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  accountId: string;
  createdAt: string;
  shiftId?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: AccountType;
  createdAt: string;
}
