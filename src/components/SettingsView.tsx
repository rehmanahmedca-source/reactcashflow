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
  FileCode,
  Trash2,
  ShieldCheck,
  Cpu,
  Clock
} from 'lucide-react';
import { FinancialAccount } from '../types';
import { api } from '../services/apiClient';
import { IntegrityAuditResult } from '../utils/ledgerEngine';

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
  const [wipeMode, setWipeMode] = useState<'TRANSACTIONS_ONLY_ZERO_BALANCES' | 'TRANSACTIONS_ONLY' | 'FULL_SYSTEM_RESET' | 'PURGE_ALL_DATA_BLANK'>('TRANSACTIONS_ONLY_ZERO_BALANCES');
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [wipeLoading, setWipeLoading] = useState(false);
  const [wipeError, setWipeError] = useState('');
  const [wipeSuccess, setWipeSuccess] = useState('');

  // DMT Forensic Audit State
  const [auditLoading, setAuditLoading] = useState(false);
  const [repairLoading, setRepairLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<IntegrityAuditResult | null>(null);
  const [repairSuccessMsg, setRepairSuccessMsg] = useState('');

  const getRequiredConfirmText = (mode: string) => {
    if (mode === 'TRANSACTIONS_ONLY_ZERO_BALANCES') return 'CLEAR';
    if (mode === 'TRANSACTIONS_ONLY') return 'RESET LEDGER';
    if (mode === 'PURGE_ALL_DATA_BLANK') return 'PURGE';
    return 'WIPE OUT';
  };

  // Backup & Restore State
  const [exportLoading, setExportLoading] = useState(false);
  const [exportCsvLoading, setExportCsvLoading] = useState(false);
  const [exportAccCsvLoading, setExportAccCsvLoading] = useState(false);
  const [exportEntitiesCsvLoading, setExportEntitiesCsvLoading] = useState(false);
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
        text: 'Full system XLSX backup workbook generated and downloaded successfully!'
      });
    } catch (err: any) {
      setBackupMessage({ type: 'error', text: err.message || 'Export failed' });
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportTransactionsCsv = async () => {
    setExportCsvLoading(true);
    setBackupMessage(null);
    try {
      const blob = await api.exportTransactionsCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FBM_Ledger_Transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setBackupMessage({
        type: 'success',
        text: 'Transactions CSV file exported and downloaded successfully!'
      });
    } catch (err: any) {
      setBackupMessage({ type: 'error', text: err.message || 'CSV export failed' });
    } finally {
      setExportCsvLoading(false);
    }
  };

  const handleExportAccountsCsv = async () => {
    setExportAccCsvLoading(true);
    setBackupMessage(null);
    try {
      const blob = await api.exportAccountsCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FBM_Accounts_Balances_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setBackupMessage({
        type: 'success',
        text: 'Accounts & Balances CSV exported and downloaded successfully!'
      });
    } catch (err: any) {
      setBackupMessage({ type: 'error', text: err.message || 'Accounts CSV export failed' });
    } finally {
      setExportAccCsvLoading(false);
    }
  };

  const handleExportEntitiesCsv = async () => {
    setExportEntitiesCsvLoading(true);
    setBackupMessage(null);
    try {
      const blob = await api.exportMasterEntitiesCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FBM_Master_Entities_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setBackupMessage({
        type: 'success',
        text: 'Master Entities CSV (Clients, Suppliers, Partners, Workers, Vehicles) downloaded successfully!'
      });
    } catch (err: any) {
      setBackupMessage({ type: 'error', text: err.message || 'Master Entities CSV export failed' });
    } finally {
      setExportEntitiesCsvLoading(false);
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

  const handleRunAudit = async () => {
    setAuditLoading(true);
    setRepairSuccessMsg('');
    try {
      const result = await api.runIntegrityAudit();
      setAuditResult(result);
    } catch (err: any) {
      alert(err.message || 'Audit execution failed');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleRepairLedger = async () => {
    setRepairLoading(true);
    setRepairSuccessMsg('');
    try {
      const res = await api.recalculateAndRepairLedger('System Administrator');
      setAuditResult(res.audit);
      setRepairSuccessMsg(res.message);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Ledger repair failed');
    } finally {
      setRepairLoading(false);
    }
  };

  const handleWipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWipeError('');
    setWipeSuccess('');

    const requiredText = getRequiredConfirmText(wipeMode);
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

      {/* FORENSIC DMT LEDGER INTEGRITY & AUDIT ENGINE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-900 text-white font-extrabold text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Forensic DMT Ledger Integrity & Audit Engine
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
              TZ: Asia/Karachi (PKT)
            </span>
            <span className="px-2 py-0.5 bg-slate-800 text-emerald-300 rounded border border-slate-700">
              Unit: Paisa Integer
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                Authoritative Double-Entry Validation Matrix
              </h4>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Transactions are the absolute source of truth. Run a live diagnostic scan to detect account balance drifts, orphan entries, or invalid states.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRunAudit}
                disabled={auditLoading || repairLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50 transition-all"
              >
                {auditLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {auditLoading ? 'Auditing Ledger...' : 'Run Integrity Audit'}
              </button>

              <button
                type="button"
                onClick={handleRepairLedger}
                disabled={auditLoading || repairLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50 transition-all"
              >
                {repairLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                {repairLoading ? 'Rebuilding...' : 'Recompute & Reconcile Balances'}
              </button>
            </div>
          </div>

          {repairSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{repairSuccessMsg}</span>
            </div>
          )}

          {auditResult && (
            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-3 font-mono text-[11px] border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-xs text-white">
                  Audit Report #{auditResult.timestamp.slice(0, 19).replace('T', ' ')}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    auditResult.passed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {auditResult.passed ? 'PASSED — ZERO DRIFT DETECTED' : 'ISSUES DETECTED'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                <div className="p-2 bg-slate-800/80 rounded-lg">
                  <div className="text-[10px] text-slate-400">Total Transactions</div>
                  <div className="text-sm font-bold text-white mt-0.5">{auditResult.totalTransactions}</div>
                </div>
                <div className="p-2 bg-slate-800/80 rounded-lg">
                  <div className="text-[10px] text-slate-400">Total Accounts</div>
                  <div className="text-sm font-bold text-white mt-0.5">{auditResult.totalAccounts}</div>
                </div>
                <div className="p-2 bg-slate-800/80 rounded-lg">
                  <div className="text-[10px] text-slate-400">Total Account Liquidity</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">Rs. {auditResult.totalAccountLiquidity.toLocaleString()}</div>
                </div>
                <div className="p-2 bg-slate-800/80 rounded-lg">
                  <div className="text-[10px] text-slate-400">Balance Discrepancies</div>
                  <div className={`text-sm font-bold mt-0.5 ${auditResult.discrepancies.length === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {auditResult.discrepancies.length}
                  </div>
                </div>
              </div>

              {auditResult.discrepancies.length > 0 ? (
                <div className="space-y-1.5 pt-2">
                  <div className="text-rose-400 font-bold">Discrepancy Details:</div>
                  {auditResult.discrepancies.map((d, i) => (
                    <div key={i} className="p-2 bg-rose-950/40 border border-rose-800/40 rounded text-rose-200">
                      [{d.type}] {d.entityName || d.entityId}: Stored = Rs. {d.storedBalance.toLocaleString()}, Authoritative Computed = Rs. {d.authoritativeBalance.toLocaleString()} (Diff: Rs. {d.difference.toLocaleString()})
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-emerald-400 flex items-center gap-1.5 pt-1 text-[11px]">
                  <Check className="w-3.5 h-3.5" /> All account opening balances, transactions, and entity ledgers reconcile perfectly with 0.00 paisa error.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SYSTEM BACKUP & RESTORE ENGINE (XLSX, CSV, JSON) */}
      <div className="bg-white border border-indigo-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white font-extrabold text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            Full System Backup & Restore Engine (XLSX / CSV / JSON)
          </div>
          <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 text-[10px] rounded font-mono font-bold border border-indigo-400/30">
            AUTO-RECONCILED
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
                <div className="mt-2 pt-2 border-t border-emerald-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-emerald-900">
                  {backupMessage.details.transactions !== undefined && <div>Transactions: <strong>{backupMessage.details.transactions}</strong></div>}
                  {backupMessage.details.accounts !== undefined && <div>Accounts: <strong>{backupMessage.details.accounts}</strong></div>}
                  {backupMessage.details.clients !== undefined && <div>Clients: <strong>{backupMessage.details.clients}</strong></div>}
                  {backupMessage.details.suppliers !== undefined && <div>Suppliers: <strong>{backupMessage.details.suppliers}</strong></div>}
                  {backupMessage.details.partners !== undefined && <div>Partners: <strong>{backupMessage.details.partners}</strong></div>}
                  {backupMessage.details.workers !== undefined && <div>Workers: <strong>{backupMessage.details.workers}</strong></div>}
                  {backupMessage.details.vehicles !== undefined && <div>Vehicles: <strong>{backupMessage.details.vehicles}</strong></div>}
                  {backupMessage.details.categories !== undefined && <div>Categories: <strong>{backupMessage.details.categories}</strong></div>}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Card */}
            <div className="p-5 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-extrabold text-sm text-indigo-950 mb-1">
                  <Download className="w-4 h-4 text-indigo-600" /> Export Data & System Backups
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Download complete system archives (.xlsx, .json) or specific spreadsheet files (.csv) for accounting, auditing, and spreadsheet analysis.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Full XLSX */}
                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={exportLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-xs"
                >
                  {exportLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Generating Full Backup...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" /> Download Complete System (.xlsx)
                    </>
                  )}
                </button>

                {/* CSV Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleExportTransactionsCsv}
                    disabled={exportCsvLoading}
                    className="py-2 px-3 bg-white hover:bg-slate-50 border border-indigo-200 text-slate-800 font-bold rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all text-xs"
                  >
                    {exportCsvLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>Transactions (.csv)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportAccountsCsv}
                    disabled={exportAccCsvLoading}
                    className="py-2 px-3 bg-white hover:bg-slate-50 border border-indigo-200 text-slate-800 font-bold rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all text-xs"
                  >
                    {exportAccCsvLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5 text-blue-600" />}
                    <span>Accounts (.csv)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportEntitiesCsv}
                    disabled={exportEntitiesCsvLoading}
                    className="py-2 px-3 bg-white hover:bg-slate-50 border border-indigo-200 text-slate-800 font-bold rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all text-xs"
                  >
                    {exportEntitiesCsvLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Building2 className="w-3.5 h-3.5 text-purple-600" />}
                    <span>Entities (.csv)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJsonBackup}
                    disabled={exportJsonLoading}
                    className="py-2 px-3 bg-white hover:bg-slate-50 border border-indigo-200 text-slate-800 font-bold rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all text-xs"
                  >
                    {exportJsonLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCode className="w-3.5 h-3.5 text-amber-600" />}
                    <span>Full DB (.json)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Import / Restore Card */}
            <form onSubmit={handleImportBackup} className="p-5 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-950 mb-1">
                  <Upload className="w-4 h-4 text-emerald-600" /> Restore / Import Backup File
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed mb-3">
                  Upload a previously exported <strong>.csv</strong>, <strong>.xlsx</strong>, or <strong>.json</strong> file. The system will auto-detect the file structure, import records, and reconcile all ledger balances.
                </p>

                <div className="relative">
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls, .json"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer cursor-pointer bg-white p-2 border border-slate-300 rounded-xl shadow-2xs"
                  />
                  {selectedFile && (
                    <div className="mt-2 text-[11px] font-mono text-emerald-800 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedFile || importLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 transition-all text-xs"
              >
                {importLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Restoring & Reconciling...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" /> Restore System from File
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* DATA WIPEOUT & SYSTEM CLEARANCE ENGINE */}
      <div className="bg-white border border-rose-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 bg-gradient-to-r from-rose-800 via-red-700 to-rose-800 text-white font-extrabold text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-300" />
            Data Wipeout & System Clearance Engine
          </div>
          <span className="px-2.5 py-0.5 bg-white/20 text-white text-[10px] rounded font-mono font-bold">
            ADMIN SECURE
          </span>
        </div>

        <form onSubmit={handleWipeSubmit} className="p-6 space-y-5 text-xs">
          {/* Current Inventory Summary */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-slate-700">
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Database className="w-4 h-4 text-slate-600" />
              Current Active Database Inventory:
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span>Transactions: <strong className="text-slate-900">{transactionCount}</strong></span>
              <span>Accounts: <strong className="text-slate-900">{accounts.length}</strong></span>
              <span>Audit Logs: <strong className="text-slate-900">{auditLogCount}</strong></span>
            </div>
          </div>

          {wipeError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 font-bold text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              {wipeError}
            </div>
          )}

          {wipeSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              {wipeSuccess}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-900 mb-2.5 text-xs">Select Clearance Scope *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Option 1: Clear all transactions and reset balances to Rs. 0 */}
              <button
                type="button"
                onClick={() => {
                  setWipeMode('TRANSACTIONS_ONLY_ZERO_BALANCES');
                  setWipeConfirmText('');
                  setWipeError('');
                  setWipeSuccess('');
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  wipeMode === 'TRANSACTIONS_ONLY_ZERO_BALANCES'
                    ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-rose-700">
                    <RotateCcw className="w-4 h-4" /> Clear Transactions (Reset to Rs. 0.00)
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-900 font-mono font-bold">CLEAR</span>
                </div>
                <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                  Deletes all posted transactions and day closure sessions. Resets all account balances and entity ledgers to <strong>Rs. 0.00</strong>. Master accounts, banks, and categories are preserved.
                </p>
              </button>

              {/* Option 2: Clear all transactions but keep designated opening balances */}
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
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-amber-800">
                    <RotateCcw className="w-4 h-4" /> Clear Transactions (Keep Opening Balances)
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 font-mono font-bold">RESET LEDGER</span>
                </div>
                <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                  Deletes all transactions and resets each financial account balance strictly back to its pre-set opening balance.
                </p>
              </button>

              {/* Option 3: Full Factory Reset with 0 balance */}
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
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-rose-800">
                    <Flame className="w-4 h-4 text-rose-600" /> Full Factory Reset (Default FBM)
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-300 text-rose-950 font-mono font-bold">WIPE OUT</span>
                </div>
                <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                  Restores clean initial banks, accounts and categories with <strong>Rs. 0 initial balances</strong>. Removes all transactions, clients, suppliers, workers, and vehicles.
                </p>
              </button>

              {/* Option 4: Complete Purge to Blank Database */}
              <button
                type="button"
                onClick={() => {
                  setWipeMode('PURGE_ALL_DATA_BLANK');
                  setWipeConfirmText('');
                  setWipeError('');
                  setWipeSuccess('');
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  wipeMode === 'PURGE_ALL_DATA_BLANK'
                    ? 'bg-red-100 border-red-700 ring-2 ring-red-700/40 text-red-950 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-red-900">
                    <Trash2 className="w-4 h-4 text-red-700" /> Total Database Purge (Blank Canvas)
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-300 text-red-950 font-mono font-bold">PURGE</span>
                </div>
                <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                  Completely empties all collections in Cloud Firestore, giving you a 100% empty canvas to build custom accounts and records from scratch.
                </p>
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Irreversible Action Warning:</strong> Clearance operations execute immediately across Google Cloud Firestore. All user sessions and devices will synchronize to the wiped state in real time.
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-800 text-xs">
                  Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-rose-700 border border-slate-200 font-extrabold">{getRequiredConfirmText(wipeMode)}</span> to confirm:
                </label>
                <button
                  type="button"
                  onClick={() => setWipeConfirmText(getRequiredConfirmText(wipeMode))}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                >
                  Fill "{getRequiredConfirmText(wipeMode)}"
                </button>
              </div>
              <input
                type="text"
                required
                placeholder={`Type ${getRequiredConfirmText(wipeMode)} here...`}
                value={wipeConfirmText}
                onChange={e => setWipeConfirmText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 uppercase tracking-wider font-bold"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={wipeLoading || wipeConfirmText.trim().toUpperCase() !== getRequiredConfirmText(wipeMode)}
                className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
              >
                <Flame className="w-4 h-4" />
                {wipeLoading ? 'Processing Clearance...' : `Execute ${getRequiredConfirmText(wipeMode)}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
