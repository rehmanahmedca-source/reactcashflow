import * as XLSX from 'xlsx';
import { db } from './db';
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
  DayStatus,
  SourceModule
} from '../types';

export class FinanceService {
  // --- HELPER METHOD FOR BALANCE REVERSAL ---
  private reverseTxnBalances(txn: LedgerTransaction) {
    if (txn.status !== 'POSTED') return;

    const account = db.accounts.find(a => a.id === txn.accountId);
    if (account) {
      if (txn.direction === 'IN') account.currentBalance -= txn.amount;
      if (txn.direction === 'OUT') account.currentBalance += txn.amount;
      if (txn.direction === 'TRANSFER') account.currentBalance += txn.amount;
    }

    if (txn.direction === 'TRANSFER' && txn.targetAccountId) {
      const targetAcc = db.accounts.find(a => a.id === txn.targetAccountId);
      if (targetAcc) {
        targetAcc.currentBalance -= txn.amount;
      }
    }

    if (txn.entityType === 'CLIENT' && txn.entityId) {
      const cli = db.clients.find(c => c.id === txn.entityId);
      if (cli) {
        if (txn.direction === 'IN') cli.balance += txn.amount;
        if (txn.direction === 'OUT') cli.balance -= txn.amount;
      }
    } else if (txn.entityType === 'SUPPLIER' && txn.entityId) {
      const sup = db.suppliers.find(s => s.id === txn.entityId);
      if (sup) {
        if (txn.direction === 'OUT') sup.balance += txn.amount;
        if (txn.direction === 'IN') sup.balance -= txn.amount;
      }
    }
  }

  // --- MASTER DATA METHODS ---

  getBanks(): Bank[] {
    return db.banks;
  }

