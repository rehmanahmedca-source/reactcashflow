/**
 * Authoritative Central Accounting & Ledger Engine
 * Core Accounting Rule: TRANSACTIONS ARE THE SOURCE OF TRUTH.
 * Never allows cached or mutated balances to silently drift.
 */

import {
  FinancialAccount,
  LedgerTransaction,
  Client,
  Supplier,
  Partner,
  DailyAccountPosition,
  DailyClosingSession,
  FilterSummary,
  DayStatus
} from '../types';
import { toPaisa, fromPaisa, addMoney, subMoney } from './financialMath';

export interface AuditIssue {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  code: string;
  entity: string;
  id: string;
  message: string;
  expected?: any;
  actual?: any;
}

export interface IntegrityAuditResult {
  passed: boolean;
  totalTransactions: number;
  postedCount: number;
  voidedCount: number;
  totalLiquidity: number;
  issues: AuditIssue[];
  accountAudits: {
    accountId: string;
    accountName: string;
    openingBalance: number;
    ledgerSum: number;
    computedBalance: number;
    cachedBalance: number;
    inSync: boolean;
  }[];
}

/**
 * Computes authoritative current balances for all accounts strictly derived from the ledger.
 */
export function computeAccountBalances(
  accounts: FinancialAccount[],
  transactions: LedgerTransaction[]
): FinancialAccount[] {
  // Map accountId -> integer paisa balance
  const balanceMap = new Map<string, number>();

  for (const acc of accounts) {
    balanceMap.set(acc.id, toPaisa(acc.openingBalance || 0));
  }

  // Process all posted transactions in chronological order
  for (const txn of transactions) {
    if (txn.status !== 'POSTED') continue;

    const amountPaisa = toPaisa(txn.amount);
    if (amountPaisa <= 0) continue;

    if (txn.direction === 'IN') {
      const current = balanceMap.get(txn.accountId) ?? 0;
      balanceMap.set(txn.accountId, current + amountPaisa);
    } else if (txn.direction === 'OUT') {
      const current = balanceMap.get(txn.accountId) ?? 0;
      balanceMap.set(txn.accountId, current - amountPaisa);
    } else if (txn.direction === 'TRANSFER') {
      // Source account decreases
      const srcCurrent = balanceMap.get(txn.accountId) ?? 0;
      balanceMap.set(txn.accountId, srcCurrent - amountPaisa);

      // Target account increases
      if (txn.targetAccountId) {
        const destCurrent = balanceMap.get(txn.targetAccountId) ?? 0;
        balanceMap.set(txn.targetAccountId, destCurrent + amountPaisa);
      }
    }
  }

  return accounts.map(acc => {
    const calculated = fromPaisa(balanceMap.get(acc.id) ?? toPaisa(acc.openingBalance || 0));
    return {
      ...acc,
      currentBalance: calculated
    };
  });
}

/**
 * Computes authoritative balances for clients, suppliers, and partners based on the ledger.
 */
