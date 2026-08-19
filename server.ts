import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { financeService } from './src/server/financeService';

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
      const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
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