  addBank(data: Omit<Bank, 'id' | 'createdAt'>, user: string): Bank {
    const newBank: Bank = {
      ...data,
      id: `BANK-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString()
    };
    db.banks.push(newBank);
    this.addAuditLog('CREATE_BANK', 'BANK', newBank.id, `Added bank ${newBank.name} (${newBank.code})`, user);
    return newBank;
  }

  updateBank(id: string, data: Partial<Bank>, user: string): Bank {
    const bank = db.banks.find(b => b.id === id);
    if (!bank) throw new Error('Bank not found');
    Object.assign(bank, data);
    this.addAuditLog('UPDATE_BANK', 'BANK', bank.id, `Updated bank ${bank.name} (${bank.code})`, user);
    return bank;
  }

  deleteBank(id: string, user: string) {
    const idx = db.banks.findIndex(b => b.id === id);
    if (idx === -1) throw new Error('Bank not found');
    const removed = db.banks.splice(idx, 1)[0];

    // Cascade residual cleanup on linked accounts
    const linkedAccounts = db.accounts.filter(a => a.bankId === id);
    for (const acc of linkedAccounts) {
      acc.bankId = undefined;
      acc.bankName = undefined;
    }

    this.addAuditLog('DELETE_BANK', 'BANK', id, `Deleted bank ${removed.name} (${removed.code}) and cleaned residual links`, user);
  }

  getAccounts(): FinancialAccount[] {
    return db.accounts;
  }

  addAccount(data: Omit<FinancialAccount, 'id' | 'currentBalance' | 'createdAt'>, user: string): FinancialAccount {
    const newAccount: FinancialAccount = {
      ...data,
      id: `ACC-${Date.now().toString().slice(-6)}`,
      currentBalance: data.openingBalance,
      createdAt: new Date().toISOString()
    };
    db.accounts.push(newAccount);
    this.addAuditLog('CREATE_ACCOUNT', 'ACCOUNT', newAccount.id, `Created financial account ${newAccount.name} with opening balance Rs. ${newAccount.openingBalance}`, user);
    return newAccount;
  }

  updateAccount(id: string, data: Partial<FinancialAccount>, user: string): FinancialAccount {
    const acc = db.accounts.find(a => a.id === id);
    if (!acc) throw new Error('Account not found');
    
    // Adjust current balance if opening balance was modified
    if (data.openingBalance !== undefined && data.openingBalance !== acc.openingBalance) {
      const diff = data.openingBalance - acc.openingBalance;
      acc.openingBalance = data.openingBalance;
      acc.currentBalance += diff;
    }
    if (data.name !== undefined) acc.name = data.name;
    if (data.accountType !== undefined) acc.accountType = data.accountType;
    if (data.bankId !== undefined) acc.bankId = data.bankId;
    if (data.bankName !== undefined) acc.bankName = data.bankName;
    if (data.accountNumber !== undefined) acc.accountNumber = data.accountNumber;

    this.addAuditLog('UPDATE_ACCOUNT', 'ACCOUNT', acc.id, `Updated financial account ${acc.name}`, user);
    return acc;
  }

  deleteAccount(id: string, user: string) {
    const idx = db.accounts.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Account not found');
    const removed = db.accounts.splice(idx, 1)[0];

    // Cascade residual cleanup: remove all transactions referencing this account & reverse target adjustments
    const txnsToRemove = db.ledgerTransactions.filter(t => t.accountId === id || t.targetAccountId === id);
    for (const txn of txnsToRemove) {
      if (txn.status === 'POSTED') {
        if (txn.direction === 'TRANSFER') {
          if (txn.accountId === id && txn.targetAccountId) {
            const targetAcc = db.accounts.find(a => a.id === txn.targetAccountId);
            if (targetAcc) targetAcc.currentBalance -= txn.amount;
          } else if (txn.targetAccountId === id && txn.accountId) {
            const sourceAcc = db.accounts.find(a => a.id === txn.accountId);
            if (sourceAcc) sourceAcc.currentBalance += txn.amount;
          }
        }
      }
    }
    db.ledgerTransactions = db.ledgerTransactions.filter(t => t.accountId !== id && t.targetAccountId !== id);
    db.dailyPositions = db.dailyPositions.filter(dp => dp.accountId !== id);

    this.addAuditLog('DELETE_ACCOUNT', 'ACCOUNT', id, `Deleted financial account ${removed.name} and cleaned all residual transactions & positions`, user);
  }

  getCategories(): TransactionCategory[] {
    return db.categories;
  }

  addCategory(data: Omit<TransactionCategory, 'id'>, user: string): TransactionCategory {
    const newCategory: TransactionCategory = {
      ...data,
      id: `CAT-${Date.now().toString().slice(-6)}`
    };
    db.categories.push(newCategory);
    this.addAuditLog('CREATE_CATEGORY', 'CATEGORY', newCategory.id, `Created category ${newCategory.name} (${newCategory.direction})`, user);
    return newCategory;
  }

  updateCategory(id: string, data: Partial<TransactionCategory>, user: string): TransactionCategory {
    const cat = db.categories.find(c => c.id === id);
    if (!cat) throw new Error('Category not found');
    Object.assign(cat, data);
    this.addAuditLog('UPDATE_CATEGORY', 'CATEGORY', cat.id, `Updated category ${cat.name}`, user);
    return cat;
  }

  deleteCategory(id: string, user: string) {
    const idx = db.categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Category not found');
    const removed = db.categories.splice(idx, 1)[0];

    // Cascade residual cleanup
    const txns = db.ledgerTransactions.filter(t => t.categoryId === id);
    for (const txn of txns) {
      this.reverseTxnBalances(txn);
    }
    db.ledgerTransactions = db.ledgerTransactions.filter(t => t.categoryId !== id);

    this.addAuditLog('DELETE_CATEGORY', 'CATEGORY', id, `Deleted category ${removed.name} and cleaned ${txns.length} residual transactions`, user);
  }

  getClients(): Client[] {
    return db.clients;
  }

  addClient(data: Omit<Client, 'id' | 'code' | 'balance' | 'createdAt'>, user: string): Client {
    const code = `C-${(db.clients.length + 101).toString()}`;
    const newClient: Client = {
      ...data,
      id: `CLI-${Date.now().toString().slice(-6)}`,
      code,
      balance: 0,
      createdAt: new Date().toISOString()
    };
    db.clients.push(newClient);
    this.addAuditLog('CREATE_CLIENT', 'CLIENT', newClient.id, `Created Client ${newClient.name} (${code})`, user);
    return newClient;
  }

  updateClient(id: string, data: Partial<Client>, user: string): Client {
    const cli = db.clients.find(c => c.id === id);
    if (!cli) throw new Error('Client not found');
    Object.assign(cli, data);
    this.addAuditLog('UPDATE_CLIENT', 'CLIENT', cli.id, `Updated client ${cli.name} (${cli.code})`, user);
    return cli;
  }

  deleteClient(id: string, user: string) {
    const idx = db.clients.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Client not found');
    const removed = db.clients.splice(idx, 1)[0];

    // Cascade residual cleanup
    const txns = db.ledgerTransactions.filter(t => t.entityType === 'CLIENT' && t.entityId === id);
    for (const txn of txns) {
      this.reverseTxnBalances(txn);
    }
    db.ledgerTransactions = db.ledgerTransactions.filter(t => !(t.entityType === 'CLIENT' && t.entityId === id));

    this.addAuditLog('DELETE_CLIENT', 'CLIENT', id, `Deleted client ${removed.name} and cleaned ${txns.length} residual transactions`, user);
  }

  getSuppliers(): Supplier[] {
    return db.suppliers;
  }

  addSupplier(data: Omit<Supplier, 'id' | 'code' | 'balance' | 'createdAt'>, user: string): Supplier {
    const code = `S-${(db.suppliers.length + 201).toString()}`;
    const newSupplier: Supplier = {
      ...data,
      id: `SUP-${Date.now().toString().slice(-6)}`,
      code,
      balance: 0,
      createdAt: new Date().toISOString()
    };
    db.suppliers.push(newSupplier);
    this.addAuditLog('CREATE_SUPPLIER', 'SUPPLIER', newSupplier.id, `Created Supplier ${newSupplier.name} (${code})`, user);
    return newSupplier;
  }

  updateSupplier(id: string, data: Partial<Supplier>, user: string): Supplier {
    const sup = db.suppliers.find(s => s.id === id);
    if (!sup) throw new Error('Supplier not found');
    Object.assign(sup, data);
    this.addAuditLog('UPDATE_SUPPLIER', 'SUPPLIER', sup.id, `Updated supplier ${sup.name} (${sup.code})`, user);
    return sup;
  }

  deleteSupplier(id: string, user: string) {
    const idx = db.suppliers.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Supplier not found');
    const removed = db.suppliers.splice(idx, 1)[0];

    // Cascade residual cleanup
    const txns = db.ledgerTransactions.filter(t => t.entityType === 'SUPPLIER' && t.entityId === id);
    for (const txn of txns) {
      this.reverseTxnBalances(txn);
    }
    db.ledgerTransactions = db.ledgerTransactions.filter(t => !(t.entityType === 'SUPPLIER' && t.entityId === id));

    this.addAuditLog('DELETE_SUPPLIER', 'SUPPLIER', id, `Deleted supplier ${removed.name} and cleaned ${txns.length} residual transactions`, user);
  }

  getPartners(): Partner[] {
    return db.partners;
  }

  addPartner(data: Omit<Partner, 'id' | 'code' | 'balance' | 'createdAt'>, user: string): Partner {
    const code = `P-${(db.partners.length + 301).toString()}`;
    const newPartner: Partner = {
      ...data,
      id: `PTR-${Date.now().toString().slice(-6)}`,
      code,
      balance: 0,
      createdAt: new Date().toISOString()
    };
    db.partners.push(newPartner);
    this.addAuditLog('CREATE_PARTNER', 'PARTNER', newPartner.id, `Created Partner ${newPartner.name} (${code})`, user);
    return newPartner;
  }

  updatePartner(id: string, data: Partial<Partner>, user: string): Partner {
    const ptr = db.partners.find(p => p.id === id);
    if (!ptr) throw new Error('Partner not found');
    Object.assign(ptr, data);
    this.addAuditLog('UPDATE_PARTNER', 'PARTNER', ptr.id, `Updated partner ${ptr.name} (${ptr.code})`, user);
    return ptr;
  }

  deletePartner(id: string, user: string) {
    const idx = db.partners.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Partner not found');
    const removed = db.partners.splice(idx, 1)[0];

    // Cascade residual cleanup
    const txns = db.ledgerTransactions.filter(t => t.entityType === 'PARTNER' && t.entityId === id);
    for (const txn of txns) {
      this.reverseTxnBalances(txn);
    }
    db.ledgerTransactions = db.ledgerTransactions.filter(t => !(t.entityType === 'PARTNER' && t.entityId === id));

    this.addAuditLog('DELETE_PARTNER', 'PARTNER', id, `Deleted partner ${removed.name} and cleaned ${txns.length} residual transactions`, user);
  }

  getWorkers(): Worker[] {
    return db.workers;
  }

  addWorker(data: Omit<Worker, 'id' | 'code' | 'createdAt'>, user: string): Worker {
    const code = `W-${(db.workers.length + 401).toString()}`;
    const newWorker: Worker = {
      ...data,
      id: `WRK-${Date.now().toString().slice(-6)}`,
      code,
      createdAt: new Date().toISOString()
    };
    db.workers.push(newWorker);
    this.addAuditLog('CREATE_WORKER', 'WORKER', newWorker.id, `Created Worker ${newWorker.name} (${code})`, user);
    return newWorker;
  }

  updateWorker(id: string, data: Partial<Worker>, user: string): Worker {
    const wrk = db.workers.find(w => w.id === id);
    if (!wrk) throw new Error('Worker not found');
    Object.assign(wrk, data);
    this.addAuditLog('UPDATE_WORKER', 'WORKER', wrk.id, `Updated worker ${wrk.name} (${wrk.code})`, user);
    return wrk;
  }

  deleteWorker(id: string, user: string) {
    const idx = db.workers.findIndex(w => w.id === id);
    if (idx === -1) throw new Error('Worker not found');
    const removed = db.workers.splice(idx, 1)[0];

    // Cascade residual cleanup
    const txns = db.ledgerTransactions.filter(t => t.entityType === 'WORKER' && t.entityId === id);
    for (const txn of txns) {
      this.reverseTxnBalances(txn);
    }
    db.ledgerTransactions = db.ledgerTransactions.filter(t => !(t.entityType === 'WORKER' && t.entityId === id));

    this.addAuditLog('DELETE_WORKER', 'WORKER', id, `Deleted worker ${removed.name} and cleaned ${txns.length} residual transactions`, user);
  }

  getVehicles(): Vehicle[] {
    return db.vehicles;
  }

  addVehicle(data: Omit<Vehicle, 'id' | 'createdAt'>, user: string): Vehicle {
    const newVehicle: Vehicle = {
      ...data,
      id: `VEH-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString()
    };
    db.vehicles.push(newVehicle);
    this.addAuditLog('CREATE_VEHICLE', 'VEHICLE', newVehicle.id, `Created Vehicle ${newVehicle.plateNumber} (${newVehicle.model})`, user);
    return newVehicle;
  }

