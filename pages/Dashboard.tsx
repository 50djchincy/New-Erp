
import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Plus,
  ArrowUpRight,
  MoreHorizontal,
  // Added Receipt to fix "Cannot find name 'Receipt'" error
  Receipt
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

const data = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 5000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 6890 },
  { name: 'Sat', value: 8390 },
  { name: 'Sun', value: 7490 },
];

const categoryData = [
  { name: 'Food & Bev', value: 45, color: '#3B82F6' },
  { name: 'Staffing', value: 30, color: '#8B5CF6' },
  { name: 'Utilities', value: 15, color: '#10B981' },
  { name: 'Marketing', value: 10, color: '#F59E0B' },
];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 font-medium">Monthly overview for August 2024</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-1">
          <Plus size={20} />
          <span>New Expense</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Spending" 
          value="$24,592" 
          change="+12.5%" 
          isPositive={false}
          icon={<DollarSign className="text-blue-600" />}
        />
        <StatCard 
          title="Avg. Daily Cost" 
          value="$820" 
          change="-2.4%" 
          isPositive={true}
          icon={<TrendingUp className="text-emerald-600" />}
        />
        <StatCard 
          title="Staff Salaries" 
          value="$12,400" 
          change="0%" 
          isPositive={true}
          icon={<Users className="text-purple-600" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Expense Trends</h3>
            <select className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-500 p-2 cursor-pointer focus:ring-1 focus:ring-blue-500">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94A3B8', fontSize: 12}}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Chart */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Category Split</h3>
          <p className="text-slate-500 text-sm mb-6">Top spending departments</p>
          <div className="h-[200px] w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
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
                  <span className="text-sm font-semibold text-slate-700">{cat.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-slate-900">Recent Transactions</h3>
          <button className="text-blue-600 font-bold text-sm hover:underline">View All</button>
        </div>
        <div className="space-y-6">
          <TransactionItem 
            title="Whole Foods Market" 
            subtitle="Supplies • 2 hours ago" 
            amount="- $342.12" 
            color="text-red-600"
          />
          <TransactionItem 
            title="City Utility - Water" 
            subtitle="Utilities • Aug 14, 2024" 
            amount="- $1,120.00" 
            color="text-red-600"
          />
          <TransactionItem 
            title="Refund - Sysco" 
            subtitle="Inventory • Aug 12, 2024" 
            amount="+ $89.00" 
            color="text-emerald-600"
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, isPositive, icon }: any) => (
  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 group transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-white transition-colors">
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {change}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
      <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
    </div>
  </div>
);

const TransactionItem = ({ title, subtitle, amount, color }: any) => (
  <div className="flex items-center justify-between group cursor-pointer">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        <Receipt size={24} />
      </div>
      <div>
        <p className="font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <p className={`font-bold ${color}`}>{amount}</p>
      <MoreHorizontal className="text-slate-300" size={20} />
    </div>
  </div>
);

export default Dashboard;
