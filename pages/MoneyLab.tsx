
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Layers, 
  Coins, 
  Wallet,
  X,
  PlusCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { AccountType } from '../types';

const MoneyLab: React.FC = () => {
  const { accounts, addAccount, setSelectedAccountId, setCurrentPage } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    type: 'asset' as AccountType
  });

  const accountTypes: { id: AccountType; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    { 
      id: 'receivable', 
      label: 'Receivables', 
      icon: <ArrowDownLeft size={20} />, 
      color: 'text-emerald-600 bg-emerald-50',
      desc: 'Money others owe you (Pending receiving)'
    },
    { 
      id: 'income', 
      label: 'Income Accounts', 
      icon: <Coins size={20} />, 
      color: 'text-blue-600 bg-blue-50',
      desc: 'Revenue tracking accounts'
    },
    { 
      id: 'payable', 
      label: 'Payables', 
      icon: <ArrowUpRight size={20} />, 
      color: 'text-red-600 bg-red-50',
      desc: 'Money you owe (Pending payments)'
    },
    { 
      id: 'asset', 
      label: 'Asset Accounts', 
      icon: <Layers size={20} />, 
      color: 'text-purple-600 bg-purple-50',
      desc: 'Equipment, inventory, property'
    }
  ];

  const handleAccountClick = (id: string) => {
    setSelectedAccountId(id);
    setCurrentPage('ledger');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addAccount({
      name: formData.name,
      balance: parseFloat(formData.balance) || 0,
      type: formData.type
    });
    setFormData({ name: '', balance: '', type: 'asset' });
    setIsModalOpen(false);
  };

  const groupedAccounts = accounts.reduce((acc, curr) => {
    if (!acc[curr.type]) acc[curr.type] = [];
    acc[curr.type].push(curr);
    return acc;
  }, {} as Record<string, typeof accounts>);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Money Lab</h1>
          <p className="text-slate-500 font-medium">Manage your restaurant financial ecosystem</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-1"
        >
          <PlusCircle size={20} />
          <span>Setup Account</span>
        </button>
      </div>

      {/* Account Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {accountTypes.map((type) => {
          const count = accounts.filter(a => a.type === type.id).length;
          const total = accounts.filter(a => a.type === type.id).reduce((sum, a) => sum + a.balance, 0);
          
          return (
            <div key={type.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className={`p-4 rounded-2xl mb-4 ${type.color}`}>
                {type.icon}
              </div>
              <h3 className="font-bold text-slate-900">{type.label}</h3>
              <p className="text-xs text-slate-400 mb-4">{type.desc}</p>
              <div className="mt-auto">
                <p className="text-lg font-bold text-slate-900">${total.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{count} Accounts</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Lists */}
      <div className="space-y-10">
        {accountTypes.map((type) => (
          <div key={type.id + "_list"} className="space-y-4">
            <div className="flex items-center gap-3 ml-2">
              <div className={`p-2 rounded-lg ${type.color}`}>
                {React.cloneElement(type.icon as React.ReactElement<any>, { size: 16 })}
              </div>
              <h2 className="text-lg font-bold text-slate-800">{type.label}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedAccounts[type.id]?.length > 0 ? (
                groupedAccounts[type.id].map((acc) => (
                  <div 
                    key={acc.id} 
                    onClick={() => handleAccountClick(acc.id)}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-200 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{acc.name}</p>
                      <p className="text-xs text-slate-400">Created {new Date(acc.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`font-bold text-lg ${type.id === 'payable' ? 'text-red-500' : 'text-slate-900'}`}>
                        ${acc.balance.toLocaleString()}
                      </p>
                      <ChevronRight size={16} className="text-slate-200 group-hover:text-blue-400" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 px-4 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                  <HelpCircle size={32} className="mb-2 opacity-20" />
                  <p className="text-sm font-medium">No accounts in this category yet</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">New Account</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Account Name</label>
                <input 
                  autoFocus
                  required
                  type="text"
                  placeholder="e.g. Main Sales"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full h-12 px-5 bg-slate-50 border-none rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Starting Balance</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.balance}
                    onChange={e => setFormData({...formData, balance: e.target.value})}
                    className="w-full h-12 pl-10 pr-5 bg-slate-50 border-none rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {accountTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({...formData, type: type.id})}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        formData.type === type.id 
                        ? 'border-blue-500 bg-blue-50 text-blue-600' 
                        : 'border-slate-50 bg-slate-50 text-slate-500 grayscale'
                      }`}
                    >
                      {React.cloneElement(type.icon as React.ReactElement<any>, { size: 16 })}
                      <span className="text-xs font-bold whitespace-nowrap">{type.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:-translate-y-0.5 mt-4"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyLab;
