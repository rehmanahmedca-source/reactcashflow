import React from 'react';
import {
  Wallet,
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  PlusCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert
} from 'lucide-react';
import { FinancialAccount, LedgerTransaction } from '../types';
import { NavTab } from './Navigation';

interface DashboardViewProps {
  accounts: FinancialAccount[];
  transactions: LedgerTransaction[];
  setActiveTab: (tab: NavTab) => void;
  onVoidTxn: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  transactions,
  setActiveTab,
  onVoidTxn
}) => {
  const cashAccounts = accounts.filter(a => a.accountType === 'CASH' || a.accountType === 'PETTY_CASH');
  const bankAccounts = accounts.filter(a => a.accountType === 'BANK' || a.accountType === 'DIGITAL');

  const totalCash = cashAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalBank = bankAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalLiquidity = totalCash + totalBank;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTxns = transactions.filter(t => t.date === todayStr && t.status === 'POSTED');

  const todayIn = todayTxns.filter(t => t.direction === 'IN').reduce((sum, t) => sum + t.amount, 0);
  const todayOut = todayTxns.filter(t => t.direction === 'OUT').reduce((sum, t) => sum + t.amount, 0);
  const todayNet = todayIn - todayOut;

  const recentTxns = transactions.slice(0, 7);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Liquidity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Net Liquidity</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              Rs. {totalLiquidity.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Cash: <strong className="text-slate-700">Rs. {totalCash.toLocaleString()}</strong></span>
              <span>•</span>
              <span>Bank: <strong className="text-slate-700">Rs. {totalBank.toLocaleString()}</strong></span>
            </p>
          </div>
        </div>

        {/* Today's Receipts (IN) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Receipts (IN)</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-emerald-600 font-mono tracking-tight">
              + Rs. {todayIn.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {todayTxns.filter(t => t.direction === 'IN').length} posted IN transaction(s) today
            </p>
          </div>
        </div>

        {/* Today's Payments (OUT) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Payments (OUT)</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-rose-600 font-mono tracking-tight">
              - Rs. {todayOut.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {todayTxns.filter(t => t.direction === 'OUT').length} posted OUT transaction(s) today
            </p>
          </div>
        </div>

        {/* Net Today Position */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Today Cash Movement</span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${todayNet >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <ArrowRightLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-extrabold font-mono tracking-tight ${todayNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {todayNet >= 0 ? '+' : ''} Rs. {todayNet.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Net difference for date {todayStr}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-white to-slate-50 rounded-xl p-5 border border-indigo-100 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              Quick Financial Actions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly record receipts, payments, internal transfers, or launch daily reconciliation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('transaction')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowDownRight className="w-4 h-4" />
              + Record IN (Receipt)
            </button>
            <button
              onClick={() => setActiveTab('transaction')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              - Record OUT (Payment)
            </button>
            <button
              onClick={() => setActiveTab('transaction')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transfer Funds
            </button>
            <button
              onClick={() => setActiveTab('reconciliation')}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Reconcile Today
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Account Positions & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts Summary Cards (Left 1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Active Accounts ({accounts.length})
            </h3>
            <button
              onClick={() => setActiveTab('master')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Manage Accounts →
            </button>
          </div>

          <div className="space-y-3">
            {accounts.map(acc => {
              const isCash = acc.accountType === 'CASH' || acc.accountType === 'PETTY_CASH';

              return (
                <div
                  key={acc.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-indigo-300 transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isCash ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      <h4 className="font-bold text-sm text-slate-900">{acc.name}</h4>
                    </div>
                    <p className="text-xs text-slate-500">
                      {acc.accountType} {acc.bankName ? `• ${acc.bankName}` : ''} {acc.accountNumber ? `(#${acc.accountNumber})` : ''}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Opening: Rs. {acc.openingBalance.toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">Current Balance</p>
                    <p className="text-base font-extrabold text-slate-900 font-mono">
                      Rs. {acc.currentBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Financial Ledger Feed (Right 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Recent Ledger Activity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Authoritative audit movement records</p>
            </div>
            <button
              onClick={() => setActiveTab('tracking')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              View Full Filterable Tracking →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date / ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Account</th>
                  <th className="py-2.5 px-3">Category & Party</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentTxns.map(t => {
                  const isVoided = t.status === 'VOIDED';

                  return (
                    <tr key={t.id} className={`hover:bg-slate-50/80 transition-colors ${isVoided ? 'opacity-50 bg-slate-50/50' : ''}`}>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 font-mono">{t.id}</div>
                        <div className="text-[11px] text-slate-500">{t.date} {t.time}</div>
                      </td>
                      <td className="py-3 px-3">
                        {t.direction === 'IN' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            IN (Receipt)
                          </span>
                        )}
                        {t.direction === 'OUT' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            OUT (Payment)
                          </span>
                        )}
                        {t.direction === 'TRANSFER' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                            TRANSFER
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{t.accountName}</div>
                        {t.targetAccountName && (
                          <div className="text-[11px] text-indigo-600">→ {t.targetAccountName}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{t.categoryName}</div>
                        {t.entityName && <div className="text-[11px] text-slate-500">{t.entityName}</div>}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-sm">
                        <span className={t.direction === 'IN' ? 'text-emerald-700' : t.direction === 'OUT' ? 'text-rose-700' : 'text-slate-800'}>
                          {t.direction === 'IN' ? '+' : t.direction === 'OUT' ? '-' : ''} Rs. {t.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isVoided ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 text-slate-600">
                            VOIDED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            POSTED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
