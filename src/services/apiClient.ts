import * as XLSX from 'xlsx';
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
  FilterSummary,
  DayStatus
} from '../types';

interface StoreData {
  banks: Bank[];
  accounts: FinancialAccount[];
  categories: TransactionCategory[];
  clients: Client[];
  suppliers: Supplier[];
  partners: Partner[];
  workers: Worker[];
  vehicles: Vehicle[];
  paymentMethods: PaymentMethod[];
  ledgerTransactions: LedgerTransaction[];
  dailyPositions: DailyAccountPosition[];
  closingSessions: DailyClosingSession[];
  auditLogs: AuditLog[];
}

const LOCAL_STORAGE_KEY = 'fbm_financial_datastore_v1';

const DEFAULT_STORE: StoreData = {
  banks: [
    { id: 'BANK-1', code: 'ALHAB', name: 'BANK AL HABIB', branch: '-', active: true, createdAt: '2026-08-08' },
    { id: 'BANK-2', code: 'MCB', name: 'MUSLIM COMMERCIAL BANK', branch: '-', active: true, createdAt: '2026-08-08' },
    { id: 'BANK-3', code: 'JAZZ CASH', name: 'MOBILINK', branch: '27905', active: true, createdAt: '2026-08-08' }
  ],
  accounts: [
    { id: 'ACC-1', name: 'FBM CASH IN HAND', accountType: 'CASH', openingBalance: 12620, currentBalance: 12620, active: true, displayOrder: 1, createdAt: '2026-08-08' },
    { id: 'ACC-2', name: 'FBM AL HABIB', bankId: 'BANK-1', bankName: 'BANK AL HABIB', accountNumber: '-', accountType: 'BANK', openingBalance: 474, currentBalance: 474, active: true, displayOrder: 2, createdAt: '2026-08-08' },
    { id: 'ACC-3', name: 'FBM MCB', bankId: 'BANK-2', bankName: 'MUSLIM COMMERCIAL BANK', accountNumber: '-', accountType: 'BANK', openingBalance: 80038, currentBalance: 80038, active: true, displayOrder: 3, createdAt: '2026-08-08' },
    { id: 'ACC-4', name: 'FBM JAZZ CASH', bankId: 'BANK-1', bankName: 'BANK AL HABIB', accountNumber: '-', accountType: 'BANK', openingBalance: 125, currentBalance: 125, active: true, displayOrder: 4, createdAt: '2026-08-08' }
  ],
  categories: [
    { id: 'CAT-1', name: 'HDC LOANS IN', direction: 'IN', active: true, requiresPartner: true, description: 'Partner Loan Inflow' },
    { id: 'CAT-2', name: 'HDC LOANS OUT', direction: 'OUT', active: true, requiresPartner: true, description: 'Partner Loan Outflow' },
    { id: 'CAT-IN-5', name: 'RECONCILIATION SURPLUS', direction: 'IN', active: true, description: 'Reconciliation surplus/excess settlement' },
    { id: 'CAT-OUT-7', name: 'RECONCILIATION DEFICIT', direction: 'OUT', active: true, description: 'Reconciliation deficit/shortage settlement' }
  ],
  clients: [],
  suppliers: [],
  partners: [
    { id: 'PTR-301', code: 'P-301', name: 'HDC', sharePercentage: 0, balance: 0, status: 'ACTIVE', createdAt: '2026-08-08' },
    { id: 'PTR-302', code: 'P-302', name: 'HDC LABOUR', sharePercentage: 0, balance: 0, status: 'ACTIVE', createdAt: '2026-08-08' }
  ],
  workers: [
    { id: 'WRK-1', code: 'W-101', name: 'Worker 1', role: 'Worker', status: 'ACTIVE', createdAt: '2026-08-08' }
  ],
  vehicles: [],
  paymentMethods: [
    { id: 'PM-1', name: 'Cash', code: 'CASH', active: true },
    { id: 'PM-2', name: 'Bank Transfer / Online RTGS', code: 'BANK_TRANSFER', active: true },
    { id: 'PM-3', name: 'Crossed Cheque', code: 'CHEQUE', active: true },
    { id: 'PM-4', name: 'Digital Wallet', code: 'DIGITAL_WALLET', active: true },
    { id: 'PM-5', name: 'Pay Order / Demand Draft', code: 'PAY_ORDER', active: true }
  ],
  ledgerTransactions: [],
  dailyPositions: [],
  closingSessions: [],
  auditLogs: [
    {
      id: 'LOG-INIT',
      timestamp: new Date().toISOString(),
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'SYSTEM',
      entityId: 'ROOT',
      details: 'FBM Financial Control Ledger active with authoritative data schema',
      user: 'System Admin'
    }
  ]
};

// Check if we are running with a reachable Express API backend
let isBackendAvailable: boolean | null = null;

async function checkBackendAvailable(): Promise<boolean> {
  if (isBackendAvailable !== null) return isBackendAvailable;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('/api/health', { signal: controller.signal });
    clearTimeout(timeout);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      isBackendAvailable = true;
      return true;
    }
  } catch {
    // API not reachable, fallback to client-side storage
  }
  isBackendAvailable = false;
  return false;
}

// Local Storage Helper
function getLocalStore(): StoreData {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        banks: Array.isArray(parsed.banks) ? parsed.banks : DEFAULT_STORE.banks,
        accounts: Array.isArray(parsed.accounts) ? parsed.accounts : DEFAULT_STORE.accounts,
        categories: Array.isArray(parsed.categories) ? parsed.categories : DEFAULT_STORE.categories,
        clients: Array.isArray(parsed.clients) ? parsed.clients : DEFAULT_STORE.clients,
        suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : DEFAULT_STORE.suppliers,
        partners: Array.isArray(parsed.partners) ? parsed.partners : DEFAULT_STORE.partners,
        workers: Array.isArray(parsed.workers) ? parsed.workers : DEFAULT_STORE.workers,
        vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : DEFAULT_STORE.vehicles,
        paymentMethods: Array.isArray(parsed.paymentMethods) ? parsed.paymentMethods : DEFAULT_STORE.paymentMethods,
        ledgerTransactions: Array.isArray(parsed.ledgerTransactions) ? parsed.ledgerTransactions : [],
        dailyPositions: Array.isArray(parsed.dailyPositions) ? parsed.dailyPositions : [],
        closingSessions: Array.isArray(parsed.closingSessions) ? parsed.closingSessions : [],
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : DEFAULT_STORE.auditLogs
      };
    }
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
  }
  saveLocalStore(DEFAULT_STORE);
  return DEFAULT_STORE;
}

function saveLocalStore(data: StoreData) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function addLocalAudit(action: string, entityType: string, entityId: string, details: string, user: string = 'User') {
  const store = getLocalStore();
  const newLog: AuditLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    action,
    entityType,
    entityId,
    details,
    user: user || 'System'
  };
  store.auditLogs.unshift(newLog);
  saveLocalStore(store);
}

// Universal fetch wrapper that falls back if backend is unavailable
async function safeFetchJson<T>(url: string, options?: RequestInit, fallbackFn?: () => T): Promise<T> {
  const isAvailable = await checkBackendAvailable();
  if (isAvailable) {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        return await res.json();
      }
      if (!res.ok && contentType.includes('application/json')) {
        const errJson = await res.json();
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('network') && !err.message.includes('Unexpected token')) {
        throw err;
      }
      // If network/json parse error, fallback to client store
    }
  }

  if (fallbackFn) {
    return fallbackFn();
  }
  throw new Error('API server is not reachable and no fallback was available');
}