  updateVehicle(id: string, data: Partial<Vehicle>, user: string): Vehicle {
    const veh = db.vehicles.find(v => v.id === id);
    if (!veh) throw new Error('Vehicle not found');
    Object.assign(veh, data);
    this.addAuditLog('UPDATE_VEHICLE', 'VEHICLE', veh.id, `Updated vehicle ${veh.plateNumber} (${veh.model})`, user);
    return veh;
  }

  deleteVehicle(id: string, user: string) {
    const idx = db.vehicles.findIndex(v => v.id === id);
    if (idx === -1) throw new Error('Vehicle not found');
    const removed = db.vehicles.splice(idx, 1)[0];

    // Cascade residual cleanup
    const txns = db.ledgerTransactions.filter(t => t.vehicleId === id);
    for (const txn of txns) {
      txn.vehicleId = undefined;
      txn.vehicleInfo = undefined;
    }

    this.addAuditLog('DELETE_VEHICLE', 'VEHICLE', id, `Deleted vehicle ${removed.plateNumber} and unlinked residual vehicle tags`, user);
  }

  getPaymentMethods(): PaymentMethod[] {
    return db.paymentMethods;
  }

  addPaymentMethod(data: Omit<PaymentMethod, 'id'>, user: string): PaymentMethod {
    const code = data.code ? data.code.toUpperCase().trim() : (data.name ? data.name.toUpperCase().replace(/\s+/g, '_') : 'PM');
    const newPm: PaymentMethod = {
      ...data,
      id: `PM-${Date.now().toString().slice(-6)}`,
      code,
      active: data.active !== undefined ? Boolean(data.active) : true
    };
    db.paymentMethods.push(newPm);
    this.addAuditLog('CREATE_PAYMENT_METHOD', 'PAYMENT_METHOD', newPm.id, `Created Payment Instrument / Method ${newPm.name} (${newPm.code})`, user);
    return newPm;
  }

  updatePaymentMethod(id: string, data: Partial<PaymentMethod>, user: string): PaymentMethod {
    const pm = db.paymentMethods.find(p => p.id === id);
    if (!pm) throw new Error('Payment method not found');
    if (data.code) data.code = data.code.toUpperCase().trim();
    Object.assign(pm, data);
    this.addAuditLog('UPDATE_PAYMENT_METHOD', 'PAYMENT_METHOD', pm.id, `Updated payment instrument ${pm.name} (${pm.code})`, user);
    return pm;
  }

  deletePaymentMethod(id: string, user: string) {
    const idx = db.paymentMethods.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Payment method not found');
    const removed = db.paymentMethods.splice(idx, 1)[0];
    this.addAuditLog('DELETE_PAYMENT_METHOD', 'PAYMENT_METHOD', id, `Deleted payment instrument ${removed.name} (${removed.code})`, user);
  }

  // --- TRANSACTION ENGINE ---

  getTransactions(): LedgerTransaction[] {
    return db.ledgerTransactions;
  }

  createTransaction(data: {
    date: string;
    time: string;
    direction: 'IN' | 'OUT' | 'TRANSFER';
    accountId: string;
    targetAccountId?: string;
    categoryId: string;
    amount: number;
    paymentMethod: string;
    entityType?: 'CLIENT' | 'SUPPLIER' | 'PARTNER' | 'WORKER' | 'NONE';
    entityId?: string;
    vehicleId?: string;
    referenceNumber?: string;
    sourceModule?: string;
    sourceId?: string;
    description: string;
    attachmentUrl?: string;
    createdBy: string;
  }): LedgerTransaction {
    // 1. Check Day Closure Protection
    const isClosed = db.closingSessions.some(s => s.date === data.date && s.status === 'CLOSED');
    if (isClosed) {
      throw new Error(`Financial date ${data.date} is CLOSED. Re-open the day to post new transactions.`);
    }

    // 2. Validate Accounts
    const account = db.accounts.find(a => a.id === data.accountId);
    if (!account) throw new Error('Source Account not found');

    let targetAccount: FinancialAccount | undefined;
    if (data.direction === 'TRANSFER') {
      if (!data.targetAccountId) throw new Error('Destination Account is required for Transfer');
      if (data.targetAccountId === data.accountId) throw new Error('Source and Destination accounts must be different');
      targetAccount = db.accounts.find(a => a.id === data.targetAccountId);
      if (!targetAccount) throw new Error('Destination Account not found');
    }

    // 3. Validate Category
    const category = db.categories.find(c => c.id === data.categoryId);
    if (!category) throw new Error('Category not found');

    if (category.requiresVehicle && !data.vehicleId) {
      throw new Error(`Category '${category.name}' requires a Vehicle selection.`);
    }

    // 4. Resolve Names
    let entityName = '';
    if (data.entityType && data.entityId) {
      if (data.entityType === 'CLIENT') {
        const c = db.clients.find(x => x.id === data.entityId);
        entityName = c ? `${c.name} (${c.code})` : '';
      } else if (data.entityType === 'SUPPLIER') {
        const s = db.suppliers.find(x => x.id === data.entityId);
        entityName = s ? `${s.name} (${s.code})` : '';
      } else if (data.entityType === 'PARTNER') {
        const p = db.partners.find(x => x.id === data.entityId);
        entityName = p ? `${p.name} (${p.code})` : '';
      } else if (data.entityType === 'WORKER') {
        const w = db.workers.find(x => x.id === data.entityId);
        entityName = w ? `${w.name} (${w.code})` : '';
      }
    }

    let vehicleInfo = '';
    if (data.vehicleId) {
      const v = db.vehicles.find(x => x.id === data.vehicleId);
      if (v) vehicleInfo = `${v.plateNumber} (${v.model})`;
    }

    const txnId = `TXN-${(db.ledgerTransactions.length + 10001).toString()}`;
    const newTxn: LedgerTransaction = {
      id: txnId,
      date: data.date,
      time: data.time || '12:00',
      direction: data.direction,
      accountId: account.id,
      accountName: account.name,
      targetAccountId: targetAccount?.id,
      targetAccountName: targetAccount?.name,
      categoryId: category.id,
      categoryName: category.name,
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod || 'Cash',
      entityType: data.entityType || 'NONE',
      entityId: data.entityId,
      entityName,
      vehicleId: data.vehicleId,
      vehicleInfo,
      referenceNumber: data.referenceNumber,
      sourceModule: (data.sourceModule as any) || 'MANUAL',
      sourceId: data.sourceId,
      description: data.description,
      attachmentUrl: data.attachmentUrl,
      status: 'POSTED',
      createdBy: data.createdBy || 'System User',
      createdAt: new Date().toISOString()
    };

    // 5. Update Balances Atomically
    if (data.direction === 'IN') {
      account.currentBalance += Number(data.amount);
    } else if (data.direction === 'OUT') {
      account.currentBalance -= Number(data.amount);
    } else if (data.direction === 'TRANSFER') {
      account.currentBalance -= Number(data.amount);
      if (targetAccount) {
        targetAccount.currentBalance += Number(data.amount);
      }
    }

    // 6. Update Entity Ledger Balances if applicable
    if (data.entityType === 'CLIENT' && data.entityId) {
      const cli = db.clients.find(c => c.id === data.entityId);
      if (cli) {
        if (data.direction === 'IN') cli.balance -= Number(data.amount); // Client paid us
        if (data.direction === 'OUT') cli.balance += Number(data.amount); // Refund to client
      }
    } else if (data.entityType === 'SUPPLIER' && data.entityId) {
      const sup = db.suppliers.find(s => s.id === data.entityId);
      if (sup) {
        if (data.direction === 'OUT') sup.balance -= Number(data.amount); // Paid supplier
        if (data.direction === 'IN') sup.balance += Number(data.amount); // Supplier refund
      }
    }

    db.ledgerTransactions.unshift(newTxn);

    this.addAuditLog(
      'CREATE_TRANSACTION',
      'TRANSACTION',
      newTxn.id,
      `Posted ${newTxn.direction} transaction ${newTxn.id} of Rs. ${newTxn.amount.toLocaleString()} on Account '${account.name}' (${newTxn.categoryName})`,
      data.createdBy
    );

    return newTxn;
  }

