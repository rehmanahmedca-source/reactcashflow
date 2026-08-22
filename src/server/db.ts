import fs from 'fs';
import path from 'path';
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
  AuditLog
} from '../types';

const DATA_FILE_PATH = path.join(process.cwd(), 'data_store.json');

export class FinanceDatabase {
  banks: Bank[] = [
    { id: 'BANK-1', code: 'ALHAB', name: 'BANK AL HABIB', branch: '-', active: true, createdAt: '2026-08-08' },
    { id: 'BANK-2', code: 'MCB', name: 'MUSLIM COMMERCIAL BANK', branch: '-', active: true, createdAt: '2026-08-08' },
    { id: 'BANK-3', code: 'JAZZ CASH', name: 'MOBILINK', branch: '27905', active: true, createdAt: '2026-08-08' }
  ];

  accounts: FinancialAccount[] = [
    { id: 'ACC-1', name: 'FBM CASH IN HAND', accountType: 'CASH', openingBalance: 12620, currentBalance: 12620, active: true, displayOrder: 1, createdAt: '2026-08-08' },
    { id: 'ACC-2', name: 'FBM AL HABIB', bankId: 'BANK-1', bankName: 'BANK AL HABIB', accountNumber: '-', accountType: 'BANK', openingBalance: 474, currentBalance: 474, active: true, displayOrder: 2, createdAt: '2026-08-08' },
    { id: 'ACC-3', name: 'FBM MCB', bankId: 'BANK-2', bankName: 'MUSLIM COMMERCIAL BANK', accountNumber: '-', accountType: 'BANK', openingBalance: 80038, currentBalance: 80038, active: true, displayOrder: 3, createdAt: '2026-08-08' },
    { id: 'ACC-4', name: 'FBM JAZZ CASH', bankId: 'BANK-1', bankName: 'BANK AL HABIB', accountNumber: '-', accountType: 'BANK', openingBalance: 125, currentBalance: 125, active: true, displayOrder: 4, createdAt: '2026-08-08' }
  ];

  categories: TransactionCategory[] = [
    { id: 'CAT-1', name: 'HDC LOANS IN', direction: 'IN', active: true, requiresPartner: true, description: 'Partner Loan Inflow' },
    { id: 'CAT-2', name: 'HDC LOANS OUT', direction: 'OUT', active: true, requiresPartner: true, description: 'Partner Loan Outflow' }
  ];

  clients: Client[] = [];

  suppliers: Supplier[] = [];

  partners: Partner[] = [
    { id: 'PTR-301', code: 'P-301', name: 'HDC', sharePercentage: 0, balance: 0, status: 'ACTIVE', createdAt: '2026-08-08' },
    { id: 'PTR-302', code: 'P-302', name: 'HDC LABOUR', sharePercentage: 0, balance: 0, status: 'ACTIVE', createdAt: '2026-08-08' }
  ];

  workers: Worker[] = [
    { id: 'WRK-1', code: 'W-101', name: 'Worker 1', role: 'Worker', status: 'ACTIVE', createdAt: '2026-08-08' }
  ];

  vehicles: Vehicle[] = [];

  paymentMethods: PaymentMethod[] = [
    { id: 'PM-1', name: 'Cash', code: 'CASH', active: true },
    { id: 'PM-2', name: 'Bank Transfer / Online RTGS', code: 'BANK_TRANSFER', active: true },
    { id: 'PM-3', name: 'Crossed Cheque', code: 'CHEQUE', active: true },
    { id: 'PM-4', name: 'Digital Wallet', code: 'DIGITAL_WALLET', active: true },
    { id: 'PM-5', name: 'Pay Order / Demand Draft', code: 'PAY_ORDER', active: true }
  ];

  ledgerTransactions: LedgerTransaction[] = [];
  dailyPositions: DailyAccountPosition[] = [];
  closingSessions: DailyClosingSession[] = [];
  auditLogs: AuditLog[] = [
    {
      id: 'LOG-INIT',
      timestamp: new Date().toISOString(),
      action: 'SYSTEM_MASTER_REPLACEMENT',
      entityType: 'MASTER_DATA',
      entityId: 'AUTHORITATIVE_DATASET',
      details: 'Master Data replaced with Authoritative Dataset: 4 Accounts, 3 Banks, 2 Categories, 2 Partners, 1 Worker',
      user: 'System Admin'
    }
  ];

  constructor() {
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        const data = JSON.parse(fileContent);

        if (Array.isArray(data.banks)) this.banks = data.banks;
        if (Array.isArray(data.accounts)) this.accounts = data.accounts;
        if (Array.isArray(data.categories)) this.categories = data.categories;
        if (Array.isArray(data.clients)) this.clients = data.clients;
        if (Array.isArray(data.suppliers)) this.suppliers = data.suppliers;
        if (Array.isArray(data.partners)) this.partners = data.partners;
        if (Array.isArray(data.workers)) this.workers = data.workers;
        if (Array.isArray(data.vehicles)) this.vehicles = data.vehicles;
        if (Array.isArray(data.paymentMethods)) this.paymentMethods = data.paymentMethods;
        if (Array.isArray(data.ledgerTransactions)) this.ledgerTransactions = data.ledgerTransactions;
        if (Array.isArray(data.dailyPositions)) this.dailyPositions = data.dailyPositions;
        if (Array.isArray(data.closingSessions)) this.closingSessions = data.closingSessions;
        if (Array.isArray(data.auditLogs)) this.auditLogs = data.auditLogs;
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error loading finance database from disk:', err);
    }
  }

  save() {
    try {
      const dataToSave = {
        banks: this.banks,
        accounts: this.accounts,
        categories: this.categories,
        clients: this.clients,
        suppliers: this.suppliers,
        partners: this.partners,
        workers: this.workers,
        vehicles: this.vehicles,
        paymentMethods: this.paymentMethods,
        ledgerTransactions: this.ledgerTransactions,
        dailyPositions: this.dailyPositions,
        closingSessions: this.closingSessions,
        auditLogs: this.auditLogs
      };
      // Atomic write: write to temp file first, then rename to prevent corruption
      const tempPath = DATA_FILE_PATH + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DATA_FILE_PATH);
    } catch (err) {
      console.error('Error saving finance database to disk:', err);
    }
  }
}

export const db = new FinanceDatabase();