export const api = {
  // --- MASTER DATA ---
  async getBanks(): Promise<Bank[]> {
    return safeFetchJson('/api/banks', undefined, () => getLocalStore().banks);
  },

  async addBank(data: Partial<Bank>, user: string = 'Admin'): Promise<Bank> {
    return safeFetchJson('/api/banks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const newBank: Bank = {
        id: `BANK-${Date.now()}`,
        code: (data.code || '').toUpperCase().trim(),
        name: (data.name || '').trim(),
        branch: data.branch?.trim() || undefined,
        active: data.active !== undefined ? data.active : true,
        createdAt: new Date().toISOString().slice(0, 10)
      };
      store.banks.push(newBank);
      saveLocalStore(store);
      addLocalAudit('CREATE_BANK', 'BANK', newBank.id, `Created bank ${newBank.name}`, user);
      return newBank;
    });
  },

  async updateBank(id: string, data: Partial<Bank>, user: string = 'Admin'): Promise<Bank> {
    return safeFetchJson(`/api/banks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const bank = store.banks.find(b => b.id === id);
      if (!bank) throw new Error('Bank not found');
      if (data.code) bank.code = data.code.toUpperCase().trim();
      if (data.name) bank.name = data.name.trim();
      if (data.branch !== undefined) bank.branch = data.branch;
      if (data.active !== undefined) bank.active = data.active;
      saveLocalStore(store);
      addLocalAudit('UPDATE_BANK', 'BANK', id, `Updated bank ${bank.name}`, user);
      return bank;
    });
  },

  async deleteBank(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return safeFetchJson(`/api/banks/${id}`, {
      method: 'DELETE',
      headers: { 'X-User': user }
    }, () => {
      const store = getLocalStore();
      const idx = store.banks.findIndex(b => b.id === id);
      if (idx === -1) throw new Error('Bank not found');
      const removed = store.banks.splice(idx, 1)[0];
      // update accounts that linked to this bank
      for (const a of store.accounts) {
        if (a.bankId === id) {
          a.bankId = undefined;
          a.bankName = undefined;
        }
      }
      saveLocalStore(store);
      addLocalAudit('DELETE_BANK', 'BANK', id, `Deleted bank ${removed.name}`, user);
      return { success: true };
    });
  },

  // Accounts
  async getAccounts(): Promise<FinancialAccount[]> {
    return safeFetchJson('/api/accounts', undefined, () => getLocalStore().accounts);
  },

  async addAccount(data: Partial<FinancialAccount>, user: string = 'Admin'): Promise<FinancialAccount> {
    return safeFetchJson('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const openBal = Number(data.openingBalance) || 0;
      const newAcc: FinancialAccount = {
        id: `ACC-${Date.now()}`,
        name: (data.name || '').trim(),
        bankId: data.bankId,
        bankName: data.bankName,
        accountNumber: data.accountNumber?.trim(),
        accountType: data.accountType || 'CASH',
        openingBalance: openBal,
        currentBalance: openBal,
        active: data.active !== undefined ? data.active : true,
        displayOrder: store.accounts.length + 1,
        createdAt: new Date().toISOString().slice(0, 10)
      };
      store.accounts.push(newAcc);
      saveLocalStore(store);
      addLocalAudit('CREATE_ACCOUNT', 'ACCOUNT', newAcc.id, `Created account ${newAcc.name} (Rs. ${openBal})`, user);
      return newAcc;
    });
  },

  async updateAccount(id: string, data: Partial<FinancialAccount>, user: string = 'Admin'): Promise<FinancialAccount> {
    return safeFetchJson(`/api/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const acc = store.accounts.find(a => a.id === id);
      if (!acc) throw new Error('Account not found');
      if (data.name) acc.name = data.name.trim();
      if (data.bankId !== undefined) acc.bankId = data.bankId;
      if (data.bankName !== undefined) acc.bankName = data.bankName;
      if (data.accountNumber !== undefined) acc.accountNumber = data.accountNumber.trim();
      if (data.accountType) acc.accountType = data.accountType;
      if (data.active !== undefined) acc.active = data.active;
      saveLocalStore(store);
      addLocalAudit('UPDATE_ACCOUNT', 'ACCOUNT', id, `Updated account ${acc.name}`, user);
      return acc;
    });
  },

  async deleteAccount(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return safeFetchJson(`/api/accounts/${id}`, {
      method: 'DELETE',
      headers: { 'X-User': user }
    }, () => {
      const store = getLocalStore();
      const idx = store.accounts.findIndex(a => a.id === id);
      if (idx === -1) throw new Error('Account not found');
      const removed = store.accounts.splice(idx, 1)[0];
      saveLocalStore(store);
      addLocalAudit('DELETE_ACCOUNT', 'ACCOUNT', id, `Deleted account ${removed.name}`, user);
      return { success: true };
    });
  },

  // Categories
  async getCategories(): Promise<TransactionCategory[]> {
    return safeFetchJson('/api/categories', undefined, () => getLocalStore().categories);
  },

  async addCategory(data: Partial<TransactionCategory>, user: string = 'Admin'): Promise<TransactionCategory> {
    return safeFetchJson('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const newCat: TransactionCategory = {
        id: `CAT-${Date.now()}`,
        name: (data.name || '').trim(),
        direction: data.direction || 'OUT',
        active: data.active !== undefined ? data.active : true,
        requiresClient: data.requiresClient,
        requiresSupplier: data.requiresSupplier,
        requiresPartner: data.requiresPartner,
        requiresWorker: data.requiresWorker,
        requiresVehicle: data.requiresVehicle,
        requiresBill: data.requiresBill,
        requiresReference: data.requiresReference,
        requiresDescription: data.requiresDescription,
        description: data.description?.trim()
      };
      store.categories.push(newCat);
      saveLocalStore(store);
      addLocalAudit('CREATE_CATEGORY', 'CATEGORY', newCat.id, `Created category ${newCat.name}`, user);
      return newCat;
    });
  },

  async updateCategory(id: string, data: Partial<TransactionCategory>, user: string = 'Admin'): Promise<TransactionCategory> {
    return safeFetchJson(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const cat = store.categories.find(c => c.id === id);
      if (!cat) throw new Error('Category not found');
      Object.assign(cat, data);
      saveLocalStore(store);
      addLocalAudit('UPDATE_CATEGORY', 'CATEGORY', id, `Updated category ${cat.name}`, user);
      return cat;
    });
  },

  async deleteCategory(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return safeFetchJson(`/api/categories/${id}`, {
      method: 'DELETE',
      headers: { 'X-User': user }
    }, () => {
      const store = getLocalStore();
      const idx = store.categories.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Category not found');
      const removed = store.categories.splice(idx, 1)[0];
      saveLocalStore(store);
      addLocalAudit('DELETE_CATEGORY', 'CATEGORY', id, `Deleted category ${removed.name}`, user);
      return { success: true };
    });
  },

  // Clients
  async getClients(): Promise<Client[]> {
    return safeFetchJson('/api/clients', undefined, () => getLocalStore().clients);
  },

  async addClient(data: Partial<Client>, user: string = 'Admin'): Promise<Client> {
    return safeFetchJson('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const newCli: Client = {
        id: `CLI-${Date.now()}`,
        code: data.code?.trim() || `C-${store.clients.length + 101}`,
        name: (data.name || '').trim(),
        phone: data.phone?.trim(),
        email: data.email?.trim(),
        address: data.address?.trim(),
        balance: Number(data.balance) || 0,
        status: data.status || 'ACTIVE',
        createdAt: new Date().toISOString().slice(0, 10)
      };
      store.clients.push(newCli);
      saveLocalStore(store);
      addLocalAudit('CREATE_CLIENT', 'CLIENT', newCli.id, `Created client ${newCli.name}`, user);
      return newCli;
    });
  },

  async updateClient(id: string, data: Partial<Client>, user: string = 'Admin'): Promise<Client> {
    return safeFetchJson(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const cli = store.clients.find(c => c.id === id);
      if (!cli) throw new Error('Client not found');
      Object.assign(cli, data);
      saveLocalStore(store);
      addLocalAudit('UPDATE_CLIENT', 'CLIENT', id, `Updated client ${cli.name}`, user);
      return cli;
    });
  },

  async deleteClient(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return safeFetchJson(`/api/clients/${id}`, {
      method: 'DELETE',
      headers: { 'X-User': user }
    }, () => {
      const store = getLocalStore();
      const idx = store.clients.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Client not found');
      const removed = store.clients.splice(idx, 1)[0];
      saveLocalStore(store);
      addLocalAudit('DELETE_CLIENT', 'CLIENT', id, `Deleted client ${removed.name}`, user);
      return { success: true };
    });
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return safeFetchJson('/api/suppliers', undefined, () => getLocalStore().suppliers);
  },

  async addSupplier(data: Partial<Supplier>, user: string = 'Admin'): Promise<Supplier> {
    return safeFetchJson('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const newSup: Supplier = {
        id: `SUP-${Date.now()}`,
        code: data.code?.trim() || `S-${store.suppliers.length + 101}`,
        name: (data.name || '').trim(),
        phone: data.phone?.trim(),
        email: data.email?.trim(),
        address: data.address?.trim(),
        balance: Number(data.balance) || 0,
        status: data.status || 'ACTIVE',
        createdAt: new Date().toISOString().slice(0, 10)
      };
      store.suppliers.push(newSup);
      saveLocalStore(store);
      addLocalAudit('CREATE_SUPPLIER', 'SUPPLIER', newSup.id, `Created supplier ${newSup.name}`, user);
      return newSup;
    });
  },

  async updateSupplier(id: string, data: Partial<Supplier>, user: string = 'Admin'): Promise<Supplier> {
    return safeFetchJson(`/api/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const sup = store.suppliers.find(s => s.id === id);
      if (!sup) throw new Error('Supplier not found');
      Object.assign(sup, data);
      saveLocalStore(store);
      addLocalAudit('UPDATE_SUPPLIER', 'SUPPLIER', id, `Updated supplier ${sup.name}`, user);
      return sup;
    });
  },

  async deleteSupplier(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return safeFetchJson(`/api/suppliers/${id}`, {
      method: 'DELETE',
      headers: { 'X-User': user }
    }, () => {
      const store = getLocalStore();
      const idx = store.suppliers.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Supplier not found');
      const removed = store.suppliers.splice(idx, 1)[0];
      saveLocalStore(store);
      addLocalAudit('DELETE_SUPPLIER', 'SUPPLIER', id, `Deleted supplier ${removed.name}`, user);
      return { success: true };
    });
  },

  // Partners
  async getPartners(): Promise<Partner[]> {
    return safeFetchJson('/api/partners', undefined, () => getLocalStore().partners);
  },

  async addPartner(data: Partial<Partner>, user: string = 'Admin'): Promise<Partner> {
    return safeFetchJson('/api/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const newPtr: Partner = {
        id: `PTR-${Date.now()}`,
        code: data.code?.trim() || `P-${store.partners.length + 301}`,
        name: (data.name || '').trim(),
        phone: data.phone?.trim(),
        email: data.email?.trim(),
        sharePercentage: Number(data.sharePercentage) || 0,
        balance: Number(data.balance) || 0,
        status: data.status || 'ACTIVE',
        createdAt: new Date().toISOString().slice(0, 10)
      };
      store.partners.push(newPtr);
      saveLocalStore(store);
      addLocalAudit('CREATE_PARTNER', 'PARTNER', newPtr.id, `Created partner ${newPtr.name}`, user);
      return newPtr;
    });
  },

  async updatePartner(id: string, data: Partial<Partner>, user: string = 'Admin'): Promise<Partner> {
    return safeFetchJson(`/api/partners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const ptr = store.partners.find(p => p.id === id);
      if (!ptr) throw new Error('Partner not found');
      Object.assign(ptr, data);
      saveLocalStore(store);
      addLocalAudit('UPDATE_PARTNER', 'PARTNER', id, `Updated partner ${ptr.name}`, user);
      return ptr;
    });
  },

  async deletePartner(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return safeFetchJson(`/api/partners/${id}`, {
      method: 'DELETE',
      headers: { 'X-User': user }
    }, () => {
      const store = getLocalStore();
      const idx = store.partners.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Partner not found');
      const removed = store.partners.splice(idx, 1)[0];
      saveLocalStore(store);
      addLocalAudit('DELETE_PARTNER', 'PARTNER', id, `Deleted partner ${removed.name}`, user);
      return { success: true };
    });
  },

  // Workers
  async getWorkers(): Promise<Worker[]> {
    return safeFetchJson('/api/workers', undefined, () => getLocalStore().workers);
  },

  async addWorker(data: Partial<Worker>, user: string = 'Admin'): Promise<Worker> {
    return safeFetchJson('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const newWrk: Worker = {
        id: `WRK-${Date.now()}`,
        code: data.code?.trim() || `W-${store.workers.length + 101}`,
        name: (data.name || '').trim(),
        role: data.role?.trim() || 'Worker',
        phone: data.phone?.trim(),
        dailyWage: Number(data.dailyWage) || undefined,
        status: data.status || 'ACTIVE',
        createdAt: new Date().toISOString().slice(0, 10)
      };
      store.workers.push(newWrk);
      saveLocalStore(store);
      addLocalAudit('CREATE_WORKER', 'WORKER', newWrk.id, `Created worker ${newWrk.name}`, user);
      return newWrk;
    });
  },

  async updateWorker(id: string, data: Partial<Worker>, user: string = 'Admin'): Promise<Worker> {
    return safeFetchJson(`/api/workers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const wrk = store.workers.find(w => w.id === id);
      if (!wrk) throw new Error('Worker not found');
      Object.assign(wrk, data);
      saveLocalStore(store);
      addLocalAudit('UPDATE_WORKER', 'WORKER', id, `Updated worker ${wrk.name}`, user);
      return wrk;
    });
  },

  async deleteWorker(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return safeFetchJson(`/api/workers/${id}`, {
      method: 'DELETE',
      headers: { 'X-User': user }
    }, () => {
      const store = getLocalStore();
      const idx = store.workers.findIndex(w => w.id === id);
      if (idx === -1) throw new Error('Worker not found');
      const removed = store.workers.splice(idx, 1)[0];
      saveLocalStore(store);
      addLocalAudit('DELETE_WORKER', 'WORKER', id, `Deleted worker ${removed.name}`, user);
      return { success: true };
    });
  },

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    return safeFetchJson('/api/vehicles', undefined, () => getLocalStore().vehicles);
  },

  async addVehicle(data: Partial<Vehicle>, user: string = 'Admin'): Promise<Vehicle> {
    return safeFetchJson('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const newVeh: Vehicle = {
        id: `VEH-${Date.now()}`,
        plateNumber: (data.plateNumber || '').trim().toUpperCase(),
        model: (data.model || '').trim(),
        driverName: data.driverName?.trim(),
        status: data.status || 'ACTIVE',
        createdAt: new Date().toISOString().slice(0, 10)
      };
      store.vehicles.push(newVeh);
      saveLocalStore(store);
      addLocalAudit('CREATE_VEHICLE', 'VEHICLE', newVeh.id, `Created vehicle ${newVeh.plateNumber}`, user);
      return newVeh;
    });
  },

  async updateVehicle(id: string, data: Partial<Vehicle>, user: string = 'Admin'): Promise<Vehicle> {
    return safeFetchJson(`/api/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const veh = store.vehicles.find(v => v.id === id);
      if (!veh) throw new Error('Vehicle not found');
      Object.assign(veh, data);
      saveLocalStore(store);
      addLocalAudit('UPDATE_VEHICLE', 'VEHICLE', id, `Updated vehicle ${veh.plateNumber}`, user);
      return veh;
    });
  },

  async deleteVehicle(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return safeFetchJson(`/api/vehicles/${id}`, {
      method: 'DELETE',
      headers: { 'X-User': user }
    }, () => {
      const store = getLocalStore();
      const idx = store.vehicles.findIndex(v => v.id === id);
      if (idx === -1) throw new Error('Vehicle not found');
      const removed = store.vehicles.splice(idx, 1)[0];
      saveLocalStore(store);
      addLocalAudit('DELETE_VEHICLE', 'VEHICLE', id, `Deleted vehicle ${removed.plateNumber}`, user);
      return { success: true };
    });
  },

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return safeFetchJson('/api/payment-methods', undefined, () => getLocalStore().paymentMethods);
  },

  async addPaymentMethod(data: Partial<PaymentMethod>, user: string = 'Admin'): Promise<PaymentMethod> {
    return safeFetchJson('/api/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const newPm: PaymentMethod = {
        id: `PM-${Date.now()}`,
        name: (data.name || '').trim(),
        code: (data.code || data.name || '').toUpperCase().replace(/\s+/g, '_'),
        active: data.active !== undefined ? data.active : true
      };
      store.paymentMethods.push(newPm);
      saveLocalStore(store);
      addLocalAudit('CREATE_PAYMENT_METHOD', 'PAYMENT_METHOD', newPm.id, `Created payment method ${newPm.name}`, user);
      return newPm;
    });
  },

  async updatePaymentMethod(id: string, data: Partial<PaymentMethod>, user: string = 'Admin'): Promise<PaymentMethod> {
    return safeFetchJson(`/api/payment-methods/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const pm = store.paymentMethods.find(p => p.id === id);
      if (!pm) throw new Error('Payment Method not found');
      Object.assign(pm, data);
      saveLocalStore(store);
      addLocalAudit('UPDATE_PAYMENT_METHOD', 'PAYMENT_METHOD', id, `Updated payment method ${pm.name}`, user);
      return pm;
    });
  },

  async deletePaymentMethod(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    return safeFetchJson(`/api/payment-methods/${id}`, {
      method: 'DELETE',
      headers: { 'X-User': user }
    }, () => {
      const store = getLocalStore();
      const idx = store.paymentMethods.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Payment Method not found');
      const removed = store.paymentMethods.splice(idx, 1)[0];
      saveLocalStore(store);
      addLocalAudit('DELETE_PAYMENT_METHOD', 'PAYMENT_METHOD', id, `Deleted payment method ${removed.name}`, user);
      return { success: true };
    });
  },

  // --- TRANSACTIONS ---
  async getTransactions(): Promise<LedgerTransaction[]> {
    return safeFetchJson('/api/transactions', undefined, () => getLocalStore().ledgerTransactions);
  },

  async createTransaction(data: any, user: string = 'Finance User'): Promise<LedgerTransaction> {
    return safeFetchJson('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const amount = Number(data.amount) || 0;
      const account = store.accounts.find(a => a.id === data.accountId);
      if (!account) throw new Error('Source Account not found');

      const isTransfer = data.direction === 'TRANSFER';
      let targetAccount: FinancialAccount | undefined;
      if (isTransfer) {
        targetAccount = store.accounts.find(a => a.id === data.targetAccountId);
        if (!targetAccount) throw new Error('Destination Transfer Account not found');
      }

      const category = store.categories.find(c => c.id === data.categoryId);

      // Create transaction record
      const txnId = `TXN-${(store.ledgerTransactions.length + 10001).toString()}`;
      const now = new Date();
      const newTxn: LedgerTransaction = {
        id: txnId,
        date: data.date || now.toISOString().slice(0, 10),
        time: data.time || now.toTimeString().slice(0, 5),
        direction: data.direction,
        accountId: account.id,
        accountName: account.name,
        targetAccountId: targetAccount?.id,
        targetAccountName: targetAccount?.name,
        categoryId: category?.id || 'CAT-GEN',
        categoryName: category?.name || (isTransfer ? 'ACCOUNT TRANSFER' : 'GENERAL'),
        amount,
        paymentMethod: data.paymentMethod || 'Cash',
        entityType: data.entityType || 'NONE',
        entityId: data.entityId,
        entityName: data.entityName,
        vehicleId: data.vehicleId,
        vehicleInfo: data.vehicleInfo,
        referenceNumber: data.referenceNumber,
        sourceModule: data.sourceModule || 'MANUAL',
        description: data.description || '',
        attachmentUrl: data.attachmentUrl,
        status: 'POSTED',
        createdBy: user,
        createdAt: now.toISOString()
      };

      // Mutate Account Balances
      if (data.direction === 'IN') {
        account.currentBalance += amount;
      } else if (data.direction === 'OUT') {
        account.currentBalance -= amount;
      } else if (data.direction === 'TRANSFER') {
        account.currentBalance -= amount;
        if (targetAccount) targetAccount.currentBalance += amount;
      }

      // Mutate entity balances if applicable
      if (data.entityType === 'CLIENT' && data.entityId) {
        const cli = store.clients.find(c => c.id === data.entityId);
        if (cli) {
          if (data.direction === 'IN') cli.balance -= amount;
          else if (data.direction === 'OUT') cli.balance += amount;
        }
      } else if (data.entityType === 'SUPPLIER' && data.entityId) {
        const sup = store.suppliers.find(s => s.id === data.entityId);
        if (sup) {
          if (data.direction === 'OUT') sup.balance -= amount;
          else if (data.direction === 'IN') sup.balance += amount;
        }
      }

      store.ledgerTransactions.unshift(newTxn);
      saveLocalStore(store);
      addLocalAudit('POST_TRANSACTION', 'TRANSACTION', newTxn.id, `Recorded Rs. ${amount} (${newTxn.direction}) on ${account.name}`, user);
      return newTxn;
    });
  },

  async updateTransaction(id: string, data: any, user: string = 'Admin User'): Promise<LedgerTransaction> {
    return safeFetchJson(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const txn = store.ledgerTransactions.find(t => t.id === id);
      if (!txn) throw new Error('Transaction not found');

      // Revert old effect
      const oldAccount = store.accounts.find(a => a.id === txn.accountId);
      if (oldAccount && txn.status === 'POSTED') {
        if (txn.direction === 'IN') oldAccount.currentBalance -= txn.amount;
        else if (txn.direction === 'OUT') oldAccount.currentBalance += txn.amount;
        else if (txn.direction === 'TRANSFER') {
          oldAccount.currentBalance += txn.amount;
          const oldTarget = store.accounts.find(a => a.id === txn.targetAccountId);
          if (oldTarget) oldTarget.currentBalance -= txn.amount;
        }
      }

      // Apply new details
      Object.assign(txn, data);
      const newAccount = store.accounts.find(a => a.id === txn.accountId);
      if (newAccount && txn.status === 'POSTED') {
        if (txn.direction === 'IN') newAccount.currentBalance += txn.amount;
        else if (txn.direction === 'OUT') newAccount.currentBalance -= txn.amount;
        else if (txn.direction === 'TRANSFER') {
          newAccount.currentBalance -= txn.amount;
          const newTarget = store.accounts.find(a => a.id === txn.targetAccountId);
          if (newTarget) newTarget.currentBalance += txn.amount;
        }
      }

      saveLocalStore(store);
      addLocalAudit('UPDATE_TRANSACTION', 'TRANSACTION', id, `Updated transaction ${id}`, user);
      return txn;
    });
  },

  async deleteTransaction(id: string, user: string = 'Admin User'): Promise<{ success: boolean }> {
    return safeFetchJson(`/api/transactions/${id}`, {
      method: 'DELETE',
      headers: { 'X-User': user }
    }, () => {
      const store = getLocalStore();
      const idx = store.ledgerTransactions.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('Transaction not found');
      const txn = store.ledgerTransactions[idx];

      if (txn.status === 'POSTED') {
        const account = store.accounts.find(a => a.id === txn.accountId);
        if (account) {
          if (txn.direction === 'IN') account.currentBalance -= txn.amount;
          else if (txn.direction === 'OUT') account.currentBalance += txn.amount;
          else if (txn.direction === 'TRANSFER') {
            account.currentBalance += txn.amount;
            const targetAcc = store.accounts.find(a => a.id === txn.targetAccountId);
            if (targetAcc) targetAcc.currentBalance -= txn.amount;
          }
        }
      }

      store.ledgerTransactions.splice(idx, 1);
      saveLocalStore(store);
      addLocalAudit('DELETE_TRANSACTION', 'TRANSACTION', id, `Deleted transaction ${id}`, user);
      return { success: true };
    });
  },

  async voidTransaction(id: string, reason: string, user: string = 'Supervisor'): Promise<LedgerTransaction> {
    return safeFetchJson(`/api/transactions/${id}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify({ reason })
    }, () => {
      const store = getLocalStore();
      const txn = store.ledgerTransactions.find(t => t.id === id);
      if (!txn) throw new Error('Transaction not found');
      if (txn.status === 'VOIDED') throw new Error('Transaction is already voided');

      // Revert account balances
      const account = store.accounts.find(a => a.id === txn.accountId);
      if (account) {
        if (txn.direction === 'IN') account.currentBalance -= txn.amount;
        else if (txn.direction === 'OUT') account.currentBalance += txn.amount;
        else if (txn.direction === 'TRANSFER') {
          account.currentBalance += txn.amount;
          const targetAcc = store.accounts.find(a => a.id === txn.targetAccountId);
          if (targetAcc) targetAcc.currentBalance -= txn.amount;
        }
      }

      txn.status = 'VOIDED';
      txn.voidReason = reason;
      saveLocalStore(store);
      addLocalAudit('VOID_TRANSACTION', 'TRANSACTION', id, `Voided transaction ${id}. Reason: ${reason}`, user);
      return txn;
    });
  },

  // Filtered tracking
  async getFilteredTracking(filters: TrackingFilter): Promise<{ transactions: LedgerTransaction[]; summary: FilterSummary }> {
    return safeFetchJson('/api/tracking/filtered', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters)
    }, () => {
      const store = getLocalStore();
      const txns = store.ledgerTransactions.filter(t => {
        if (filters.fromDate && t.date < filters.fromDate) return false;
        if (filters.toDate && t.date > filters.toDate) return false;
        if (filters.direction && filters.direction !== 'ALL' && t.direction !== filters.direction) return false;
        if (filters.accountId && t.accountId !== filters.accountId && t.targetAccountId !== filters.accountId) return false;
        if (filters.categoryId && t.categoryId !== filters.categoryId) return false;
        if (filters.clientId && (t.entityType !== 'CLIENT' || t.entityId !== filters.clientId)) return false;
        if (filters.supplierId && (t.entityType !== 'SUPPLIER' || t.entityId !== filters.supplierId)) return false;
        if (filters.partnerId && (t.entityType !== 'PARTNER' || t.entityId !== filters.partnerId)) return false;
        if (filters.workerId && (t.entityType !== 'WORKER' || t.entityId !== filters.workerId)) return false;
        if (filters.vehicleId && t.vehicleId !== filters.vehicleId) return false;
        if (filters.paymentMethod && t.paymentMethod !== filters.paymentMethod) return false;
        if (filters.status && t.status !== filters.status) return false;
        if (filters.sourceModule && t.sourceModule !== filters.sourceModule) return false;
        if (filters.minAmount !== undefined && filters.minAmount !== '' && t.amount < Number(filters.minAmount)) return false;
        if (filters.maxAmount !== undefined && filters.maxAmount !== '' && t.amount > Number(filters.maxAmount)) return false;
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          const match =
            t.id.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            (t.referenceNumber && t.referenceNumber.toLowerCase().includes(q)) ||
            (t.entityName && t.entityName.toLowerCase().includes(q)) ||
            (t.accountName && t.accountName.toLowerCase().includes(q)) ||
            (t.categoryName && t.categoryName.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      });

      const validTxns = txns.filter(t => t.status === 'POSTED');
      const totalIn = validTxns.filter(t => t.direction === 'IN').reduce((sum, t) => sum + t.amount, 0);
      const totalOut = validTxns.filter(t => t.direction === 'OUT').reduce((sum, t) => sum + t.amount, 0);
      const transferIn = validTxns.filter(t => t.direction === 'TRANSFER').reduce((sum, t) => sum + t.amount, 0);
      const transferOut = transferIn;

      const summary: FilterSummary = {
        totalIn,
        totalOut,
        transferIn,
        transferOut,
        netMovement: totalIn - totalOut,
        transactionCount: txns.length,
        categoryBreakdown: [],
        accountBreakdown: []
      };

      return { transactions: txns, summary };
    });
  },

  // Reconciliation
  async getReconciliation(date: string): Promise<{ positions: DailyAccountPosition[]; session: DailyClosingSession }> {
    return safeFetchJson(`/api/reconciliation?date=${date}`, undefined, () => {
      const store = getLocalStore();
      const session = store.closingSessions.find(s => s.date === date) || {
        date,
        status: 'OPEN',
        totalOpening: 0,
        totalExpectedClosing: 0,
        totalActualCounted: 0,
        totalDifference: 0
      };

      const positions: DailyAccountPosition[] = store.accounts.map(acc => {
        const existing = store.dailyPositions.find(dp => dp.date === date && dp.accountId === acc.id);
        const priorTxns = store.ledgerTransactions.filter(t => t.status === 'POSTED' && t.date < date);
        let calcOpening = acc.openingBalance;
        for (const t of priorTxns) {
          if (t.accountId === acc.id) {
            if (t.direction === 'IN') calcOpening += t.amount;
            else if (t.direction === 'OUT' || t.direction === 'TRANSFER') calcOpening -= t.amount;
          }
          if (t.targetAccountId === acc.id && t.direction === 'TRANSFER') {
            calcOpening += t.amount;
          }
        }

        const dayTxns = store.ledgerTransactions.filter(t => t.status === 'POSTED' && t.date === date);
        let totalIn = 0;
        let totalOut = 0;
        let transferIn = 0;
        let transferOut = 0;

        for (const t of dayTxns) {
          if (t.accountId === acc.id) {
            if (t.direction === 'IN') totalIn += t.amount;
            else if (t.direction === 'OUT') totalOut += t.amount;
            else if (t.direction === 'TRANSFER') transferOut += t.amount;
          }
          if (t.targetAccountId === acc.id && t.direction === 'TRANSFER') {
            transferIn += t.amount;
          }
        }

        const expectedClosing = calcOpening + totalIn + transferIn - totalOut - transferOut;
        const actualCounted = existing?.actualCountedBalance;
        const difference = actualCounted !== undefined ? actualCounted - expectedClosing : undefined;

        return {
          id: existing?.id || `POS-${date}-${acc.id}`,
          date,
          accountId: acc.id,
          accountName: acc.name,
          openingBalance: calcOpening,
          totalIn,
          totalOut,
          transferIn,
          transferOut,
          expectedClosing,
          actualCountedBalance: actualCounted,
          difference,
          status: (session.status === 'CLOSED' ? 'CLOSED' : (existing?.status || 'OPEN')) as DayStatus,
          notes: existing?.notes
        };
      });

      return { positions, session };
    });
  },

  async saveReconciliationCount(date: string, accountId: string, actualCountedBalance: number, notes?: string, user: string = 'Auditor'): Promise<{ success: boolean }> {
    return safeFetchJson('/api/reconciliation/count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify({ date, accountId, actualCountedBalance, notes })
    }, () => {
      const store = getLocalStore();
      let existing = store.dailyPositions.find(p => p.date === date && p.accountId === accountId);
      if (!existing) {
        const acc = store.accounts.find(a => a.id === accountId);
        existing = {
          id: `POS-${date}-${accountId}`,
          date,
          accountId,
          accountName: acc?.name || '',
          openingBalance: acc?.openingBalance || 0,
          totalIn: 0,
          totalOut: 0,
          transferIn: 0,
          transferOut: 0,
          expectedClosing: acc?.currentBalance || 0,
          status: 'OPEN'
        };
        store.dailyPositions.push(existing);
      }
      existing.actualCountedBalance = Number(actualCountedBalance);
      if (notes !== undefined) existing.notes = notes;
      existing.difference = existing.actualCountedBalance - existing.expectedClosing;
      saveLocalStore(store);
      addLocalAudit('UPDATE_COUNT', 'RECONCILIATION', existing.id, `Count updated for ${existing.accountName} on ${date}: Rs. ${actualCountedBalance}`, user);
      return { success: true };
    });
  },

  async settleDifference(date: string, accountId: string, type: 'DEFICIT' | 'SURPLUS', amount: number, reason: string, user: string = 'Manager'): Promise<{ success: boolean }> {
    return safeFetchJson('/api/reconciliation/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify({ date, accountId, type, amount, reason })
    }, () => {
      const store = getLocalStore();
      const account = store.accounts.find(a => a.id === accountId);
      if (!account) throw new Error('Account not found');

      if (type === 'DEFICIT') {
        const cat = store.categories.find(c => c.id === 'CAT-OUT-7') || store.categories.find(c => c.direction === 'OUT') || { id: 'CAT-DEFICIT', name: 'RECONCILIATION DEFICIT' };
        api.createTransaction({
          date,
          direction: 'OUT',
          accountId,
          categoryId: cat.id,
          amount,
          paymentMethod: 'Cash',
          entityType: 'NONE',
          description: `Daily Reconciliation Deficit Settlement: ${reason}`
        }, user);
      } else {
        const cat = store.categories.find(c => c.id === 'CAT-IN-5') || store.categories.find(c => c.direction === 'IN') || { id: 'CAT-SURPLUS', name: 'RECONCILIATION SURPLUS' };
        api.createTransaction({
          date,
          direction: 'IN',
          accountId,
          categoryId: cat.id,
          amount,
          paymentMethod: 'Cash',
          entityType: 'NONE',
          description: `Daily Reconciliation Surplus Settlement: ${reason}`
        }, user);
      }
      return { success: true };
    });
  },

  async closeDay(date: string, notes?: string, user: string = 'Controller'): Promise<DailyClosingSession> {
    return safeFetchJson('/api/reconciliation/close-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify({ date, notes })
    }, () => {
      const store = getLocalStore();
      let session = store.closingSessions.find(s => s.date === date);
      if (!session) {
        session = {
          date,
          status: 'CLOSED',
          totalOpening: 0,
          totalExpectedClosing: 0,
          totalActualCounted: 0,
          totalDifference: 0
        };
        store.closingSessions.push(session);
      }
      session.status = 'CLOSED';
      session.closedBy = user;
      session.closedAt = new Date().toISOString();
      session.notes = notes;
      saveLocalStore(store);
      addLocalAudit('CLOSE_DAY', 'DAY_CLOSING', date, `Closed financial day ${date}`, user);
      return session;
    });
  },

  async reopenDay(date: string, reason: string, user: string = 'Director'): Promise<DailyClosingSession> {
    return safeFetchJson('/api/reconciliation/reopen-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify({ date, reason })
    }, () => {
      const store = getLocalStore();
      const session = store.closingSessions.find(s => s.date === date);
      if (!session) throw new Error('No session for this date');
      session.status = 'OPEN';
      session.notes = `Reopened: ${reason}`;
      saveLocalStore(store);
      addLocalAudit('REOPEN_DAY', 'DAY_CLOSING', date, `Reopened financial day ${date}. Reason: ${reason}`, user);
      return session;
    });
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    return safeFetchJson('/api/audit-logs', undefined, () => getLocalStore().auditLogs);
  },

  // --- ADMIN DATA CLEARANCE & WIPE ---
  async wipeData(mode: 'TRANSACTIONS_ONLY' | 'FULL_SYSTEM_RESET', user: string = 'System Administrator'): Promise<{ success: boolean; message: string }> {
    return safeFetchJson('/api/admin/wipe-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': user },
      body: JSON.stringify({ mode })
    }, () => {
      const store = getLocalStore();
      if (mode === 'TRANSACTIONS_ONLY') {
        store.ledgerTransactions = [];
        store.dailyPositions = [];
        store.closingSessions = [];
        for (const acc of store.accounts) {
          acc.currentBalance = acc.openingBalance;
        }
        for (const c of store.clients) c.balance = 0;
        for (const s of store.suppliers) s.balance = 0;
        for (const p of store.partners) p.balance = 0;

        addLocalAudit('WIPE_DATA', 'SYSTEM', 'LEDGER', 'Cleared all transactions and reset account balances', user);
        saveLocalStore(store);
        return { success: true, message: 'All transactions cleared and balances recalibrated to opening balance.' };
      } else {
        store.ledgerTransactions = [];
        store.dailyPositions = [];
        store.closingSessions = [];
        store.clients = [];
        store.suppliers = [];
        store.partners = [];
        store.workers = [];
        store.vehicles = [];
        store.banks = [];
        store.accounts = [];
        store.categories = [];
        store.paymentMethods = [];
        store.auditLogs = [];

        addLocalAudit('FULL_SYSTEM_RESET', 'SYSTEM', 'DATABASE', 'Complete factory reset executed', user);
        saveLocalStore(store);
        return { success: true, message: 'Complete full system factory reset executed.' };
      }
    });
  },

  // --- XLSX & JSON BACKUP EXPORT ---
  async exportFullBackupWorkbook(): Promise<Blob> {
    const isAvailable = await checkBackendAvailable();
    if (isAvailable) {
      try {
        const res = await fetch('/api/backup/export');
        if (res.ok && (res.headers.get('content-type') || '').includes('sheet')) {
          return await res.blob();
        }
      } catch {
        // Fall back to client-side generation
      }
    }

    // Client-side XLSX generation
    const store = getLocalStore();
    const wb = XLSX.utils.book_new();

    const addSheet = (sheetName: string, rows: any[]) => {
      const ws = XLSX.utils.json_to_sheet(rows || []);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    addSheet('Transactions', store.ledgerTransactions);
    addSheet('Accounts', store.accounts);
    addSheet('Banks', store.banks);
    addSheet('Categories', store.categories);
    addSheet('Clients', store.clients);
    addSheet('Suppliers', store.suppliers);
    addSheet('Partners', store.partners);
    addSheet('Workers', store.workers);
    addSheet('Vehicles', store.vehicles);
    addSheet('PaymentMethods', store.paymentMethods);
    addSheet('ClosingSessions', store.closingSessions);
    addSheet('DailyPositions', store.dailyPositions);
    addSheet('AuditLogs', store.auditLogs);

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },

  exportFullBackupJson(): Blob {
    const store = getLocalStore();
    const jsonStr = JSON.stringify(store, null, 2);
    return new Blob([jsonStr], { type: 'application/json' });
  },

  // --- BACKUP RESTORE (XLSX & JSON) ---
  async restoreBackupFile(file: File, user: string = 'System Administrator'): Promise<{ success: boolean; message: string; result?: any }> {
    const isJson = file.name.endsWith('.json');

    if (isJson) {
      const text = await file.text();
      const data = JSON.parse(text);
      const store = getLocalStore();

      if (Array.isArray(data.banks)) store.banks = data.banks;
      if (Array.isArray(data.accounts)) store.accounts = data.accounts;
      if (Array.isArray(data.categories)) store.categories = data.categories;
      if (Array.isArray(data.clients)) store.clients = data.clients;
      if (Array.isArray(data.suppliers)) store.suppliers = data.suppliers;
      if (Array.isArray(data.partners)) store.partners = data.partners;
      if (Array.isArray(data.workers)) store.workers = data.workers;
      if (Array.isArray(data.vehicles)) store.vehicles = data.vehicles;
      if (Array.isArray(data.paymentMethods)) store.paymentMethods = data.paymentMethods;
      if (Array.isArray(data.ledgerTransactions)) store.ledgerTransactions = data.ledgerTransactions;
      if (Array.isArray(data.dailyPositions)) store.dailyPositions = data.dailyPositions;
      if (Array.isArray(data.closingSessions)) store.closingSessions = data.closingSessions;
      if (Array.isArray(data.auditLogs)) store.auditLogs = data.auditLogs;

      saveLocalStore(store);
      addLocalAudit('SYSTEM_RESTORE_JSON', 'BACKUP', file.name, `Restored system state from JSON file (${store.ledgerTransactions.length} transactions, ${store.accounts.length} accounts)`, user);

      return {
        success: true,
        message: `Successfully restored database state from JSON file: ${store.ledgerTransactions.length} transactions, ${store.accounts.length} accounts.`,
        result: {
          transactionsCount: store.ledgerTransactions.length,
          accountsCount: store.accounts.length,
          categoriesCount: store.categories.length,
          banksCount: store.banks.length
        }
      };
    }

    // Process XLSX
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });

    const parseSheet = (sheetName: string): any[] => {
      const ws = wb.Sheets[sheetName];
      if (!ws) return [];
      return XLSX.utils.sheet_to_json(ws, { defval: '' });
    };

    const toBool = (val: any, defaultVal = false): boolean => {
      if (val === true || val === 'true' || val === 'TRUE' || val === 1 || val === '1') return true;
      if (val === false || val === 'false' || val === 'FALSE' || val === 0 || val === '0') return false;
      return defaultVal;
    };

    const toNum = (val: any, defaultVal = 0): number => {
      if (val === undefined || val === null || val === '') return defaultVal;
      const n = Number(val);
      return isNaN(n) ? defaultVal : n;
    };

    const toStr = (val: any): string => {
      if (val === undefined || val === null) return '';
      return String(val).trim();
    };

    const store = getLocalStore();

    // Banks
    const rawBanks = parseSheet('Banks');
    if (rawBanks.length > 0) {
      store.banks = rawBanks.map((b: any) => ({
        id: toStr(b.id) || `BANK-${Date.now()}`,
        code: toStr(b.code),
        name: toStr(b.name),
        branch: b.branch ? toStr(b.branch) : undefined,
        active: toBool(b.active, true),
        createdAt: toStr(b.createdAt) || new Date().toISOString()
      }));
    }

    // Accounts
    const rawAccounts = parseSheet('Accounts');
    if (rawAccounts.length > 0) {
      store.accounts = rawAccounts.map((a: any) => ({
        id: toStr(a.id) || `ACC-${Date.now()}`,
        name: toStr(a.name),
        bankId: a.bankId ? toStr(a.bankId) : undefined,
        bankName: a.bankName ? toStr(a.bankName) : undefined,
        accountNumber: a.accountNumber ? toStr(a.accountNumber) : undefined,
        accountType: toStr(a.accountType) as any,
        openingBalance: toNum(a.openingBalance),
        currentBalance: toNum(a.currentBalance),
        active: toBool(a.active, true),
        displayOrder: a.displayOrder ? toNum(a.displayOrder) : undefined,
        createdAt: toStr(a.createdAt) || new Date().toISOString()
      }));
    }

    // Categories
    const rawCategories = parseSheet('Categories');
    if (rawCategories.length > 0) {
      store.categories = rawCategories.map((c: any) => ({
        id: toStr(c.id) || `CAT-${Date.now()}`,
        name: toStr(c.name),
        direction: toStr(c.direction) as any,
        active: toBool(c.active, true),
        requiresClient: c.requiresClient !== undefined && c.requiresClient !== '' ? toBool(c.requiresClient) : undefined,
        requiresSupplier: c.requiresSupplier !== undefined && c.requiresSupplier !== '' ? toBool(c.requiresSupplier) : undefined,
        requiresPartner: c.requiresPartner !== undefined && c.requiresPartner !== '' ? toBool(c.requiresPartner) : undefined,
        requiresWorker: c.requiresWorker !== undefined && c.requiresWorker !== '' ? toBool(c.requiresWorker) : undefined,
        requiresVehicle: c.requiresVehicle !== undefined && c.requiresVehicle !== '' ? toBool(c.requiresVehicle) : undefined,
        requiresBill: c.requiresBill !== undefined && c.requiresBill !== '' ? toBool(c.requiresBill) : undefined,
        requiresReference: c.requiresReference !== undefined && c.requiresReference !== '' ? toBool(c.requiresReference) : undefined,
        requiresDescription: c.requiresDescription !== undefined && c.requiresDescription !== '' ? toBool(c.requiresDescription) : undefined,
        description: c.description ? toStr(c.description) : undefined
      }));
    }

    // Clients
    const rawClients = parseSheet('Clients');
    if (rawClients.length > 0) {
      store.clients = rawClients.map((c: any) => ({
        id: toStr(c.id) || `CLI-${Date.now()}`,
        code: toStr(c.code),
        name: toStr(c.name),
        phone: c.phone ? toStr(c.phone) : undefined,
        email: c.email ? toStr(c.email) : undefined,
        address: c.address ? toStr(c.address) : undefined,
        balance: toNum(c.balance),
        status: (toStr(c.status) || 'ACTIVE') as any,
        createdAt: toStr(c.createdAt) || new Date().toISOString()
      }));
    }

    // Suppliers
    const rawSuppliers = parseSheet('Suppliers');
    if (rawSuppliers.length > 0) {
      store.suppliers = rawSuppliers.map((s: any) => ({
        id: toStr(s.id) || `SUP-${Date.now()}`,
        code: toStr(s.code),
        name: toStr(s.name),
        phone: s.phone ? toStr(s.phone) : undefined,
        email: s.email ? toStr(s.email) : undefined,
        address: s.address ? toStr(s.address) : undefined,
        balance: toNum(s.balance),
        status: (toStr(s.status) || 'ACTIVE') as any,
        createdAt: toStr(s.createdAt) || new Date().toISOString()
      }));
    }

    // Partners
    const rawPartners = parseSheet('Partners');
    if (rawPartners.length > 0) {
      store.partners = rawPartners.map((p: any) => ({
        id: toStr(p.id) || `PTR-${Date.now()}`,
        code: toStr(p.code),
        name: toStr(p.name),
        phone: p.phone ? toStr(p.phone) : undefined,
        email: p.email ? toStr(p.email) : undefined,
        sharePercentage: p.sharePercentage ? toNum(p.sharePercentage) : undefined,
        balance: toNum(p.balance),
        status: (toStr(p.status) || 'ACTIVE') as any,
        createdAt: toStr(p.createdAt) || new Date().toISOString()
      }));
    }

    // Workers
    const rawWorkers = parseSheet('Workers');
    if (rawWorkers.length > 0) {
      store.workers = rawWorkers.map((w: any) => ({
        id: toStr(w.id) || `WRK-${Date.now()}`,
        code: toStr(w.code),
        name: toStr(w.name),
        role: w.role ? toStr(w.role) : undefined,
        phone: w.phone ? toStr(w.phone) : undefined,
        dailyWage: w.dailyWage ? toNum(w.dailyWage) : undefined,
        status: (toStr(w.status) || 'ACTIVE') as any,
        createdAt: toStr(w.createdAt) || new Date().toISOString()
      }));
    }

    // Vehicles
    const rawVehicles = parseSheet('Vehicles');
    if (rawVehicles.length > 0) {
      store.vehicles = rawVehicles.map((v: any) => ({
        id: toStr(v.id) || `VEH-${Date.now()}`,
        plateNumber: toStr(v.plateNumber),
        model: toStr(v.model),
        driverName: v.driverName ? toStr(v.driverName) : undefined,
        status: (toStr(v.status) || 'ACTIVE') as any,
        createdAt: toStr(v.createdAt) || new Date().toISOString()
      }));
    }

    // Payment Methods
    const rawPaymentMethods = parseSheet('PaymentMethods');
    if (rawPaymentMethods.length > 0) {
      store.paymentMethods = rawPaymentMethods.map((pm: any) => ({
        id: toStr(pm.id) || `PM-${Date.now()}`,
        name: toStr(pm.name),
        code: toStr(pm.code),
        active: toBool(pm.active, true)
      }));
    }

    // Transactions
    const rawTxns = parseSheet('Transactions');
    if (rawTxns.length > 0) {
      store.ledgerTransactions = rawTxns.map((t: any) => ({
        id: toStr(t.id),
        date: toStr(t.date),
        time: toStr(t.time),
        direction: toStr(t.direction) as any,
        accountId: toStr(t.accountId),
        accountName: toStr(t.accountName),
        targetAccountId: t.targetAccountId ? toStr(t.targetAccountId) : undefined,
        targetAccountName: t.targetAccountName ? toStr(t.targetAccountName) : undefined,
        categoryId: toStr(t.categoryId),
        categoryName: toStr(t.categoryName),
        amount: toNum(t.amount),
        paymentMethod: toStr(t.paymentMethod),
        entityType: (toStr(t.entityType) || 'NONE') as any,
        entityId: t.entityId ? toStr(t.entityId) : undefined,
        entityName: t.entityName ? toStr(t.entityName) : undefined,
        vehicleId: t.vehicleId ? toStr(t.vehicleId) : undefined,
        vehicleInfo: t.vehicleInfo ? toStr(t.vehicleInfo) : undefined,
        referenceNumber: t.referenceNumber ? toStr(t.referenceNumber) : undefined,
        sourceModule: (toStr(t.sourceModule) || 'MANUAL') as any,
        description: toStr(t.description),
        attachmentUrl: t.attachmentUrl ? toStr(t.attachmentUrl) : undefined,
        status: (toStr(t.status) || 'POSTED') as any,
        voidReason: t.voidReason ? toStr(t.voidReason) : undefined,
        createdBy: toStr(t.createdBy) || 'System',
        createdAt: toStr(t.createdAt) || new Date().toISOString(),
        reconciledDay: t.reconciledDay ? toStr(t.reconciledDay) : undefined
      }));
    }

    // ClosingSessions
    const rawClosing = parseSheet('ClosingSessions');
    if (rawClosing.length > 0) {
      store.closingSessions = rawClosing.map((cs: any) => ({
        date: toStr(cs.date),
        status: (toStr(cs.status) || 'OPEN') as any,
        closedBy: cs.closedBy ? toStr(cs.closedBy) : undefined,
        closedAt: cs.closedAt ? toStr(cs.closedAt) : undefined,
        totalOpening: toNum(cs.totalOpening),
        totalExpectedClosing: toNum(cs.totalExpectedClosing),
        totalActualCounted: toNum(cs.totalActualCounted),
        totalDifference: toNum(cs.totalDifference),
        notes: cs.notes ? toStr(cs.notes) : undefined
      }));
    }

    // DailyPositions
    const rawPositions = parseSheet('DailyPositions');
    if (rawPositions.length > 0) {
      store.dailyPositions = rawPositions.map((dp: any) => ({
        id: toStr(dp.id) || `POS-${toStr(dp.date)}-${toStr(dp.accountId)}`,
        date: toStr(dp.date),
        accountId: toStr(dp.accountId),
        accountName: toStr(dp.accountName),
        openingBalance: toNum(dp.openingBalance),
        totalIn: toNum(dp.totalIn),
        totalOut: toNum(dp.totalOut),
        transferIn: toNum(dp.transferIn),
        transferOut: toNum(dp.transferOut),
        expectedClosing: toNum(dp.expectedClosing !== undefined && dp.expectedClosing !== '' ? dp.expectedClosing : dp.expectedClosingBalance),
        actualCountedBalance: dp.actualCountedBalance !== undefined && dp.actualCountedBalance !== '' ? toNum(dp.actualCountedBalance) : undefined,
        difference: dp.difference !== undefined && dp.difference !== '' ? toNum(dp.difference) : undefined,
        status: (toStr(dp.status) || 'OPEN') as DayStatus,
        notes: dp.notes ? toStr(dp.notes) : undefined
      }));
    }

    saveLocalStore(store);
    addLocalAudit('SYSTEM_RESTORE_XLSX', 'BACKUP', file.name, `Restored database state from XLSX workbook (${store.ledgerTransactions.length} transactions, ${store.accounts.length} accounts)`, user);

    // Also attempt sending to server in background if server is online
    const isAvailable = await checkBackendAvailable();
    if (isAvailable) {
      try {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const resultStr = evt.target?.result as string;
          const base64 = resultStr.split(',')[1] || resultStr;
          await fetch('/api/backup/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-User': user },
            body: JSON.stringify({ fileBase64: base64 })
          });
        };
        reader.readAsDataURL(file);
      } catch {
        // server sync failed, local store is authoritative
      }
    }

    return {
      success: true,
      message: `System state cleanly restored from XLSX backup workbook! Restored ${store.ledgerTransactions.length} transactions, ${store.accounts.length} accounts.`,
      result: {
        transactionsCount: store.ledgerTransactions.length,
        accountsCount: store.accounts.length,
        banksCount: store.banks.length,
        categoriesCount: store.categories.length,
        clientsCount: store.clients.length,
        suppliersCount: store.suppliers.length,
        partnersCount: store.partners.length,
        workersCount: store.workers.length,
        vehiclesCount: store.vehicles.length,
        paymentMethodsCount: store.paymentMethods.length
      }
    };
  }
};
