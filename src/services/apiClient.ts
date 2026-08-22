/**
 * Authoritative API Client — Single Source of Truth
 * All financial data flows through the Express server API.
 * No Firebase dependency. No competing data backends.
 */

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
  DailyAccountPosition,
  DailyClosingSession,
  AuditLog,
  TrackingFilter,
  FilterSummary
} from '../types';
import { IntegrityAuditResult } from '../utils/ledgerEngine';

// HTTP helper
async function request<T>(method: string, path: string, body?: any, user?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (user) headers['x-user'] = user;

  const options: RequestInit = { method, headers };
  if (body !== undefined && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(path, options);
  if (!res.ok) {
    let errorMsg = `Request failed: ${res.status}`;
    try {
      const errBody = await res.json();
      errorMsg = errBody.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return res.json();
}

// Blob download helper
async function requestBlob(path: string): Promise<Blob> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.json();
}

export const api = {
  // --- REAL-TIME SUBSCRIPTION (polling-based) ---
  subscribeToData(onUpdate: () => void): () => void {
    const interval = setInterval(() => {
      onUpdate();
    }, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  },

  // --- BANKS ---
  getBanks(): Promise<Bank[]> {
    return request('GET', '/api/banks');
  },
  addBank(data: Partial<Bank>, user: string = 'Admin'): Promise<Bank> {
    return request('POST', '/api/banks', data, user);
  },
  updateBank(id: string, data: Partial<Bank>, user: string = 'Admin'): Promise<Bank> {
    return request('PUT', `/api/banks/${id}`, data, user);
  },
  deleteBank(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return request('DELETE', `/api/banks/${id}`, undefined, user);
  },

  // --- ACCOUNTS ---
  getAccounts(): Promise<FinancialAccount[]> {
    return request('GET', '/api/accounts');
  },
  addAccount(data: Partial<FinancialAccount>, user: string = 'Admin'): Promise<FinancialAccount> {
    return request('POST', '/api/accounts', data, user);
  },
  updateAccount(id: string, data: Partial<FinancialAccount>, user: string = 'Admin'): Promise<FinancialAccount> {
    return request('PUT', `/api/accounts/${id}`, data, user);
  },
  deleteAccount(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return request('DELETE', `/api/accounts/${id}`, undefined, user);
  },

  // --- CATEGORIES ---
  getCategories(): Promise<TransactionCategory[]> {
    return request('GET', '/api/categories');
  },
  addCategory(data: Partial<TransactionCategory>, user: string = 'Admin'): Promise<TransactionCategory> {
    return request('POST', '/api/categories', data, user);
  },
  updateCategory(id: string, data: Partial<TransactionCategory>, user: string = 'Admin'): Promise<TransactionCategory> {
    return request('PUT', `/api/categories/${id}`, data, user);
  },
  deleteCategory(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return request('DELETE', `/api/categories/${id}`, undefined, user);
  },

  // --- CLIENTS ---
  getClients(): Promise<Client[]> {
    return request('GET', '/api/clients');
  },
  addClient(data: Partial<Client>, user: string = 'Admin'): Promise<Client> {
    return request('POST', '/api/clients', data, user);
  },
  updateClient(id: string, data: Partial<Client>, user: string = 'Admin'): Promise<Client> {
    return request('PUT', `/api/clients/${id}`, data, user);
  },
  deleteClient(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return request('DELETE', `/api/clients/${id}`, undefined, user);
  },

  // --- SUPPLIERS ---
  getSuppliers(): Promise<Supplier[]> {
    return request('GET', '/api/suppliers');
  },
  addSupplier(data: Partial<Supplier>, user: string = 'Admin'): Promise<Supplier> {
    return request('POST', '/api/suppliers', data, user);
  },
  updateSupplier(id: string, data: Partial<Supplier>, user: string = 'Admin'): Promise<Supplier> {
    return request('PUT', `/api/suppliers/${id}`, data, user);
  },
  deleteSupplier(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return request('DELETE', `/api/suppliers/${id}`, undefined, user);
  },

  // --- PARTNERS ---
  getPartners(): Promise<Partner[]> {
    return request('GET', '/api/partners');
  },
  addPartner(data: Partial<Partner>, user: string = 'Admin'): Promise<Partner> {
    return request('POST', '/api/partners', data, user);
  },
  updatePartner(id: string, data: Partial<Partner>, user: string = 'Admin'): Promise<Partner> {
    return request('PUT', `/api/partners/${id}`, data, user);
  },
  deletePartner(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return request('DELETE', `/api/partners/${id}`, undefined, user);
  },

  // --- WORKERS ---
  getWorkers(): Promise<Worker[]> {
    return request('GET', '/api/workers');
  },
  addWorker(data: Partial<Worker>, user: string = 'Admin'): Promise<Worker> {
    return request('POST', '/api/workers', data, user);
  },
  updateWorker(id: string, data: Partial<Worker>, user: string = 'Admin'): Promise<Worker> {
    return request('PUT', `/api/workers/${id}`, data, user);
  },
  deleteWorker(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return request('DELETE', `/api/workers/${id}`, undefined, user);
  },

  // --- VEHICLES ---
  getVehicles(): Promise<Vehicle[]> {
    return request('GET', '/api/vehicles');
  },
  addVehicle(data: Partial<Vehicle>, user: string = 'Admin'): Promise<Vehicle> {
    return request('POST', '/api/vehicles', data, user);
  },
  updateVehicle(id: string, data: Partial<Vehicle>, user: string = 'Admin'): Promise<Vehicle> {
    return request('PUT', `/api/vehicles/${id}`, data, user);
  },
  deleteVehicle(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return request('DELETE', `/api/vehicles/${id}`, undefined, user);
  },

  // --- PAYMENT METHODS ---
  getPaymentMethods(): Promise<PaymentMethod[]> {
    return request('GET', '/api/payment-methods');
  },
  addPaymentMethod(data: Partial<PaymentMethod>, user: string = 'Admin'): Promise<PaymentMethod> {
    return request('POST', '/api/payment-methods', data, user);
  },
  updatePaymentMethod(id: string, data: Partial<PaymentMethod>, user: string = 'Admin'): Promise<PaymentMethod> {
    return request('PUT', `/api/payment-methods/${id}`, data, user);
  },
  deletePaymentMethod(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return request('DELETE', `/api/payment-methods/${id}`, undefined, user);
  },

  // --- TRANSACTIONS ---
  getTransactions(): Promise<LedgerTransaction[]> {
    return request('GET', '/api/transactions');
  },
  createTransaction(data: any, user: string = 'Finance User'): Promise<LedgerTransaction> {
    return request('POST', '/api/transactions', data, user);
  },
  updateTransaction(id: string, data: any, user: string = 'Admin User'): Promise<LedgerTransaction> {
    return request('PUT', `/api/transactions/${id}`, data, user);
  },
  deleteTransaction(id: string, user: string = 'Admin User'): Promise<{ success: boolean }> {
    return request('DELETE', `/api/transactions/${id}`, undefined, user);
  },
  voidTransaction(id: string, reason: string, user: string = 'Supervisor'): Promise<LedgerTransaction> {
    return request('POST', `/api/transactions/${id}/void`, { reason }, user);
  },

  // --- FILTERED TRACKING ---
  async getFilteredTracking(filters: TrackingFilter): Promise<{ transactions: LedgerTransaction[]; summary: FilterSummary }> {
    return request('POST', '/api/tracking/filtered', filters);
  },

  // --- RECONCILIATION ---
  getReconciliation(date: string): Promise<{ session: DailyClosingSession; positions: DailyAccountPosition[] }> {
    return request('GET', `/api/reconciliation?date=${encodeURIComponent(date)}`);
  },
  saveReconciliationCount(date: string, accountId: string, actualCountedBalance: number, notes?: string, user: string = 'Auditor'): Promise<{ success: boolean }> {
    return request('POST', '/api/reconciliation/count', { date, accountId, actualCountedBalance, notes }, user);
  },
  settleDifference(date: string, accountId: string, type: 'DEFICIT' | 'SURPLUS', amount: number, reason: string, user: string = 'Manager'): Promise<{ success: boolean }> {
    return request('POST', '/api/reconciliation/settle', { date, accountId, type, amount, reason }, user);
  },
  closeDay(date: string, notes?: string, user: string = 'Controller'): Promise<DailyClosingSession> {
    return request('POST', '/api/reconciliation/close-day', { date, notes }, user);
  },
  reopenDay(date: string, reason: string, user: string = 'Director'): Promise<DailyClosingSession> {
    return request('POST', '/api/reconciliation/reopen-day', { date, reason }, user);
  },

  // --- AUDIT LOGS ---
  getAuditLogs(): Promise<AuditLog[]> {
    return request('GET', '/api/audit-logs');
  },

  // --- ADMIN DATA WIPE ---
  wipeData(mode: string, user: string = 'System Administrator'): Promise<{ success: boolean; message: string }> {
    return request('POST', '/api/admin/wipe-data', { mode }, user);
  },

  // --- LEDGER INTEGRITY ---
  async recalculateAndRepairLedger(user: string = 'System Admin'): Promise<{ success: boolean; message: string; audit: IntegrityAuditResult }> {
    // First trigger recalculation on server, then run audit
    await request('POST', '/api/ledger/recalculate', {}, user);
    const audit = await request<IntegrityAuditResult>('POST', '/api/ledger/audit');
    return {
      success: true,
      message: 'Authoritative ledger recalculation complete. All balances synchronized.',
      audit
    };
  },

  runIntegrityAudit(): Promise<IntegrityAuditResult> {
    return request('POST', '/api/ledger/audit');
  },

  // --- BACKUP EXPORTS ---
  async exportFullBackupWorkbook(): Promise<Blob> {
    const res = await fetch('/api/backup/export');
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  },

  async exportTransactionsCsv(): Promise<Blob> {
    const res = await fetch('/api/backup/export-transactions-csv');
    if (!res.ok) throw new Error('CSV export failed');
    return res.blob();
  },

  async exportAccountsCsv(): Promise<Blob> {
    const res = await fetch('/api/backup/export-accounts-csv');
    if (!res.ok) throw new Error('Accounts CSV export failed');
    return res.blob();
  },

  async exportMasterEntitiesCsv(): Promise<Blob> {
    const res = await fetch('/api/backup/export-entities-csv');
    if (!res.ok) throw new Error('Entities CSV export failed');
    return res.blob();
  },

  async exportFullBackupJson(): Promise<Blob> {
    const res = await fetch('/api/backup/export-json');
    if (!res.ok) throw new Error('JSON export failed');
    return res.blob();
  },

  // --- BACKUP IMPORT ---
  async restoreBackupFile(file: File, user: string = 'System Administrator'): Promise<{ success: boolean; message: string; result: any }> {
    const fileNameLower = file.name.toLowerCase();

    if (fileNameLower.endsWith('.json')) {
      const text = await file.text();
      const data = JSON.parse(text);
      // Send parsed JSON data to server for import
      return request('POST', '/api/backup/import-json', { data }, user);
    }

    // For XLSX/CSV: convert to base64 and send
    const buffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return request('POST', '/api/backup/import', { fileBase64: base64 }, user);
  }
};
