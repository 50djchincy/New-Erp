
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Banknote, 
  Plus, 
  X, 
  Loader2, 
  Save, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Heart,
  Zap,
  CheckCircle2,
  Briefcase,
  ArrowRight,
  UserCheck,
  Wallet,
  AlertCircle,
  CreditCard,
  PlusCircle
} from 'lucide-react';
import { StaffMember, HolidayRecord } from '../types';

const COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', 
  '#EC4899', '#6366F1', '#06B6D4', '#84CC16', '#F97316'
];

interface PayrollConfig {
  staff: StaffMember;
  type: 'SALARY' | 'SERVICE_CHARGE';
  baseAmount: number;
  advancesTotal: number;
  loanRepayment: number;
  sourceId: string;
}

const Modal = ({ title, children, onClose }: { title: string, children?: React.ReactNode, onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
    <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-black text-slate-900">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
      </div>
      {children}
    </div>
  </div>
);

const Staff: React.FC = () => {
  const { 
    staff, 
    holidays, 
    accounts, 
    transactions, 
    addTransaction, 
    addStaff, 
    updateStaff, 
    deleteStaff, 
    toggleHoliday 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'directory' | 'holidays' | 'payroll'>('directory');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStaffForHoliday, setSelectedStaffForHoliday] = useState<string>('');
  
  // Modal States
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState<StaffMember | null>(null);
  const [showLoanModal, setShowLoanModal] = useState<StaffMember | null>(null);
  const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // --- Unified Account Filter for Payouts ---
  const payoutSources = useMemo(() => 
    accounts.filter(a => ['cash', 'bank', 'income', 'asset'].includes(a.type)),
  [accounts]);

  // --- Date Range Logic (15th to 14th) ---
  const periodRange = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    // Start of cycle is 15th of prev month
    const startDate = new Date(year, month - 1, 15);
    // End of cycle is 14th of current month
    const endDate = new Date(year, month, 14);
    return { startDate, endDate };
  }, [currentMonth]);

  const daysInPeriod = useMemo(() => {
    const days: Date[] = [];
    const { startDate, endDate } = periodRange;
    const curr = new Date(startDate);
    while (curr <= endDate) {
      days.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, [periodRange]);

  const getLeaveCount = (staffId: string) => {
    const { startDate, endDate } = periodRange;
    return holidays.filter(h => {
        const hDate = new Date(h.date);
        return h.staffId === staffId && hDate >= startDate && hDate <= endDate;
    }).length;
  };

  const getOutstandingAdvances = (staffId: string) => {
    const staffTxs = transactions.filter(t => 
      t.staffId === staffId && 
      ['Staff Advance', 'Staff Payroll Internal'].includes(t.category)
    );
    const issued = staffTxs.filter(t => t.category === 'Staff Advance').reduce((acc, t) => acc + t.amount, 0);
    const cleared = staffTxs.filter(t => t.category === 'Staff Payroll Internal').reduce((acc, t) => acc + t.amount, 0);
    return Math.max(0, issued - cleared);
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    setActionLoading(true);
    try {
      // Fix: Remove 'isActive' and 'joinedAt' from the addStaff call as they are omitted in the function's parameter type and handled inside the function.
      await addStaff({
        name: formData.get('name') as string,
        role: formData.get('role') as string,
        salary: Number(formData.get('salary')),
        loanBalance: Number(formData.get('loanBalance')) || 0,
        color: COLORS[staff.length % COLORS.length],
      });
      setShowAddStaff(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdvanceModal) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const amount = Number(formData.get('amount'));
    const sourceId = formData.get('source') as string;

    if (!sourceId) {
      alert("Please select a payout source account.");
      return;
    }

    setActionLoading(true);
    try {
      await addTransaction({
        description: `Advance issued to ${showAdvanceModal.name}`,
        amount: -amount,
        category: 'Staff Advance',
        date: new Date().toISOString(),
        accountId: sourceId,
        staffId: showAdvanceModal.id
      });
      setShowAdvanceModal(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGiveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showLoanModal) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const amount = Number(formData.get('amount'));
    const sourceId = formData.get('source') as string;

    if (!sourceId) {
      alert("Please select a payout source account.");
      return;
    }

    setActionLoading(true);
    try {
      await addTransaction({
        description: `Loan given to ${showLoanModal.name}`,
        amount: -amount,
        category: 'Staff Loan',
        date: new Date().toISOString(),
        accountId: sourceId,
        staffId: showLoanModal.id
      });
      await updateStaff(showLoanModal.id, { loanBalance: showLoanModal.loanBalance + amount });
      setShowLoanModal(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const initiatePayroll = (staffId: string, type: 'SALARY' | 'SERVICE_CHARGE') => {
    const s = staff.find(sm => sm.id === staffId);
    if (!s) return;
    const advances = getOutstandingAdvances(staffId);
    
    // Default to the first bank account or any liquid source
    const defaultSourceId = payoutSources.find(a => a.type === 'bank')?.id || payoutSources[0]?.id || '';

    setPayrollConfig({
      staff: s,
      type,
      baseAmount: type === 'SALARY' ? s.salary : 0,
      advancesTotal: advances,
      loanRepayment: 0,
      sourceId: defaultSourceId
    });
  };

  const confirmPayout = async () => {
    if (!payrollConfig) return;
    const { staff: s, type, baseAmount, advancesTotal, loanRepayment, sourceId } = payrollConfig;
    const netPay = baseAmount - advancesTotal - loanRepayment;

    if (!sourceId) {
      alert("Please select a payout source account.");
      return;
    }

    setActionLoading(true);
    try {
      // 1. Pay Net
      if (netPay > 0) {
        await addTransaction({
          description: `${type} Payout (Net): ${s.name}`,
          amount: -netPay,
          category: 'Payroll Expense',
          date: new Date().toISOString(),
          accountId: sourceId,
          staffId: s.id
        });
      }

      // 2. Clear Advance Ledger (Internal Transaction)
      if (advancesTotal > 0) {
        await addTransaction({
            description: `Advance Settled via Payroll: ${s.name}`,
            amount: advancesTotal,
            category: 'Staff Payroll Internal',
            date: new Date().toISOString(),
            accountId: 'internal_staff_ledger', // This is a virtual reference
            staffId: s.id
        });
      }

      // 3. Handle Loan Repayment
      if (loanRepayment > 0) {
        await updateStaff(s.id, { loanBalance: Math.max(0, s.loanBalance - loanRepayment) });
      }

      setPayrollConfig(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Users className="text-purple-600" size={32} />
            Staff Hub
          </h1>
          <p className="text-slate-500 font-medium">Employee directory, attendance & payroll lifecycle.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('directory')} 
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'directory' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Directory
          </button>
          <button 
            onClick={() => setActiveTab('holidays')} 
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'holidays' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Attendance
          </button>
          <button 
            onClick={() => setActiveTab('payroll')} 
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'payroll' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Payroll
          </button>
        </div>
      </div>

      {/* --- DIRECTORY TAB --- */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="bg-purple-50 px-4 py-2 rounded-xl flex items-center gap-2 text-purple-700">
              <CalendarIcon size={16} />
              <span className="text-xs font-black uppercase tracking-widest">
                Cycle: {periodRange.startDate.getDate()} {periodRange.startDate.toLocaleString('default', { month: 'short' })} - {periodRange.endDate.getDate()} {periodRange.endDate.toLocaleString('default', { month: 'short' })}
              </span>
            </div>
            <button 
              onClick={() => setShowAddStaff(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all active:scale-95"
            >
              <PlusCircle size={20} />
              ADD EMPLOYEE
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map(s => (
              <div key={s.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 group relative overflow-hidden transition-all hover:shadow-md">
                <div className="flex items-center gap-5 mb-8">
                  <div 
                    className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white font-black text-2xl shadow-lg" 
                    style={{ backgroundColor: s.color }}
                  >
                    {s.name[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{s.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-slate-50 text-[10px] font-black text-slate-500 px-2 py-0.5 rounded-lg uppercase tracking-widest border border-slate-100">
                        {s.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Basic Salary</span>
                    <span className="text-sm font-black text-slate-900">${s.salary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Balance</span>
                    <span className="text-sm font-black text-red-500">${s.loanBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leaves (Cycle)</span>
                    <span className="text-sm font-black text-purple-600">{getLeaveCount(s.id)} Days</span>
                  </div>
                </div>

                <button 
                  onClick={() => confirm('Remove staff member?') && deleteStaff(s.id)}
                  className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- ATTENDANCE TAB --- */}
      {activeTab === 'holidays' && (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-80 space-y-4">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-fit">
              <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
                <UserCheck className="text-purple-600" size={24} /> 
                Roster
              </h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">Select a staff member to toggle holidays on the cycle calendar.</p>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {staff.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStaffForHoliday(s.id === selectedStaffForHoliday ? '' : s.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                      selectedStaffForHoliday === s.id 
                        ? 'bg-purple-50 border-purple-200 shadow-sm ring-1 ring-purple-100' 
                        : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm" 
                      style={{ backgroundColor: s.color }}
                    >
                      {s.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-slate-900 text-xs uppercase tracking-widest">{s.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{s.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-3">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                 <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Other Staff Off</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-purple-600 shadow-lg shadow-purple-200"></div>
                 <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Selected Staff Off</span>
               </div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {selectedStaffForHoliday 
                    ? `Schedule: ${staff.find(s => s.id === selectedStaffForHoliday)?.name}` 
                    : 'Attendance Overview'}
                </h2>
                <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
                  Cycle ending {currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl self-start">
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} 
                  className="p-3 hover:bg-white rounded-xl text-slate-400 shadow-sm transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-black text-slate-900 min-w-[140px] text-center uppercase tracking-widest">
                  {periodRange.startDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - {periodRange.endDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                </span>
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} 
                  className="p-3 hover:bg-white rounded-xl text-slate-400 shadow-sm transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest pb-4">{d}</div>
              ))}

              {Array.from({ length: daysInPeriod[0].getDay() }).map((_, i) => (
                 <div key={`pad-${i}`} className="min-h-[80px] md:aspect-square" />
              ))}

              {daysInPeriod.map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const dayHolidays = holidays.filter(h => h.date === dateStr);
                const isSelectedStaffOff = selectedStaffForHoliday && dayHolidays.some(h => h.staffId === selectedStaffForHoliday);
                
                return (
                  <div 
                    key={dateStr}
                    onClick={() => selectedStaffForHoliday && toggleHoliday(selectedStaffForHoliday, dateStr)}
                    className={`
                      min-h-[80px] md:aspect-square rounded-2xl p-2 md:p-3 border transition-all flex flex-col justify-between group overflow-hidden
                      ${selectedStaffForHoliday ? 'cursor-pointer hover:border-purple-300 hover:shadow-md active:scale-95' : 'cursor-default opacity-80'}
                      ${isSelectedStaffOff ? 'bg-purple-600 border-purple-600 shadow-lg shadow-purple-100 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}
                    `}
                  >
                    <span className={`text-[10px] md:text-xs font-black ${isSelectedStaffOff ? 'text-white' : 'text-slate-400'}`}>
                      {date.getDate()}
                    </span>
                    
                    <div className="flex flex-wrap gap-1 mt-1 justify-center md:justify-start">
                       {dayHolidays.map(h => {
                          const s = staff.find(sm => sm.id === h.staffId);
                          if (!s || s.id === selectedStaffForHoliday) return null;
                          return (
                             <div 
                               key={h.id} 
                               title={s.name}
                               className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px] md:text-xs font-black text-white shrink-0"
                               style={{ backgroundColor: s.color }}
                             >
                               {s.name[0]}
                             </div>
                          );
                       })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- PAYROLL TAB --- */}
      {activeTab === 'payroll' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-8">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Banknote className="text-emerald-600" size={28} />
              Payroll Center
            </h2>
            <div className="space-y-4">
              {staff.map(s => (
                <div key={s.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-purple-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md" style={{ backgroundColor: s.color }}>{s.name[0]}</div>
                     <div>
                       <p className="font-black text-slate-900 uppercase tracking-widest text-sm">{s.name}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.role}</p>
                     </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     <button 
                       onClick={() => setShowAdvanceModal(s)}
                       className="px-4 py-2 bg-white hover:bg-amber-50 text-amber-600 text-[10px] font-black rounded-xl border border-slate-100 uppercase tracking-widest transition-all flex items-center gap-2"
                     >
                       <Wallet size={14} /> Advance
                     </button>
                     <button 
                       onClick={() => setShowLoanModal(s)}
                       className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 text-[10px] font-black rounded-xl border border-slate-100 uppercase tracking-widest transition-all flex items-center gap-2"
                     >
                       <CreditCard size={14} /> Loan
                     </button>
                     <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />
                     <button onClick={() => initiatePayroll(s.id, 'SALARY')} className="px-4 py-2 bg-purple-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-all shadow-md shadow-purple-100">Pay Salary</button>
                     <button onClick={() => initiatePayroll(s.id, 'SERVICE_CHARGE')} className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-all shadow-md shadow-blue-100">Pay SC</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Zap size={24} className="text-purple-600" />
                Workflow
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                   <div className="shrink-0 w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600"><CheckCircle2 size={14} /></div>
                   <p className="text-xs text-slate-500 font-medium">Advances are auto-deducted from payouts.</p>
                </li>
                <li className="flex gap-3">
                   <div className="shrink-0 w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600"><CheckCircle2 size={14} /></div>
                   <p className="text-xs text-slate-500 font-medium">Loans track long-term debt separate from monthly salary.</p>
                </li>
              </ul>
              <div className="p-6 bg-slate-900 rounded-3xl text-white">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Advances Booked</p>
                <p className="text-2xl font-black">${accounts.reduce((sum, a) => sum + (a.name.toLowerCase().includes('staff') ? a.balance : 0), 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      
      {showAddStaff && (
        <Modal title="New Employee" onClose={() => setShowAddStaff(false)}>
           <form onSubmit={handleAddStaffSubmit} className="space-y-6">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity & Role</label>
                 <input name="name" required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500" placeholder="Full Legal Name" />
                 <input name="role" required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500" placeholder="Job Title (e.g. Waiter)" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Financial Setup</label>
                 <input name="salary" type="number" required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500" placeholder="Basic Salary Per Month" />
                 <input name="loanBalance" type="number" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500" placeholder="Initial Loan Opening (Optional)" />
              </div>
              <button disabled={actionLoading} type="submit" className="w-full py-5 bg-purple-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-purple-100 active:scale-95 transition-all flex items-center justify-center gap-3">
                {actionLoading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />} 
                CREATE ACCOUNT
              </button>
           </form>
        </Modal>
      )}

      {showAdvanceModal && (
        <Modal title="Issue Advance" onClose={() => setShowAdvanceModal(null)}>
           <div className="mb-6 p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black" style={{ backgroundColor: showAdvanceModal.color }}>{showAdvanceModal.name[0]}</div>
                 <div>
                    <p className="font-black text-amber-900 text-sm">{showAdvanceModal.name}</p>
                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest">{showAdvanceModal.role}</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pending</p>
                 <p className="text-xl font-black text-amber-900">${getOutstandingAdvances(showAdvanceModal.id).toLocaleString()}</p>
              </div>
           </div>
           <form onSubmit={handleIssueAdvance} className="space-y-6">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount to Pay</label>
                 <input name="amount" type="number" required className="w-full bg-slate-50 border-none rounded-3xl px-8 py-6 text-4xl font-black text-slate-900 outline-none" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payout Source</label>
                 <select name="source" required className="w-full h-14 bg-slate-50 border-none rounded-2xl px-5 text-slate-900 font-bold">
                    <option value="">Select Payout Source...</option>
                    {payoutSources.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (${a.balance.toLocaleString()})</option>
                    ))}
                 </select>
                 {payoutSources.length === 0 && <p className="text-[10px] text-red-500 font-bold mt-1">Setup source accounts in Money Lab first.</p>}
              </div>
              <button disabled={actionLoading || payoutSources.length === 0} type="submit" className="w-full py-5 bg-amber-500 text-white rounded-[1.5rem] font-black shadow-xl shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-3">
                {actionLoading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />} DISBURSE ADVANCE
              </button>
           </form>
        </Modal>
      )}

      {showLoanModal && (
        <Modal title="Issue New Loan" onClose={() => setShowLoanModal(null)}>
           <div className="mb-6 p-6 bg-red-50 rounded-3xl border border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black" style={{ backgroundColor: showLoanModal.color }}>{showLoanModal.name[0]}</div>
                 <div>
                    <p className="font-black text-red-900 text-sm">{showLoanModal.name}</p>
                    <p className="text-[10px] text-red-700 font-bold uppercase tracking-widest">Current Balance</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Outstanding</p>
                 <p className="text-xl font-black text-red-900">${showLoanModal.loanBalance.toLocaleString()}</p>
              </div>
           </div>
           <form onSubmit={handleGiveLoan} className="space-y-6">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loan Amount</label>
                 <input name="amount" type="number" required className="w-full bg-slate-50 border-none rounded-3xl px-8 py-6 text-4xl font-black text-slate-900 outline-none" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payout Source</label>
                 <select name="source" required className="w-full h-14 bg-slate-50 border-none rounded-2xl px-5 text-slate-900 font-bold">
                    <option value="">Select Payout Source...</option>
                    {payoutSources.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (${a.balance.toLocaleString()})</option>
                    ))}
                 </select>
                 {payoutSources.length === 0 && <p className="text-[10px] text-red-500 font-bold mt-1">Setup source accounts in Money Lab first.</p>}
              </div>
              <button disabled={actionLoading || payoutSources.length === 0} type="submit" className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-red-100 active:scale-95 transition-all flex items-center justify-center gap-3">
                {actionLoading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />} ISSUE LOAN
              </button>
           </form>
        </Modal>
      )}

      {payrollConfig && (
        <Modal title="Disburse Payout" onClose={() => setPayrollConfig(null)}>
           <div className="mb-8 flex items-center gap-5">
              <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white font-black text-2xl shadow-lg" style={{ backgroundColor: payrollConfig.staff.color }}>
                {payrollConfig.staff.name[0]}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{payrollConfig.staff.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{payrollConfig.type.replace('_', ' ')} Processing</p>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex justify-between p-4 bg-slate-50 rounded-2xl">
                 <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Base Payout</span>
                 <input 
                    type="number" 
                    value={payrollConfig.baseAmount}
                    onChange={(e) => setPayrollConfig({...payrollConfig, baseAmount: Number(e.target.value)})}
                    className="w-24 text-right bg-transparent border-none font-black text-slate-900 focus:ring-0 p-0"
                 />
              </div>
              <div className="flex justify-between p-4 bg-amber-50 rounded-2xl">
                 <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Deduct Advances</span>
                 <span className="font-black text-amber-900">-${payrollConfig.advancesTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-4 bg-red-50 rounded-2xl">
                 <span className="text-xs font-black text-red-600 uppercase tracking-widest">Loan Repayment</span>
                 <input 
                    type="number" 
                    value={payrollConfig.loanRepayment}
                    onChange={(e) => setPayrollConfig({...payrollConfig, loanRepayment: Number(e.target.value)})}
                    className="w-24 text-right bg-transparent border-none font-black text-red-900 focus:ring-0 p-0"
                 />
              </div>
              
              <div className="pt-4 border-t border-slate-100 mt-6">
                 <div className="p-6 bg-emerald-600 rounded-[2rem] text-white shadow-xl shadow-emerald-100 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Final Net Payout</p>
                       <p className="text-3xl font-black">
                         ${(payrollConfig.baseAmount - payrollConfig.advancesTotal - payrollConfig.loanRepayment).toLocaleString()}
                       </p>
                    </div>
                    <ArrowRight size={24} />
                 </div>
              </div>

              <div className="space-y-1.5 mt-6">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Disburse From</label>
                 <select 
                    value={payrollConfig.sourceId}
                    onChange={(e) => setPayrollConfig({...payrollConfig, sourceId: e.target.value})}
                    className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-slate-900 font-bold"
                 >
                    <option value="">Select Payout Source...</option>
                    {payoutSources.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (${a.balance.toLocaleString()})</option>
                    ))}
                 </select>
              </div>

              <button 
                onClick={confirmPayout}
                disabled={actionLoading || payoutSources.length === 0}
                className="w-full mt-6 py-5 bg-slate-900 text-white rounded-[2rem] font-black shadow-2xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />} 
                AUTHORIZE SWEEP
              </button>
           </div>
        </Modal>
      )}
    </div>
  );
};

export default Staff;
