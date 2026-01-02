
import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  Settings as SettingsIcon, 
  LogOut,
  ChevronRight,
  Beaker,
  Zap,
  Users
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, mode, logout, currentPage, setCurrentPage } = useApp();

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col pb-20 md:pb-0 md:pl-64">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-[1.2rem] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100">
              M
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter">Mozzarella</h1>
          </div>

          <nav className="space-y-2">
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={currentPage === 'dashboard'} 
              onClick={() => setCurrentPage('dashboard')}
            />
            <NavItem 
              icon={<Zap size={20} />} 
              label="Daily Ops" 
              active={currentPage === 'dailyops'} 
              onClick={() => setCurrentPage('dailyops')}
            />
            <NavItem 
              icon={<Users size={20} />} 
              label="Staff Hub" 
              active={currentPage === 'staff'} 
              onClick={() => setCurrentPage('staff')}
            />
            <NavItem 
              icon={<Receipt size={20} />} 
              label="Expenses" 
              active={currentPage === 'expenses'} 
              onClick={() => setCurrentPage('expenses')}
            />
            <NavItem 
              icon={<Beaker size={20} />} 
              label="Money Lab" 
              active={currentPage === 'moneylab' || currentPage === 'ledger'} 
              onClick={() => setCurrentPage('moneylab')}
            />
            <NavItem 
              icon={<SettingsIcon size={20} />} 
              label="Settings" 
              active={currentPage === 'settings'} 
              onClick={() => setCurrentPage('settings')}
            />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <img src={user?.photoURL || 'https://picsum.photos/100'} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm" alt="Profile" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">{user?.displayName}</p>
              <p className="text-[10px] font-black text-slate-400 truncate uppercase tracking-widest">{mode}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-600 transition-all w-full p-2 font-black text-[10px] uppercase tracking-widest"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Top Bar - Mobile Only */}
      <header className="md:hidden bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            M
          </div>
          <span className="font-black text-slate-900 tracking-tighter">Mozzarella</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${mode === 'sandbox' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
            {mode}
          </span>
          <img src={user?.photoURL || 'https://picsum.photos/100'} className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm" alt="Profile" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-10 lg:p-12 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-around items-center h-20 px-2 z-50">
        <BottomNavItem 
          icon={<LayoutDashboard size={22} />} 
          label="Home" 
          active={currentPage === 'dashboard'} 
          onClick={() => setCurrentPage('dashboard')}
        />
        <BottomNavItem 
          icon={<Zap size={22} />} 
          label="Ops" 
          active={currentPage === 'dailyops'} 
          onClick={() => setCurrentPage('dailyops')}
        />
        <BottomNavItem 
          icon={<Receipt size={22} />} 
          label="Pay" 
          active={currentPage === 'expenses'} 
          onClick={() => setCurrentPage('expenses')}
        />
        <BottomNavItem 
          icon={<Users size={22} />} 
          label="Staff" 
          active={currentPage === 'staff'} 
          onClick={() => setCurrentPage('staff')}
        />
        <BottomNavItem 
          icon={<Beaker size={22} />} 
          label="Lab" 
          active={currentPage === 'moneylab'} 
          onClick={() => setCurrentPage('moneylab')}
        />
      </nav>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${active ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-black text-xs uppercase tracking-widest">{label}</span>
    </div>
    {active && <ChevronRight size={14} />}
  </button>
);

const BottomNavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-90 ${active ? 'text-blue-600' : 'text-slate-400'}`}
  >
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-blue-50' : ''}`}>
      {icon}
    </div>
    <span className="text-[9px] mt-1 font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default Layout;
