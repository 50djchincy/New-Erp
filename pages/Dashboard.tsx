
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Plus,
  ArrowUpRight,
  MoreHorizontal,
  Receipt,
  AlertCircle,
  Clock,
  Repeat,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard: React.FC = () => {
  const { transactions, expenses, setCurrentPage } = useApp();

  const analytics = useMemo(() => {
    // Current Ledger Stats
    const totalOut = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const payrollOut = transactions.filter(t => t.amount < 0 && t.category === 'Payroll Expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Reminders Stats
    const pendingItems = expenses.filter(e => e.paymentStatus === 'pending');
    const recurringItems = expenses.filter(e => e.paymentStatus === 'recurring');
    const totalRemindersAmt = [...pendingItems, ...recurringItems].reduce((sum, e) => sum + e.amount, 0);

    // Weekly Spend Data
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = days.map(d => ({ name: d, value: 0 }));
    transactions.filter(t => t.amount < 0).forEach(t => {
       const day = days[new Date(t.date).getDay()];
       const entry = chartData.find(c => c.name === day);
       if (entry) entry.value += Math.abs(t.amount);
    });

    return { totalOut, payrollOut, pendingItems, recurringItems, totalRemindersAmt, chartData };
  }, [transactions, expenses]);

  const categoryData = [
    { name: 'Labor', value: analytics.payrollOut, color: '#8B5CF6' },
    { name: 'Operations', value: analytics.totalOut - analytics.payrollOut, color: '#3B82F6' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 font-medium">Real-time operational overview and intelligence.</p>
        </div>
        <button onClick={() => setCurrentPage('expenses')} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-blue-200 transition-all hover:-translate-y-1">
          <Plus size={20} />
          <span>New Entry</span>
        </button>
      </div>

      {/* Operational Alerts */}
      {(analytics.pendingItems.length > 0 || analytics.recurringItems.length > 0) && (
        <section className="animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Operational Alerts</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {analytics.pendingItems.length > 0 && (
               <button onClick={() => setCurrentPage('expenses')} className="flex items-center gap-5 p-6 bg-amber-50 rounded-[2rem] border border-amber-100 hover:bg-amber-100 transition-all text-left shadow-sm group">
                  <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200"><Clock size={28} /></div>
                  <div className="flex-1">
                     <p className="text-xs font-black text-amber-600 uppercase tracking-widest">Unpaid Bills</p>
                     <p className="text-lg font-black text-slate-900">{analytics.pendingItems.length} Pending Settlements</p>
                  </div>
                  <ChevronRight size={20} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
               </button>
             )}
             {analytics.recurringItems.length > 0 && (
               <button onClick={() => setCurrentPage('expenses')} className="flex items-center gap-5 p-6 bg-purple-50 rounded-[2rem] border border-purple-100 hover:bg-purple-100 transition-all text-left shadow-sm group">
                  <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200"><Repeat size={28} /></div>
                  <div className="flex-1">
                     <p className="text-xs font-black text-purple-600 uppercase tracking-widest">Recurring Cycle</p>
                     <p className="text-lg font-black text-slate-900">{analytics.recurringItems.length} Reminders Due</p>
                  </div>
                  <ChevronRight size={20} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
               </button>
             )}
          </div>
        </section>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Outflow" value={`$${analytics.totalOut.toLocaleString()}`} change="Live Ledger" isPositive={false} icon={<DollarSign className="text-blue-600" />} />
        <StatCard title="Total Liability" value={`$${analytics.totalRemindersAmt.toLocaleString()}`} change={`${analytics.pendingItems.length + analytics.recurringItems.length} Active`} isPositive={true} icon={<AlertCircle className="text-amber-600" />} />
        <StatCard title="Staff Salaries" value={`$${analytics.payrollOut.toLocaleString()}`} change="Cycle Active" isPositive={true} icon={<Users className="text-purple-600" />} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900">Expense Heatmap</h3>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase">Weekly View</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-xl font-black text-slate-900 mb-2">Cost Split</h3>
          <p className="text-slate-500 text-sm mb-6 font-medium">Labor vs Operational Distribution</p>
          <div className="h-[200px] w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {categoryData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">{cat.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900">
                  {analytics.totalOut > 0 ? Math.round((cat.value / analytics.totalOut) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-900">Recent Transactions</h3>
          <button onClick={() => setCurrentPage('ledger')} className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">View All</button>
        </div>
        <div className="space-y-6">
          {transactions.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Receipt size={24} />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm truncate max-w-[200px]">{t.description}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className={`font-black text-sm ${t.amount < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                   {t.amount < 0 ? '-' : '+'} ${Math.abs(t.amount).toLocaleString()}
                </p>
                <MoreHorizontal className="text-slate-300" size={20} />
              </div>
            </div>
          ))}
          {transactions.length === 0 && <p className="text-center text-slate-400 py-10 italic">No transactions recorded yet.</p>}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, isPositive, icon }: any) => (
  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 group transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-6">
      <div className="p-4 rounded-2xl bg-slate-50 group-hover:bg-white transition-colors border border-slate-100">{icon}</div>
      <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
        {change}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
    </div>
  </div>
);

export default Dashboard;
