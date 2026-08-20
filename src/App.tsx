import React, { useState, useEffect } from 'react';
import {
  Bank,
  FinancialAccount,
  TransactionCategory,
  Client,
  Supplier,
  Partner,
  Worker,
  Vehicle,
  PaymentMethod,
  LedgerTransaction,
  AuditLog,
  DailyClosingSession
} from './types';

import { Navigation, NavTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { TransactionForm } from './components/TransactionForm';
import { FinancialTracking } from './components/FinancialTracking';
import { DailyReconciliationView } from './components/DailyReconciliationView';
import { MasterDataView } from './components/MasterDataView';
import { AuditLogView } from './components/AuditLogView';
import { SettingsView } from './components/SettingsView';
import { api } from './services/apiClient';

export default function App() {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const [banks, setBanks] = useState<Bank[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentSession, setCurrentSession] = useState<DailyClosingSession | undefined>();

  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      const [
        banksData,
        accountsData,
        categoriesData,
        clientsData,
        suppliersData,
        partnersData,
        workersData,
        vehiclesData,
        pmData,
        txnsData,
        auditData,
        reconData
      ] = await Promise.all([
        api.getBanks(),
        api.getAccounts(),
        api.getCategories(),
        api.getClients(),
        api.getSuppliers(),
        api.getPartners(),
        api.getWorkers(),
        api.getVehicles(),
        api.getPaymentMethods(),
        api.getTransactions(),
        api.getAuditLogs(),
        api.getReconciliation(todayStr)
      ]);

      setBanks(banksData || []);
      setAccounts(accountsData || []);
      setCategories(categoriesData || []);
      setClients(clientsData || []);
      setSuppliers(suppliersData || []);
      setPartners(partnersData || []);
      setWorkers(workersData || []);
      setVehicles(vehiclesData || []);
      setPaymentMethods(pmData || []);
      setTransactions(txnsData || []);
      setAuditLogs(auditData || []);
      setCurrentSession(reconData?.session);
    } catch (err) {
      console.error('Error loading financial master data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "FBM Cash Flow Systems";
    fetchAllData();
  }, []);

  const totalCash = accounts
    .filter(a => a.accountType === 'CASH' || a.accountType === 'PETTY_CASH')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const totalBank = accounts
    .filter(a => a.accountType === 'BANK' || a.accountType === 'DIGITAL')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const isDayClosed = currentSession?.status === 'CLOSED';

  const handleVoidTxn = async (id: string, reason: string) => {
    try {
      await api.voidTransaction(id, reason, 'Supervisor');
      fetchAllData();
    } catch (err) {
      console.error('Failed to void transaction:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-lg font-bold tracking-wide">Initializing FBM Financial Ledger...</h2>
          <p className="text-xs text-slate-500">Loading master accounts, banks, categories, and audit streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 font-sans text-slate-900 antialiased flex flex-col lg:flex-row selection:bg-indigo-500 selection:text-white">
      {/* Navigation Left Sidebar Menu */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentDate={todayStr}
        isDayClosed={isDayClosed}
        totalCashBalance={totalCash}
        totalBankBalance={totalBank}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardView
            accounts={accounts}
            transactions={transactions}
            setActiveTab={setActiveTab}
            onVoidTxn={handleVoidTxn}
          />
        )}

        {activeTab === 'transaction' && (
          <TransactionForm
            accounts={accounts}
            categories={categories}
            clients={clients}
            suppliers={suppliers}
            partners={partners}
            workers={workers}
            vehicles={vehicles}
            paymentMethods={paymentMethods}
            banks={banks}
            onSuccess={() => setActiveTab('tracking')}
            onRefreshData={fetchAllData}
          />
        )}

        {activeTab === 'tracking' && (
          <FinancialTracking
            accounts={accounts}
            categories={categories}
            clients={clients}
            suppliers={suppliers}
            partners={partners}
            workers={workers}
            vehicles={vehicles}
            paymentMethods={paymentMethods}
            transactionsProp={transactions}
            onVoidTxn={handleVoidTxn}
            onRefreshData={fetchAllData}
          />
        )}

        {activeTab === 'reconciliation' && (
          <DailyReconciliationView onRefreshData={fetchAllData} />
        )}

        {activeTab === 'master' && (
          <MasterDataView
            accounts={accounts}
            banks={banks}
            categories={categories}
            clients={clients}
            suppliers={suppliers}
            partners={partners}
            workers={workers}
            vehicles={vehicles}
            paymentMethods={paymentMethods}
            onRefreshData={fetchAllData}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogView logs={auditLogs} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            accounts={accounts}
            transactionCount={transactions.length}
            auditLogCount={auditLogs.length}
            onRefreshData={fetchAllData}
          />
        )}
      </main>
    </div>
  );
}
