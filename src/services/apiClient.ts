import * as XLSX from 'xlsx';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
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

// Collection references
const COL_BANKS = 'banks';
const COL_ACCOUNTS = 'accounts';
const COL_CATEGORIES = 'categories';
const COL_CLIENTS = 'clients';
const COL_SUPPLIERS = 'suppliers';
const COL_PARTNERS = 'partners';
const COL_WORKERS = 'workers';
const COL_VEHICLES = 'vehicles';
const COL_PAYMENT_METHODS = 'paymentMethods';
const COL_TRANSACTIONS = 'transactions';
const COL_DAILY_POSITIONS = 'dailyPositions';
const COL_CLOSING_SESSIONS = 'closingSessions';
const COL_AUDIT_LOGS = 'auditLogs';
const COL_META = 'systemMeta';

const DEFAULT_BANKS: Bank[] = [
  { id: 'BANK-1', code: 'ALHAB', name: 'BANK AL HABIB', branch: '-', active: true, createdAt: '2026-08-08' },
  { id: 'BANK-2', code: 'MCB', name: 'MUSLIM COMMERCIAL BANK', branch: '-', active: true, createdAt: '2026-08-08' },
  { id: 'BANK-3', code: 'JAZZ CASH', name: 'MOBILINK', branch: '27905', active: true, createdAt: '2026-08-08' }
];

const DEFAULT_ACCOUNTS: FinancialAccount[] = [
  { id: 'ACC-1', name: 'FBM CASH IN HAND', accountType: 'CASH', openingBalance: 0, currentBalance: 0, active: true, displayOrder: 1, createdAt: '2026-08-08' },
  { id: 'ACC-2', name: 'FBM AL HABIB', bankId: 'BANK-1', bankName: 'BANK AL HABIB', accountNumber: '-', accountType: 'BANK', openingBalance: 0, currentBalance: 0, active: true, displayOrder: 2, createdAt: '2026-08-08' },
  { id: 'ACC-3', name: 'FBM MCB', bankId: 'BANK-2', bankName: 'MUSLIM COMMERCIAL BANK', accountNumber: '-', accountType: 'BANK', openingBalance: 0, currentBalance: 0, active: true, displayOrder: 3, createdAt: '2026-08-08' },
  { id: 'ACC-4', name: 'FBM JAZZ CASH', bankId: 'BANK-1', bankName: 'BANK AL HABIB', accountNumber: '-', accountType: 'BANK', openingBalance: 0, currentBalance: 0, active: true, displayOrder: 4, createdAt: '2026-08-08' }
];

const DEFAULT_CATEGORIES: TransactionCategory[] = [
  { id: 'CAT-1', name: 'HDC LOANS IN', direction: 'IN', active: true, requiresPartner: true, description: 'Partner Loan Inflow' },
  { id: 'CAT-2', name: 'HDC LOANS OUT', direction: 'OUT', active: true, requiresPartner: true, description: 'Partner Loan Outflow' },
  { id: 'CAT-IN-5', name: 'RECONCILIATION SURPLUS', direction: 'IN', active: true, description: 'Reconciliation surplus/excess settlement' },
  { id: 'CAT-OUT-7', name: 'RECONCILIATION DEFICIT', direction: 'OUT', active: true, description: 'Reconciliation deficit/shortage settlement' }
];

const DEFAULT_PARTNERS: Partner[] = [
  { id: 'PTR-301', code: 'P-301', name: 'HDC', sharePercentage: 0, balance: 0, status: 'ACTIVE', createdAt: '2026-08-08' },
  { id: 'PTR-302', code: 'P-302', name: 'HDC LABOUR', sharePercentage: 0, balance: 0, status: 'ACTIVE', createdAt: '2026-08-08' }
];

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'PM-1', name: 'Cash', code: 'CASH', active: true },
  { id: 'PM-2', name: 'Bank Transfer / Online RTGS', code: 'BANK_TRANSFER', active: true },
  { id: 'PM-3', name: 'Crossed Cheque', code: 'CHEQUE', active: true },
  { id: 'PM-4', name: 'Digital Wallet', code: 'DIGITAL_WALLET', active: true },
  { id: 'PM-5', name: 'Pay Order / Demand Draft', code: 'PAY_ORDER', active: true }
];

let initPromise: Promise<void> | null = null;

// Ensure base collections exist in Firestore
async function ensureFirestoreInitialized(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const metaDocRef = doc(db, COL_META, 'initialization');
      const metaDoc = await getDoc(metaDocRef);

      if (!metaDoc.exists()) {
        const batch = writeBatch(db);

        // Seed banks
        for (const bank of DEFAULT_BANKS) {
          batch.set(doc(db, COL_BANKS, bank.id), bank);
        }
        // Seed accounts
        for (const acc of DEFAULT_ACCOUNTS) {
          batch.set(doc(db, COL_ACCOUNTS, acc.id), acc);
        }
        // Seed categories
        for (const cat of DEFAULT_CATEGORIES) {
          batch.set(doc(db, COL_CATEGORIES, cat.id), cat);
        }
        // Seed partners
        for (const ptr of DEFAULT_PARTNERS) {
          batch.set(doc(db, COL_PARTNERS, ptr.id), ptr);
        }
        // Seed payment methods
        for (const pm of DEFAULT_PAYMENT_METHODS) {
          batch.set(doc(db, COL_PAYMENT_METHODS, pm.id), pm);
        }

        // Init audit log
        const logId = `LOG-${Date.now()}`;
        batch.set(doc(db, COL_AUDIT_LOGS, logId), {
          id: logId,
          timestamp: new Date().toISOString(),
          action: 'SYSTEM_INITIALIZATION',
          entityType: 'SYSTEM',
          entityId: 'ROOT',
          details: 'Central Cloud Firestore database initialized for multi-user synchronization',
          user: 'System Admin'
        });

        // Set metadata
        batch.set(metaDocRef, {
          initialized: true,
          initializedAt: new Date().toISOString(),
          version: '2.0.0'
        });

        await batch.commit();
      }
    } catch (e) {
      console.error('Error initializing Firestore:', e);
    }
  })();

  return initPromise;
}

// Helper to strip undefined values so Firestore never throws unsupported field errors
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        result[key] = sanitizeForFirestore(val);
      }
    }
    return result as T;
  }
  return data;
}

// Audit helper in Firestore
async function addFirestoreAudit(action: string, entityType: string, entityId: string, details: string, user: string = 'User') {
  try {
    const logId = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newLog: AuditLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      details,
      user: user || 'System'
    };
    await setDoc(doc(db, COL_AUDIT_LOGS, logId), sanitizeForFirestore(newLog));
  } catch (err) {
    console.error('Failed to log audit:', err);
  }
}

