
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppMode, User, Account, Transaction, Shift, Customer, ShiftFlowConfig } from '../types';
import { auth, getArtifactCollection } from '../firebase';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { addDoc, onSnapshot, query, orderBy, updateDoc, doc, setDoc } from 'firebase/firestore';

const DEFAULT_FLOW: ShiftFlowConfig = {
  salesAccount: 'main_sales_income',
  cardsAccount: 'business_bank',
  hikingAccount: 'hiking_bar_rec',
  fxAccount: 'foreign_currency_reserve',
  billsAccount: 'bills_to_receive',
  cashAccount: 'main_cash_till',
  varianceAccount: 'cash_variance_expense'
};

interface AppContextType {
  mode: AppMode;
  user: User | null;
  loading: boolean;
  currentPage: string;
  accounts: Account[];
  transactions: Transaction[];
  shifts: Shift[];
  activeShift: Shift | null;
  customers: Customer[];
  flowConfig: ShiftFlowConfig;
  selectedAccountId: string | null;
  setCurrentPage: (page: string) => void;
  setSelectedAccountId: (id: string | null) => void;
  setFlowConfig: (config: ShiftFlowConfig) => void;
  toggleMode: () => void;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  addAccount: (accountData: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  addTransaction: (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  startShift: (openingFloat: number, initialInjections: any[], accountingDate: string) => Promise<void>;
  updateActiveShift: (updates: Partial<Shift>) => Promise<void>;
  closeShift: (actualCash: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem('mozza_mode');
    return (saved as AppMode) || 'sandbox';
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [flowConfig, setFlowConfigState] = useState<ShiftFlowConfig>(DEFAULT_FLOW);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const activeShift = shifts.find(s => s.status === 'open') || null;

  useEffect(() => {
    localStorage.setItem('mozza_mode', mode);
  }, [mode]);

  useEffect(() => {
    if (mode === 'live') {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      const savedUser = localStorage.getItem('mozza_sandbox_user');
      if (savedUser) setUser(JSON.parse(savedUser));
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    if (!user) return;

    if (mode === 'live') {
      const unsubAcc = onSnapshot(query(getArtifactCollection('accounts'), orderBy('createdAt', 'desc')), (s) => setAccounts(s.docs.map(d => ({ id: d.id, ...d.data() } as Account))));
      const unsubTrans = onSnapshot(query(getArtifactCollection('transactions'), orderBy('date', 'desc')), (s) => setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))));
      const unsubShift = onSnapshot(query(getArtifactCollection('shifts'), orderBy('startTime', 'desc')), (s) => setShifts(s.docs.map(d => ({ id: d.id, ...d.data() } as Shift))));
      const unsubCust = onSnapshot(query(getArtifactCollection('customers'), orderBy('name', 'asc')), (s) => setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() } as Customer))));
      // Flow config would be a single doc
      const unsubFlow = onSnapshot(doc(getArtifactCollection('config'), 'shift_flow'), (d) => {
        if (d.exists()) setFlowConfigState(d.data() as ShiftFlowConfig);
      });