  voidTransaction(txnId: string, reason: string, user: string): LedgerTransaction {
    const txn = db.ledgerTransactions.find(t => t.id === txnId);
    if (!txn) throw new Error('Transaction not found');
    if (txn.status === 'VOIDED') throw new Error('Transaction is already voided');

    const isClosed = db.closingSessions.some(s => s.date === txn.date && s.status === 'CLOSED');
    if (isClosed) {
      throw new Error(`Cannot void transaction on CLOSED day (${txn.date}). Re-open the day first.`);
    }

    // Reverse Account Balances
    const account = db.accounts.find(a => a.id === txn.accountId);
    if (account) {
      if (txn.direction === 'IN') account.currentBalance -= txn.amount;
      if (txn.direction === 'OUT') account.currentBalance += txn.amount;
      if (txn.direction === 'TRANSFER') account.currentBalance += txn.amount;
    }

    if (txn.direction === 'TRANSFER' && txn.targetAccountId) {
      const targetAcc = db.accounts.find(a => a.id === txn.targetAccountId);
      if (targetAcc) {
        targetAcc.currentBalance -= txn.amount;
      }
    }

    // Reverse Entity Balances
    if (txn.entityType === 'CLIENT' && txn.entityId) {
      const cli = db.clients.find(c => c.id === txn.entityId);
      if (cli) {
        if (txn.direction === 'IN') cli.balance += txn.amount;
        if (txn.direction === 'OUT') cli.balance -= txn.amount;
      }
    } else if (txn.entityType === 'SUPPLIER' && txn.entityId) {
      const sup = db.suppliers.find(s => s.id === txn.entityId);
      if (sup) {
        if (txn.direction === 'OUT') sup.balance += txn.amount;
        if (txn.direction === 'IN') sup.balance -= txn.amount;
      }
    }

    txn.status = 'VOIDED';
    txn.voidReason = reason;
    txn.voidedAt = new Date().toISOString();
    txn.voidedBy = user;

    this.addAuditLog('VOID_TRANSACTION', 'TRANSACTION', txn.id, `Voided transaction ${txn.id} of Rs. ${txn.amount}. Reason: ${reason}`, user);

    return txn;
  }

  updateTransaction(id: string, data: any, user: string): LedgerTransaction {
    const txn = db.ledgerTransactions.find(t => t.id === id);
    if (!txn) throw new Error('Transaction not found');

    const isOldClosed = db.closingSessions.some(s => s.date === txn.date && s.status === 'CLOSED');
    if (isOldClosed) throw new Error(`Cannot edit transaction on CLOSED day (${txn.date}). Re-open day first.`);

    if (data.date) {
      const isNewClosed = db.closingSessions.some(s => s.date === data.date && s.status === 'CLOSED');
      if (isNewClosed) throw new Error(`Target date ${data.date} is CLOSED. Re-open day first.`);
    }

    // If transaction was POSTED, reverse old balances
    if (txn.status === 'POSTED') {
      const oldAccount = db.accounts.find(a => a.id === txn.accountId);
      if (oldAccount) {
        if (txn.direction === 'IN') oldAccount.currentBalance -= txn.amount;
        if (txn.direction === 'OUT') oldAccount.currentBalance += txn.amount;
        if (txn.direction === 'TRANSFER') oldAccount.currentBalance += txn.amount;
      }
      if (txn.direction === 'TRANSFER' && txn.targetAccountId) {
        const targetAcc = db.accounts.find(a => a.id === txn.targetAccountId);
        if (targetAcc) targetAcc.currentBalance -= txn.amount;
      }
      if (txn.entityType === 'CLIENT' && txn.entityId) {
        const cli = db.clients.find(c => c.id === txn.entityId);
        if (cli) {
          if (txn.direction === 'IN') cli.balance += txn.amount;
          if (txn.direction === 'OUT') cli.balance -= txn.amount;
        }
      } else if (txn.entityType === 'SUPPLIER' && txn.entityId) {
        const sup = db.suppliers.find(s => s.id === txn.entityId);
        if (sup) {
          if (txn.direction === 'OUT') sup.balance += txn.amount;
          if (txn.direction === 'IN') sup.balance -= txn.amount;
        }
      }
    }

    // Apply new values to txn
    if (data.date) txn.date = data.date;
    if (data.time) txn.time = data.time;
    if (data.direction) txn.direction = data.direction;
    if (data.accountId) {
      txn.accountId = data.accountId;
      txn.accountName = db.accounts.find(a => a.id === data.accountId)?.name || txn.accountName;
    }
    if (data.targetAccountId !== undefined) {
      txn.targetAccountId = data.targetAccountId;
      txn.targetAccountName = data.targetAccountId ? db.accounts.find(a => a.id === data.targetAccountId)?.name : undefined;
    }
    if (data.categoryId) {
      txn.categoryId = data.categoryId;
      txn.categoryName = db.categories.find(c => c.id === data.categoryId)?.name || txn.categoryName;
    }
    if (data.amount !== undefined) txn.amount = Number(data.amount);
    if (data.paymentMethod) txn.paymentMethod = data.paymentMethod;
    if (data.entityType !== undefined) txn.entityType = data.entityType;
    if (data.entityId !== undefined) {
      txn.entityId = data.entityId;
      if (txn.entityType === 'CLIENT' && data.entityId) {
        const c = db.clients.find(x => x.id === data.entityId);
        txn.entityName = c ? `${c.name} (${c.code})` : '';
      } else if (txn.entityType === 'SUPPLIER' && data.entityId) {
        const s = db.suppliers.find(x => x.id === data.entityId);
        txn.entityName = s ? `${s.name} (${s.code})` : '';
      } else if (txn.entityType === 'PARTNER' && data.entityId) {
        const p = db.partners.find(x => x.id === data.entityId);
        txn.entityName = p ? `${p.name} (${p.code})` : '';
      } else if (txn.entityType === 'WORKER' && data.entityId) {
        const w = db.workers.find(x => x.id === data.entityId);
        txn.entityName = w ? `${w.name} (${w.code})` : '';
      } else {
        txn.entityName = '';
      }
    }
    if (data.referenceNumber !== undefined) txn.referenceNumber = data.referenceNumber;
    if (data.description !== undefined) txn.description = data.description;

    // Apply new balances if POSTED
    if (txn.status === 'POSTED') {
      const newAccount = db.accounts.find(a => a.id === txn.accountId);
      if (newAccount) {
        if (txn.direction === 'IN') newAccount.currentBalance += txn.amount;
        if (txn.direction === 'OUT') newAccount.currentBalance -= txn.amount;
        if (txn.direction === 'TRANSFER') newAccount.currentBalance -= txn.amount;
      }
      if (txn.direction === 'TRANSFER' && txn.targetAccountId) {
        const targetAcc = db.accounts.find(a => a.id === txn.targetAccountId);
        if (targetAcc) targetAcc.currentBalance += txn.amount;
      }
      if (txn.entityType === 'CLIENT' && txn.entityId) {
        const cli = db.clients.find(c => c.id === txn.entityId);
        if (cli) {
          if (txn.direction === 'IN') cli.balance -= txn.amount;
          if (txn.direction === 'OUT') cli.balance += txn.amount;
        }
      } else if (txn.entityType === 'SUPPLIER' && txn.entityId) {
        const sup = db.suppliers.find(s => s.id === txn.entityId);
        if (sup) {
          if (txn.direction === 'OUT') sup.balance -= txn.amount;
          if (txn.direction === 'IN') sup.balance += txn.amount;
        }
      }
    }

    this.addAuditLog('UPDATE_TRANSACTION', 'TRANSACTION', txn.id, `Updated transaction ${txn.id} details`, user);
    return txn;
  }