export const api = {
  // Real-time synchronization subscription helper across all master and transactional collections
  subscribeToData(onUpdate: () => void) {
    const collectionsToListen = [
      COL_TRANSACTIONS,
      COL_ACCOUNTS,
      COL_BANKS,
      COL_CATEGORIES,
      COL_CLIENTS,
      COL_SUPPLIERS,
      COL_PARTNERS,
      COL_WORKERS,
      COL_VEHICLES,
      COL_PAYMENT_METHODS,
      COL_DAILY_POSITIONS,
      COL_CLOSING_SESSIONS,
      COL_AUDIT_LOGS,
      COL_META
    ];

    const unsubs = collectionsToListen.map(colName =>
      onSnapshot(
        collection(db, colName),
        () => {
          onUpdate();
        },
        (error) => {
          console.warn(`Snapshot listener notice for ${colName}:`, error);
        }
      )
    );

    return () => {
      unsubs.forEach(u => u());
    };
  },

  // --- BANKS ---
  async getBanks(): Promise<Bank[]> {
    await ensureFirestoreInitialized();
    const snap = await getDocs(collection(db, COL_BANKS));
    const banks: Bank[] = [];
    snap.forEach(d => banks.push(d.data() as Bank));
    return banks;
  },

  async addBank(data: Partial<Bank>, user: string = 'Admin'): Promise<Bank> {
    await ensureFirestoreInitialized();
    const newId = `BANK-${Date.now()}`;
    const newBank: Bank = {
      id: newId,
      code: (data.code || '').toUpperCase().trim(),
      name: (data.name || '').trim(),
      branch: data.branch?.trim() || undefined,
      active: data.active !== undefined ? data.active : true,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    await setDoc(doc(db, COL_BANKS, newId), sanitizeForFirestore(newBank));
    await addFirestoreAudit('CREATE_BANK', 'BANK', newId, `Created bank ${newBank.name}`, user);
    return newBank;
  },

  async updateBank(id: string, data: Partial<Bank>, user: string = 'Admin'): Promise<Bank> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_BANKS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Bank not found');
    const existing = snap.data() as Bank;
    const updated: Bank = {
      ...existing,
      ...data,
      code: data.code ? data.code.toUpperCase().trim() : existing.code,
      name: data.name ? data.name.trim() : existing.name
    };
    await setDoc(docRef, sanitizeForFirestore(updated));
    await addFirestoreAudit('UPDATE_BANK', 'BANK', id, `Updated bank ${updated.name}`, user);
    return updated;
  },

  async deleteBank(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_BANKS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Bank not found');
    const b = snap.data() as Bank;
    await deleteDoc(docRef);
    await addFirestoreAudit('DELETE_BANK', 'BANK', id, `Deleted bank ${b.name}`, user);
    return { success: true };
  },

  // --- FINANCIAL ACCOUNTS ---
  async getAccounts(): Promise<FinancialAccount[]> {
    await ensureFirestoreInitialized();
    const snap = await getDocs(collection(db, COL_ACCOUNTS));
    const accounts: FinancialAccount[] = [];
    snap.forEach(d => accounts.push(d.data() as FinancialAccount));
    return accounts.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
  },

  async addAccount(data: Partial<FinancialAccount>, user: string = 'Admin'): Promise<FinancialAccount> {
    await ensureFirestoreInitialized();
    const newId = `ACC-${Date.now()}`;
    const openBal = Number(data.openingBalance) || 0;
    const allAccs = await this.getAccounts();
    const newAcc: FinancialAccount = {
      id: newId,
      name: (data.name || '').trim(),
      bankId: data.bankId,
      bankName: data.bankName,
      accountNumber: data.accountNumber?.trim(),
      accountType: data.accountType || 'CASH',
      openingBalance: openBal,
      currentBalance: openBal,
      active: data.active !== undefined ? data.active : true,
      displayOrder: allAccs.length + 1,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    await setDoc(doc(db, COL_ACCOUNTS, newId), sanitizeForFirestore(newAcc));
    await addFirestoreAudit('CREATE_ACCOUNT', 'ACCOUNT', newId, `Created account ${newAcc.name} (Opening: Rs. ${openBal})`, user);
    return newAcc;
  },

  async updateAccount(id: string, data: Partial<FinancialAccount>, user: string = 'Admin'): Promise<FinancialAccount> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_ACCOUNTS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Account not found');
    const existing = snap.data() as FinancialAccount;
    const updated: FinancialAccount = {
      ...existing,
      ...data,
      name: data.name ? data.name.trim() : existing.name
    };
    await setDoc(docRef, sanitizeForFirestore(updated));
    await addFirestoreAudit('UPDATE_ACCOUNT', 'ACCOUNT', id, `Updated account ${updated.name}`, user);
    return updated;
  },

  async deleteAccount(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_ACCOUNTS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Account not found');
    const a = snap.data() as FinancialAccount;
    await deleteDoc(docRef);
    await addFirestoreAudit('DELETE_ACCOUNT', 'ACCOUNT', id, `Deleted account ${a.name}`, user);
    return { success: true };
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<TransactionCategory[]> {
    await ensureFirestoreInitialized();
    const snap = await getDocs(collection(db, COL_CATEGORIES));
    const cats: TransactionCategory[] = [];
    snap.forEach(d => cats.push(d.data() as TransactionCategory));
    return cats;
  },

  async addCategory(data: Partial<TransactionCategory>, user: string = 'Admin'): Promise<TransactionCategory> {
    await ensureFirestoreInitialized();
    const newId = `CAT-${Date.now()}`;
    const newCat: TransactionCategory = {
      id: newId,
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
    await setDoc(doc(db, COL_CATEGORIES, newId), sanitizeForFirestore(newCat));
    await addFirestoreAudit('CREATE_CATEGORY', 'CATEGORY', newId, `Created category ${newCat.name}`, user);
    return newCat;
  },

  async updateCategory(id: string, data: Partial<TransactionCategory>, user: string = 'Admin'): Promise<TransactionCategory> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_CATEGORIES, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Category not found');
    const existing = snap.data() as TransactionCategory;
    const updated = { ...existing, ...data };
    await setDoc(docRef, sanitizeForFirestore(updated));
    await addFirestoreAudit('UPDATE_CATEGORY', 'CATEGORY', id, `Updated category ${updated.name}`, user);
    return updated;
  },

  async deleteCategory(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_CATEGORIES, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Category not found');
    const c = snap.data() as TransactionCategory;
    await deleteDoc(docRef);
    await addFirestoreAudit('DELETE_CATEGORY', 'CATEGORY', id, `Deleted category ${c.name}`, user);
    return { success: true };
  },

  // --- CLIENTS ---
  async getClients(): Promise<Client[]> {
    await ensureFirestoreInitialized();
    const snap = await getDocs(collection(db, COL_CLIENTS));
    const list: Client[] = [];
    snap.forEach(d => list.push(d.data() as Client));
    return list;
  },

  async addClient(data: Partial<Client>, user: string = 'Admin'): Promise<Client> {
    await ensureFirestoreInitialized();
    const newId = `CLI-${Date.now()}`;
    const all = await this.getClients();
    const newCli: Client = {
      id: newId,
      code: data.code?.trim() || `C-${all.length + 101}`,
      name: (data.name || '').trim(),
      phone: data.phone?.trim(),
      email: data.email?.trim(),
      address: data.address?.trim(),
      balance: Number(data.balance) || 0,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    await setDoc(doc(db, COL_CLIENTS, newId), sanitizeForFirestore(newCli));
    await addFirestoreAudit('CREATE_CLIENT', 'CLIENT', newId, `Created client ${newCli.name}`, user);
    return newCli;
  },

  async updateClient(id: string, data: Partial<Client>, user: string = 'Admin'): Promise<Client> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_CLIENTS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Client not found');
    const updated = { ...(snap.data() as Client), ...data };
    await setDoc(docRef, sanitizeForFirestore(updated));
    await addFirestoreAudit('UPDATE_CLIENT', 'CLIENT', id, `Updated client ${updated.name}`, user);
    return updated;
  },

  async deleteClient(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_CLIENTS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Client not found');
    const c = snap.data() as Client;
    await deleteDoc(docRef);
    await addFirestoreAudit('DELETE_CLIENT', 'CLIENT', id, `Deleted client ${c.name}`, user);
    return { success: true };
  },

  // --- SUPPLIERS ---
  async getSuppliers(): Promise<Supplier[]> {
    await ensureFirestoreInitialized();
    const snap = await getDocs(collection(db, COL_SUPPLIERS));
    const list: Supplier[] = [];
    snap.forEach(d => list.push(d.data() as Supplier));
    return list;
  },

  async addSupplier(data: Partial<Supplier>, user: string = 'Admin'): Promise<Supplier> {
    await ensureFirestoreInitialized();
    const newId = `SUP-${Date.now()}`;
    const all = await this.getSuppliers();
    const newSup: Supplier = {
      id: newId,
      code: data.code?.trim() || `S-${all.length + 101}`,
      name: (data.name || '').trim(),
      phone: data.phone?.trim(),
      email: data.email?.trim(),
      address: data.address?.trim(),
      balance: Number(data.balance) || 0,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    await setDoc(doc(db, COL_SUPPLIERS, newId), sanitizeForFirestore(newSup));
    await addFirestoreAudit('CREATE_SUPPLIER', 'SUPPLIER', newId, `Created supplier ${newSup.name}`, user);
    return newSup;
  },

  async updateSupplier(id: string, data: Partial<Supplier>, user: string = 'Admin'): Promise<Supplier> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_SUPPLIERS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Supplier not found');
    const updated = { ...(snap.data() as Supplier), ...data };
    await setDoc(docRef, sanitizeForFirestore(updated));
    await addFirestoreAudit('UPDATE_SUPPLIER', 'SUPPLIER', id, `Updated supplier ${updated.name}`, user);
    return updated;
  },

  async deleteSupplier(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_SUPPLIERS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Supplier not found');
    const s = snap.data() as Supplier;
    await deleteDoc(docRef);
    await addFirestoreAudit('DELETE_SUPPLIER', 'SUPPLIER', id, `Deleted supplier ${s.name}`, user);
    return { success: true };
  },

  // --- PARTNERS ---
  async getPartners(): Promise<Partner[]> {
    await ensureFirestoreInitialized();
    const snap = await getDocs(collection(db, COL_PARTNERS));
    const list: Partner[] = [];
    snap.forEach(d => list.push(d.data() as Partner));
    return list;
  },

  async addPartner(data: Partial<Partner>, user: string = 'Admin'): Promise<Partner> {
    await ensureFirestoreInitialized();
    const newId = `PTR-${Date.now()}`;
    const all = await this.getPartners();
    const newPtr: Partner = {
      id: newId,
      code: data.code?.trim() || `P-${all.length + 301}`,
      name: (data.name || '').trim(),
      phone: data.phone?.trim(),
      email: data.email?.trim(),
      sharePercentage: Number(data.sharePercentage) || 0,
      balance: Number(data.balance) || 0,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    await setDoc(doc(db, COL_PARTNERS, newId), sanitizeForFirestore(newPtr));
    await addFirestoreAudit('CREATE_PARTNER', 'PARTNER', newId, `Created partner ${newPtr.name}`, user);
    return newPtr;
  },

  async updatePartner(id: string, data: Partial<Partner>, user: string = 'Admin'): Promise<Partner> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_PARTNERS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Partner not found');
    const updated = { ...(snap.data() as Partner), ...data };
    await setDoc(docRef, sanitizeForFirestore(updated));
    await addFirestoreAudit('UPDATE_PARTNER', 'PARTNER', id, `Updated partner ${updated.name}`, user);
    return updated;
  },

  async deletePartner(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_PARTNERS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Partner not found');
    const p = snap.data() as Partner;
    await deleteDoc(docRef);
    await addFirestoreAudit('DELETE_PARTNER', 'PARTNER', id, `Deleted partner ${p.name}`, user);
    return { success: true };
  },

  // --- WORKERS ---
  async getWorkers(): Promise<Worker[]> {
    await ensureFirestoreInitialized();
    const snap = await getDocs(collection(db, COL_WORKERS));
    const list: Worker[] = [];
    snap.forEach(d => list.push(d.data() as Worker));
    return list;
  },

  async addWorker(data: Partial<Worker>, user: string = 'Admin'): Promise<Worker> {
    await ensureFirestoreInitialized();
    const newId = `WRK-${Date.now()}`;
    const all = await this.getWorkers();
    const newWrk: Worker = {
      id: newId,
      code: data.code?.trim() || `W-${all.length + 101}`,
      name: (data.name || '').trim(),
      role: data.role?.trim() || 'Worker',
      phone: data.phone?.trim(),
      dailyWage: Number(data.dailyWage) || undefined,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    await setDoc(doc(db, COL_WORKERS, newId), sanitizeForFirestore(newWrk));
    await addFirestoreAudit('CREATE_WORKER', 'WORKER', newId, `Created worker ${newWrk.name}`, user);
    return newWrk;
  },

  async updateWorker(id: string, data: Partial<Worker>, user: string = 'Admin'): Promise<Worker> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_WORKERS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Worker not found');
    const updated = { ...(snap.data() as Worker), ...data };
    await setDoc(docRef, sanitizeForFirestore(updated));
    await addFirestoreAudit('UPDATE_WORKER', 'WORKER', id, `Updated worker ${updated.name}`, user);
    return updated;
  },

  async deleteWorker(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_WORKERS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Worker not found');
    const w = snap.data() as Worker;
    await deleteDoc(docRef);
    await addFirestoreAudit('DELETE_WORKER', 'WORKER', id, `Deleted worker ${w.name}`, user);
    return { success: true };
  },

  // --- VEHICLES ---
  async getVehicles(): Promise<Vehicle[]> {
    await ensureFirestoreInitialized();
    const snap = await getDocs(collection(db, COL_VEHICLES));
    const list: Vehicle[] = [];
    snap.forEach(d => list.push(d.data() as Vehicle));
    return list;
  },

  async addVehicle(data: Partial<Vehicle>, user: string = 'Admin'): Promise<Vehicle> {
    await ensureFirestoreInitialized();
    const newId = `VEH-${Date.now()}`;
    const newVeh: Vehicle = {
      id: newId,
      plateNumber: (data.plateNumber || '').trim().toUpperCase(),
      model: (data.model || '').trim(),
      driverName: data.driverName?.trim(),
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    await setDoc(doc(db, COL_VEHICLES, newId), sanitizeForFirestore(newVeh));
    await addFirestoreAudit('CREATE_VEHICLE', 'VEHICLE', newId, `Created vehicle ${newVeh.plateNumber}`, user);
    return newVeh;
  },

  async updateVehicle(id: string, data: Partial<Vehicle>, user: string = 'Admin'): Promise<Vehicle> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_VEHICLES, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Vehicle not found');
    const updated = { ...(snap.data() as Vehicle), ...data };
    await setDoc(docRef, sanitizeForFirestore(updated));
    await addFirestoreAudit('UPDATE_VEHICLE', 'VEHICLE', id, `Updated vehicle ${updated.plateNumber}`, user);
    return updated;
  },

  async deleteVehicle(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_VEHICLES, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Vehicle not found');
    const v = snap.data() as Vehicle;
    await deleteDoc(docRef);
    await addFirestoreAudit('DELETE_VEHICLE', 'VEHICLE', id, `Deleted vehicle ${v.plateNumber}`, user);
    return { success: true };
  },

  // --- PAYMENT METHODS ---
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    await ensureFirestoreInitialized();
    const snap = await getDocs(collection(db, COL_PAYMENT_METHODS));
    const list: PaymentMethod[] = [];
    snap.forEach(d => list.push(d.data() as PaymentMethod));
    return list;
  },

  async addPaymentMethod(data: Partial<PaymentMethod>, user: string = 'Admin'): Promise<PaymentMethod> {
    await ensureFirestoreInitialized();
    const newId = `PM-${Date.now()}`;
    const newPm: PaymentMethod = {
      id: newId,
      name: (data.name || '').trim(),
      code: (data.code || data.name || '').toUpperCase().replace(/\s+/g, '_'),
      active: data.active !== undefined ? data.active : true
    };
    await setDoc(doc(db, COL_PAYMENT_METHODS, newId), sanitizeForFirestore(newPm));
    await addFirestoreAudit('CREATE_PAYMENT_METHOD', 'PAYMENT_METHOD', newId, `Created payment method ${newPm.name}`, user);
    return newPm;
  },

  async updatePaymentMethod(id: string, data: Partial<PaymentMethod>, user: string = 'Admin'): Promise<PaymentMethod> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_PAYMENT_METHODS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Payment Method not found');
    const updated = { ...(snap.data() as PaymentMethod), ...data };
    await setDoc(docRef, sanitizeForFirestore(updated));
    await addFirestoreAudit('UPDATE_PAYMENT_METHOD', 'PAYMENT_METHOD', id, `Updated payment method ${updated.name}`, user);
    return updated;
  },

  async deletePaymentMethod(id: string, user: string = 'Admin'): Promise<{ success: boolean }> {
    await ensureFirestoreInitialized();
    const docRef = doc(db, COL_PAYMENT_METHODS, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Payment Method not found');
    const pm = snap.data() as PaymentMethod;
    await deleteDoc(docRef);
    await addFirestoreAudit('DELETE_PAYMENT_METHOD', 'PAYMENT_METHOD', id, `Deleted payment method ${pm.name}`, user);
    return { success: true };
  },

  // --- TRANSACTIONS ---
  async getTransactions(): Promise<LedgerTransaction[]> {
    await ensureFirestoreInitialized();
    const snap = await getDocs(collection(db, COL_TRANSACTIONS));
    const list: LedgerTransaction[] = [];
    snap.forEach(d => list.push(d.data() as LedgerTransaction));
    // Sort descending by date & time
    return list.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  },

  async createTransaction(data: any, user: string = 'Finance User'): Promise<LedgerTransaction> {
    await ensureFirestoreInitialized();
    const amount = Number(data.amount) || 0;

    // Fetch accounts
    const accDocRef = doc(db, COL_ACCOUNTS, data.accountId);
    const accSnap = await getDoc(accDocRef);
    if (!accSnap.exists()) throw new Error('Source Account not found');
    const account = accSnap.data() as FinancialAccount;

    const isTransfer = data.direction === 'TRANSFER';
    let targetAccount: FinancialAccount | undefined;
    let targetDocRef = null;

    if (isTransfer) {
      if (!data.targetAccountId) throw new Error('Destination Transfer Account is required for transfer');
      targetDocRef = doc(db, COL_ACCOUNTS, data.targetAccountId);
      const targetSnap = await getDoc(targetDocRef);
      if (!targetSnap.exists()) throw new Error('Destination Transfer Account not found');
      targetAccount = targetSnap.data() as FinancialAccount;
    }

    // Category name resolution
    let categoryName = data.categoryName;
    if (!categoryName && data.categoryId) {
      const catSnap = await getDoc(doc(db, COL_CATEGORIES, data.categoryId));
      if (catSnap.exists()) categoryName = (catSnap.data() as TransactionCategory).name;
    }
    if (!categoryName) categoryName = isTransfer ? 'ACCOUNT TRANSFER' : 'GENERAL';

    // Entity name resolution if entityId is supplied
    let entityName = data.entityName;
    if (data.entityType && data.entityType !== 'NONE' && data.entityId && !entityName) {
      try {
        if (data.entityType === 'CLIENT') {
          const snap = await getDoc(doc(db, COL_CLIENTS, data.entityId));
          if (snap.exists()) entityName = (snap.data() as Client).name;
        } else if (data.entityType === 'SUPPLIER') {
          const snap = await getDoc(doc(db, COL_SUPPLIERS, data.entityId));
          if (snap.exists()) entityName = (snap.data() as Supplier).name;
        } else if (data.entityType === 'PARTNER') {
          const snap = await getDoc(doc(db, COL_PARTNERS, data.entityId));
          if (snap.exists()) entityName = (snap.data() as Partner).name;
        } else if (data.entityType === 'WORKER') {
          const snap = await getDoc(doc(db, COL_WORKERS, data.entityId));
          if (snap.exists()) entityName = (snap.data() as Worker).name;
        }
      } catch (e) {
        console.warn('Entity lookup error:', e);
      }
    }

    // Vehicle info resolution
    let vehicleInfo = data.vehicleInfo;
    if (data.vehicleId && !vehicleInfo) {
      try {
        const snap = await getDoc(doc(db, COL_VEHICLES, data.vehicleId));
        if (snap.exists()) {
          const v = snap.data() as Vehicle;
          vehicleInfo = `${v.plateNumber} (${v.model})`;
        }
      } catch (e) {
        console.warn('Vehicle lookup error:', e);
      }
    }

    const txns = await this.getTransactions();
    const txnId = `TXN-${(txns.length + 10001).toString()}`;
    const now = new Date();

    const newTxn: LedgerTransaction = {
      id: txnId,
      date: data.date || now.toISOString().slice(0, 10),
      time: data.time || now.toTimeString().slice(0, 5),
      direction: data.direction,
      accountId: account.id,
      accountName: account.name,
      ...(isTransfer && targetAccount ? { targetAccountId: targetAccount.id, targetAccountName: targetAccount.name } : {}),
      categoryId: data.categoryId || 'CAT-GEN',
      categoryName,
      amount,
      paymentMethod: data.paymentMethod || 'Cash',
      entityType: isTransfer ? 'NONE' : (data.entityType || 'NONE'),
      ...(data.entityId ? { entityId: data.entityId } : {}),
      ...(entityName ? { entityName } : {}),
      ...(data.vehicleId ? { vehicleId: data.vehicleId } : {}),
      ...(vehicleInfo ? { vehicleInfo } : {}),
      ...(data.referenceNumber ? { referenceNumber: data.referenceNumber } : {}),
      sourceModule: data.sourceModule || 'MANUAL',
      description: data.description || '',
      ...(data.attachmentUrl ? { attachmentUrl: data.attachmentUrl } : {}),
      status: 'POSTED',
      createdBy: user,
      createdAt: now.toISOString()
    };

    // Prepare batch write
    const batch = writeBatch(db);
    batch.set(doc(db, COL_TRANSACTIONS, txnId), sanitizeForFirestore(newTxn));

    // Update account balances
    if (data.direction === 'IN') {
      batch.update(accDocRef, { currentBalance: (account.currentBalance || 0) + amount });
    } else if (data.direction === 'OUT') {
      batch.update(accDocRef, { currentBalance: (account.currentBalance || 0) - amount });
    } else if (data.direction === 'TRANSFER' && targetDocRef && targetAccount) {
      batch.update(accDocRef, { currentBalance: (account.currentBalance || 0) - amount });
      batch.update(targetDocRef, { currentBalance: (targetAccount.currentBalance || 0) + amount });
    }

    // Entity balances update
    if (data.entityType === 'CLIENT' && data.entityId) {
      const cliRef = doc(db, COL_CLIENTS, data.entityId);
      const cliSnap = await getDoc(cliRef);
      if (cliSnap.exists()) {
        const cli = cliSnap.data() as Client;
        const newBal = data.direction === 'IN' ? (cli.balance || 0) - amount : (cli.balance || 0) + amount;
        batch.update(cliRef, { balance: newBal });
      }
    } else if (data.entityType === 'SUPPLIER' && data.entityId) {
      const supRef = doc(db, COL_SUPPLIERS, data.entityId);
      const supSnap = await getDoc(supRef);
      if (supSnap.exists()) {
        const sup = supSnap.data() as Supplier;
        const newBal = data.direction === 'OUT' ? (sup.balance || 0) - amount : (sup.balance || 0) + amount;
        batch.update(supRef, { balance: newBal });
      }
    } else if (data.entityType === 'PARTNER' && data.entityId) {
      const ptrRef = doc(db, COL_PARTNERS, data.entityId);
      const ptrSnap = await getDoc(ptrRef);
      if (ptrSnap.exists()) {
        const ptr = ptrSnap.data() as Partner;
        const newBal = data.direction === 'IN' ? (ptr.balance || 0) + amount : (ptr.balance || 0) - amount;
        batch.update(ptrRef, { balance: newBal });
      }
    }

    await batch.commit();
    await addFirestoreAudit('POST_TRANSACTION', 'TRANSACTION', newTxn.id, `Recorded Rs. ${amount} (${newTxn.direction}) on ${account.name}`, user);
    return newTxn;
  },

  async updateTransaction(id: string, data: any, user: string = 'Admin User'): Promise<LedgerTransaction> {
    await ensureFirestoreInitialized();
    const txnRef = doc(db, COL_TRANSACTIONS, id);
    const txnSnap = await getDoc(txnRef);
    if (!txnSnap.exists()) throw new Error('Transaction not found');
    const txn = txnSnap.data() as LedgerTransaction;

    const batch = writeBatch(db);

    // Revert old effect if POSTED
    if (txn.status === 'POSTED') {
      const oldAccRef = doc(db, COL_ACCOUNTS, txn.accountId);
      const oldAccSnap = await getDoc(oldAccRef);
      if (oldAccSnap.exists()) {
        const oldAcc = oldAccSnap.data() as FinancialAccount;
        if (txn.direction === 'IN') {
          batch.update(oldAccRef, { currentBalance: (oldAcc.currentBalance || 0) - txn.amount });
        } else if (txn.direction === 'OUT') {
          batch.update(oldAccRef, { currentBalance: (oldAcc.currentBalance || 0) + txn.amount });
        } else if (txn.direction === 'TRANSFER' && txn.targetAccountId) {
          batch.update(oldAccRef, { currentBalance: (oldAcc.currentBalance || 0) + txn.amount });
          const oldTargetRef = doc(db, COL_ACCOUNTS, txn.targetAccountId);
          const oldTargetSnap = await getDoc(oldTargetRef);
          if (oldTargetSnap.exists()) {
            const oldTarget = oldTargetSnap.data() as FinancialAccount;
            batch.update(oldTargetRef, { currentBalance: (oldTarget.currentBalance || 0) - txn.amount });
          }
        }
      }
    }

    // Prepare updated record
    const updatedTxn: LedgerTransaction = { ...txn, ...data };
    batch.set(txnRef, sanitizeForFirestore(updatedTxn));

    // Apply new effect if still POSTED
    if (updatedTxn.status === 'POSTED') {
      const newAccRef = doc(db, COL_ACCOUNTS, updatedTxn.accountId);
      const newAccSnap = await getDoc(newAccRef);
      if (newAccSnap.exists()) {
        const newAcc = newAccSnap.data() as FinancialAccount;
        if (updatedTxn.direction === 'IN') {
          batch.update(newAccRef, { currentBalance: (newAcc.currentBalance || 0) + updatedTxn.amount });
        } else if (updatedTxn.direction === 'OUT') {
          batch.update(newAccRef, { currentBalance: (newAcc.currentBalance || 0) - updatedTxn.amount });
        } else if (updatedTxn.direction === 'TRANSFER' && updatedTxn.targetAccountId) {
          batch.update(newAccRef, { currentBalance: (newAcc.currentBalance || 0) - updatedTxn.amount });
          const newTargetRef = doc(db, COL_ACCOUNTS, updatedTxn.targetAccountId);
          const newTargetSnap = await getDoc(newTargetRef);
          if (newTargetSnap.exists()) {
            const newTarget = newTargetSnap.data() as FinancialAccount;
            batch.update(newTargetRef, { currentBalance: (newTarget.currentBalance || 0) + updatedTxn.amount });
          }
        }
      }
    }

    await batch.commit();
    await addFirestoreAudit('UPDATE_TRANSACTION', 'TRANSACTION', id, `Updated transaction ${id}`, user);
    return updatedTxn;
  },

  async deleteTransaction(id: string, user: string = 'Admin User'): Promise<{ success: boolean }> {
    await ensureFirestoreInitialized();
    const txnRef = doc(db, COL_TRANSACTIONS, id);
    const txnSnap = await getDoc(txnRef);
    if (!txnSnap.exists()) throw new Error('Transaction not found');
    const txn = txnSnap.data() as LedgerTransaction;

    const batch = writeBatch(db);

    if (txn.status === 'POSTED') {
      const accRef = doc(db, COL_ACCOUNTS, txn.accountId);
      const accSnap = await getDoc(accRef);
      if (accSnap.exists()) {
        const acc = accSnap.data() as FinancialAccount;
        if (txn.direction === 'IN') {
          batch.update(accRef, { currentBalance: (acc.currentBalance || 0) - txn.amount });
        } else if (txn.direction === 'OUT') {
          batch.update(accRef, { currentBalance: (acc.currentBalance || 0) + txn.amount });
        } else if (txn.direction === 'TRANSFER' && txn.targetAccountId) {
          batch.update(accRef, { currentBalance: (acc.currentBalance || 0) + txn.amount });
          const targetRef = doc(db, COL_ACCOUNTS, txn.targetAccountId);
          const targetSnap = await getDoc(targetRef);
          if (targetSnap.exists()) {
            const targetAcc = targetSnap.data() as FinancialAccount;
            batch.update(targetRef, { currentBalance: (targetAcc.currentBalance || 0) - txn.amount });
          }
        }
      }
    }

    batch.delete(txnRef);
    await batch.commit();
    await addFirestoreAudit('DELETE_TRANSACTION', 'TRANSACTION', id, `Permanently deleted transaction ${id}`, user);
    return { success: true };
  },

  async voidTransaction(id: string, reason: string, user: string = 'Supervisor'): Promise<LedgerTransaction> {
    await ensureFirestoreInitialized();
    const txnRef = doc(db, COL_TRANSACTIONS, id);
    const txnSnap = await getDoc(txnRef);
    if (!txnSnap.exists()) throw new Error('Transaction not found');
    const txn = txnSnap.data() as LedgerTransaction;
    if (txn.status === 'VOIDED') throw new Error('Transaction is already voided');

    const batch = writeBatch(db);

    // Revert account balances
    const accRef = doc(db, COL_ACCOUNTS, txn.accountId);
    const accSnap = await getDoc(accRef);
    if (accSnap.exists()) {
      const acc = accSnap.data() as FinancialAccount;
      if (txn.direction === 'IN') {
        batch.update(accRef, { currentBalance: (acc.currentBalance || 0) - txn.amount });
      } else if (txn.direction === 'OUT') {
        batch.update(accRef, { currentBalance: (acc.currentBalance || 0) + txn.amount });
      } else if (txn.direction === 'TRANSFER' && txn.targetAccountId) {
        batch.update(accRef, { currentBalance: (acc.currentBalance || 0) + txn.amount });
        const targetRef = doc(db, COL_ACCOUNTS, txn.targetAccountId);
        const targetSnap = await getDoc(targetRef);
        if (targetSnap.exists()) {
          const targetAcc = targetSnap.data() as FinancialAccount;
          batch.update(targetRef, { currentBalance: (targetAcc.currentBalance || 0) - txn.amount });
        }
      }
    }

    const updatedTxn: LedgerTransaction = {
      ...txn,
      status: 'VOIDED',
      voidReason: reason
    };
    batch.set(txnRef, sanitizeForFirestore(updatedTxn));
    await batch.commit();
    await addFirestoreAudit('VOID_TRANSACTION', 'TRANSACTION', id, `Voided transaction ${id}. Reason: ${reason}`, user);
    return updatedTxn;
  },

  // --- FILTERED TRACKING ---
  async getFilteredTracking(filters: TrackingFilter): Promise<{ transactions: LedgerTransaction[]; summary: FilterSummary }> {
    const allTxns = await this.getTransactions();

    const txns = allTxns.filter(t => {
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
  },

  // --- RECONCILIATION ---
  async getReconciliation(date: string): Promise<{ positions: DailyAccountPosition[]; session: DailyClosingSession }> {
    await ensureFirestoreInitialized();

    const [accounts, allTxns] = await Promise.all([
      this.getAccounts(),
      this.getTransactions()
    ]);

    // Fetch daily positions
    const posSnap = await getDocs(collection(db, COL_DAILY_POSITIONS));
    const allPositions: DailyAccountPosition[] = [];
    posSnap.forEach(d => allPositions.push(d.data() as DailyAccountPosition));

    // Fetch session
    const sessionDocRef = doc(db, COL_CLOSING_SESSIONS, date);
    const sessionSnap = await getDoc(sessionDocRef);

    const session: DailyClosingSession = sessionSnap.exists()
      ? (sessionSnap.data() as DailyClosingSession)
      : {
          date,
          status: 'OPEN',
          totalOpening: 0,
          totalExpectedClosing: 0,
          totalActualCounted: 0,
          totalDifference: 0
        };

    const positions: DailyAccountPosition[] = accounts.map(acc => {
      const existing = allPositions.find(dp => dp.date === date && dp.accountId === acc.id);
      const priorTxns = allTxns.filter(t => t.status === 'POSTED' && t.date < date);

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

      const dayTxns = allTxns.filter(t => t.status === 'POSTED' && t.date === date);
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
  },

  async saveReconciliationCount(date: string, accountId: string, actualCountedBalance: number, notes?: string, user: string = 'Auditor'): Promise<{ success: boolean }> {
    await ensureFirestoreInitialized();
    const posId = `POS-${date}-${accountId}`;
    const posDocRef = doc(db, COL_DAILY_POSITIONS, posId);
    const snap = await getDoc(posDocRef);

    const recon = await this.getReconciliation(date);
    const targetPos = recon.positions.find(p => p.accountId === accountId);
    const expected = targetPos?.expectedClosing || 0;
    const diff = Number(actualCountedBalance) - expected;

    const dataToSave: DailyAccountPosition = {
      id: posId,
      date,
      accountId,
      accountName: targetPos?.accountName || '',
      openingBalance: targetPos?.openingBalance || 0,
      totalIn: targetPos?.totalIn || 0,
      totalOut: targetPos?.totalOut || 0,
      transferIn: targetPos?.transferIn || 0,
      transferOut: targetPos?.transferOut || 0,
      expectedClosing: expected,
      actualCountedBalance: Number(actualCountedBalance),
      difference: diff,
      status: 'OPEN',
      notes: notes !== undefined ? notes : (snap.exists() ? (snap.data() as DailyAccountPosition).notes : undefined)
    };

    await setDoc(posDocRef, sanitizeForFirestore(dataToSave));
    await addFirestoreAudit('UPDATE_COUNT', 'RECONCILIATION', posId, `Count updated for ${dataToSave.accountName} on ${date}: Rs. ${actualCountedBalance}`, user);
    return { success: true };
  },

  async settleDifference(date: string, accountId: string, type: 'DEFICIT' | 'SURPLUS', amount: number, reason: string, user: string = 'Manager'): Promise<{ success: boolean }> {
    const cats = await this.getCategories();
    if (type === 'DEFICIT') {
      const cat = cats.find(c => c.id === 'CAT-OUT-7') || cats.find(c => c.direction === 'OUT') || { id: 'CAT-DEFICIT', name: 'RECONCILIATION DEFICIT' };
      await this.createTransaction({
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
      const cat = cats.find(c => c.id === 'CAT-IN-5') || cats.find(c => c.direction === 'IN') || { id: 'CAT-SURPLUS', name: 'RECONCILIATION SURPLUS' };
      await this.createTransaction({
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
  },

  async closeDay(date: string, notes?: string, user: string = 'Controller'): Promise<DailyClosingSession> {
    await ensureFirestoreInitialized();
    const sessionDocRef = doc(db, COL_CLOSING_SESSIONS, date);
    const session: DailyClosingSession = {
      date,
      status: 'CLOSED',
      totalOpening: 0,
      totalExpectedClosing: 0,
      totalActualCounted: 0,
      totalDifference: 0,
      closedBy: user,
      closedAt: new Date().toISOString(),
      ...(notes ? { notes } : {})
    };
    await setDoc(sessionDocRef, sanitizeForFirestore(session));
    await addFirestoreAudit('CLOSE_DAY', 'DAY_CLOSING', date, `Permanently closed financial day ${date}`, user);
    return session;
  },

  async reopenDay(date: string, reason: string, user: string = 'Director'): Promise<DailyClosingSession> {
    await ensureFirestoreInitialized();
    const sessionDocRef = doc(db, COL_CLOSING_SESSIONS, date);
    const sessionSnap = await getDoc(sessionDocRef);
    if (!sessionSnap.exists()) throw new Error('No session for this date');
    const session = sessionSnap.data() as DailyClosingSession;
    session.status = 'OPEN';
    session.notes = `Reopened: ${reason}`;
    await setDoc(sessionDocRef, sanitizeForFirestore(session));
    await addFirestoreAudit('REOPEN_DAY', 'DAY_CLOSING', date, `Reopened financial day ${date}. Reason: ${reason}`, user);
    return session;
  },

  // --- AUDIT LOGS ---
  async getAuditLogs(): Promise<AuditLog[]> {
    await ensureFirestoreInitialized();
    const snap = await getDocs(collection(db, COL_AUDIT_LOGS));
    const logs: AuditLog[] = [];
    snap.forEach(d => logs.push(d.data() as AuditLog));
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  // --- ADMIN PERMANENT DATA WIPE ---
  async wipeData(
    mode: 'TRANSACTIONS_ONLY' | 'TRANSACTIONS_ONLY_ZERO_BALANCES' | 'FULL_SYSTEM_RESET' | 'PURGE_ALL_DATA_BLANK',
    user: string = 'System Administrator'
  ): Promise<{ success: boolean; message: string }> {
    await ensureFirestoreInitialized();

    // Safe chunked batch deletion to prevent Firestore 500-operation limits
    const deleteEntireCollection = async (colName: string) => {
      const snap = await getDocs(collection(db, colName));
      if (snap.empty) return;
      const docs = snap.docs;
      const chunkSize = 200;
      for (let i = 0; i < docs.length; i += chunkSize) {
        const chunk = docs.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(docSnap => batch.delete(docSnap.ref));
        await batch.commit();
      }
    };

    if (mode === 'TRANSACTIONS_ONLY_ZERO_BALANCES' || mode === 'TRANSACTIONS_ONLY') {
      // 1. Delete all transactions
      await deleteEntireCollection(COL_TRANSACTIONS);
      // 2. Delete all daily positions
      await deleteEntireCollection(COL_DAILY_POSITIONS);
      // 3. Delete all closing sessions
      await deleteEntireCollection(COL_CLOSING_SESSIONS);

      // 4. Update account balances
      const accSnap = await getDocs(collection(db, COL_ACCOUNTS));
      if (!accSnap.empty) {
        const accBatch = writeBatch(db);
        accSnap.forEach(d => {
          const acc = d.data() as FinancialAccount;
          if (mode === 'TRANSACTIONS_ONLY_ZERO_BALANCES') {
            accBatch.update(d.ref, { openingBalance: 0, currentBalance: 0 });
          } else {
            accBatch.update(d.ref, { currentBalance: acc.openingBalance || 0 });
          }
        });
        await accBatch.commit();
      }

      // 5. Reset client and supplier balances
      const cliSnap = await getDocs(collection(db, COL_CLIENTS));
      if (!cliSnap.empty) {
        const cliBatch = writeBatch(db);
        cliSnap.forEach(d => cliBatch.update(d.ref, { balance: 0 }));
        await cliBatch.commit();
      }

      const supSnap = await getDocs(collection(db, COL_SUPPLIERS));
      if (!supSnap.empty) {
        const supBatch = writeBatch(db);
        supSnap.forEach(d => supBatch.update(d.ref, { balance: 0 }));
        await supBatch.commit();
      }

      const ptrSnap = await getDocs(collection(db, COL_PARTNERS));
      if (!ptrSnap.empty) {
        const ptrBatch = writeBatch(db);
        ptrSnap.forEach(d => ptrBatch.update(d.ref, { balance: 0 }));
        await ptrBatch.commit();
      }

      const actionText = mode === 'TRANSACTIONS_ONLY_ZERO_BALANCES'
        ? 'Cleared all transactions & zeroed all balances to Rs. 0 in Cloud Firestore'
        : 'Wiped all transactions & restored opening balances in Cloud Firestore';

      await addFirestoreAudit('PERMANENT_WIPE_TRANSACTIONS', 'SYSTEM', 'TRANSACTIONS', actionText, user);
      return {
        success: true,
        message: mode === 'TRANSACTIONS_ONLY_ZERO_BALANCES'
          ? 'All transactions, day closures, and positions have been wiped. All accounts reset to clean Rs. 0.00 balance.'
          : 'All transactions, day closures, and positions have been permanently wiped from the centralized cloud database.'
      };
    } else if (mode === 'PURGE_ALL_DATA_BLANK') {
      // Complete Blank Slate Purge (Deletes everything including master records)
      await deleteEntireCollection(COL_TRANSACTIONS);
      await deleteEntireCollection(COL_DAILY_POSITIONS);
      await deleteEntireCollection(COL_CLOSING_SESSIONS);
      await deleteEntireCollection(COL_CLIENTS);
      await deleteEntireCollection(COL_SUPPLIERS);
      await deleteEntireCollection(COL_WORKERS);
      await deleteEntireCollection(COL_VEHICLES);
      await deleteEntireCollection(COL_BANKS);
      await deleteEntireCollection(COL_ACCOUNTS);
      await deleteEntireCollection(COL_CATEGORIES);
      await deleteEntireCollection(COL_PARTNERS);
      await deleteEntireCollection(COL_PAYMENT_METHODS);

      // Keep metadata so it doesn't auto-reseed old defaults
      await setDoc(doc(db, COL_META, 'initialization'), {
        initialized: true,
        clearedAt: new Date().toISOString(),
        version: '2.0.0',
        blankSlate: true
      });

      await addFirestoreAudit('PURGE_DATABASE_BLANK', 'SYSTEM', 'ROOT', 'Completely purged all cloud collections to empty blank state', user);
      return { success: true, message: 'Complete database purge complete. Database is now a 100% clean empty canvas.' };
    } else {
      // FULL SYSTEM FACTORY RESET WITH RS. 0 BALANCES
      await deleteEntireCollection(COL_TRANSACTIONS);
      await deleteEntireCollection(COL_DAILY_POSITIONS);
      await deleteEntireCollection(COL_CLOSING_SESSIONS);
      await deleteEntireCollection(COL_CLIENTS);
      await deleteEntireCollection(COL_SUPPLIERS);
      await deleteEntireCollection(COL_WORKERS);
      await deleteEntireCollection(COL_VEHICLES);
      await deleteEntireCollection(COL_BANKS);
      await deleteEntireCollection(COL_ACCOUNTS);
      await deleteEntireCollection(COL_CATEGORIES);
      await deleteEntireCollection(COL_PARTNERS);
      await deleteEntireCollection(COL_PAYMENT_METHODS);

      // Re-seed clean defaults in Cloud Firestore with 0 opening and current balances
      const batch = writeBatch(db);
      for (const b of DEFAULT_BANKS) batch.set(doc(db, COL_BANKS, b.id), b);
      for (const a of DEFAULT_ACCOUNTS) batch.set(doc(db, COL_ACCOUNTS, a.id), { ...a, openingBalance: 0, currentBalance: 0 });
      for (const c of DEFAULT_CATEGORIES) batch.set(doc(db, COL_CATEGORIES, c.id), c);
      for (const p of DEFAULT_PARTNERS) batch.set(doc(db, COL_PARTNERS, p.id), { ...p, balance: 0 });
      for (const pm of DEFAULT_PAYMENT_METHODS) batch.set(doc(db, COL_PAYMENT_METHODS, pm.id), pm);
      await batch.commit();

      await addFirestoreAudit('PERMANENT_FACTORY_RESET', 'SYSTEM', 'ROOT', 'Executed full system factory reset in Cloud Firestore with clean Rs. 0 balances', user);
      return { success: true, message: 'Full system factory reset complete. Cloud Firestore database restored to clean Rs. 0.00 pristine state.' };
    }
  },

  // --- EXPORT BACKUPS ---
  async exportFullBackupWorkbook(): Promise<Blob> {
    await ensureFirestoreInitialized();
    const [banks, accounts, categories, clients, suppliers, partners, workers, vehicles, paymentMethods, txns, dailyPositions, closingSessions, auditLogs] = await Promise.all([
      this.getBanks(),
      this.getAccounts(),
      this.getCategories(),
      this.getClients(),
      this.getSuppliers(),
      this.getPartners(),
      this.getWorkers(),
      this.getVehicles(),
      this.getPaymentMethods(),
      this.getTransactions(),
      (async () => {
        const snap = await getDocs(collection(db, COL_DAILY_POSITIONS));
        const list: DailyAccountPosition[] = [];
        snap.forEach(d => list.push(d.data() as DailyAccountPosition));
        return list;
      })(),
      (async () => {
        const snap = await getDocs(collection(db, COL_CLOSING_SESSIONS));
        const list: DailyClosingSession[] = [];
        snap.forEach(d => list.push(d.data() as DailyClosingSession));
        return list;
      })(),
      this.getAuditLogs()
    ]);

    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, data: any[]) => {
      const ws = XLSX.utils.json_to_sheet(data && data.length > 0 ? data : [{ status: 'EMPTY' }]);
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    addSheet('Transactions', txns);
    addSheet('Accounts', accounts);
    addSheet('Categories', categories);
    addSheet('Banks', banks);
    addSheet('Clients', clients);
    addSheet('Suppliers', suppliers);
    addSheet('Partners', partners);
    addSheet('Workers', workers);
    addSheet('Vehicles', vehicles);
    addSheet('PaymentMethods', paymentMethods);
    addSheet('DailyPositions', dailyPositions);
    addSheet('ClosingSessions', closingSessions);
    addSheet('AuditLogs', auditLogs);

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },

  async exportFullBackupJson(): Promise<Blob> {
    await ensureFirestoreInitialized();
    const [banks, accounts, categories, clients, suppliers, partners, workers, vehicles, paymentMethods, transactions, auditLogs] = await Promise.all([
      this.getBanks(),
      this.getAccounts(),
      this.getCategories(),
      this.getClients(),
      this.getSuppliers(),
      this.getPartners(),
      this.getWorkers(),
      this.getVehicles(),
      this.getPaymentMethods(),
      this.getTransactions(),
      this.getAuditLogs()
    ]);

    const fullData = {
      exportedAt: new Date().toISOString(),
      version: '2.0.0-firestore',
      banks,
      accounts,
      categories,
      clients,
      suppliers,
      partners,
      workers,
      vehicles,
      paymentMethods,
      transactions,
      auditLogs
    };

    return new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
  },

  // --- IMPORT / RESTORE BACKUPS ---
  async restoreBackupFile(file: File, user: string = 'System Administrator'): Promise<{ success: boolean; message: string; result: any }> {
    await ensureFirestoreInitialized();

    const isJson = file.name.endsWith('.json');
    let backupObj: any = {};

    if (isJson) {
      const text = await file.text();
      backupObj = JSON.parse(text);
    } else {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });

      const parseSheet = (sheetName: string) => {
        const ws = wb.Sheets[sheetName];
        if (!ws) return [];
        return XLSX.utils.sheet_to_json(ws);
      };

      backupObj = {
        banks: parseSheet('Banks'),
        accounts: parseSheet('Accounts'),
        categories: parseSheet('Categories'),
        clients: parseSheet('Clients'),
        suppliers: parseSheet('Suppliers'),
        partners: parseSheet('Partners'),
        workers: parseSheet('Workers'),
        vehicles: parseSheet('Vehicles'),
        paymentMethods: parseSheet('PaymentMethods'),
        transactions: parseSheet('Transactions'),
        dailyPositions: parseSheet('DailyPositions'),
        closingSessions: parseSheet('ClosingSessions')
      };
    }

    // Overwrite to Cloud Firestore
    const batch = writeBatch(db);

    const restoreCol = (colName: string, items: any[], idField: string = 'id') => {
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && item[idField]) {
            batch.set(doc(db, colName, item[idField]), sanitizeForFirestore(item));
          }
        }
      }
    };

    restoreCol(COL_BANKS, backupObj.banks);
    restoreCol(COL_ACCOUNTS, backupObj.accounts);
    restoreCol(COL_CATEGORIES, backupObj.categories);
    restoreCol(COL_CLIENTS, backupObj.clients);
    restoreCol(COL_SUPPLIERS, backupObj.suppliers);
    restoreCol(COL_PARTNERS, backupObj.partners);
    restoreCol(COL_WORKERS, backupObj.workers);
    restoreCol(COL_VEHICLES, backupObj.vehicles);
    restoreCol(COL_PAYMENT_METHODS, backupObj.paymentMethods);
    restoreCol(COL_TRANSACTIONS, backupObj.transactions || backupObj.ledgerTransactions);
    restoreCol(COL_DAILY_POSITIONS, backupObj.dailyPositions);
    restoreCol(COL_CLOSING_SESSIONS, backupObj.closingSessions, 'date');

    await batch.commit();
    await addFirestoreAudit('RESTORE_BACKUP', 'SYSTEM', file.name, `Restored complete system backup from ${file.name} to Cloud Firestore`, user);

    return {
      success: true,
      message: 'System database successfully restored to Cloud Firestore! All devices will now reflect the restored records.',
      result: {
        transactions: (backupObj.transactions || backupObj.ledgerTransactions || []).length,
        accounts: (backupObj.accounts || []).length,
        clients: (backupObj.clients || []).length,
        suppliers: (backupObj.suppliers || []).length
      }
    };
  }
};
