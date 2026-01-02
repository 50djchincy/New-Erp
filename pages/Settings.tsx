
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings as SettingsIcon, 
  Map, 
  ChevronRight, 
  ArrowRightLeft,
  DollarSign,
  CreditCard,
  Beer,
  Globe,
  Users,
  Wallet,
  AlertTriangle,
  Info,
  Save,
  CheckCircle2,
  PlusCircle,
  Trash2,
  RefreshCcw
} from 'lucide-react';
import { ShiftFlowConfig } from '../types';

const Settings: React.FC = () => {
  const { flowConfig, setFlowConfig, accounts, setCurrentPage, mode, resetSandbox } = useApp();
  const [localFlowConfig, setLocalFlowConfig] = useState<ShiftFlowConfig>(flowConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setLocalFlowConfig(flowConfig);
  }, [flowConfig]);

  const handleUpdate = (key: keyof ShiftFlowConfig, value: string) => {
    setLocalFlowConfig(prev => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setFlowConfig(localFlowConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save flow configuration", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    resetSandbox();
    setShowResetConfirm(false);
  };

  const hasChanges = JSON.stringify(localFlowConfig) !== JSON.stringify(flowConfig);

  const sections = [
    { key: 'salesAccount', label: 'Gross Sales Target', icon: <DollarSign className="text-blue-500" />, desc: 'Primary account for recording daily revenue' },
    { key: 'cardsAccount', label: 'Card Settlements', icon: <CreditCard className="text-purple-500" />, desc: 'Destination for bank transfers and credit cards' },
    { key: 'hikingAccount', label: 'Hiking Bar Transfers', icon: <Beer className="text-orange-500" />, desc: 'Ledger for internal hiking transfers' },
    { key: 'fxAccount', label: 'Foreign Currency Reserve', icon: <Globe className="text-indigo-500" />, desc: 'Vault for non-base currency collections' },
    { key: 'billsAccount', label: 'Credit Bill Receivables', icon: <Users className="text-emerald-500" />, desc: 'Pending guest balances account' },
    { key: 'cashAccount', label: 'Main Cash Till', icon: <Wallet className="text-slate-700" />, desc: 'Final destination for physical cash' },
    { key: 'varianceAccount', label: 'Variance/Shortage Log', icon: <AlertTriangle className="text-red-500" />, desc: 'Account for tracking cash discrepancies' },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 font-medium">Control your operational parameters</p>
        </div>
      </div>

      {/* Shift Flow Config Card */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Map size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Shift Flow Editor</h2>
              <p className="text-sm text-slate-400 font-medium">Define automatic fund sweeps upon shift closure</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all transform active:scale-95 ${
              saveSuccess 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
                : hasChanges 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 size={20} />
            ) : (
              <Save size={20} />
            )}
            <span>{saveSuccess ? 'Saved' : isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-slate-100 rounded-[2rem]">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <Wallet size={32} />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-bold text-slate-900">No Accounts Found</h3>
              <p className="text-sm text-slate-400">You need to create accounts in the Money Lab before configuring the shift flow.</p>
            </div>
            <button 
              onClick={() => setCurrentPage('moneylab')}
              className="flex items-center gap-2 text-blue-600 font-black text-sm uppercase tracking-widest hover:underline"
            >
              <PlusCircle size={16} />
              Go to Money Lab
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
            {sections.map((sec) => (
              <div key={sec.key} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50">
                    {sec.icon}
                  </div>
                  <div>
                    <label className="text-sm font-black text-slate-700 block leading-tight">{sec.label}</label>
                    <p className="text-[10px] text-slate-400 font-medium">{sec.desc}</p>
                  </div>
                </div>
                
                <select 
                  className={`w-full h-12 px-4 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 transition-colors ${
                    (localFlowConfig as any)[sec.key] !== (flowConfig as any)[sec.key] 
                      ? 'bg-blue-50/50 ring-1 ring-blue-100' 
                      : 'bg-slate-50'
                  }`}
                  value={(localFlowConfig as any)[sec.key]}
                  onChange={(e) => handleUpdate(sec.key as keyof ShiftFlowConfig, e.target.value)}
                >
                  <option value="">Select Target Account...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 p-6 bg-slate-50 rounded-3xl flex gap-4 border border-slate-100">
          <Info className="text-blue-500 shrink-0" size={24} />
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">How Sweep Logic Works</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Upon closing a shift, Mozzarella creates a series of automated transactions based on the configuration above. 
              It records the <strong>Total Sales</strong> to your designated target account, then immediately sweeps the non-cash portions 
              (Cards, Bills, Hiking) to their respective ledgers, ensuring your <strong>Main Cash Till</strong> accurately reflects physical cash on hand.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone / Reset Sandbox */}
      {mode === 'sandbox' && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-red-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                <Trash2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Danger Zone</h2>
                <p className="text-sm text-slate-400 font-medium">Reset your sandbox operational environment</p>
              </div>
            </div>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 transition-all active:scale-95"
              >
                <RefreshCcw size={20} />
                <span>Reset Sandbox Data</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-6 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="px-8 py-4 rounded-2xl font-black bg-red-600 text-white shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Trash2 size={20} />
                  CONFIRM WIPE
                </button>
              </div>
            )}
          </div>
          
          {showResetConfirm && (
            <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-700 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              ⚠️ WARNING: This will permanently delete all sandbox accounts, transactions, and shifts. This action cannot be undone.
            </div>
          )}
        </div>
      )}

      {/* General Configuration (Disabled/Dummy) */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 opacity-50 pointer-events-none">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-900">General Configuration</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <span className="font-bold text-slate-700">Multi-currency Support</span>
            <div className="w-12 h-6 bg-slate-200 rounded-full" />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <span className="font-bold text-slate-700">Push Notifications</span>
            <div className="w-12 h-6 bg-blue-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
