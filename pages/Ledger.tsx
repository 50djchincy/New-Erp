
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Tag, 
  FileText, 
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Receipt,
  Download,
  Filter,
  X
} from 'lucide-react';

const Ledger: React.FC = () => {
  const { 
    accounts, 
    transactions, 
    selectedAccountId, 
    setSelectedAccountId, 
    setCurrentPage, 
    addTransaction 
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Operation',
    date: new Date().toISOString().split('T')[0]
  });

  const account = accounts.find(a => a.id === selectedAccountId);
  const accountTransactions = transactions.filter(t => t.accountId === selectedAccountId);
  
  // Calculate running balance logic
  const runningTransactions = [...accountTransactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let tempBalance = account?.balance || 0;
  // This is a bit tricky since we don't have the "initial" balance vs "current" balance split well in this simplified model.
  // For now, let's just list them and show the current total balance at top.

  const handleBack = () => {
    setSelectedAccountId(null);
    setCurrentPage('moneylab');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;

    await addTransaction({
      description: formData.description,
      amount: parseFloat(formData.amount) || 0,
      category: formData.category,
      date: formData.date,
      accountId: selectedAccountId
    });

    setFormData({
      description: '',
      amount: '',
      category: 'Operation',
      date: new Date().toISOString().split('T')[0]
    });
    setIsAddModalOpen(false);
  };

  if (!account) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
      <p>Account not found</p>
      <button onClick={handleBack} className="text-blue-600 font-bold mt-4">Go Back</button>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={handleBack}
          className="p-2 hover:bg-white rounded-xl text-slate-500 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{account.name} Ledger</h1>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 text-slate-600`}>
              {account.type}
            </span>
            <p className="text-slate-400 text-sm font-medium">History & Entries</p>
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Balance</p>
          <h2 className={`text-4xl font-black ${account.type === 'payable' ? 'text-red-500' : 'text-slate-900'}`}>
            ${account.balance.toLocaleString()}
          </h2>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-5 py-3 rounded-2xl font-bold transition-all">
            <Download size={18} />
            <span>Export</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-1"
          >
            <Plus size={18} />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-2">
        <h3 className="font-bold text-slate-900">Transaction History</h3>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-slate-600"><Filter size={20} /></button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="hidden md:grid grid-cols-4 gap-4 px-8 py-4 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span>Date</span>
          <span>Description</span>
          <span>Category</span>
          <span className="text-right">Amount</span>
        </div>
        
        <div className="divide-y divide-slate-50">
          {accountTransactions.length > 0 ? (
            accountTransactions.map((t) => (
              <div key={t.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 px-8 py-5 items-center group hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="md:hidden w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <Calendar size={18} />
                  </div>
                  <span className="text-sm font-semibold text-slate-500">
                    {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900">{t.description}</span>
                  <span className="md:hidden text-xs text-slate-400">{t.category}</span>
                </div>

                <div className="hidden md:flex items-center">
                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">{t.category}</span>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4">
                  <span className={`font-bold text-lg ${t.amount < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {t.amount < 0 ? '-' : '+'} ${Math.abs(t.amount).toLocaleString()}
                  </span>
                  <button className="p-1 text-slate-200 group-hover:text-slate-400 transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300">
              <Receipt size={48} className="mb-4 opacity-20" />
              <p className="font-medium">No transactions found for this account</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">New Entry</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    autoFocus
                    required
                    type="text"
                    placeholder="e.g. Payment from Supplier"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full h-12 pl-12 pr-5 bg-slate-50 border-none rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                      className="w-full h-12 pl-10 pr-5 bg-slate-50 border-none rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <input 
                    required
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full h-12 px-4 bg-slate-50 border-none rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full h-12 px-4 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                >
                  <option>Operation</option>
                  <option>Inventory</option>
                  <option>Payroll</option>
                  <option>Revenue</option>
                  <option>Marketing</option>
                  <option>Utilities</option>
                  <option>Other</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:-translate-y-0.5 mt-4"
              >
                Add Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ledger;