      return () => { unsubAcc(); unsubTrans(); unsubShift(); unsubCust(); unsubFlow(); };
    } else {
      setAccounts(JSON.parse(localStorage.getItem('mozza_sandbox_accounts') || '[]'));
      setTransactions(JSON.parse(localStorage.getItem('mozza_sandbox_transactions') || '[]'));
      setShifts(JSON.parse(localStorage.getItem('mozza_sandbox_shifts') || '[]'));
      setCustomers(JSON.parse(localStorage.getItem('mozza_sandbox_customers') || '[{"id":"1","name":"Regular Guest"},{"id":"2","name":"VIP Table 5"}]'));
      setFlowConfigState(JSON.parse(localStorage.getItem('mozza_sandbox_flow') || JSON.stringify(DEFAULT_FLOW)));
    }
  }, [user, mode]);

  const setFlowConfig = (config: ShiftFlowConfig) => {
    setFlowConfigState(config);
    if (mode === 'sandbox') {
      localStorage.setItem('mozza_sandbox_flow', JSON.stringify(config));
    } else {
      setDoc(doc(getArtifactCollection('config'), 'shift_flow'), config);
    }
  };

  const toggleMode = () => setMode(prev => prev === 'sandbox' ? 'live' : 'sandbox');

  const login = async (email?: string, password?: string) => {
    if (mode === 'sandbox') {
      const mockUser = { uid: 'sb-123', email: email || 'chef@mozzarella.io', displayName: 'Master Chef', photoURL: 'https://picsum.photos/200' };
      setUser(mockUser);
      localStorage.setItem('mozza_sandbox_user', JSON.stringify(mockUser));
    } else {
      await signInAnonymously(auth);
    }
  };

  const logout = async () => {
    if (mode === 'live') await signOut(auth);
    else { localStorage.removeItem('mozza_sandbox_user'); setUser(null); }
  };

  const addAccount = async (data: any) => {
    const newItem = { ...data, createdAt: new Date().toISOString() };
    if (mode === 'live') await addDoc(getArtifactCollection('accounts'), newItem);
    else {
      const updated = [{ ...newItem, id: Math.random().toString(36).substr(2, 9) }, ...accounts];
      setAccounts(updated);
      localStorage.setItem('mozza_sandbox_accounts', JSON.stringify(updated));
    }
  };

  const addTransaction = async (data: any) => {
    const newItem = { ...data, createdAt: new Date().toISOString() };
    if (mode === 'live') await addDoc(getArtifactCollection('transactions'), newItem);
    else {
      const updated = [{ ...newItem, id: Math.random().toString(36).substr(2, 9) }, ...transactions];
      setTransactions(updated);
      localStorage.setItem('mozza_sandbox_transactions', JSON.stringify(updated));
    }
  };

  const startShift = async (openingFloat: number, initialInjections: any[], accountingDate: string) => {
    const newShift: Shift = {
      id: Math.random().toString(36).substr(2, 9),
      status: 'open',
      startTime: new Date().toISOString(),
      accountingDate,
      openingFloat,
      totalSales: 0,
      cards: 0,
      hikingBar: 0,
      foreignCurrency: { value: 0, comment: '' },
      creditBills: [],
      injections: initialInjections,
      expenses: [],
      expectedCash: openingFloat + initialInjections.reduce((a, b) => a + b.amount, 0),
    };

    if (mode === 'live') {
      await addDoc(getArtifactCollection('shifts'), newShift);
    } else {
      const updated = [newShift, ...shifts];
      setShifts(updated);
      localStorage.setItem('mozza_sandbox_shifts', JSON.stringify(updated));
    }
  };

  const updateActiveShift = async (updates: Partial<Shift>) => {
    if (!activeShift) return;
    const updatedShift = { ...activeShift, ...updates };

    const totalBills = updatedShift.creditBills.reduce((sum, b) => sum + b.amount, 0);
    const cashSales = updatedShift.totalSales - (
      updatedShift.cards + 
      updatedShift.hikingBar + 
      updatedShift.foreignCurrency.value + 
      totalBills
    );
    const totalInjections = updatedShift.injections.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = updatedShift.expenses.reduce((sum, e) => sum + e.amount, 0);
    updatedShift.expectedCash = (updatedShift.openingFloat + cashSales + totalInjections) - totalExpenses;

    if (mode === 'live') {
      // Live update logic
    } else {
      const updated = shifts.map(s => s.id === updatedShift.id ? updatedShift : s);
      setShifts(updated);
      localStorage.setItem('mozza_sandbox_shifts', JSON.stringify(updated));
    }
  };

  const closeShift = async (actualCash: number) => {
    if (!activeShift) return;
    const closedShift: Shift = {
      ...activeShift,
      status: 'closed',
      endTime: new Date().toISOString(),
      actualCash,
      difference: actualCash - activeShift.expectedCash,
      closedBy: user?.displayName || 'Unknown'
    };

    // --- ENHANCED SWEEP LOGIC BASED ON FLOW EDITOR ---
    
    // 1. Log Gross Sales
    await addTransaction({
      description: `Sales Revenue (${closedShift.accountingDate})`,
      amount: closedShift.totalSales,
      category: 'Revenue',
      date: closedShift.endTime,
      accountId: flowConfig.salesAccount,
      shiftId: closedShift.id
    });

    // 2. Transfer from Sales to Destination Accounts
    // Card Sweep
    if (closedShift.cards > 0) {
      await addTransaction({ description: `Sales Card Sweep`, amount: -closedShift.cards, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.salesAccount, shiftId: closedShift.id });
      await addTransaction({ description: `Card Settlement Receipt`, amount: closedShift.cards, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.cardsAccount, shiftId: closedShift.id });
    }

    // Hiking Bar Sweep
    if (closedShift.hikingBar > 0) {
      await addTransaction({ description: `Hiking Bar Shift Portion`, amount: -closedShift.hikingBar, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.salesAccount, shiftId: closedShift.id });
      await addTransaction({ description: `Hiking Bar Receivable Log`, amount: closedShift.hikingBar, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.hikingAccount, shiftId: closedShift.id });
    }

    // Foreign Currency Sweep
    if (closedShift.foreignCurrency.value > 0) {
      await addTransaction({ description: `FX Reserve Transfer`, amount: -closedShift.foreignCurrency.value, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.salesAccount, shiftId: closedShift.id });
      await addTransaction({ description: `FX Reserve: ${closedShift.foreignCurrency.comment}`, amount: closedShift.foreignCurrency.value, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.fxAccount, shiftId: closedShift.id });
    }

    // Credit Bills Sweep
    for (const bill of closedShift.creditBills) {
      await addTransaction({ description: `Credit Bill: ${bill.customerName}`, amount: -bill.amount, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.salesAccount, shiftId: closedShift.id });
      await addTransaction({ description: `Receivable: ${bill.customerName}`, amount: bill.amount, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.billsAccount, shiftId: closedShift.id });
    }

    // Expenses Paid from Till
    for (const exp of closedShift.expenses) {
      await addTransaction({ description: `Exp: ${exp.description}`, amount: -exp.amount, category: exp.category, date: closedShift.endTime, accountId: flowConfig.cashAccount, shiftId: closedShift.id });
    }

    // Remaining Cash Sweep (Cash Sales)
    const totalNonCash = closedShift.cards + closedShift.hikingBar + closedShift.foreignCurrency.value + closedShift.creditBills.reduce((a,b)=>a+b.amount,0);
    const cashSales = closedShift.totalSales - totalNonCash;
    if (cashSales > 0) {
      await addTransaction({ description: `Cash Sales Deposit`, amount: -cashSales, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.salesAccount, shiftId: closedShift.id });
      await addTransaction({ description: `Cash Sales Receipt`, amount: cashSales, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.cashAccount, shiftId: closedShift.id });
    }

    // 3. Handle Variance
    if (closedShift.difference !== 0) {
       await addTransaction({
         description: `Cash Variance (${closedShift.difference > 0 ? 'Over' : 'Short'})`,
         amount: closedShift.difference,
         category: 'Adjustment',
         date: closedShift.endTime,
         accountId: flowConfig.varianceAccount,
         shiftId: closedShift.id
       });
       // Mirror in cash account
       await addTransaction({
         description: `Cash Variance Correction`,
         amount: closedShift.difference,
         category: 'Adjustment',
         date: closedShift.endTime,
         accountId: flowConfig.cashAccount,
         shiftId: closedShift.id
       });
    }

    if (mode === 'live') {
      // Firestore update logic
    } else {
      const updated = shifts.map(s => s.id === closedShift.id ? closedShift : s);
      setShifts(updated);
      localStorage.setItem('mozza_sandbox_shifts', JSON.stringify(updated));
    }
  };

  return (
    <AppContext.Provider value={{ 
      mode, user, loading, currentPage, setCurrentPage, toggleMode, login, logout, 
      accounts, transactions, shifts, activeShift, customers, flowConfig, selectedAccountId, 
      setSelectedAccountId, setFlowConfig, addAccount, addTransaction, startShift, updateActiveShift, closeShift 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
