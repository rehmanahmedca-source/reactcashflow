import React, { useState, useEffect } from 'react';
import {
  Filter,
  RotateCcw,
  Printer,
  FileSpreadsheet,
  FileText,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  FinancialAccount,
  TransactionCategory,
  Client,
  Supplier,
  Partner,
  Worker,
  Vehicle,
  PaymentMethod,
  LedgerTransaction,
  TrackingFilter,
  FilterSummary
} from '../types';
import { SearchableCombobox, ComboboxItem } from './SearchableCombobox';
import { EditTransactionModal } from './EditTransactionModal';
import { api } from '../services/apiClient';

interface FinancialTrackingProps {
  accounts: FinancialAccount[];
  categories: TransactionCategory[];
  clients: Client[];
  suppliers: Supplier[];
  partners: Partner[];
  workers: Worker[];
  vehicles: Vehicle[];
  paymentMethods?: PaymentMethod[];
  transactionsProp?: LedgerTransaction[];
  onVoidTxn: (id: string, reason: string) => void;
  onRefreshData: () => void;
}

export const FinancialTracking: React.FC<FinancialTrackingProps> = ({
  accounts,
  categories,
  clients,
  suppliers,
  partners,
  workers,
  vehicles,
  paymentMethods = [],
  transactionsProp = [],
  onVoidTxn,
  onRefreshData
}) => {
  const defaultFilter: TrackingFilter = {
    datePreset: 'THIS_MONTH',
    fromDate: '',
    toDate: '',
    direction: 'ALL',
    categoryId: '',
    accountId: '',
    clientId: '',
    supplierId: '',
    partnerId: '',
    workerId: '',
    vehicleId: '',
    minAmount: '',
    maxAmount: '',
    searchQuery: '',
    sourceModule: '',
    status: '',
    paymentMethod: ''
  };

  const [filter, setFilter] = useState<TrackingFilter>(defaultFilter);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [summary, setSummary] = useState<FilterSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showSummaries, setShowSummaries] = useState(true);
  const [voidTxnId, setVoidTxnId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [editingTxn, setEditingTxn] = useState<LedgerTransaction | null>(null);
  const [deletingTxn, setDeletingTxn] = useState<LedgerTransaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Combobox item transformations
  const accountItems: ComboboxItem[] = accounts.map(a => ({ id: a.id, label: a.name, subtext: a.accountType }));
  const categoryItems: ComboboxItem[] = categories.map(c => ({ id: c.id, label: c.name, subtext: c.direction }));
  const clientItems: ComboboxItem[] = clients.map(c => ({ id: c.id, label: `${c.name} (${c.code})` }));
  const supplierItems: ComboboxItem[] = suppliers.map(s => ({ id: s.id, label: `${s.name} (${s.code})` }));
  const partnerItems: ComboboxItem[] = partners.map(p => ({ id: p.id, label: `${p.name} (${p.code})` }));
  const workerItems: ComboboxItem[] = workers.map(w => ({ id: w.id, label: `${w.name} (${w.code})` }));
  const vehicleItems: ComboboxItem[] = vehicles.map(v => ({ id: v.id, label: v.plateNumber, subtext: v.model }));

  const fetchFilteredData = async (activeFilters: TrackingFilter) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getFilteredTracking(activeFilters);
      setTransactions(data.transactions);
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load filtered transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredData(filter);
  }, [accounts, categories, clients, suppliers, partners, workers, vehicles, transactionsProp]);

  const handleApplyFilters = () => {
    fetchFilteredData(filter);
  };

  const handleResetFilters = () => {
    setFilter(defaultFilter);
    fetchFilteredData(defaultFilter);
  };

  // --- PDF REPORT GENERATOR ---
  const handleGeneratePDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // 1. Header & Title
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('FBM FINANCIAL CONTROL & TRACKING REPORT', 14, 15);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated Date/Time: ${new Date().toLocaleString()}`, 14, 21);

    // 2. Applied Filters Context Block
    let filterText = `Date Filter: ${filter.datePreset}`;
    if (filter.fromDate || filter.toDate) filterText += ` (${filter.fromDate || 'Start'} to ${filter.toDate || 'End'})`;
    if (filter.direction !== 'ALL') filterText += ` | Direction: ${filter.direction}`;
    if (filter.categoryId) {
      const cat = categories.find(c => c.id === filter.categoryId);
      if (cat) filterText += ` | Category: ${cat.name}`;
    }
    if (filter.accountId) {
      const acc = accounts.find(a => a.id === filter.accountId);
      if (acc) filterText += ` | Account: ${acc.name}`;
    }
    if (filter.clientId) {
      const cli = clients.find(c => c.id === filter.clientId);
      if (cli) filterText += ` | Client: ${cli.name}`;
    }
    if (filter.supplierId) {
      const sup = suppliers.find(s => s.id === filter.supplierId);
      if (sup) filterText += ` | Supplier: ${sup.name}`;
    }

    doc.setFontSize(8);
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(14, 25, 269, 10, 'F');
    doc.setTextColor(51, 65, 85);
    doc.text(`Active Filters: ${filterText}`, 17, 31);

    // 3. KPI Summary Totals Block
    if (summary) {
      doc.setFontSize(10);
      doc.text(
        `Total Transactions: ${summary.transactionCount}  |  Total IN: Rs. ${summary.totalIn.toLocaleString()}  |  Total OUT: Rs. ${summary.totalOut.toLocaleString()}  |  Net Movement: Rs. ${summary.netMovement.toLocaleString()}`,
        14,
        42
      );
    }

    // 4. Filtered Transactions Table
    const tableData = transactions.map(t => [
      t.id,
      `${t.date} ${t.time}`,
      t.direction,
      t.accountName,
      t.categoryName,
      t.entityName || 'N/A',
      `Rs. ${t.amount.toLocaleString()}`,
      t.referenceNumber || '-',
      t.description,
      t.status
    ]);

    autoTable(doc, {
      startY: 47,
      head: [['Txn ID', 'Date/Time', 'Type', 'Account', 'Category', 'Entity / Party', 'Amount', 'Ref #', 'Description', 'Status']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 22 },
        2: { cellWidth: 16 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 35 },
        6: { cellWidth: 25, halign: 'right' },
        7: { cellWidth: 20 },
        8: { cellWidth: 50 },
        9: { cellWidth: 18, halign: 'center' }
      }
    });

    const filename = `FBM_Financial_Tracking_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  // --- EXCEL EXPORT ---
  const handleExportExcel = () => {
    const exportRows = transactions.map(t => ({
      'Transaction ID': t.id,
      'Date': t.date,
      'Time': t.time,
      'Direction': t.direction,
      'Account': t.accountName,
      'Target Account': t.targetAccountName || '',
      'Category': t.categoryName,
      'Entity Type': t.entityType,
      'Entity Name': t.entityName || '',
      'Vehicle': t.vehicleInfo || '',
      'Amount (PKR)': t.amount,
      'Payment Method': t.paymentMethod,
      'Reference Number': t.referenceNumber || '',
      'Description': t.description,
      'Source Module': t.sourceModule,
      'Status': t.status,
      'Created By': t.createdBy
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Ledger');
    XLSX.writeFile(workbook, `FBM_Financial_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // --- CSV EXPORT ---
  const handleExportCSV = () => {
    const exportRows = transactions.map(t => ({
      'Transaction ID': t.id,
      'Date': t.date,
      'Time': t.time,
      'Direction': t.direction,
      'Account': t.accountName,
      'Category': t.categoryName,
      'Entity Name': t.entityName || '',
      'Amount': t.amount,
      'Reference': t.referenceNumber || '',
      'Description': t.description,
      'Status': t.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `FBM_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Void
  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidTxnId || !voidReason) return;

    try {
      await api.voidTransaction(voidTxnId, voidReason, 'Finance Supervisor');
      setVoidTxnId(null);
      setVoidReason('');
      onRefreshData();
      fetchFilteredData(filter);
    } catch (err: any) {
      alert(`Error voiding transaction: ${err.message || 'Failed'}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* FILTER CONTROL PANEL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
              Financial Tracking Filter Matrix
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Filter className="w-3.5 h-3.5" /> Apply Filters
            </button>
          </div>
        </div>

        {/* Filter Rows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Date Preset */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Date Range Preset</label>
            <select
              value={filter.datePreset}
              onChange={e => setFilter({ ...filter, datePreset: e.target.value as any })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>
          </div>

          {/* Custom Dates */}
          {filter.datePreset === 'CUSTOM' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={filter.fromDate || ''}
                  onChange={e => setFilter({ ...filter, fromDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={filter.toDate || ''}
                  onChange={e => setFilter({ ...filter, toDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </>
          )}

          {/* Direction */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Direction / Type</label>
            <select
              value={filter.direction}
              onChange={e => setFilter({ ...filter, direction: e.target.value as any })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
            >
              <option value="ALL">All Directions</option>
              <option value="IN">IN (Receipts)</option>
              <option value="OUT">OUT (Payments)</option>
              <option value="TRANSFER">TRANSFER (Internal)</option>
            </select>
          </div>

          {/* Category */}
          <SearchableCombobox
            label="Category"
            placeholder="All Categories"
            items={categoryItems}
            value={filter.categoryId}
            onChange={val => setFilter({ ...filter, categoryId: val })}
          />

          {/* Account */}
          <SearchableCombobox
            label="Account"
            placeholder="All Accounts"
            items={accountItems}
            value={filter.accountId}
            onChange={val => setFilter({ ...filter, accountId: val })}
          />

          {/* Client */}
          <SearchableCombobox
            label="Client"
            placeholder="All Clients"
            items={clientItems}
            value={filter.clientId}
            onChange={val => setFilter({ ...filter, clientId: val })}
          />

          {/* Supplier */}
          <SearchableCombobox
            label="Supplier"
            placeholder="All Suppliers"
            items={supplierItems}
            value={filter.supplierId}
            onChange={val => setFilter({ ...filter, supplierId: val })}
          />

          {/* Partner */}
          <SearchableCombobox
            label="Partner"
            placeholder="All Partners"
            items={partnerItems}
            value={filter.partnerId}
            onChange={val => setFilter({ ...filter, partnerId: val })}
          />

          {/* Worker */}
          <SearchableCombobox
            label="Worker / Labour"
            placeholder="All Workers"
            items={workerItems}
            value={filter.workerId}
            onChange={val => setFilter({ ...filter, workerId: val })}
          />

          {/* Vehicle */}
          <SearchableCombobox
            label="Vehicle"
            placeholder="All Vehicles"
            items={vehicleItems}
            value={filter.vehicleId}
            onChange={val => setFilter({ ...filter, vehicleId: val })}
          />

          {/* Payment Method */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
            <select
              value={filter.paymentMethod || ''}
              onChange={e => setFilter({ ...filter, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
            >
              <option value="">All Payment Methods</option>
              {paymentMethods.map(pm => (
                <option key={pm.id} value={pm.name}>{pm.name}</option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Text / Ref Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search reference, description..."
                value={filter.searchQuery || ''}
                onChange={e => setFilter({ ...filter, searchQuery: e.target.value })}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC KPI SUMMARY CARDS FOR FILTERED RESULT */}
      {summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500">Filtered Total IN</span>
              <p className="text-xl font-extrabold text-emerald-600 font-mono mt-1">
                + Rs. {summary.totalIn.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500">Filtered Total OUT</span>
              <p className="text-xl font-extrabold text-rose-600 font-mono mt-1">
                - Rs. {summary.totalOut.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500">Net Movement</span>
              <p className={`text-xl font-extrabold font-mono mt-1 ${summary.netMovement >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {summary.netMovement >= 0 ? '+' : ''} Rs. {summary.netMovement.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500">Matching Records</span>
              <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                {summary.transactionCount} Transactions
              </p>
            </div>
          </div>

          {/* Action Toolbar for Printing & Exporting */}
          <div className="bg-gradient-to-r from-indigo-50/90 via-white to-slate-50 border border-indigo-100 rounded-xl p-4 text-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Export Filtered Financial Report</h3>
                <p className="text-xs text-slate-500">Generate PDF report, Excel, or CSV based on exact active filters</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleGeneratePDF}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Download PDF Report
              </button>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export Excel (.xlsx)
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Category & Account Breakdown Summaries */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <button
              onClick={() => setShowSummaries(!showSummaries)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider"
            >
              <span>Filtered Category & Account Breakdown</span>
              {showSummaries ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSummaries && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                {/* Category Breakdown */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Category Summary</h4>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-2">Category</th>
                        <th className="py-1.5 px-2">Type</th>
                        <th className="py-1.5 px-2 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {summary.categoryBreakdown.map(c => (
                        <tr key={c.categoryName}>
                          <td className="py-1.5 px-2">{c.categoryName}</td>
                          <td className="py-1.5 px-2 text-[10px] font-bold uppercase">{c.direction}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold">Rs. {c.totalAmount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Account Breakdown */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Account Summary</h4>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-2">Account</th>
                        <th className="py-1.5 px-2 text-right">IN</th>
                        <th className="py-1.5 px-2 text-right">OUT</th>
                        <th className="py-1.5 px-2 text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {summary.accountBreakdown.map(a => (
                        <tr key={a.accountName}>
                          <td className="py-1.5 px-2">{a.accountName}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-emerald-700">Rs. {a.totalIn.toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-rose-700">Rs. {a.totalOut.toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold">Rs. {a.netChange.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FILTERED TRANSACTIONS MAIN DATA TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
            Filtered Financial Movements ({transactions.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Txn #</th>
                <th className="py-3 px-3">Date / Time</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Account</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Party / Entity</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">Ref #</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-center">Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {transactions.map(t => {
                const isVoided = t.status === 'VOIDED';

                return (
                  <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${isVoided ? 'bg-slate-50/70 opacity-60' : ''}`}>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{t.id}</td>
                    <td className="py-3 px-3 font-mono">
                      <div>{t.date}</div>
                      <div className="text-[10px] text-slate-500">{t.time}</div>
                    </td>
                    <td className="py-3 px-3">
                      {t.direction === 'IN' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          IN
                        </span>
                      )}
                      {t.direction === 'OUT' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          OUT
                        </span>
                      )}
                      {t.direction === 'TRANSFER' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          TRANSFER
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{t.accountName}</div>
                      {t.targetAccountName && <div className="text-[10px] text-indigo-600">→ {t.targetAccountName}</div>}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{t.categoryName}</td>
                    <td className="py-3 px-3 text-slate-700">{t.entityName || '-'}</td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-sm">
                      <span className={t.direction === 'IN' ? 'text-emerald-700' : t.direction === 'OUT' ? 'text-rose-700' : 'text-slate-900'}>
                        {t.direction === 'IN' ? '+' : t.direction === 'OUT' ? '-' : ''} Rs. {t.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{t.referenceNumber || '-'}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{t.description}</td>
                    <td className="py-3 px-3 text-center">
                      {isVoided ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 text-slate-600">
                          VOIDED
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingTxn(t)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Transaction"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setVoidTxnId(t.id)}
                            className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Void Transaction"
                          >
                            Void
                          </button>
                          <button
                            onClick={() => setDeletingTxn(t)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT TRANSACTION MODAL */}
      {editingTxn && (
        <EditTransactionModal
          transaction={editingTxn}
          isOpen={true}
          onClose={() => setEditingTxn(null)}
          onSuccess={() => {
            onRefreshData();
            fetchFilteredData(filter);
          }}
          accounts={accounts}
          categories={categories}
          clients={clients}
          suppliers={suppliers}
          partners={partners}
          workers={workers}
          vehicles={vehicles}
          paymentMethods={paymentMethods}
        />
      )}

      {/* DELETE TRANSACTION CONFIRMATION MODAL */}
      {deletingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-rose-600 text-white font-bold text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Transaction #{deletingTxn.id}
            </div>
            <div className="p-5 space-y-4 text-xs">
              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {deleteError}
                </div>
              )}
              <p className="text-slate-700 font-medium">
                Are you sure you want to permanently delete transaction <strong className="text-slate-900">#{deletingTxn.id}</strong> ({deletingTxn.categoryName} - Rs. {deletingTxn.amount.toLocaleString()})?
              </p>
              <p className="text-slate-500 text-[11px]">
                Deleting will reverse associated account balances and log a permanent audit entry.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingTxn(null);
                    setDeleteError('');
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={async () => {
                    setDeleteLoading(true);
                    setDeleteError('');
                    try {
                      await api.deleteTransaction(deletingTxn.id, 'Finance Supervisor');
                      setDeletingTxn(null);
                      onRefreshData();
                      fetchFilteredData(filter);
                    } catch (err: any) {
                      setDeleteError(err.message || 'Failed to delete transaction');
                    } finally {
                      setDeleteLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VOID TRANSACTION REASON MODAL */}
      {voidTxnId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-rose-600 text-white font-bold text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Void Transaction #{voidTxnId}
            </div>
            <form onSubmit={handleVoidSubmit} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Voiding will automatically reverse all financial balances for this transaction and create an auditable reversal log.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Voiding *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why this transaction is being voided..."
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidTxnId(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm Void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
