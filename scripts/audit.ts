#!/usr/bin/env tsx
/**
 * FBM Financial Control — Database Integrity Audit Command
 * Checks database availability, schema, record counts, balance consistency,
 * orphan references, invalid dates, and accounting invariants.
 * 
 * Usage: npx tsx scripts/audit.ts
 * Exit code 0 = healthy, non-zero = corruption/inconsistency detected.
 */

import fs from 'fs';
import path from 'path';
import { FinanceDatabase } from '../src/server/db';
import { FinanceService } from '../src/server/financeService';

let passed = 0;
let failed = 0;
let warnings = 0;
const issues: string[] = [];

function pass(msg: string) {
  passed++;
  console.log(`  ✅ ${msg}`);
}

function fail(msg: string) {
  failed++;
  issues.push(msg);
  console.log(`  ❌ ${msg}`);
}

function warn(msg: string) {
  warnings++;
  console.log(`  ⚠️  ${msg}`);
}

console.log('\n🔍 FBM Financial Control — Database Integrity Audit');
console.log('='.repeat(60));

// ============================================
// 1. DATABASE AVAILABILITY
// ============================================
console.log('\n📦 1. Database Availability');
console.log('-'.repeat(40));

const dataPath = path.join(process.cwd(), 'data_store.json');
let dbExists = false;

try {
  dbExists = fs.existsSync(dataPath);
  if (dbExists) {
    const content = fs.readFileSync(dataPath, 'utf-8');
    JSON.parse(content); // Verify valid JSON
    pass('Database file exists and is valid JSON');
  } else {
    warn('No data_store.json found (will use defaults)');
  }
} catch (err: any) {
  fail(`Database file is corrupted: ${err.message}`);
}

// ============================================
// 2. SCHEMA & STRUCTURE
// ============================================
console.log('\n🏗️ 2. Schema & Structure');
console.log('-'.repeat(40));

const svc = new FinanceService();

const accounts = svc.getAccounts();
const transactions = svc.getTransactions();
const banks = svc.getBanks();
const categories = svc.getCategories();
const clients = svc.getClients();
const suppliers = svc.getSuppliers();
const partners = svc.getPartners();
const workers = svc.getWorkers();
const vehicles = svc.getVehicles();
const paymentMethods = svc.getPaymentMethods();
const auditLogs = svc.getAuditLogs();

pass(`Accounts: ${accounts.length}`);
pass(`Transactions: ${transactions.length}`);
pass(`Banks: ${banks.length}`);
pass(`Categories: ${categories.length}`);
pass(`Clients: ${clients.length}`);
pass(`Suppliers: ${suppliers.length}`);
pass(`Partners: ${partners.length}`);
pass(`Workers: ${workers.length}`);
pass(`Vehicles: ${vehicles.length}`);
pass(`Payment Methods: ${paymentMethods.length}`);
pass(`Audit Logs: ${auditLogs.length}`);

// ============================================
// 3. DUPLICATE IDS
// ============================================
console.log('\n🔑 3. Duplicate ID Check');
console.log('-'.repeat(40));

function checkDuplicates(items: any[], name: string) {
  const ids = items.map(i => i.id);
  const uniqueIds = new Set(ids);
  if (ids.length === uniqueIds.size) {
    pass(`${name}: No duplicate IDs`);
  } else {
    fail(`${name}: ${ids.length - uniqueIds.size} duplicate IDs detected`);
  }
}

checkDuplicates(accounts, 'Accounts');
checkDuplicates(transactions, 'Transactions');
checkDuplicates(banks, 'Banks');
checkDuplicates(categories, 'Categories');
checkDuplicates(clients, 'Clients');
checkDuplicates(suppliers, 'Suppliers');
checkDuplicates(partners, 'Partners');
checkDuplicates(workers, 'Workers');
checkDuplicates(vehicles, 'Vehicles');
checkDuplicates(paymentMethods, 'Payment Methods');

// ============================================
// 4. ORPHAN REFERENCES
// ============================================
console.log('\n🔗 4. Orphan Reference Check');
console.log('-'.repeat(40));

const accountIds = new Set(accounts.map(a => a.id));
const categoryIds = new Set(categories.map(c => c.id));
const clientIds = new Set(clients.map(c => c.id));
const supplierIds = new Set(suppliers.map(s => s.id));
const partnerIds = new Set(partners.map(p => p.id));
const workerIds = new Set(workers.map(w => w.id));
const vehicleIds = new Set(vehicles.map(v => v.id));

let orphanCount = 0;

for (const txn of transactions) {
  if (!accountIds.has(txn.accountId)) {
    fail(`Transaction ${txn.id} references non-existent account ${txn.accountId}`);
    orphanCount++;
  }
  if (txn.targetAccountId && !accountIds.has(txn.targetAccountId)) {
    fail(`Transaction ${txn.id} references non-existent target account ${txn.targetAccountId}`);
    orphanCount++;
  }
  if (!categoryIds.has(txn.categoryId)) {
    fail(`Transaction ${txn.id} references non-existent category ${txn.categoryId}`);
    orphanCount++;
  }
  if (txn.entityType === 'CLIENT' && txn.entityId && !clientIds.has(txn.entityId)) {
    fail(`Transaction ${txn.id} references non-existent client ${txn.entityId}`);
    orphanCount++;
  }
  if (txn.entityType === 'SUPPLIER' && txn.entityId && !supplierIds.has(txn.entityId)) {
    fail(`Transaction ${txn.id} references non-existent supplier ${txn.entityId}`);
    orphanCount++;
  }
}