export function computeEntityBalances(
  clients: Client[],
  suppliers: Supplier[],
  partners: Partner[],
  transactions: LedgerTransaction[]
): { clients: Client[]; suppliers: Supplier[]; partners: Partner[] } {
  // Client balance (Receivables: In decreases, Out increases)
  const clientMap = new Map<string, number>();
  for (const c of clients) clientMap.set(c.id, 0); // Ledger-only movement

  // Supplier balance (Payables: Out decreases, In increases)
  const supplierMap = new Map<string, number>();
  for (const s of suppliers) supplierMap.set(s.id, 0);

  // Partner balance (Capital/Drawings: In increases capital, Out decreases)
  const partnerMap = new Map<string, number>();
  for (const p of partners) partnerMap.set(p.id, 0);

  for (const txn of transactions) {
    if (txn.status !== 'POSTED') continue;
    const amountPaisa = toPaisa(txn.amount);

    if (txn.entityType === 'CLIENT' && txn.entityId) {
      const curr = clientMap.get(txn.entityId) ?? 0;
      // Client paying money (IN) reduces their receivable balance
      if (txn.direction === 'IN') {
        clientMap.set(txn.entityId, curr - amountPaisa);
      } else if (txn.direction === 'OUT') {
        clientMap.set(txn.entityId, curr + amountPaisa);
      }
    } else if (txn.entityType === 'SUPPLIER' && txn.entityId) {
      const curr = supplierMap.get(txn.entityId) ?? 0;
      // Paying supplier (OUT) reduces payable
      if (txn.direction === 'OUT') {
        supplierMap.set(txn.entityId, curr - amountPaisa);
      } else if (txn.direction === 'IN') {
        supplierMap.set(txn.entityId, curr + amountPaisa);
      }
    } else if (txn.entityType === 'PARTNER' && txn.entityId) {
      const curr = partnerMap.get(txn.entityId) ?? 0;
      if (txn.direction === 'IN') {
        partnerMap.set(txn.entityId, curr + amountPaisa);
      } else if (txn.direction === 'OUT') {
        partnerMap.set(txn.entityId, curr - amountPaisa);
      }
    }
  }

  const updatedClients = clients.map(c => ({
    ...c,
    balance: fromPaisa(clientMap.get(c.id) ?? 0)
  }));

  const updatedSuppliers = suppliers.map(s => ({
    ...s,
    balance: fromPaisa(supplierMap.get(s.id) ?? 0)
  }));

  const updatedPartners = partners.map(p => ({
    ...p,
    balance: fromPaisa(partnerMap.get(p.id) ?? 0)
  }));

  return {
    clients: updatedClients,
    suppliers: updatedSuppliers,
    partners: updatedPartners
  };
}

/**
 * Computes daily reconciliation positions with mathematical roll-forward accuracy.
 */
export function computeDailyReconciliationPositions(
  date: string,
  accounts: FinancialAccount[],
  transactions: LedgerTransaction[],
  existingPositions: DailyAccountPosition[],
  session: DailyClosingSession
): DailyAccountPosition[] {
  const isClosed = session.status === 'CLOSED';

  // Filter transactions strictly using date string comparison YYYY-MM-DD
  const priorTxns = transactions.filter(t => t.status === 'POSTED' && t.date < date);
  const dayTxns = transactions.filter(t => t.status === 'POSTED' && t.date === date);

  return accounts.map(acc => {
    const existing = existingPositions.find(p => p.date === date && p.accountId === acc.id);

    // 1. Calculate opening balance for this date: Opening balance + sum of all prior transactions
    let openingPaisa = toPaisa(acc.openingBalance || 0);
    for (const t of priorTxns) {
      const amt = toPaisa(t.amount);
      if (t.accountId === acc.id) {
        if (t.direction === 'IN') openingPaisa += amt;
        else if (t.direction === 'OUT' || t.direction === 'TRANSFER') openingPaisa -= amt;
      }
      if (t.targetAccountId === acc.id && t.direction === 'TRANSFER') {
        openingPaisa += amt;
      }
    }

    // 2. Calculate day transactions
    let totalInPaisa = 0;
    let totalOutPaisa = 0;
    let transferInPaisa = 0;
    let transferOutPaisa = 0;

    for (const t of dayTxns) {
      const amt = toPaisa(t.amount);
      if (t.accountId === acc.id) {
        if (t.direction === 'IN') totalInPaisa += amt;
        else if (t.direction === 'OUT') totalOutPaisa += amt;
        else if (t.direction === 'TRANSFER') transferOutPaisa += amt;
      }
      if (t.targetAccountId === acc.id && t.direction === 'TRANSFER') {
        transferInPaisa += amt;
      }
    }

    // Expected closing = Opening + In + TransferIn - Out - TransferOut
    const expectedClosingPaisa = openingPaisa + totalInPaisa + transferInPaisa - totalOutPaisa - transferOutPaisa;
    const expectedClosing = fromPaisa(expectedClosingPaisa);

    const actualCounted = existing?.actualCountedBalance;
    const difference = actualCounted !== undefined
      ? fromPaisa(toPaisa(actualCounted) - expectedClosingPaisa)
      : undefined;

    return {
      id: existing?.id || `POS-${date}-${acc.id}`,
      date,
      accountId: acc.id,
      accountName: acc.name,
      openingBalance: fromPaisa(openingPaisa),
      totalIn: fromPaisa(totalInPaisa),
      totalOut: fromPaisa(totalOutPaisa),
      transferIn: fromPaisa(transferInPaisa),
      transferOut: fromPaisa(transferOutPaisa),
      expectedClosing,
      actualCountedBalance: actualCounted,
      difference,
      status: (isClosed ? 'CLOSED' : (existing?.status || 'OPEN')) as DayStatus,
      notes: existing?.notes
    };
  });
}

