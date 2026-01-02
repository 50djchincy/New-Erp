
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MoneyLab from './pages/MoneyLab';
import Ledger from './pages/Ledger';
import DailyOps from './pages/DailyOps';
import Settings from './pages/Settings';
import Staff from './pages/Staff';
import Expenses from './pages/Expenses';

const AppContent: React.FC = () => {
  const { user, loading, currentPage } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl animate-bounce flex items-center justify-center shadow-xl shadow-blue-200">
          <span className="text-white font-bold text-2xl">M</span>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Initializing Lab...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'dailyops' && <DailyOps />}
      {currentPage === 'staff' && <Staff />}
      {currentPage === 'expenses' && <Expenses />}
      {currentPage === 'moneylab' && <MoneyLab />}
      {currentPage === 'ledger' && <Ledger />}
      {currentPage === 'settings' && <Settings />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
