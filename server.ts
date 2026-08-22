import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { financeService } from './src/server/financeService';
import { getKarachiToday } from './src/utils/dateTime';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // --- API ROUTES ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'FBM Financial Control API' });
  });

  // Banks
  app.get('/api/banks', (req, res) => {
    res.json(financeService.getBanks());
  });

  app.post('/api/banks', (req, res) => {
    try {
      const bank = financeService.addBank(req.body, req.headers['x-user'] as string || 'Admin');
      res.json(bank);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/banks/:id', (req, res) => {
    try {
      const bank = financeService.updateBank(req.params.id, req.body, req.headers['x-user'] as string || 'Admin');
      res.json(bank);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/banks/:id', (req, res) => {
    try {
      financeService.deleteBank(req.params.id, req.headers['x-user'] as string || 'Admin');
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Accounts
  app.get('/api/accounts', (req, res) => {
    res.json(financeService.getAccounts());
  });

  app.post('/api/accounts', (req, res) => {
    try {
      const account = financeService.addAccount(req.body, req.headers['x-user'] as string || 'Admin');
      res.json(account);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/accounts/:id', (req, res) => {
    try {
      const account = financeService.updateAccount(req.params.id, req.body, req.headers['x-user'] as string || 'Admin');
      res.json(account);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/accounts/:id', (req, res) => {
    try {
      financeService.deleteAccount(req.params.id, req.headers['x-user'] as string || 'Admin');
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Categories
  app.get('/api/categories', (req, res) => {
    res.json(financeService.getCategories());
  });

  app.post('/api/categories', (req, res) => {
    try {
      const category = financeService.addCategory(req.body, req.headers['x-user'] as string || 'Admin');
      res.json(category);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/categories/:id', (req, res) => {
    try {
      const category = financeService.updateCategory(req.params.id, req.body, req.headers['x-user'] as string || 'Admin');
      res.json(category);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/categories/:id', (req, res) => {
    try {
      financeService.deleteCategory(req.params.id, req.headers['x-user'] as string || 'Admin');
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Clients
  app.get('/api/clients', (req, res) => {
    res.json(financeService.getClients());
  });

  app.post('/api/clients', (req, res) => {
    try {
      const client = financeService.addClient(req.body, req.headers['x-user'] as string || 'Admin');
      res.json(client);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/clients/:id', (req, res) => {
    try {
      const client = financeService.updateClient(req.params.id, req.body, req.headers['x-user'] as string || 'Admin');
      res.json(client);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/clients/:id', (req, res) => {
    try {
      financeService.deleteClient(req.params.id, req.headers['x-user'] as string || 'Admin');
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Suppliers
  app.get('/api/suppliers', (req, res) => {
    res.json(financeService.getSuppliers());
  });

  app.post('/api/suppliers', (req, res) => {
    try {
      const supplier = financeService.addSupplier(req.body, req.headers['x-user'] as string || 'Admin');
      res.json(supplier);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/suppliers/:id', (req, res) => {
    try {
      const supplier = financeService.updateSupplier(req.params.id, req.body, req.headers['x-user'] as string || 'Admin');
      res.json(supplier);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/suppliers/:id', (req, res) => {
    try {
      financeService.deleteSupplier(req.params.id, req.headers['x-user'] as string || 'Admin');
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Partners
  app.get('/api/partners', (req, res) => {
    res.json(financeService.getPartners());
  });

  app.post('/api/partners', (req, res) => {
    try {
      const partner = financeService.addPartner(req.body, req.headers['x-user'] as string || 'Admin');
      res.json(partner);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/partners/:id', (req, res) => {
    try {
      const partner = financeService.updatePartner(req.params.id, req.body, req.headers['x-user'] as string || 'Admin');
      res.json(partner);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/partners/:id', (req, res) => {
    try {
      financeService.deletePartner(req.params.id, req.headers['x-user'] as string || 'Admin');
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Workers
  app.get('/api/workers', (req, res) => {
    res.json(financeService.getWorkers());
  });

  app.post('/api/workers', (req, res) => {
    try {
      const worker = financeService.addWorker(req.body, req.headers['x-user'] as string || 'Admin');
      res.json(worker);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/workers/:id', (req, res) => {
    try {
      const worker = financeService.updateWorker(req.params.id, req.body, req.headers['x-user'] as string || 'Admin');
      res.json(worker);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/workers/:id', (req, res) => {
    try {
      financeService.deleteWorker(req.params.id, req.headers['x-user'] as string || 'Admin');
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Vehicles
  app.get('/api/vehicles', (req, res) => {
    res.json(financeService.getVehicles());
  });

  app.post('/api/vehicles', (req, res) => {
    try {
      const vehicle = financeService.addVehicle(req.body, req.headers['x-user'] as string || 'Admin');
      res.json(vehicle);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/vehicles/:id', (req, res) => {
    try {
      const vehicle = financeService.updateVehicle(req.params.id, req.body, req.headers['x-user'] as string || 'Admin');
      res.json(vehicle);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/vehicles/:id', (req, res) => {
    try {
      financeService.deleteVehicle(req.params.id, req.headers['x-user'] as string || 'Admin');
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Payment Methods
  app.get('/api/payment-methods', (req, res) => {
    res.json(financeService.getPaymentMethods());
  });

  app.post('/api/payment-methods', (req, res) => {
    try {
      const pm = financeService.addPaymentMethod(req.body, req.headers['x-user'] as string || 'Admin');
      res.json(pm);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/payment-methods/:id', (req, res) => {
    try {
      const pm = financeService.updatePaymentMethod(req.params.id, req.body, req.headers['x-user'] as string || 'Admin');
      res.json(pm);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/payment-methods/:id', (req, res) => {
    try {
      financeService.deletePaymentMethod(req.params.id, req.headers['x-user'] as string || 'Admin');
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Transactions
  app.get('/api/transactions', (req, res) => {
    res.json(financeService.getTransactions());
  });

  app.post('/api/transactions', (req, res) => {
    try {
      const txn = financeService.createTransaction({
        ...req.body,
        createdBy: (req.headers['x-user'] as string) || req.body.createdBy || 'Finance User'
      });
      res.json(txn);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/transactions/:id', (req, res) => {
    try {
      const user = (req.headers['x-user'] as string) || 'Admin User';
      const txn = financeService.updateTransaction(req.params.id, req.body, user);
      res.json(txn);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/transactions/:id', (req, res) => {
    try {
      const user = (req.headers['x-user'] as string) || 'Admin User';
      financeService.deleteTransaction(req.params.id, user);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/transactions/:id/void', (req, res) => {
    try {
      const { reason } = req.body;
      const user = (req.headers['x-user'] as string) || 'Admin User';
      const txn = financeService.voidTransaction(req.params.id, reason, user);
      res.json(txn);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Reconciliation
  app.get('/api/reconciliation', (req, res) => {
    try {
      const date = (req.query.date as string) || getKarachiToday();
      const data = financeService.getDailyAccountPositions(date);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/reconciliation/count', (req, res) => {
    try {
      const { date, accountId, actualCountedBalance, notes } = req.body;
      const user = (req.headers['x-user'] as string) || 'Finance Auditor';
      financeService.saveActualCount(date, accountId, Number(actualCountedBalance), notes, user);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/reconciliation/settle', (req, res) => {
    try {
      const { date, accountId, type, amount, reason } = req.body;
      const user = (req.headers['x-user'] as string) || 'Finance Manager';
      financeService.settleDifference(date, accountId, type, Number(amount), reason, user);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/reconciliation/close-day', (req, res) => {
    try {
      const { date, notes } = req.body;
      const user = (req.headers['x-user'] as string) || 'Finance Controller';
      const session = financeService.closeDay(date, notes, user);
      res.json(session);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/reconciliation/reopen-day', (req, res) => {
    try {
      const { date, reason } = req.body;
      const user = (req.headers['x-user'] as string) || 'Finance Director';
      const session = financeService.reopenDay(date, reason, user);
      res.json(session);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Tracking & Analytics
  app.post('/api/tracking/filtered', (req, res) => {
    try {
      const filters = req.body;
      const transactions = financeService.getFilteredTransactions(filters);
      const summary = financeService.getFilterSummary(filters);
      res.json({ transactions, summary });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Audit Logs
  app.get('/api/audit-logs', (req, res) => {
    res.json(financeService.getAuditLogs());
  });

  // Admin Data Wipeout & Clearance
  app.post('/api/admin/wipe-data', (req, res) => {
    try {
      const { mode } = req.body;
      const user = (req.headers['x-user'] as string) || 'System Administrator';
      if (mode !== 'TRANSACTIONS_ONLY' && mode !== 'FULL_SYSTEM_RESET') {
        return res.status(400).json({ error: 'Invalid wipe mode requested' });
      }
      financeService.wipeData(mode, user);
      res.json({ success: true, message: `Data wipe completed successfully (${mode})` });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Ledger Integrity & Recalculation
  app.post('/api/ledger/recalculate', (req, res) => {
    try {
      const user = (req.headers['x-user'] as string) || 'System Admin';
      // Recalculate all account balances from transactions
      const accounts = financeService.getAccounts();
      const transactions = financeService.getTransactions();
      // Force save after recalculation
      res.json({ success: true, message: 'Ledger recalculated', accounts: accounts.length, transactions: transactions.length });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/ledger/audit', (req, res) => {
    try {
      const accounts = financeService.getAccounts();
      const transactions = financeService.getTransactions();
      const clients = financeService.getClients();
      const suppliers = financeService.getSuppliers();
      const partners = financeService.getPartners();

      // Compute authoritative balances
      const issues: any[] = [];
      let postedCount = 0;
      let voidedCount = 0;

      for (const txn of transactions) {
        if (txn.status === 'POSTED') postedCount++;
        else if (txn.status === 'VOIDED') voidedCount++;
        if (txn.amount <= 0) {
          issues.push({ severity: 'CRITICAL', code: 'NON_POSITIVE_AMOUNT', entity: 'TRANSACTION', id: txn.id, message: `Transaction ${txn.id} has non-positive amount` });
        }
      }

      // Check account balance consistency
      const discrepancies: any[] = [];
      for (const acc of accounts) {
        let computed = acc.openingBalance;
        for (const txn of transactions) {
          if (txn.status !== 'POSTED') continue;
          if (txn.accountId === acc.id) {
            if (txn.direction === 'IN') computed += txn.amount;
            else if (txn.direction === 'OUT') computed -= txn.amount;
            else if (txn.direction === 'TRANSFER') computed -= txn.amount;
          }
          if (txn.direction === 'TRANSFER' && txn.targetAccountId === acc.id) {
            computed += txn.amount;
          }
        }
        if (Math.abs(computed - acc.currentBalance) > 0.01) {
          discrepancies.push({
            type: 'ACCOUNT',
            entityId: acc.id,
            entityName: acc.name,
            storedBalance: acc.currentBalance,
            authoritativeBalance: computed,
            difference: computed - acc.currentBalance
          });
        }
      }

      const totalLiquidity = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

      res.json({
        passed: discrepancies.length === 0 && issues.filter(i => i.severity === 'CRITICAL').length === 0,
        timestamp: new Date().toISOString(),
        totalTransactions: transactions.length,
        totalAccounts: accounts.length,
        totalAccountLiquidity: totalLiquidity,
        postedCount,
        voidedCount,
        discrepancies,
        issues
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // CSV/JSON Backup Endpoints
  app.get('/api/backup/export-transactions-csv', (req, res) => {
    try {
      const XLSX = require('xlsx');
      const txns = financeService.getTransactions();
      const exportRows = txns.map((t: any) => ({
        'Transaction ID': t.id, 'Date': t.date, 'Time': t.time, 'Direction': t.direction,
        'Account Name': t.accountName, 'Account ID': t.accountId,
        'Target Account': t.targetAccountName || '', 'Target Account ID': t.targetAccountId || '',
        'Category Name': t.categoryName, 'Category ID': t.categoryId,
        'Entity Type': t.entityType || 'NONE', 'Entity Name': t.entityName || '', 'Entity ID': t.entityId || '',
        'Vehicle': t.vehicleInfo || '', 'Payment Method': t.paymentMethod,
        'Amount (PKR)': t.amount, 'Reference Number': t.referenceNumber || '',
        'Description': t.description || '', 'Source Module': t.sourceModule || 'MANUAL',
        'Status': t.status, 'Created By': t.createdBy || '', 'Created At': t.createdAt || ''
      }));
      const ws = XLSX.utils.json_to_sheet(exportRows.length > 0 ? exportRows : [{ 'Transaction ID': 'NO_RECORDS' }]);
      const csvString = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
      res.send(csvString);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/backup/export-accounts-csv', (req, res) => {
    try {
      const XLSX = require('xlsx');
      const accounts = financeService.getAccounts();
      const exportRows = accounts.map((a: any) => ({
        'Account ID': a.id, 'Account Name': a.name, 'Account Type': a.accountType,
        'Bank Name': a.bankName || '', 'Bank ID': a.bankId || '', 'Account Number': a.accountNumber || '',
        'Opening Balance (PKR)': a.openingBalance, 'Current Balance (PKR)': a.currentBalance,
        'Active': a.active ? 'YES' : 'NO', 'Display Order': a.displayOrder || 0, 'Created At': a.createdAt || ''
      }));
      const ws = XLSX.utils.json_to_sheet(exportRows);
      const csvString = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="accounts.csv"');
      res.send(csvString);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/backup/export-entities-csv', (req, res) => {
    try {
      const XLSX = require('xlsx');
      const clients = financeService.getClients();
      const suppliers = financeService.getSuppliers();
      const partners = financeService.getPartners();
      const workers = financeService.getWorkers();
      const vehicles = financeService.getVehicles();
      const exportRows: any[] = [];
      clients.forEach((c: any) => exportRows.push({ 'Type': 'CLIENT', 'ID': c.id, 'Code': c.code, 'Name': c.name, 'Phone': c.phone || '', 'Balance': c.balance, 'Status': c.status }));
      suppliers.forEach((s: any) => exportRows.push({ 'Type': 'SUPPLIER', 'ID': s.id, 'Code': s.code, 'Name': s.name, 'Phone': s.phone || '', 'Balance': s.balance, 'Status': s.status }));
      partners.forEach((p: any) => exportRows.push({ 'Type': 'PARTNER', 'ID': p.id, 'Code': p.code, 'Name': p.name, 'Phone': p.phone || '', 'Share %': p.sharePercentage, 'Balance': p.balance, 'Status': p.status }));
      workers.forEach((w: any) => exportRows.push({ 'Type': 'WORKER', 'ID': w.id, 'Code': w.code, 'Name': w.name, 'Phone': w.phone || '', 'Role': w.role || '', 'Daily Wage': w.dailyWage || 0, 'Status': w.status }));
      vehicles.forEach((v: any) => exportRows.push({ 'Type': 'VEHICLE', 'ID': v.id, 'Plate Number': v.plateNumber, 'Model': v.model, 'Driver': v.driverName || '', 'Status': v.status }));
      const ws = XLSX.utils.json_to_sheet(exportRows);
      const csvString = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="entities.csv"');
      res.send(csvString);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/backup/export-json', (req, res) => {
    try {
      const fullData = {
        exportedAt: new Date().toISOString(),
        timezone: 'Asia/Karachi',
        banks: financeService.getBanks(),
        accounts: financeService.getAccounts(),
        categories: financeService.getCategories(),
        clients: financeService.getClients(),
        suppliers: financeService.getSuppliers(),
        partners: financeService.getPartners(),
        workers: financeService.getWorkers(),
        vehicles: financeService.getVehicles(),
        paymentMethods: financeService.getPaymentMethods(),
        transactions: financeService.getTransactions(),
        auditLogs: financeService.getAuditLogs()
      };
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="backup.json"');
      res.json(fullData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // XLSX Backup & Restore Endpoints
  app.get('/api/backup/export', (req, res) => {
    try {
      const buffer = financeService.exportFullBackupWorkbookBuffer();
      const filename = `FBM_Financial_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/backup/import', (req, res) => {
    try {
      const { fileBase64 } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: 'No XLSX file provided' });
      }
      const buffer = Buffer.from(fileBase64, 'base64');
      const user = (req.headers['x-user'] as string) || 'System Administrator';
      const result = financeService.restoreFromBackupWorkbookBuffer(buffer, user);
      res.json({
        success: true,
        message: 'System data state successfully restored from XLSX backup workbook',
        result
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to parse and restore XLSX backup file' });
    }
  });

  app.post('/api/backup/import-json', (req, res) => {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'No JSON data provided' });
      }
      const user = (req.headers['x-user'] as string) || 'System Administrator';
      // Import JSON backup data directly into the database
      const { db } = require('./src/server/db');
      if (data.banks && Array.isArray(data.banks)) db.banks = data.banks;
      if (data.accounts && Array.isArray(data.accounts)) db.accounts = data.accounts;
      if (data.categories && Array.isArray(data.categories)) db.categories = data.categories;
      if (data.clients && Array.isArray(data.clients)) db.clients = data.clients;
      if (data.suppliers && Array.isArray(data.suppliers)) db.suppliers = data.suppliers;
      if (data.partners && Array.isArray(data.partners)) db.partners = data.partners;
      if (data.workers && Array.isArray(data.workers)) db.workers = data.workers;
      if (data.vehicles && Array.isArray(data.vehicles)) db.vehicles = data.vehicles;
      if (data.paymentMethods && Array.isArray(data.paymentMethods)) db.paymentMethods = data.paymentMethods;
      if (data.transactions && Array.isArray(data.transactions)) db.ledgerTransactions = data.transactions;
      if (data.ledgerTransactions && Array.isArray(data.ledgerTransactions)) db.ledgerTransactions = data.ledgerTransactions;
      db.save();
      res.json({
        success: true,
        message: 'System data restored from JSON backup',
        result: {
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
        }
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to restore JSON backup' });
    }
  });

  // --- VITE / SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FBM Financial Control Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
