import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Flame,
  ShieldAlert,
  RotateCcw,
  Check,
  AlertTriangle,
  ArrowRightLeft,
  Database,
  Building2,
  Wallet,
  Activity,
  FileText,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  FileCode
} from 'lucide-react';
import { FinancialAccount } from '../types';
import { api } from '../services/apiClient';

interface SettingsViewProps {
  accounts: FinancialAccount[];
  transactionCount: number;
  auditLogCount: number;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  accounts,
  transactionCount,
  auditLogCount,
  onRefreshData
}) => {
  const [wipeMode, setWipeMode] = useState<'TRANSACTIONS_ONLY' | 'FULL_SYSTEM_RESET'>('TRANSACTIONS_ONLY');
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [wipeLoading, setWipeLoading] = useState(false);
  const [wipeError, setWipeError] = useState('');
  const [wipeSuccess, setWipeSuccess] = useState('');

  // Backup & Restore State
  const [exportLoading, setExportLoading] = useState(false);
  const [exportJsonLoading, setExportJsonLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string; details?: any } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const cashAccounts = accounts.filter(a => a.accountType === 'CASH' || a.accountType === 'PETTY_CASH');
  const bankAccounts = accounts.filter(a => a.accountType === 'BANK' || a.accountType === 'DIGITAL');

  const handleExportBackup = async () => {
    setExportLoading(true);
    setBackupMessage(null);
    try {
      const blob = await api.exportFullBackupWorkbook();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FBM_Financial_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setBackupMessage({
        type: 'success',
        text: 'Full system XLSX backup workbook generated and downloaded successfully! Works across Cloudflare and server environments.'
      });
    } catch (err: any) {
      setBackupMessage({ type: 'error', text: err.message || 'Export failed' });
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportJsonBackup = async () => {
    setExportJsonLoading(true);
    setBackupMessage(null);
    try {
      const blob = await api.exportFullBackupJson();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FBM_Financial_Database_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setBackupMessage({
        type: 'success',
        text: 'Complete database JSON backup file generated and downloaded successfully!'
      });
    } catch (err: any) {
      setBackupMessage({ type: 'error', text: err.message || 'JSON export failed' });
    } finally {
      setExportJsonLoading(false);
    }
  };

  const handleImportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setImportLoading(true);
    setBackupMessage(null);

    try {
      const res = await api.restoreBackupFile(selectedFile, 'System Administrator');
      setBackupMessage({
        type: 'success',
        text: res.message,
        details: res.result
      });
      setSelectedFile(null);
      onRefreshData();
    } catch (err: any) {
      setBackupMessage({ type: 'error', text: err.message || 'Failed to restore backup file' });
    } finally {
      setImportLoading(false);
    }
  };

  const handleWipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWipeError('');
    setWipeSuccess('');

    const requiredText = wipeMode === 'TRANSACTIONS_ONLY' ? 'CLEAR' : 'WIPE OUT';
    if (wipeConfirmText.trim().toUpperCase() !== requiredText) {
      setWipeError(`Please type "${requiredText}" in uppercase to confirm clearance.`);
      return;
    }

    setWipeLoading(true);
    try {
      const res = await api.wipeData(wipeMode, 'System Administrator');
      setWipeSuccess(res.message || 'System data clearance completed successfully.');
      setWipeConfirmText('');
      onRefreshData();
    } catch (err: any) {
      setWipeError(err.message || 'Failed to wipe data');
    } finally {
      setWipeLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-indigo-600/30 border border-indigo-400/30 rounded-xl text-indigo-300">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">System Settings & Data Control</h2>
          </div>
          <p className="text-xs text-slate-300">
            Manage system-wide data clearance, audit parameters, liquidity transfer configurations, and factory defaults
          </p>
        </div>
      </div>

      {/* System Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Accounts</span>
            <Wallet className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 font-mono">{accounts.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {cashAccounts.length} Cash / {bankAccounts.length} Bank
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ledger Entries</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 font-mono">{transactionCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Posted transactions in ledger</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Audit Trail Logs</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 font-mono">{auditLogCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Recorded audit events</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Transfer Engine</span>
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-sm font-extrabold text-emerald-600">100% Operational</p>
          <p className="text-[11px] text-slate-500 mt-1">Cash ⇄ Bank ⇄ Account Transfers</p>
        </div>
      </div>

      {/* Account Transfer Topology Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Liquidity Account Transfer Matrix</h3>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] rounded-full">
            All Transfer Routes Active
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The platform supports bi-directional atomic transfers between any two accounts (Cash-to-Bank, Bank-to-Cash, Bank-to-Bank, Cash-to-Cash). Both source and target balances update instantly without requiring double manual entries.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Cash Accounts */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600" /> Cash Safes & Counters
              </span>
              <span className="text-[11px] font-bold text-emerald-700 font-mono">
                {cashAccounts.length} Accounts
              </span>
            </div>
            <div className="space-y-1.5">
              {cashAccounts.map(a => (
                <div key={a.id} className="p-2 bg-white rounded-lg border border-emerald-200/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{a.name}</span>
                  <span className="font-bold font-mono text-emerald-700">Rs. {a.currentBalance.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" /> Bank & Digital Accounts
              </span>
              <span className="text-[11px] font-bold text-blue-700 font-mono">
                {bankAccounts.length} Accounts
              </span>
            </div>
            <div className="space-y-1.5">
              {bankAccounts.map(a => (
                <div key={a.id} className="p-2 bg-white rounded-lg border border-blue-200/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{a.name}</span>
                  <span className="font-bold font-mono text-blue-700">Rs. {a.currentBalance.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SYSTEM BACKUP & RESTORE ENGINE (XLSX) */}
      <div className="bg-white border border-indigo-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white font-extrabold text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            Full System Backup & Restore Engine (XLSX)
          </div>
          <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 text-[10px] rounded font-mono font-bold border border-indigo-400/30">
            13 REPOSITORIES INCLUDED
          </span>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {backupMessage && (
            <div
              className={`p-4 rounded-xl border text-xs font-medium space-y-1 ${
                backupMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                {backupMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                {backupMessage.text}
              </div>
              {backupMessage.details && (
                <div className="mt-2 pt-2 border-t border-emerald-200/60 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono text-emerald-900">
                  <div>Transactions: <strong>{backupMessage.details.transactionsCount}</strong></div>
                  <div>Accounts: <strong>{backupMessage.details.accountsCount}</strong></div>
                  <div>Categories: <strong>{backupMessage.details.categoriesCount}</strong></div>
                  <div>Clients: <strong>{backupMessage.details.clientsCount}</strong></div>
                  <div>Suppliers: <strong>{backupMessage.details.suppliersCount}</strong></div>
                  <div>Workers: <strong>{backupMessage.details.workersCount}</strong></div>
                  <div>Vehicles: <strong>{backupMessage.details.vehiclesCount}</strong></div>
                  <div>Partners: <strong>{backupMessage.details.partnersCount}</strong></div>
                  <div>Banks: <strong>{backupMessage.details.banksCount}</strong></div>
                  <div>Methods: <strong>{backupMessage.details.paymentMethodsCount}</strong></div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Card */}
            <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-extrabold text-sm text-indigo-950 mb-1">
                  <Download className="w-4 h-4 text-indigo-600" /> Export Full System Backup (XLSX)
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Downloads an all-inclusive Excel workbook (`.xlsx`) or complete database (`.json`) containing separate datasets for Ledger Transactions, Master Categories, Financial Accounts, Banks, Clients, Suppliers, Partners, Workers, Vehicles, Daily Positions, and Audit Logs.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={exportLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {exportLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Generating XLSX...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" /> Download XLSX System Backup
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleExportJsonBackup}
                  disabled={exportJsonLoading}
                  className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-xs"
                >
                  {exportJsonLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Exporting JSON...
                    </>
                  ) : (
                    <>
                      <FileCode className="w-3.5 h-3.5 text-indigo-400" /> Download JSON Backup (.json)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Import / Restore Card */}
            <form onSubmit={handleImportBackup} className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-950 mb-1">
                  <Upload className="w-4 h-4 text-emerald-600" /> Import / Restore Backup (XLSX / JSON)
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed mb-3">
                  Upload a previously exported system backup file (`.xlsx` or `.json`). This will restore all master categories, transactions, accounts, clients, suppliers, workers, and vehicles cleanly.
                </p>

                <input
                  type="file"
                  accept=".xlsx, .xls, .json"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer cursor-pointer bg-white p-1.5 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedFile || importLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
              >
                {importLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Restoring System...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" /> Restore System from Backup
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* DATA WIPEOUT & SYSTEM CLEARANCE ENGINE */}
      <div className="bg-white border border-rose-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white font-extrabold text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-300" />
            Data Wipeout & System Clearance Engine
          </div>
          <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] rounded font-mono font-bold">
            ADMIN ONLY
          </span>
        </div>

        <form onSubmit={handleWipeSubmit} className="p-6 space-y-5 text-xs">
          {wipeError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              {wipeError}
            </div>
          )}

          {wipeSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              {wipeSuccess}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-900 mb-2 text-xs">Select Clearance Scope *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setWipeMode('TRANSACTIONS_ONLY');
                  setWipeConfirmText('');
                  setWipeError('');
                  setWipeSuccess('');
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  wipeMode === 'TRANSACTIONS_ONLY'
                    ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-rose-700 mb-1.5">
                  <RotateCcw className="w-4 h-4" /> Clear All Ledger Transactions
                </div>
                <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                  Clears all posted transactions, daily reconciliation counts & closing sessions. Resets account current balances back to opening balances. Keeps master banks, accounts, clients & suppliers intact.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWipeMode('FULL_SYSTEM_RESET');
                  setWipeConfirmText('');
                  setWipeError('');
                  setWipeSuccess('');
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  wipeMode === 'FULL_SYSTEM_RESET'
                    ? 'bg-rose-100 border-rose-600 ring-2 ring-rose-600/30 text-rose-950 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-rose-800 mb-1.5">
                  <Flame className="w-4 h-4 text-rose-600" /> Full Factory Reset
                </div>
                <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                  Complete system clearance. Removes all transactions, reconciliations, categories, accounts, banks, clients, suppliers, partners, workers, vehicles, payment methods, and resets all system data.
                </p>
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Security Warning:</strong> Performing a data clearance action is immediate and irreversible. An immutable security audit event will be recorded in the system audit stream.
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-rose-700 border border-slate-200 font-extrabold">{wipeMode === 'TRANSACTIONS_ONLY' ? 'CLEAR' : 'WIPE OUT'}</span> to confirm clearance:
              </label>
              <input
                type="text"
                required
                placeholder={`Type ${wipeMode === 'TRANSACTIONS_ONLY' ? 'CLEAR' : 'WIPE OUT'} here...`}
                value={wipeConfirmText}
                onChange={e => setWipeConfirmText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 uppercase tracking-wider font-bold"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={wipeLoading || wipeConfirmText.trim().toUpperCase() !== (wipeMode === 'TRANSACTIONS_ONLY' ? 'CLEAR' : 'WIPE OUT')}
                className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
              >
                <Flame className="w-4 h-4" />
                {wipeLoading ? 'Processing Clearance...' : wipeMode === 'TRANSACTIONS_ONLY' ? 'Clear All Transactions' : 'Execute Full System Reset'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
