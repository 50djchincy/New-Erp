
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

export interface Vendor {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'pending' | 'auto-pay';
  color: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  amount: number;
  description: string;
  vendorId?: string;
  category: string;
  date: string;
  paymentStatus: 'paid' | 'pending' | 'recurring';
  accountId: string; // The Money Lab account used for payment
  createdAt: string;
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
  source: string;
  amount: number;
}

export interface ShiftFlowConfig {
  salesAccount: string;      
  cardsAccount: string;      
  hikingAccount: string;     
  fxAccount: string;         
  billsAccount: string;      
  cashAccount: string;       
  varianceAccount: string;   
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  salary: number;
  loanBalance: number;
  color: string;
}

export interface HolidayRecord {
  id: string;
  staffId: string;
  date: string;
}

export interface Shift {
  id: string;
  status: 'open' | 'closed';
  startTime: string;
  endTime?: string;
  accountingDate: string;
  openingFloat: number;
  totalSales: number;
  cards: number;
  hikingBar: number;
  foreignCurrency: {
    value: number;
    comment: string;
  };
  creditBills: CreditBillEntry[];
  injections: ShiftInjection[];
  expenses: ShiftExpense[];
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
  staffId?: string;
  expenseId?: string; // Optional reference to a business expense
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: AccountType;
  createdAt: string;
}
