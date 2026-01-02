
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
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mozzarella</h1>
          </div>

          <nav className="space-y-1">
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
              icon={<Beaker size={20} />} 
              label="Money Lab" 
              active={currentPage === 'moneylab' || currentPage === 'ledger'} 
              onClick={() => setCurrentPage('moneylab')}
            />
            <NavItem icon={<Receipt size={20} />} label="Expenses" active={currentPage === 'expenses'} />
            <NavItem 
              icon={<SettingsIcon size={20} />} 
              label="Settings" 
              active={currentPage === 'settings'} 
              onClick={() => setCurrentPage('settings')}
            />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6 p-2 rounded-xl bg-slate-50">
            <img src={user?.photoURL || 'https://picsum.photos/100'} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Profile" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.displayName}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{mode} Mode</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors w-full p-2"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Top Bar - Mobile Only */}
      <header className="md:hidden bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            M
          </div>
          <span className="font-bold text-slate-900">Mozzarella</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${mode === 'sandbox' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
            {mode}
          </span>
          <img src={user?.photoURL || 'https://picsum.photos/100'} className="w-8 h-8 rounded-full border border-slate-200 shadow-sm" alt="Profile" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 px-2 z-50">
        <BottomNavItem 
          icon={<LayoutDashboard size={24} />} 
          label="Home" 
          active={currentPage === 'dashboard'} 
          onClick={() => setCurrentPage('dashboard')}
        />
        <BottomNavItem 
          icon={<Zap size={24} />} 
          label="Ops" 
          active={currentPage === 'dailyops'} 
          onClick={() => setCurrentPage('dailyops')}
        />
        <BottomNavItem 
          icon={<Users size={24} />} 
          label="Staff" 
          active={currentPage === 'staff'} 
          onClick={() => setCurrentPage('staff')}
        />
        <BottomNavItem 
          icon={<Beaker size={24} />} 
          label="Lab" 
          active={currentPage === 'moneylab'} 
          onClick={() => setCurrentPage('moneylab')}
        />
        <BottomNavItem 
          icon={<SettingsIcon size={24} />} 
          label="Settings" 
          active={currentPage === 'settings'} 
          onClick={() => setCurrentPage('settings')}
        />
      </nav>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${active ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </div>
    {active && <ChevronRight size={16} />}
  </button>
);

const BottomNavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`}
  >
    {icon}
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </button>
);

export default Layout;