  deleteTransaction(id: string, user: string) {
    const idx = db.ledgerTransactions.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Transaction not found');
    const txn = db.ledgerTransactions[idx];

    const isClosed = db.closingSessions.some(s => s.date === txn.date && s.status === 'CLOSED');
    if (isClosed) throw new Error(`Cannot delete transaction on CLOSED day (${txn.date}). Re-open day first.`);

    // Reverse balances if POSTED
    if (txn.status === 'POSTED') {
      const account = db.accounts.find(a => a.id === txn.accountId);
      if (account) {
        if (txn.direction === 'IN') account.currentBalance -= txn.amount;
        if (txn.direction === 'OUT') account.currentBalance += txn.amount;
        if (txn.direction === 'TRANSFER') account.currentBalance += txn.amount;
      }
      if (txn.direction === 'TRANSFER' && txn.targetAccountId) {
        const targetAcc = db.accounts.find(a => a.id === txn.targetAccountId);
        if (targetAcc) targetAcc.currentBalance -= txn.amount;
      }
      if (txn.entityType === 'CLIENT' && txn.entityId) {
        const cli = db.clients.find(c => c.id === txn.entityId);
        if (cli) {
          if (txn.direction === 'IN') cli.balance += txn.amount;
          if (txn.direction === 'OUT') cli.balance -= txn.amount;
        }
      } else if (txn.entityType === 'SUPPLIER' && txn.entityId) {
        const sup = db.suppliers.find(s => s.id === txn.entityId);
        if (sup) {
          if (txn.direction === 'OUT') sup.balance += txn.amount;
          if (txn.direction === 'IN') sup.balance -= txn.amount;
        }
      }
    }

    db.ledgerTransactions.splice(idx, 1);
    this.addAuditLog('DELETE_TRANSACTION', 'TRANSACTION', id, `Deleted transaction ${id} of Rs. ${txn.amount}`, user);
  }

  // --- DAILY RECONCILIATION ENGINE ---

  getDailyAccountPositions(date: string): { session: DailyClosingSession | undefined; positions: DailyAccountPosition[] } {
    const session = db.closingSessions.find(s => s.date === date);

    const positions: DailyAccountPosition[] = db.accounts.map(acc => {
      // Find existing saved position record if any
      const existing = db.dailyPositions.find(dp => dp.date === date && dp.accountId === acc.id);

      // Compute Opening Balance dynamically based on previous movements or account opening balance
      let openingBalance = acc.openingBalance;

      // Sum all posted transactions PRIOR to this date
      const priorTxns = db.ledgerTransactions.filter(t => t.status === 'POSTED' && t.date < date);
      for (const t of priorTxns) {
        if (t.accountId === acc.id) {
          if (t.direction === 'IN') openingBalance += t.amount;
          if (t.direction === 'OUT') openingBalance -= t.amount;
          if (t.direction === 'TRANSFER') openingBalance -= t.amount;
        }
        if (t.direction === 'TRANSFER' && t.targetAccountId === acc.id) {
          openingBalance += t.amount;
        }
      }

      // Compute current day movements
      const dayTxns = db.ledgerTransactions.filter(t => t.status === 'POSTED' && t.date === date);

      let totalIn = 0;
      let totalOut = 0;
      let transferIn = 0;
      let transferOut = 0;

      for (const t of dayTxns) {
        if (t.accountId === acc.id) {
          if (t.direction === 'IN') totalIn += t.amount;
          if (t.direction === 'OUT') totalOut += t.amount;
          if (t.direction === 'TRANSFER') transferOut += t.amount;
        }
        if (t.direction === 'TRANSFER' && t.targetAccountId === acc.id) {
          transferIn += t.amount;
        }
      }

      const expectedClosing = openingBalance + totalIn - totalOut + transferIn - transferOut;

      const actualCountedBalance = existing?.actualCountedBalance ?? expectedClosing;
      const difference = actualCountedBalance - expectedClosing;

      return {
        id: existing?.id || `DAP-${date}-${acc.id}`,
        date,
        accountId: acc.id,
        accountName: acc.name,
        openingBalance,
        totalIn,
        totalOut,
        transferIn,
        transferOut,
        expectedClosing,
        actualCountedBalance,
        difference,
        status: session ? session.status : 'OPEN',
        settlementType: existing?.settlementType || 'NONE',
        notes: existing?.notes || ''
      };
    });

    return { session, positions };
  }

