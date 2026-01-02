
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppMode, User, Account, Transaction, Shift, Customer, ShiftFlowConfig, StaffMember, HolidayRecord, Vendor, ExpenseRecord } from '../types';
import { auth, db, getArtifactCollection } from '../firebase';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { addDoc, onSnapshot, query, orderBy, updateDoc, doc, setDoc, increment, deleteDoc, collection } from 'firebase/firestore';

const DEFAULT_FLOW: ShiftFlowConfig = {
  salesAccount: '',
  cardsAccount: '',
  hikingAccount: '',
  fxAccount: '',
  billsAccount: '',
  cashAccount: '',
  varianceAccount: ''
};

interface AppContextType {
  mode: AppMode;
  user: User | null;
  loading: boolean;
  currentPage: string;
  accounts: Account[];
  transactions: Transaction[];
  shifts: Shift[];
  staff: StaffMember[];
  holidays: HolidayRecord[];
  activeShift: Shift | null;
  customers: Customer[];
  vendors: Vendor[];
  expenses: ExpenseRecord[];
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
  resetSandbox: () => void;
  // Staff Methods
  addStaff: (data: Omit<StaffMember, 'id' | 'joinedAt' | 'isActive'>) => Promise<void>;
  updateStaff: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  toggleHoliday: (staffId: string, date: string) => Promise<void>;
  // Expense/Vendor Methods
  addVendor: (data: Omit<Vendor, 'id' | 'createdAt'>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  addExpense: (data: Omit<ExpenseRecord, 'id' | 'createdAt'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
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
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
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
      const unsubStaff = onSnapshot(query(getArtifactCollection('staff')), (s) => setStaff(s.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember))));
      const unsubHolidays = onSnapshot(query(getArtifactCollection('holidays')), (s) => setHolidays(s.docs.map(d => ({ id: d.id, ...d.data() } as HolidayRecord))));
      const unsubCust = onSnapshot(query(getArtifactCollection('customers'), orderBy('name', 'asc')), (s) => setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() } as Customer))));
      const unsubVendors = onSnapshot(query(getArtifactCollection('vendors'), orderBy('name', 'asc')), (s) => setVendors(s.docs.map(d => ({ id: d.id, ...d.data() } as Vendor))));
      const unsubExpenses = onSnapshot(query(getArtifactCollection('expenses'), orderBy('date', 'desc')), (s) => setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() } as ExpenseRecord))));
      const unsubFlow = onSnapshot(doc(getArtifactCollection('config'), 'shift_flow'), (d) => {
        if (d.exists()) setFlowConfigState(d.data() as ShiftFlowConfig);
      });

      return () => { unsubAcc(); unsubTrans(); unsubShift(); unsubStaff(); unsubHolidays(); unsubCust(); unsubVendors(); unsubExpenses(); unsubFlow(); };
    } else {
      setAccounts(JSON.parse(localStorage.getItem('mozza_sandbox_accounts') || '[]'));
      setTransactions(JSON.parse(localStorage.getItem('mozza_sandbox_transactions') || '[]'));
      setShifts(JSON.parse(localStorage.getItem('mozza_sandbox_shifts') || '[]'));
      setStaff(JSON.parse(localStorage.getItem('mozza_sandbox_staff') || '[]'));
      setHolidays(JSON.parse(localStorage.getItem('mozza_sandbox_holidays') || '[]'));
      setCustomers(JSON.parse(localStorage.getItem('mozza_sandbox_customers') || '[{"id":"1","name":"Regular Guest"},{"id":"2","name":"VIP Table 5"}]'));
      setVendors(JSON.parse(localStorage.getItem('mozza_sandbox_vendors') || '[{"id":"v1","name":"Sysco Foods","category":"Inventory","status":"active","color":"#3B82F6","createdAt":"2024-01-01"}]'));
      setExpenses(JSON.parse(localStorage.getItem('mozza_sandbox_expenses') || '[]'));
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
    if (mode === 'live') {
      await addDoc(getArtifactCollection('accounts'), newItem);
    } else {
      setAccounts(prev => {
        const updated = [{ ...newItem, id: Math.random().toString(36).substr(2, 9) }, ...prev];
        localStorage.setItem('mozza_sandbox_accounts', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newItem = { ...data, createdAt: new Date().toISOString() };
    if (mode === 'live') {
      await addDoc(getArtifactCollection('transactions'), newItem);
      if (data.accountId !== 'internal_ledger' && data.accountId !== 'internal_staff_ledger') {
        const accountRef = doc(getArtifactCollection('accounts'), data.accountId);
        await updateDoc(accountRef, { balance: increment(data.amount) });
      }
    } else {
      const newId = Math.random().toString(36).substr(2, 9);
      const newTransaction = { ...newItem, id: newId };
      setTransactions(prev => {
        const updated = [newTransaction, ...prev];
        localStorage.setItem('mozza_sandbox_transactions', JSON.stringify(updated));
        return updated;
      });
      if (data.accountId !== 'internal_ledger' && data.accountId !== 'internal_staff_ledger') {
        setAccounts(prev => {
          const updated = prev.map(acc => acc.id === data.accountId ? { ...acc, balance: acc.balance + data.amount } : acc);
          localStorage.setItem('mozza_sandbox_accounts', JSON.stringify(updated));
          return updated;
        });
      }
    }
  };

  const addVendor = async (data: Omit<Vendor, 'id' | 'createdAt'>) => {
    const newItem = { ...data, createdAt: new Date().toISOString() };
    if (mode === 'live') {
      await addDoc(getArtifactCollection('vendors'), newItem);
    } else {
      setVendors(prev => {
        const updated = [{ ...newItem, id: Math.random().toString(36).substr(2, 9) }, ...prev];
        localStorage.setItem('mozza_sandbox_vendors', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const deleteVendor = async (id: string) => {
    if (mode === 'live') {
      await deleteDoc(doc(getArtifactCollection('vendors'), id));
    } else {
      setVendors(prev => {
        const updated = prev.filter(v => v.id !== id);
        localStorage.setItem('mozza_sandbox_vendors', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const addExpense = async (data: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    const newItem = { ...data, createdAt: new Date().toISOString() };
    if (mode === 'live') {
      const res = await addDoc(getArtifactCollection('expenses'), newItem);
      if (data.paymentStatus === 'paid') {
        await addTransaction({
          description: `Business Expense: ${data.description}`,
          amount: -data.amount,
          category: data.category,
          date: data.date,
          accountId: data.accountId,
          expenseId: res.id
        });
      }
    } else {
      const id = Math.random().toString(36).substr(2, 9);
      const newExpense = { ...newItem, id };
      setExpenses(prev => {
        const updated = [newExpense, ...prev];
        localStorage.setItem('mozza_sandbox_expenses', JSON.stringify(updated));
        return updated;
      });
      if (data.paymentStatus === 'paid') {
        await addTransaction({
          description: `Business Expense: ${data.description}`,
          amount: -data.amount,
          category: data.category,
          date: data.date,
          accountId: data.accountId,
          expenseId: id
        });
      }
    }
  };

  const deleteExpense = async (id: string) => {
    if (mode === 'live') {
      await deleteDoc(doc(getArtifactCollection('expenses'), id));
    } else {
      setExpenses(prev => {
        const updated = prev.filter(e => e.id !== id);
        localStorage.setItem('mozza_sandbox_expenses', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const addStaff = async (data: Omit<StaffMember, 'id' | 'joinedAt' | 'isActive'>) => {
    const newItem = { ...data, joinedAt: Date.now(), isActive: true };
    if (mode === 'live') {
      await addDoc(getArtifactCollection('staff'), newItem);
    } else {
      setStaff(prev => {
        const updated = [{ ...newItem, id: Math.random().toString(36).substr(2, 9) }, ...prev];
        localStorage.setItem('mozza_sandbox_staff', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const updateStaff = async (id: string, updates: Partial<StaffMember>) => {
    if (mode === 'live') {
      await updateDoc(doc(getArtifactCollection('staff'), id), updates);
    } else {
      setStaff(prev => {
        const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s);
        localStorage.setItem('mozza_sandbox_staff', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const deleteStaff = async (id: string) => {
    if (mode === 'live') {
      await deleteDoc(doc(getArtifactCollection('staff'), id));
    } else {
      setStaff(prev => {
        const updated = prev.filter(s => s.id !== id);
        localStorage.setItem('mozza_sandbox_staff', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const toggleHoliday = async (staffId: string, date: string) => {
    const existing = holidays.find(h => h.staffId === staffId && h.date === date);
    if (mode === 'live') {
      if (existing) {
        await deleteDoc(doc(getArtifactCollection('holidays'), existing.id));
      } else {
        await addDoc(getArtifactCollection('holidays'), { staffId, date });
      }
    } else {
      setHolidays(prev => {
        let updated;
        if (existing) {
          updated = prev.filter(h => h.id !== existing.id);
        } else {
          updated = [...prev, { id: Math.random().toString(36).substr(2, 9), staffId, date }];
        }
        localStorage.setItem('mozza_sandbox_holidays', JSON.stringify(updated));
        return updated;
      });
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
      setShifts(prev => {
        const updated = [newShift, ...prev];
        localStorage.setItem('mozza_sandbox_shifts', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const updateActiveShift = async (updates: Partial<Shift>) => {
    if (!activeShift) return;
    const updatedShift = { ...activeShift, ...updates };
    const totalBills = updatedShift.creditBills.reduce((sum, b) => sum + b.amount, 0);
    const cashSales = updatedShift.totalSales - (updatedShift.cards + updatedShift.hikingBar + updatedShift.foreignCurrency.value + totalBills);
    const totalInjections = updatedShift.injections.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = updatedShift.expenses.reduce((sum, e) => sum + e.amount, 0);
    updatedShift.expectedCash = (updatedShift.openingFloat + cashSales + totalInjections) - totalExpenses;
    if (mode === 'live') {
      const shiftRef = doc(getArtifactCollection('shifts'), activeShift.id);
      await updateDoc(shiftRef, { ...updates, expectedCash: updatedShift.expectedCash });
    } else {
      setShifts(prev => {
        const updated = prev.map(s => s.id === updatedShift.id ? updatedShift : s);
        localStorage.setItem('mozza_sandbox_shifts', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const closeShift = async (actualCash: number) => {
    if (!activeShift) return;
    const isConfigComplete = Object.values(flowConfig).every(val => val !== '');
    if (!isConfigComplete) return alert("Shift Flow configuration is incomplete.");
    const closedShift: Shift = { ...activeShift, status: 'closed', endTime: new Date().toISOString(), actualCash, difference: actualCash - activeShift.expectedCash, closedBy: user?.displayName || 'Unknown' };
    await addTransaction({ description: `Daily Sales (${closedShift.accountingDate})`, amount: closedShift.totalSales, category: 'Revenue', date: closedShift.endTime, accountId: flowConfig.salesAccount, shiftId: closedShift.id });
    if (closedShift.cards > 0) {
      await addTransaction({ description: `Sales Card Sweep`, amount: -closedShift.cards, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.salesAccount, shiftId: closedShift.id });
      await addTransaction({ description: `Card Settlement Receipt`, amount: closedShift.cards, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.cardsAccount, shiftId: closedShift.id });
    }
    if (closedShift.hikingBar > 0) {
      await addTransaction({ description: `Hiking Portion Sweep`, amount: -closedShift.hikingBar, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.salesAccount, shiftId: closedShift.id });
      await addTransaction({ description: `Hiking Bar Receivable`, amount: closedShift.hikingBar, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.hikingAccount, shiftId: closedShift.id });
    }
    if (closedShift.foreignCurrency.value > 0) {
      await addTransaction({ description: `FX Reserve Sweep`, amount: -closedShift.foreignCurrency.value, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.salesAccount, shiftId: closedShift.id });
      await addTransaction({ description: `FX Reserve (${closedShift.foreignCurrency.comment})`, amount: closedShift.foreignCurrency.value, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.fxAccount, shiftId: closedShift.id });
    }
    for (const bill of closedShift.creditBills) {
      await addTransaction({ description: `Credit Bill Sweep: ${bill.customerName}`, amount: -bill.amount, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.salesAccount, shiftId: closedShift.id });
      await addTransaction({ description: `Guest Receivable: ${bill.customerName}`, amount: bill.amount, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.billsAccount, shiftId: closedShift.id });
    }
    for (const exp of closedShift.expenses) {
      await addTransaction({ description: `Shift Expense: ${exp.description}`, amount: -exp.amount, category: exp.category, date: closedShift.endTime, accountId: flowConfig.cashAccount, shiftId: closedShift.id });
    }
    const totalNonCash = closedShift.cards + closedShift.hikingBar + closedShift.foreignCurrency.value + closedShift.creditBills.reduce((a,b)=>a+b.amount,0);
    const cashSales = closedShift.totalSales - totalNonCash;
    if (cashSales > 0) {
      await addTransaction({ description: `Cash Portion Sweep`, amount: -cashSales, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.salesAccount, shiftId: closedShift.id });
      await addTransaction({ description: `Shift Cash Receipt`, amount: cashSales, category: 'Transfer', date: closedShift.endTime, accountId: flowConfig.cashAccount, shiftId: closedShift.id });
    }
    if (closedShift.difference !== 0) {
       await addTransaction({ description: `Cash Variance Adjustment`, amount: closedShift.difference, category: 'Adjustment', date: closedShift.endTime, accountId: flowConfig.varianceAccount, shiftId: closedShift.id });
       await addTransaction({ description: `Variance Correction in Till`, amount: closedShift.difference, category: 'Adjustment', date: closedShift.endTime, accountId: flowConfig.cashAccount, shiftId: closedShift.id });
    }
    if (mode === 'live') {
      const shiftRef = doc(getArtifactCollection('shifts'), activeShift.id);
      await updateDoc(shiftRef, { status: 'closed', endTime: closedShift.endTime, actualCash: closedShift.actualCash, difference: closedShift.difference, closedBy: closedShift.closedBy, totalSales: closedShift.totalSales });
    } else {
      setShifts(prev => {
        const updated = prev.map(s => s.id === closedShift.id ? closedShift : s);
        localStorage.setItem('mozza_sandbox_shifts', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const resetSandbox = () => {
    localStorage.removeItem('mozza_sandbox_accounts');
    localStorage.removeItem('mozza_sandbox_transactions');
    localStorage.removeItem('mozza_sandbox_shifts');
    localStorage.removeItem('mozza_sandbox_staff');
    localStorage.removeItem('mozza_sandbox_holidays');
    localStorage.removeItem('mozza_sandbox_vendors');
    localStorage.removeItem('mozza_sandbox_expenses');
    localStorage.removeItem('mozza_sandbox_flow');
    setAccounts([]); setTransactions([]); setShifts([]); setStaff([]); setHolidays([]); setVendors([]); setExpenses([]); setFlowConfigState(DEFAULT_FLOW);
    setCurrentPage('dashboard');
  };

  return (
    <AppContext.Provider value={{ 
      mode, user, loading, currentPage, setCurrentPage, toggleMode, login, logout, 
      accounts, transactions, shifts, staff, holidays, activeShift, customers, vendors, expenses, flowConfig, selectedAccountId, 
      setSelectedAccountId, setFlowConfig, addAccount, addTransaction, startShift, updateActiveShift, closeShift,
      resetSandbox,
      addStaff, updateStaff, deleteStaff, toggleHoliday,
      addVendor, deleteVendor, addExpense, deleteExpense
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