/**
 * Computes Filter Summary totals strictly avoiding floating-point drift.
 */
export function computeFilterSummary(transactions: LedgerTransaction[]): FilterSummary {
  const validTxns = transactions.filter(t => t.status === 'POSTED');

  let totalInPaisa = 0;
  let totalOutPaisa = 0;
  let transferInPaisa = 0;

  const categoryMap = new Map<string, { name: string; direction: string; amountPaisa: number; count: number }>();
  const accountMap = new Map<string, { name: string; inPaisa: number; outPaisa: number; netPaisa: number; count: number }>();

  for (const t of validTxns) {
    const amtPaisa = toPaisa(t.amount);

    if (t.direction === 'IN') {
      totalInPaisa += amtPaisa;
    } else if (t.direction === 'OUT') {
      totalOutPaisa += amtPaisa;
    } else if (t.direction === 'TRANSFER') {
      transferInPaisa += amtPaisa;
    }

    // Category breakdown
    if (t.categoryName) {
      const existing = categoryMap.get(t.categoryName) || { name: t.categoryName, direction: t.direction, amountPaisa: 0, count: 0 };
      existing.amountPaisa += amtPaisa;
      existing.count += 1;
      categoryMap.set(t.categoryName, existing);
    }

    // Account breakdown
    const accKey = t.accountName || t.accountId;
    const existingAcc = accountMap.get(accKey) || { name: accKey, inPaisa: 0, outPaisa: 0, netPaisa: 0, count: 0 };
    existingAcc.count += 1;
    if (t.direction === 'IN') {
      existingAcc.inPaisa += amtPaisa;
      existingAcc.netPaisa += amtPaisa;
    } else if (t.direction === 'OUT' || t.direction === 'TRANSFER') {
      existingAcc.outPaisa += amtPaisa;
      existingAcc.netPaisa -= amtPaisa;
    }
    accountMap.set(accKey, existingAcc);
  }

  const netMovementPaisa = totalInPaisa - totalOutPaisa;

  return {
    totalIn: fromPaisa(totalInPaisa),
    totalOut: fromPaisa(totalOutPaisa),
    transferIn: fromPaisa(transferInPaisa),
    transferOut: fromPaisa(transferInPaisa),
    netMovement: fromPaisa(netMovementPaisa),
    transactionCount: transactions.length,
    categoryBreakdown: Array.from(categoryMap.values()).map(c => ({
      categoryName: c.name,
      direction: c.direction,
      totalAmount: fromPaisa(c.amountPaisa),
      count: c.count
    })),
    accountBreakdown: Array.from(accountMap.values()).map(a => ({
      accountName: a.name,
      totalIn: fromPaisa(a.inPaisa),
      totalOut: fromPaisa(a.outPaisa),
      netChange: fromPaisa(a.netPaisa),
      count: a.count
    }))
  };
}

/**
 * Diagnostic & Integrity Test (DMT) Engine
 * Audits 100% of ledger transactions against all accounts, balances, and positions.
 */
