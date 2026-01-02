
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Flame, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Repeat, 
  Receipt, 
  Building2, 
  Tag, 
  Users, 
  Layers, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight,
  Loader2,
  Plus, 
  X,
  PieChart as PieChartIcon,
  FileText,
  CalendarClock,
  Calendar,
  AlertCircle,
  StickyNote,
  Wallet,
  Package,
  ChevronDown,
  Trash2,
  Settings2,
  Edit2,
  Snowflake,
  ShoppingBag,
  Truck,
  Star
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { ExpenseRecord, Vendor } from '../types';

// --- TYPES & DEFAULTS ---

type Preset = {
  id: string;
  label: string;
  amount: number;
  iconName: string;
  color: string;
  bg: string;
  category: string;
};

const DEFAULT_PRESETS: Preset[] = [
  { id: 'p1', label: 'Ice Delivery', amount: 45.00, iconName: 'Snowflake', color: 'text-cyan-600', bg: 'bg-cyan-50', category: 'Inventory' },
  { id: 'p2', label: 'Linen Service', amount: 120.00, iconName: 'ShoppingBag', color: 'text-purple-600', bg: 'bg-purple-50', category: 'Utilities' },
  { id: 'p3', label: 'Gas Refill', amount: 85.50, iconName: 'Flame', color: 'text-red-600', bg: 'bg-red-50', category: 'Utilities' },
  { id: 'p4', label: 'Produce', amount: 0, iconName: 'Truck', color: 'text-emerald-600', bg: 'bg-emerald-50', category: 'Inventory' },
];

const DEFAULT_CATEGORIES = ['Inventory', 'Utilities', 'Staffing', 'Marketing', 'Rent', 'Other'];

// Helper to render icons dynamically
const IconRenderer = ({ name, size = 20 }: { name: string, size?: number }) => {
  switch(name) {
    case 'Snowflake': return <Snowflake size={size} />;
    case 'ShoppingBag': return <ShoppingBag size={size} />;
    case 'Flame': return <Flame size={size} />;
    case 'Truck': return <Truck size={size} />;
    case 'Package': return <Package size={size} />;
    case 'Receipt': return <Receipt size={size} />;
    case 'DollarSign': return <DollarSign size={size} />;
    default: return <Zap size={size} />;
  }
};