  saveActualCount(date: string, accountId: string, actualCountedBalance: number, notes: string, user: string) {
    let existing = db.dailyPositions.find(p => p.date === date && p.accountId === accountId);
    if (!existing) {
      existing = {
        id: `DAP-${date}-${accountId}`,
        date,
        accountId,
        accountName: db.accounts.find(a => a.id === accountId)?.name || '',
        openingBalance: 0,
        totalIn: 0,
        totalOut: 0,
        transferIn: 0,
        transferOut: 0,
        expectedClosing: 0,
        actualCountedBalance,
        difference: 0,
        status: 'OPEN',
        notes
      };
      db.dailyPositions.push(existing);
    } else {
      existing.actualCountedBalance = actualCountedBalance;
      existing.notes = notes;
    }

    this.addAuditLog('UPDATE_COUNT', 'RECONCILIATION', existing.id, `Updated actual count for ${existing.accountName} on ${date} to Rs. ${actualCountedBalance}`, user);
  }

  settleDifference(date: string, accountId: string, type: 'LOSS' | 'EXCESS', amount: number, reason: string, user: string) {
    const account = db.accounts.find(a => a.id === accountId);
    if (!account) throw new Error('Account not found');

    if (type === 'LOSS') {
      // Shortage settlement creates Cash Shortage OUT entry
      const lossCategory = db.categories.find(c => c.id === 'CAT-OUT-7') || db.categories.find(c => c.direction === 'OUT');
      this.createTransaction({
        date,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        direction: 'OUT',
        accountId,
        categoryId: lossCategory?.id || 'CAT-OUT-7',
        amount: Math.abs(amount),
        paymentMethod: 'Cash',
        description: `Reconciliation Loss/Shortage Write-off: ${reason}`,
        sourceModule: 'ADJUSTMENT',
        createdBy: user
      });
    } else {
      // Excess settlement creates Unidentified Receipt IN entry
      const excessCategory = db.categories.find(c => c.id === 'CAT-IN-5') || db.categories.find(c => c.direction === 'IN');
      this.createTransaction({
        date,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        direction: 'IN',
        accountId,
        categoryId: excessCategory?.id || 'CAT-IN-5',
        amount: Math.abs(amount),
        paymentMethod: 'Cash',
        description: `Reconciliation Excess Adjustment: ${reason}`,
        sourceModule: 'ADJUSTMENT',
        createdBy: user
      });
    }

    this.addAuditLog('SETTLE_DIFFERENCE', 'RECONCILIATION', accountId, `Settled ${type} adjustment of Rs. ${amount} for ${account.name} on ${date}. Reason: ${reason}`, user);
  }

  closeDay(date: string, notes: string, user: string): DailyClosingSession {
    const { positions } = this.getDailyAccountPositions(date);

    let session = db.closingSessions.find(s => s.date === date);
    if (!session) {
      session = {
        date,
        status: 'CLOSED',
        closedBy: user,
        closedAt: new Date().toISOString(),
        totalOpening: positions.reduce((sum, p) => sum + p.openingBalance, 0),
        totalExpectedClosing: positions.reduce((sum, p) => sum + p.expectedClosing, 0),
        totalActualCounted: positions.reduce((sum, p) => sum + (p.actualCountedBalance ?? p.expectedClosing), 0),
        totalDifference: positions.reduce((sum, p) => sum + (p.difference ?? 0), 0),
        notes
      };
      db.closingSessions.push(session);
    } else {
      session.status = 'CLOSED';
      session.closedBy = user;
      session.closedAt = new Date().toISOString();
      session.notes = notes;
    }

    this.addAuditLog('CLOSE_DAY', 'DAY_CLOSING', date, `Closed financial day ${date} with total expected balance Rs. ${session.totalExpectedClosing}`, user);
    return session;
  }

  reopenDay(date: string, reason: string, user: string): DailyClosingSession {
    const session = db.closingSessions.find(s => s.date === date);
    if (!session) throw new Error(`Day ${date} is not closed`);

    session.status = 'OPEN';
    session.notes = `${session.notes || ''} | Reopened on ${new Date().toISOString()} by ${user}: ${reason}`;

    this.addAuditLog('REOPEN_DAY', 'DAY_CLOSING', date, `Reopened closed financial day ${date}. Reason: ${reason}`, user);
    return session;
  }

  // --- CANONICAL FILTERING & TRACKING ENGINE ---