if (orphanCount === 0) {
  pass('No orphan references detected');
}

// ============================================
// 5. INVALID DATES
// ============================================
console.log('\n📅 5. Invalid Date Check');
console.log('-'.repeat(40));

let invalidDateCount = 0;
for (const txn of transactions) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(txn.date)) {
    fail(`Transaction ${txn.id} has invalid date: ${txn.date}`);
    invalidDateCount++;
  }
}
if (invalidDateCount === 0) {
  pass('All transaction dates are valid YYYY-MM-DD');
}

// ============================================
// 6. INVALID AMOUNTS
// ============================================
console.log('\n💰 6. Invalid Amount Check');
console.log('-'.repeat(40));

let invalidAmountCount = 0;
for (const txn of transactions) {
  if (!isFinite(txn.amount) || txn.amount <= 0) {
    fail(`Transaction ${txn.id} has invalid amount: ${txn.amount}`);
    invalidAmountCount++;
  }
}
if (invalidAmountCount === 0) {
  pass('All transaction amounts are valid positive numbers');
}

// ============================================
// 7. INVALID STATUSES
// ============================================
console.log('\n📊 7. Invalid Status Check');
console.log('-'.repeat(40));

let invalidStatusCount = 0;
for (const txn of transactions) {
  if (!['POSTED', 'VOIDED', 'REVERSED'].includes(txn.status)) {
    fail(`Transaction ${txn.id} has invalid status: ${txn.status}`);
    invalidStatusCount++;
  }
}
if (invalidStatusCount === 0) {
  pass('All transaction statuses are valid');
}

// ============================================
// 8. ACCOUNT BALANCE CONSISTENCY
// ============================================
console.log('\n⚖️ 8. Account Balance Consistency');
console.log('-'.repeat(40));

let balanceMismatchCount = 0;
let totalLiquidity = 0;

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
  
  const diff = Math.abs(computed - acc.currentBalance);
  if (diff > 0.01) {
    fail(`Account "${acc.name}" balance drift: stored=${acc.currentBalance}, computed=${computed}, diff=${(computed - acc.currentBalance).toFixed(2)}`);
    balanceMismatchCount++;
  } else {
    pass(`Account "${acc.name}": Rs. ${acc.currentBalance.toLocaleString()} ✓`);
  }
  
  totalLiquidity += acc.currentBalance;
}

console.log(`\n  💎 Total System Liquidity: Rs. ${totalLiquidity.toLocaleString()}`);

// ============================================
// 9. TRANSFER VALIDITY
// ============================================
console.log('\n🔄 9. Transfer Validity Check');
console.log('-'.repeat(40));

let transferIssues = 0;
const transfers = transactions.filter(t => t.direction === 'TRANSFER');

for (const txn of transfers) {
  if (!txn.targetAccountId) {
    fail(`Transfer ${txn.id} has no target account`);
    transferIssues++;
  }
  if (txn.accountId === txn.targetAccountId) {
    fail(`Transfer ${txn.id} transfers to the same account`);
    transferIssues++;
  }
}

if (transferIssues === 0 && transfers.length > 0) {
  pass(`All ${transfers.length} transfers are valid`);
} else if (transfers.length === 0) {
  pass('No transfers to validate');
}

// ============================================
// 10. VOIDED TRANSACTION INVARIANTS
// ============================================
console.log('\n🚫 10. Voided Transaction Invariants');
console.log('-'.repeat(40));

const voidedTxns = transactions.filter(t => t.status === 'VOIDED');
let voidIssues = 0;

for (const txn of voidedTxns) {
  if (!txn.voidReason) {
    warn(`Voided transaction ${txn.id} has no void reason`);
  }
  if (!txn.voidedAt) {
    warn(`Voided transaction ${txn.id} has no voidedAt timestamp`);
  }
}

if (voidedTxns.length > 0) {
  pass(`${voidedTxns.length} voided transactions checked`);
} else {
  pass('No voided transactions to validate');
}

// ============================================
// RESULTS
// ============================================
console.log('\n' + '='.repeat(60));
console.log('\n📊 AUDIT RESULTS:');
console.log(`   ✅ Passed:   ${passed}`);
console.log(`   ❌ Failed:   ${failed}`);
console.log(`   ⚠️  Warnings: ${warnings}`);

if (issues.length > 0) {
  console.log('\n🔴 ISSUES FOUND:');
  issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
}

console.log('\n' + (failed === 0 ? '🎉 DATABASE INTEGRITY AUDIT PASSED!' : '💥 INTEGRITY ISSUES DETECTED — REPAIR REQUIRED'));
console.log('');

process.exit(failed > 0 ? 1 : 0);