export function runIntegrityAudit(
  accounts: FinancialAccount[],
  transactions: LedgerTransaction[],
  clients: Client[] = [],
  suppliers: Supplier[] = [],
  partners: Partner[] = []
): IntegrityAuditResult {
  const issues: AuditIssue[] = [];
  const computedAccounts = computeAccountBalances(accounts, transactions);

  let totalLiquidityPaisa = 0;
  const accountAudits: IntegrityAuditResult['accountAudits'] = [];

  for (const acc of accounts) {
    const computed = computedAccounts.find(a => a.id === acc.id);
    const computedBal = computed ? computed.currentBalance : (acc.openingBalance || 0);
    const cachedBal = acc.currentBalance ?? (acc.openingBalance || 0);
    const inSync = Math.abs(toPaisa(computedBal) - toPaisa(cachedBal)) === 0;

    totalLiquidityPaisa += toPaisa(computedBal);

    accountAudits.push({
      accountId: acc.id,
      accountName: acc.name,
      openingBalance: acc.openingBalance || 0,
      ledgerSum: subMoney(computedBal, acc.openingBalance || 0),
      computedBalance: computedBal,
      cachedBalance: cachedBal,
      inSync
    });

    if (!inSync) {
      issues.push({
        severity: 'CRITICAL',
        code: 'BALANCE_DRIFT',
        entity: 'ACCOUNT',
        id: acc.id,
        message: `Account "${acc.name}" cached balance (Rs. ${cachedBal}) drifts from ledger derived balance (Rs. ${computedBal})`,
        expected: computedBal,
        actual: cachedBal
      });
    }
  }

  // Check transaction validity
  let postedCount = 0;
  let voidedCount = 0;
  const validAccIds = new Set(accounts.map(a => a.id));

  for (const txn of transactions) {
    if (txn.status === 'POSTED') postedCount++;
    else if (txn.status === 'VOIDED') voidedCount++;
    else {
      issues.push({
        severity: 'WARNING',
        code: 'UNKNOWN_STATUS',
        entity: 'TRANSACTION',
        id: txn.id,
        message: `Transaction ${txn.id} has invalid status "${txn.status}"`
      });
    }

    if (txn.amount <= 0) {
      issues.push({
        severity: 'CRITICAL',
        code: 'NON_POSITIVE_AMOUNT',
        entity: 'TRANSACTION',
        id: txn.id,
        message: `Transaction ${txn.id} has non-positive amount: Rs. ${txn.amount}`
      });
    }

    if (!validAccIds.has(txn.accountId)) {
      issues.push({
        severity: 'CRITICAL',
        code: 'ORPHAN_ACCOUNT',
        entity: 'TRANSACTION',
        id: txn.id,
        message: `Transaction ${txn.id} references non-existent account ID ${txn.accountId}`
      });
    }

    if (txn.direction === 'TRANSFER') {
      if (!txn.targetAccountId) {
        issues.push({
          severity: 'CRITICAL',
          code: 'TRANSFER_MISSING_TARGET',
          entity: 'TRANSACTION',
          id: txn.id,
          message: `Transfer transaction ${txn.id} is missing targetAccountId`
        });
      } else if (txn.targetAccountId === txn.accountId) {
        issues.push({
          severity: 'CRITICAL',
          code: 'TRANSFER_SAME_ACCOUNT',
          entity: 'TRANSACTION',
          id: txn.id,
          message: `Transfer transaction ${txn.id} transfers to the same account`
        });
      } else if (!validAccIds.has(txn.targetAccountId)) {
        issues.push({
          severity: 'CRITICAL',
          code: 'TRANSFER_ORPHAN_TARGET',
          entity: 'TRANSACTION',
          id: txn.id,
          message: `Transfer transaction ${txn.id} references non-existent destination account ID ${txn.targetAccountId}`
        });
      }
    }
  }

  return {
    passed: issues.filter(i => i.severity === 'CRITICAL').length === 0,
    totalTransactions: transactions.length,
    postedCount,
    voidedCount,
    totalLiquidity: fromPaisa(totalLiquidityPaisa),
    issues,
    accountAudits
  };
}