export default function Expenses() {
  const { 
    transactions, 
    addTransaction, 
    accounts, 
    expenses, 
    addExpense, 
    deleteExpense, 
    vendors, 
    addVendor, 
    deleteVendor 
  } = useApp();
  
  // --- FORM STATE ---
  const [amount, setAmount] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [category, setCategory] = useState('Inventory');
  const [expenseMode, setExpenseMode] = useState<'paid' | 'pending' | 'recurring'>('paid');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [recurrenceFreq, setRecurrenceFreq] = useState('Monthly');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isInventory, setIsInventory] = useState(false);
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- UI STATE ---
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showVendorManager, setShowVendorManager] = useState(false);
  const [settleItem, setSettleItem] = useState<ExpenseRecord | null>(null);
  const [settleAccountId, setSettleAccountId] = useState('');
  const [isEditingPresets, setIsEditingPresets] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // --- PRESETS STATE ---
  const [presets, setPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem('mozza_expense_presets');
    return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
  });

  useEffect(() => {
    localStorage.setItem('mozza_expense_presets', JSON.stringify(presets));
  }, [presets]);

  // --- CATEGORY CUSTOMIZATION ---
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // --- REPORTING STATE ---
  const [reportView, setReportView] = useState<'category' | 'vendor' | 'source'>('category');

  // Initialize selected account
  useEffect(() => {
    const liquid = accounts.find(a => a.type === 'bank' || a.type === 'asset' || a.type === 'cash');
    if (liquid && !selectedAccountId) setSelectedAccountId(liquid.id);
  }, [accounts, selectedAccountId]);

  // Close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ANALYTICS ---
  const analytics = useMemo(() => {
    let totalOutflow = 0;
    let laborCost = 0;
    let operationalCost = 0;
    const weeklyBurn: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const reportData: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.amount >= 0) return;
      const absAmount = Math.abs(t.amount);
      totalOutflow += absAmount;
      const isLabor = !!t.staffId || ['Payroll Expense', 'Staff Advance', 'Staffing', 'Payroll'].includes(t.category);
      if (isLabor) laborCost += absAmount;
      else operationalCost += absAmount;
      const tDate = new Date(t.date);
      const dayName = tDate.toLocaleDateString('en-US', { weekday: 'short' });
      if (weeklyBurn[dayName] !== undefined) weeklyBurn[dayName] += absAmount;
      let key = t.category;
      if (reportView === 'vendor') key = t.description.split(' (')[0].replace('Business Expense: ', '');
      if (reportView === 'source') key = accounts.find(a => a.id === t.accountId)?.name || 'Unknown';
      reportData[key] = (reportData[key] || 0) + absAmount;
    });

    const heatmapData = Object.entries(weeklyBurn).map(([day, val]) => {
      let intensity = 'bg-slate-50 text-slate-300';
      if (val > 0) intensity = 'bg-emerald-100 text-emerald-600';
      if (val > 500) intensity = 'bg-amber-100 text-amber-600';
      if (val > 2000) intensity = 'bg-red-300 text-red-800';
      return { day, value: val, intensity };
    });

    return { 
      totalOutflow, 
      laborCost, 
      operationalCost, 
      heatmapData, 
      formattedReport: Object.entries(reportData).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    };
  }, [transactions, reportView, accounts]);

  // --- HANDLERS ---

  const handleLogExpense = async () => {
    if (!amount || !vendorName) return;
    setIsSubmitting(true);
    
    try {
      const numericAmount = parseFloat(amount);
      const fullDescription = vendorName + (note ? ` (${note})` : '') + (isInventory ? ' [INVENTORY]' : '');
      
      // Save as preset if toggled
      if (saveAsPreset) {
        const alreadyExists = presets.some(p => p.label.toLowerCase() === vendorName.toLowerCase());
        if (!alreadyExists) {
          const newP: Preset = {
            id: 'p' + Date.now(),
            label: vendorName,
            amount: numericAmount,
            category: category,
            iconName: 'Zap',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
          };
          setPresets(prev => [...prev, newP]);
        }
      }

      if (expenseMode === 'paid') {
        // Immediate financial impact
        await addExpense({
          amount: numericAmount,
          description: fullDescription,
          category,
          date,
          paymentStatus: 'paid',
          accountId: selectedAccountId,
          vendorId: vendors.find(v => v.name === vendorName)?.id
        });
      } else {
        await addExpense({
          amount: numericAmount,
          description: fullDescription + (expenseMode === 'recurring' ? ` [RECURRING: ${recurrenceFreq}]` : ' [PENDING]'),
          category,
          date: expenseMode === 'pending' && dueDate ? dueDate : date,
          paymentStatus: expenseMode,
          accountId: '', 
          vendorId: vendors.find(v => v.name === vendorName)?.id
        });
      }
      
      setAmount('');
      setVendorName('');
      setNote('');
      setDueDate('');
      setIsInventory(false);
      setSaveAsPreset(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettleItem = async () => {
    if (!settleItem || !settleAccountId) return;
    setIsSubmitting(true);
    try {
      await addTransaction({
        description: `Settled: ${settleItem.description.split(' [')[0]}`,
        amount: -settleItem.amount,
        category: settleItem.category,
        date: new Date().toISOString(),
        accountId: settleAccountId
      });
      await deleteExpense(settleItem.id);
      setSettleItem(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePresetClick = (p: Preset) => {
    if (isEditingPresets) {
      if (confirm(`Delete preset "${p.label}"?`)) {
        setPresets(prev => prev.filter(item => item.id !== p.id));
      }
    } else {
      setVendorName(p.label);
      setCategory(p.category);
      if (p.amount > 0) setAmount(p.amount.toString());
    }
  };

  const toggleCategoryEdit = () => {
    setIsEditingCategories(!isEditingCategories);
    setNewCategoryName('');
  };

  const addCategory = () => {
    if (newCategoryName && !categories.includes(newCategoryName)) {
      setCategories([...categories, newCategoryName]);
      setNewCategoryName('');
    }
  };

  const removeCategory = (cat: string) => {
    setCategories(prev => prev.filter(c => c !== cat));
  };

  const liquidAccounts = accounts.filter(a => ['asset', 'bank', 'cash', 'income'].includes(a.type));

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Zap className="text-amber-500" size={32} />
            Unified Operations Canvas
          </h1>
          <p className="text-slate-500 font-medium mt-2 max-w-2xl">
            Consolidated command center for rapid expense entry and financial intelligence.
          </p>
        </div>
        <button 
          onClick={() => setShowVendorManager(true)}
          className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-500 hover:text-blue-600 transition-all flex items-center gap-2 group"
        >
          <Settings2 size={24} className="group-hover:rotate-45 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest hidden md:block">Registry</span>
        </button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Total Outflow" value={`$${analytics.totalOutflow.toLocaleString()}`} icon={<DollarSign size={24} />} theme="dark" />
        <MetricCard title="Operational" value={`$${analytics.operationalCost.toLocaleString()}`} icon={<Layers size={24} />} theme="blue" />
        <MetricCard title="Labor Cost" value={`$${analytics.laborCost.toLocaleString()}`} icon={<Users size={24} />} theme="purple" />
      </div>

      {/* ENTRY & SETTLEMENT */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Terminal */}
        <div className="xl:col-span-7 space-y-6">
           <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100 relative h-full">
             
             <div className={`p-8 relative overflow-hidden text-white transition-colors duration-500 
               ${expenseMode === 'paid' ? 'bg-slate-900' : expenseMode === 'pending' ? 'bg-amber-600' : 'bg-purple-600'}
             `}>
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-white"><Receipt size={140} /></div>
                
                <div className="absolute top-8 right-8 z-10">
                   <div className="relative group flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/20 transition-colors">
                     <Calendar size={16} className="text-white/80" />
                     <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer w-28" />
                   </div>
                </div>

                <label className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2 block">Amount</label>
                <div className="relative flex items-center">
                  <span className="text-4xl md:text-6xl font-black text-white/50 mr-2">$</span>
                  <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-transparent border-none text-4xl md:text-6xl font-black text-white focus:ring-0 placeholder-white/20 p-0 outline-none" />
                </div>
                
                <div className="flex gap-2 mt-8 overflow-x-auto pb-2 scrollbar-hide">
                  <button onClick={() => setExpenseMode('paid')} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${expenseMode === 'paid' ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    <CheckCircle2 size={16} /> Paid Now
                  </button>
                  <button onClick={() => setExpenseMode('pending')} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${expenseMode === 'pending' ? 'bg-white text-amber-700' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    <Clock size={16} /> Pay Later
                  </button>
                  <button onClick={() => setExpenseMode('recurring')} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${expenseMode === 'recurring' ? 'bg-white text-purple-700' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    <Repeat size={16} /> Recurring
                  </button>
                </div>

                {expenseMode === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-white/20 animate-in fade-in slide-in-from-top-2 flex items-center gap-4">
                     <div className="flex-1">
                        <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1 block">Expected Due Date</label>
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none" />
                     </div>
                  </div>
                )}

                {expenseMode === 'recurring' && (
                   <div className="mt-4 pt-4 border-t border-white/20 animate-in fade-in slide-in-from-top-2 flex gap-2">
                      {['Weekly', 'Monthly', 'Yearly'].map(freq => (
                        <button key={freq} onClick={() => setRecurrenceFreq(freq)} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${recurrenceFreq === freq ? 'bg-white text-purple-700' : 'bg-purple-800 text-purple-200'}`}>
                          {freq}
                        </button>
                      ))}
                   </div>
                )}
             </div>
             
             <div className="p-8 space-y-6">
                <div className="space-y-3 relative" ref={suggestionRef}>
                   <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"><Building2 size={14} /> Payee / Vendor</label>
                   <div className="relative">
                     <input 
                       type="text" 
                       placeholder="Select or type new vendor..." 
                       value={vendorName} 
                       onFocus={() => setShowSuggestions(true)}
                       onChange={(e) => { setVendorName(e.target.value); setShowSuggestions(true); }}
                       className="w-full h-16 px-6 bg-slate-50 rounded-2xl text-xl font-bold text-slate-900 border-none outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
                     />
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={20} />
                     </div>
                   </div>

                   {showSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-60 overflow-y-auto">
                        {vendors.filter(v => v.name.toLowerCase().includes(vendorName.toLowerCase())).map((v) => (
                          <button key={v.id} onClick={() => { setVendorName(v.name); setCategory(v.category); setShowSuggestions(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-bold text-slate-700 border-b border-slate-50 last:border-0">{v.name}</button>
                        ))}
                        {vendorName && !vendors.some(v => v.name === vendorName) && (
                          <button onClick={async () => { await addVendor({ name: vendorName, category, status: 'active', color: '#3B82F6' }); setShowSuggestions(false); }} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm font-bold text-blue-600 flex items-center gap-2">
                            <Plus size={14} /> Add "{vendorName}" to Registry
                          </button>
                        )}
                      </div>
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"><Wallet size={14} /> {expenseMode === 'paid' ? 'Source of Funds' : 'Default Target Account'}</label>
                     <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className="w-full h-12 px-4 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 border-none outline-none appearance-none">
                       {liquidAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type.toUpperCase()})</option>)}
                       {liquidAccounts.length === 0 && <option value="">No liquid accounts found</option>}
                     </select>
                  </div>
                  <div className="space-y-2 flex flex-col justify-end">
                     <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 hover:border-blue-200 cursor-pointer transition-all">
                       <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isInventory ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 bg-white'}`}>
                          {isInventory && <CheckCircle2 size={14} />}
                       </div>
                       <input type="checkbox" checked={isInventory} onChange={(e) => setIsInventory(e.target.checked)} className="hidden" />
                       <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Package size={16} className="text-slate-400" /> Receiving Inventory</span>
                     </label>
                  </div>
                </div>

                <div className="space-y-3">
                   <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"><StickyNote size={14} /> Notes</label>
                   <input type="text" placeholder="Details..." value={note} onChange={(e) => setNote(e.target.value)} className="w-full h-12 px-6 bg-slate-50 rounded-xl text-sm font-medium text-slate-900 border-none outline-none" />
                </div>
                
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"><Tag size={14} /> Category</label>
                     <button onClick={toggleCategoryEdit} className={`p-1.5 rounded-lg transition-colors ${isEditingCategories ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>
                       {isEditingCategories ? <CheckCircle2 size={14} /> : <Edit2 size={14} />}
                     </button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {categories.map((c) => (
                        <div key={c} className="relative group">
                          <button onClick={() => !isEditingCategories && setCategory(c)} className={`px-4 py-3 rounded-xl border text-center transition-all ${!isEditingCategories && category === c ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-slate-50 border-transparent text-slate-600'}`}>
                             <span className="text-xs">{c}</span>
                          </button>
                          {isEditingCategories && <button onClick={() => removeCategory(c)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={10} /></button>}
                        </div>
                      ))}
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${saveAsPreset ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-200 bg-slate-50 group-hover:border-amber-300'}`}>
                         <Star size={18} fill={saveAsPreset ? "currentColor" : "none"} />
                      </div>
                      <input type="checkbox" checked={saveAsPreset} onChange={(e) => setSaveAsPreset(e.target.checked)} className="hidden" />
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Save as One-Tap Preset</p>
                        <p className="text-[10px] font-bold text-slate-400">Capture this pattern for the future</p>
                      </div>
                   </label>
                </div>
                
                <button 
                  onClick={handleLogExpense}
                  disabled={isSubmitting || !amount || !vendorName}
                  className={`w-full h-16 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50
                    ${expenseMode === 'paid' ? 'bg-slate-900 text-white' : expenseMode === 'pending' ? 'bg-amber-500 text-white' : 'bg-purple-600 text-white'}
                  `}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <ArrowUpRight size={24} />} 
                  {expenseMode === 'paid' ? 'Log Payout' : 'Set Reminder'}
                </button>
             </div>
           </div>
        </div>

        {/* Right Col: Presets & Settlement */}
        <div className="xl:col-span-5 space-y-8">
          
          {/* One-Tap Presets */}
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-amber-500" />
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">One-Tap Presets</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditingPresets(!isEditingPresets)} className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${isEditingPresets ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    {isEditingPresets ? <CheckCircle2 size={12} /> : <Trash2 size={12} />}
                    {isEditingPresets ? 'Done' : 'Delete Hub'}
                  </button>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                {presets.map((p) => (
                  <button 
                    key={p.id} 
                    onClick={() => handlePresetClick(p)}
                    className={`p-4 bg-white rounded-2xl border transition-all text-left group shadow-sm relative overflow-hidden
                      ${isEditingPresets ? 'border-dashed border-red-300 bg-red-50/20' : 'border-slate-100 hover:border-blue-200 active:scale-95'}
                    `}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${p.bg} ${p.color} transition-transform group-hover:scale-110`}>
                      <IconRenderer name={p.iconName} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{p.label}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.category}</p>
                    </div>
                    {isEditingPresets && (
                      <div className="absolute top-2 right-2 text-red-500 animate-pulse">
                        <Trash2 size={14} />
                      </div>
                    )}
                  </button>
                ))}
                {presets.length === 0 && (
                  <div className="col-span-2 py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 text-xs font-bold uppercase tracking-widest">
                    No presets captured yet
                  </div>
                )}
             </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
             <div className="p-6 border-b border-slate-50 bg-slate-50/50">
               <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                 <CalendarClock size={16} className="text-purple-500" />
                 Settlement Desk
               </h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Reminders Queue</p>
             </div>
             
             <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {expenses.filter(e => e.paymentStatus !== 'paid').length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                    <CheckCircle2 size={32} />
                    <p className="text-xs font-bold">Desk is clear.</p>
                  </div>
                ) : (
                  expenses.filter(e => e.paymentStatus !== 'paid').map((e) => (
                    <button 
                      key={e.id} 
                      onClick={() => { setSettleItem(e); setSettleAccountId(liquidAccounts[0]?.id || ''); }}
                      className="w-full p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-blue-500 hover:shadow-md transition-all text-left"
                    >
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${e.paymentStatus === 'recurring' ? 'bg-purple-500' : 'bg-amber-500'}`}>
                             {e.paymentStatus === 'recurring' ? <Repeat size={18} /> : <Clock size={18} />}
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-700 truncate max-w-[140px]">{e.description}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">{e.category}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-lg font-black text-slate-900">${e.amount.toLocaleString()}</p>
                          <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Settle</span>
                       </div>
                    </button>
                  ))
                )}
             </div>
          </div>
        </div>
      </section>

      {/* EXPLORER */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Transaction Explorer</h3>
        </div>
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 {(['category', 'vendor', 'source'] as const).map(view => (
                   <button key={view} onClick={() => setReportView(view)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${reportView === view ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>
                     {view}
                   </button>
                 ))}
              </div>
              <FileText size={16} className="text-slate-300" />
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar lg:border-r border-slate-100">
                 {analytics.formattedReport.map((item, idx) => (
                   <div key={item.name} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all">
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                         <span className="text-sm font-bold text-slate-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                         <span className="block text-sm font-black text-slate-900">${item.value.toLocaleString()}</span>
                         <div className="w-24 h-1 bg-slate-100 rounded-full mt-1 ml-auto overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item.value / (analytics.totalOutflow || 1)) * 100}%` }} />
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
              <div className="p-8 h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.formattedReport.slice(0, 5)} layout="vertical">
                       <XAxis type="number" hide />
                       <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} width={80} />
                       <Tooltip cursor={{fill: '#f8fafc'}} />
                       <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      </section>

      {/* OPERATIONAL INTELLIGENCE */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Operational Intelligence</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Burn Rate Heatmap */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Flame size={18} className="text-red-500" />
                    Weekly Burn Rate
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ledger Inflow</p>
                  <p className="text-sm font-black text-slate-900">${analytics.totalOutflow.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 md:gap-4 h-40">
                {analytics.heatmapData.map((d) => (
                  <div key={d.day} className="flex flex-col justify-end group cursor-pointer">
                     <div className="relative flex-1 bg-slate-50 rounded-xl overflow-hidden flex flex-col justify-end hover:bg-slate-100 transition-colors">
                        <div 
                          className={`w-full rounded-xl transition-all duration-500 group-hover:opacity-80 ${d.intensity}`}
                          style={{ height: `${d.value === 0 ? 5 : Math.min(100, (d.value / (analytics.totalOutflow || 1)) * 100 * 3)}%` }}
                        />
                     </div>
                     <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 group-hover:text-slate-600 transition-colors">
                       {d.day}
                     </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Labor Ratio Card */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Labor Cost Efficiency</p>
                     <p className="text-xl font-black text-slate-900">
                       {analytics.totalOutflow > 0 ? Math.round((analytics.laborCost / analytics.totalOutflow) * 100) : 0}%
                     </p>
                  </div>
               </div>
               <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(analytics.laborCost / (analytics.totalOutflow || 1)) * 100}%` }} />
               </div>
               <p className="text-xs text-slate-500 font-medium leading-relaxed">
                 {analytics.laborCost / (analytics.totalOutflow || 1) < 0.35 
                    ? "Labor overhead is within optimal operational range." 
                    : "High labor cost detected. Review shift scheduling efficiency."}
               </p>
            </div>
        </div>
      </section>

      {/* MODALS */}
      {settleItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSettleItem(null)} />
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900">Authorize Settlement</h2>
              <button onClick={() => setSettleItem(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl mb-8">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payee</p>
               <p className="text-lg font-black text-slate-900">{settleItem.description.split(' [')[0]}</p>
               <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-2xl font-black text-blue-600">${settleItem.amount.toLocaleString()}</span>
                  <span className="text-[10px] font-black px-2 py-1 bg-white rounded-lg border border-slate-200">{settleItem.category}</span>
               </div>
            </div>
            <div className="space-y-6">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Disburse From</label>
                  <select value={settleAccountId} onChange={(e) => setSettleAccountId(e.target.value)} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-5 text-slate-900 font-bold outline-none">
                    {liquidAccounts.map(a => <option key={a.id} value={a.id}>{a.name} (${a.balance.toLocaleString()})</option>)}
                  </select>
               </div>
               <button onClick={handleSettleItem} disabled={isSubmitting} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                 {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />} 
                 EXECUTE PAYOUT
               </button>
               <button onClick={() => deleteExpense(settleItem.id).then(() => setSettleItem(null))} className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-red-500">Remove from Desk</button>
            </div>
          </div>
        </div>
      )}

      {showVendorManager && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowVendorManager(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900">Supplier Registry</h2>
              <button onClick={() => setShowVendorManager(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
               {vendors.map(v => (
                 <div key={v.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black">{v.name[0]}</div>
                     <div>
                       <p className="font-black text-slate-900 text-sm">{v.name}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{v.category}</p>
                     </div>
                   </div>
                   <button onClick={() => confirm('Delete vendor?') && deleteVendor(v.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                 </div>
               ))}
               {vendors.length === 0 && <div className="py-20 text-center text-slate-400 italic">No registry entries.</div>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const MetricCard = ({ title, value, icon, theme }: any) => {
  const styles = {
    dark: 'bg-slate-900 text-white shadow-xl shadow-slate-200',
    blue: 'bg-blue-50 text-blue-600 border border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border border-purple-100'
  };

  return (
    <div className={`p-8 rounded-[2.5rem] shadow-sm transition-transform hover:scale-[1.02] duration-300 ${(styles as any)[theme]}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</p>
        <h4 className="text-3xl font-black tracking-tight">{value}</h4>
      </div>
    </div>
  );
};