  getFilteredTransactions(filters: TrackingFilter): LedgerTransaction[] {
    return db.ledgerTransactions.filter(t => {
      // 1. Date Filter
      if (filters.datePreset && filters.datePreset !== 'ALL') {
        const todayStr = new Date().toISOString().slice(0, 10);
        const today = new Date();

        if (filters.datePreset === 'TODAY') {
          if (t.date !== todayStr) return false;
        } else if (filters.datePreset === 'YESTERDAY') {
          const yest = new Date(today);
          yest.setDate(yest.getDate() - 1);
          if (t.date !== yest.toISOString().slice(0, 10)) return false;
        } else if (filters.datePreset === 'THIS_MONTH') {
          if (t.date.slice(0, 7) !== todayStr.slice(0, 7)) return false;
        } else if (filters.datePreset === 'CUSTOM') {
          if (filters.fromDate && t.date < filters.fromDate) return false;
          if (filters.toDate && t.date > filters.toDate) return false;
        }
      }

      // Explicit Custom Date Range override if provided
      if (filters.fromDate && t.date < filters.fromDate) return false;
      if (filters.toDate && t.date > filters.toDate) return false;

      // 2. Direction
      if (filters.direction && filters.direction !== 'ALL' && t.direction !== filters.direction) {
        return false;
      }

      // 3. Category
      if (filters.categoryId && t.categoryId !== filters.categoryId) {
        return false;
      }

      // 4. Account
      if (filters.accountId) {
        if (t.direction === 'TRANSFER') {
          if (t.accountId !== filters.accountId && t.targetAccountId !== filters.accountId) return false;
        } else {
          if (t.accountId !== filters.accountId) return false;
        }
      }

      // 5. Client
      if (filters.clientId && (t.entityType !== 'CLIENT' || t.entityId !== filters.clientId)) {
        return false;
      }

      // 6. Supplier
      if (filters.supplierId && (t.entityType !== 'SUPPLIER' || t.entityId !== filters.supplierId)) {
        return false;
      }

      // 7. Partner
      if (filters.partnerId && (t.entityType !== 'PARTNER' || t.entityId !== filters.partnerId)) {
        return false;
      }

      // 8. Worker
      if (filters.workerId && (t.entityType !== 'WORKER' || t.entityId !== filters.workerId)) {
        return false;
      }

      // 9. Vehicle
      if (filters.vehicleId && t.vehicleId !== filters.vehicleId) {
        return false;
      }

      // 10. Amount Min / Max
      if (filters.minAmount && t.amount < Number(filters.minAmount)) return false;
      if (filters.maxAmount && t.amount > Number(filters.maxAmount)) return false;

      // 11. Source Module
      if (filters.sourceModule && t.sourceModule !== filters.sourceModule) return false;

      // 12. Status
      if (filters.status && t.status !== filters.status) return false;

      // 13. Payment Method
      if (filters.paymentMethod && t.paymentMethod !== filters.paymentMethod) return false;

      // 14. Search Text Query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          t.id.toLowerCase().includes(q) ||
          t.accountName.toLowerCase().includes(q) ||
          t.categoryName.toLowerCase().includes(q) ||
          (t.entityName && t.entityName.toLowerCase().includes(q)) ||
          (t.referenceNumber && t.referenceNumber.toLowerCase().includes(q)) ||
          t.description.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }

  getFilterSummary(filters: TrackingFilter): FilterSummary {
    const txns = this.getFilteredTransactions(filters);

    let totalIn = 0;
    let totalOut = 0;
    let transferIn = 0;
    let transferOut = 0;

    const catMap: Record<string, { categoryName: string; direction: string; totalAmount: number; count: number }> = {};
    const accMap: Record<string, { accountName: string; totalIn: number; totalOut: number; netChange: number; count: number }> = {};

    for (const t of txns) {
      if (t.status !== 'POSTED') continue;

      if (t.direction === 'IN') totalIn += t.amount;
      if (t.direction === 'OUT') totalOut += t.amount;
      if (t.direction === 'TRANSFER') {
        transferOut += t.amount;
        transferIn += t.amount;
      }

      // Category Summary
      if (!catMap[t.categoryName]) {
        catMap[t.categoryName] = { categoryName: t.categoryName, direction: t.direction, totalAmount: 0, count: 0 };
      }
      catMap[t.categoryName].totalAmount += t.amount;
      catMap[t.categoryName].count += 1;

      // Account Summary
      if (!accMap[t.accountName]) {
        accMap[t.accountName] = { accountName: t.accountName, totalIn: 0, totalOut: 0, netChange: 0, count: 0 };
      }
      if (t.direction === 'IN') accMap[t.accountName].totalIn += t.amount;
      if (t.direction === 'OUT') accMap[t.accountName].totalOut += t.amount;
      if (t.direction === 'TRANSFER') accMap[t.accountName].totalOut += t.amount;
      accMap[t.accountName].count += 1;

      if (t.direction === 'TRANSFER' && t.targetAccountName) {
        if (!accMap[t.targetAccountName]) {
          accMap[t.targetAccountName] = { accountName: t.targetAccountName, totalIn: 0, totalOut: 0, netChange: 0, count: 0 };
        }
        accMap[t.targetAccountName].totalIn += t.amount;
        accMap[t.targetAccountName].count += 1;
      }
    }

    Object.values(accMap).forEach(a => {
      a.netChange = a.totalIn - a.totalOut;
    });

    const categoryBreakdown = Object.values(catMap);
    const accountBreakdown = Object.values(accMap);

    let entitySummary;
    if (filters.clientId) {
      const cli = db.clients.find(c => c.id === filters.clientId);
      if (cli) {
        const cliTxns = txns.filter(t => t.entityType === 'CLIENT' && t.entityId === cli.id && t.status === 'POSTED');
        const cIn = cliTxns.filter(t => t.direction === 'IN').reduce((sum, t) => sum + t.amount, 0);
        const cOut = cliTxns.filter(t => t.direction === 'OUT').reduce((sum, t) => sum + t.amount, 0);
        entitySummary = {
          entityName: `${cli.name} (${cli.code})`,
          entityType: 'CLIENT',
          totalIn: cIn,
          totalOut: cOut,
          netMovement: cIn - cOut,
          count: cliTxns.length
        };
      }
    } else if (filters.supplierId) {
      const sup = db.suppliers.find(s => s.id === filters.supplierId);
      if (sup) {
        const supTxns = txns.filter(t => t.entityType === 'SUPPLIER' && t.entityId === sup.id && t.status === 'POSTED');
        const sIn = supTxns.filter(t => t.direction === 'IN').reduce((sum, t) => sum + t.amount, 0);
        const sOut = supTxns.filter(t => t.direction === 'OUT').reduce((sum, t) => sum + t.amount, 0);
        entitySummary = {
          entityName: `${sup.name} (${sup.code})`,
          entityType: 'SUPPLIER',
          totalIn: sIn,
          totalOut: sOut,
          netMovement: sIn - sOut,
          count: supTxns.length
        };
      }
    }

    return {
      totalIn,
      totalOut,
      transferIn,
      transferOut,
      netMovement: totalIn - totalOut,
      transactionCount: txns.length,
      categoryBreakdown,
      accountBreakdown,
      entitySummary
    };
  }

  // --- SYSTEM WIPE & DATA CLEARANCE ENGINE ---

  wipeData(mode: 'TRANSACTIONS_ONLY' | 'FULL_SYSTEM_RESET', user: string) {
    if (mode === 'TRANSACTIONS_ONLY') {
      // Clear all transaction entries, daily positions, closing sessions
      db.ledgerTransactions = [];
      db.dailyPositions = [];
      db.closingSessions = [];

      // Reset account current balances back to opening balances
      for (const acc of db.accounts) {
        acc.currentBalance = acc.openingBalance;
      }

      // Reset client, supplier, partner balances back to 0
      for (const c of db.clients) c.balance = 0;
      for (const s of db.suppliers) s.balance = 0;
      for (const p of db.partners) p.balance = 0;

      this.addAuditLog(
        'WIPE_TRANSACTIONS',
        'SYSTEM',
        'ALL_TRANSACTIONS',
        'DATA WIPE: Cleared all ledger transactions, daily positions, and closing sessions. Restored account balances to opening values.',
        user
      );
    } else if (mode === 'FULL_SYSTEM_RESET') {
      // Complete Factory Reset
      db.ledgerTransactions = [];
      db.dailyPositions = [];
      db.closingSessions = [];
      db.clients = [];
      db.suppliers = [];
      db.partners = [];
      db.workers = [];
      db.vehicles = [];
      db.banks = [];
      db.accounts = [];
      db.categories = [];
      db.paymentMethods = [];

      // Clear audit logs except the reset log itself
      db.auditLogs = [];

      this.addAuditLog(
        'FULL_SYSTEM_RESET',
        'SYSTEM',
        'FACTORY_CLEARANCE',
        'COMPLETE DATA CLEARANCE: Performed full factory reset. Removed all transactions, reconciliations, accounts, banks, categories, payment methods, master data entities, and logs.',
        user
      );
    }
  }

  // --- XLSX BACKUP & RESTORE ENGINE ---

  exportFullBackupWorkbookBuffer(): Buffer {
    const wb = XLSX.utils.book_new();

    const addSheet = (sheetName: string, rows: any[]) => {
      const ws = XLSX.utils.json_to_sheet(rows || []);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    addSheet('Transactions', db.ledgerTransactions);
    addSheet('Accounts', db.accounts);
    addSheet('Banks', db.banks);
    addSheet('Categories', db.categories);
    addSheet('Clients', db.clients);
    addSheet('Suppliers', db.suppliers);
    addSheet('Partners', db.partners);
    addSheet('Workers', db.workers);
    addSheet('Vehicles', db.vehicles);
    addSheet('PaymentMethods', db.paymentMethods);
    addSheet('ClosingSessions', db.closingSessions);
    addSheet('DailyPositions', db.dailyPositions);
    addSheet('AuditLogs', db.auditLogs);

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buf;
  }

  restoreFromBackupWorkbookBuffer(buffer: Buffer, user: string = 'System Administrator') {
    const wb = XLSX.read(buffer, { type: 'buffer' });

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

    // Restore Banks
    const rawBanks = parseSheet('Banks');
    db.banks = rawBanks.map((b: any) => ({
      id: toStr(b.id),
      code: toStr(b.code),
      name: toStr(b.name),
      branch: b.branch ? toStr(b.branch) : undefined,
      active: toBool(b.active, true),
      createdAt: toStr(b.createdAt) || new Date().toISOString()
    }));

    // Restore Accounts
    const rawAccounts = parseSheet('Accounts');
    db.accounts = rawAccounts.map((a: any) => ({
      id: toStr(a.id),
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

    // Restore Categories
    const rawCategories = parseSheet('Categories');
    db.categories = rawCategories.map((c: any) => ({
      id: toStr(c.id),
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

    // Restore Clients
    const rawClients = parseSheet('Clients');
    db.clients = rawClients.map((c: any) => ({
      id: toStr(c.id),
      code: toStr(c.code),
      name: toStr(c.name),
      phone: c.phone ? toStr(c.phone) : undefined,
      email: c.email ? toStr(c.email) : undefined,
      address: c.address ? toStr(c.address) : undefined,
      balance: toNum(c.balance),
      status: (toStr(c.status) || 'ACTIVE') as any,
      createdAt: toStr(c.createdAt) || new Date().toISOString()
    }));

    // Restore Suppliers
    const rawSuppliers = parseSheet('Suppliers');
    db.suppliers = rawSuppliers.map((s: any) => ({
      id: toStr(s.id),
      code: toStr(s.code),
      name: toStr(s.name),
      phone: s.phone ? toStr(s.phone) : undefined,
      email: s.email ? toStr(s.email) : undefined,
      address: s.address ? toStr(s.address) : undefined,
      balance: toNum(s.balance),
      status: (toStr(s.status) || 'ACTIVE') as any,
      createdAt: toStr(s.createdAt) || new Date().toISOString()
    }));

    // Restore Partners
    const rawPartners = parseSheet('Partners');
    db.partners = rawPartners.map((p: any) => ({
      id: toStr(p.id),
      code: toStr(p.code),
      name: toStr(p.name),
      phone: p.phone ? toStr(p.phone) : undefined,
      email: p.email ? toStr(p.email) : undefined,
      sharePercentage: p.sharePercentage ? toNum(p.sharePercentage) : undefined,
      balance: toNum(p.balance),
      status: (toStr(p.status) || 'ACTIVE') as any,
      createdAt: toStr(p.createdAt) || new Date().toISOString()
    }));

    // Restore Workers
    const rawWorkers = parseSheet('Workers');
    db.workers = rawWorkers.map((w: any) => ({
      id: toStr(w.id),
      code: toStr(w.code),
      name: toStr(w.name),
      role: w.role ? toStr(w.role) : undefined,
      phone: w.phone ? toStr(w.phone) : undefined,
      dailyWage: w.dailyWage ? toNum(w.dailyWage) : undefined,
      status: (toStr(w.status) || 'ACTIVE') as any,
      createdAt: toStr(w.createdAt) || new Date().toISOString()
    }));

    // Restore Vehicles
    const rawVehicles = parseSheet('Vehicles');
    db.vehicles = rawVehicles.map((v: any) => ({
      id: toStr(v.id),
      plateNumber: toStr(v.plateNumber),
      model: toStr(v.model),
      driverName: v.driverName ? toStr(v.driverName) : undefined,
      status: (toStr(v.status) || 'ACTIVE') as any,
      createdAt: toStr(v.createdAt) || new Date().toISOString()
    }));

    // Restore PaymentMethods
    const rawPaymentMethods = parseSheet('PaymentMethods');
    db.paymentMethods = rawPaymentMethods.map((pm: any) => ({
      id: toStr(pm.id),
      name: toStr(pm.name),
      code: toStr(pm.code),
      active: toBool(pm.active, true)
    }));

    // Restore LedgerTransactions
    const rawTxns = parseSheet('Transactions');
    db.ledgerTransactions = rawTxns.map((t: any) => ({
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
      sourceModule: (toStr(t.sourceModule) || 'MANUAL') as SourceModule,
      description: toStr(t.description),
      attachmentUrl: t.attachmentUrl ? toStr(t.attachmentUrl) : undefined,
      status: (toStr(t.status) || 'POSTED') as any,
      voidReason: t.voidReason ? toStr(t.voidReason) : undefined,
      createdBy: toStr(t.createdBy) || 'System',
      createdAt: toStr(t.createdAt) || new Date().toISOString(),
      reconciledDay: t.reconciledDay ? toStr(t.reconciledDay) : undefined
    }));

    // Restore ClosingSessions
    const rawClosing = parseSheet('ClosingSessions');
    db.closingSessions = rawClosing.map((cs: any) => ({
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

    // Restore DailyPositions
    const rawPositions = parseSheet('DailyPositions');
    db.dailyPositions = rawPositions.map((dp: any) => ({
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
      settlementType: dp.settlementType ? toStr(dp.settlementType) as any : undefined,
      settlementTxnId: dp.settlementTxnId ? toStr(dp.settlementTxnId) : undefined,
      notes: dp.notes ? toStr(dp.notes) : undefined,
      reconciledBy: dp.reconciledBy ? toStr(dp.reconciledBy) : undefined,
      reconciledAt: dp.reconciledAt ? toStr(dp.reconciledAt) : undefined
    }));

    // Restore AuditLogs
    const rawAudit = parseSheet('AuditLogs');
    db.auditLogs = rawAudit.map((al: any) => ({
      id: toStr(al.id),
      timestamp: toStr(al.timestamp) || new Date().toISOString(),
      action: toStr(al.action),
      entityType: toStr(al.entityType),
      entityId: toStr(al.entityId),
      details: toStr(al.details),
      user: toStr(al.user)
    }));

    this.addAuditLog(
      'SYSTEM_RESTORE',
      'BACKUP',
      'RESTORE_XLSX',
      `FULL SYSTEM RESTORE: Successfully restored database state from backup XLSX workbook. Restored ${db.ledgerTransactions.length} transactions, ${db.accounts.length} accounts, ${db.categories.length} categories.`,
      user
    );

    return {
      transactionsCount: db.ledgerTransactions.length,
      accountsCount: db.accounts.length,
      banksCount: db.banks.length,
      categoriesCount: db.categories.length,
      clientsCount: db.clients.length,
      suppliersCount: db.suppliers.length,
      partnersCount: db.partners.length,
      workersCount: db.workers.length,
      vehiclesCount: db.vehicles.length,
      paymentMethodsCount: db.paymentMethods.length
    };
  }

  // --- AUDIT LOGS ---

  getAuditLogs(): AuditLog[] {
    return db.auditLogs;
  }

  private addAuditLog(action: string, entityType: string, entityId: string, details: string, user: string) {
    db.auditLogs.unshift({
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      details,
      user: user || 'System'
    });
    db.save();
  }
}

export const financeService = new FinanceService();
