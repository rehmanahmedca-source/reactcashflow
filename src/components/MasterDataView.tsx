import React, { useState } from 'react';
import {
  Building2,
  Building,
  Tag,
  Users,
  Truck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Database,
  Pencil,
  Trash2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  RotateCcw,
  Check
} from 'lucide-react';
import {
  FinancialAccount,
  Bank,
  TransactionCategory,
  Client,
  Supplier,
  Partner,
  Worker,
  Vehicle,
  PaymentMethod
} from '../types';
import { QuickAddModal, QuickAddType } from './QuickAddModal';
import { api } from '../services/apiClient';

interface MasterDataViewProps {
  accounts: FinancialAccount[];
  banks: Bank[];
  categories: TransactionCategory[];
  clients: Client[];
  suppliers: Supplier[];
  partners: Partner[];
  workers: Worker[];
  vehicles: Vehicle[];
  paymentMethods?: PaymentMethod[];
  onRefreshData: () => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  accounts,
  banks,
  categories,
  clients,
  suppliers,
  partners,
  workers,
  vehicles,
  paymentMethods = [],
  onRefreshData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ACCOUNTS' | 'BANKS' | 'CATEGORIES' | 'CLIENTS' | 'SUPPLIERS' | 'PARTNERS' | 'WORKERS' | 'VEHICLES' | 'PAYMENT_METHODS'>('ACCOUNTS');
  const [search, setSearch] = useState('');
  const [quickAddType, setQuickAddType] = useState<QuickAddType | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: QuickAddType; item: any } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: QuickAddType; id: string; name: string; endpoint: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // DATA WIPEOUT & CLEARANCE STATE
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wipeMode, setWipeMode] = useState<'TRANSACTIONS_ONLY_ZERO_BALANCES' | 'TRANSACTIONS_ONLY' | 'FULL_SYSTEM_RESET' | 'PURGE_ALL_DATA_BLANK'>('TRANSACTIONS_ONLY_ZERO_BALANCES');
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [wipeLoading, setWipeLoading] = useState(false);
  const [wipeError, setWipeError] = useState('');
  const [wipeSuccess, setWipeSuccess] = useState('');

  const getRequiredConfirmText = (mode: string) => {
    if (mode === 'TRANSACTIONS_ONLY_ZERO_BALANCES') return 'CLEAR';
    if (mode === 'TRANSACTIONS_ONLY') return 'RESET LEDGER';
    if (mode === 'PURGE_ALL_DATA_BLANK') return 'PURGE';
    return 'WIPE OUT';
  };

  const subTabs = [
    { id: 'ACCOUNTS', label: 'Accounts', count: accounts.length, addType: 'ACCOUNT' as QuickAddType, endpoint: '/api/accounts' },
    { id: 'BANKS', label: 'Banks', count: banks.length, addType: 'BANK' as QuickAddType, endpoint: '/api/banks' },
    { id: 'CATEGORIES', label: 'Categories', count: categories.length, addType: 'CATEGORY' as QuickAddType, endpoint: '/api/categories' },
    { id: 'CLIENTS', label: 'Clients', count: clients.length, addType: 'CLIENT' as QuickAddType, endpoint: '/api/clients' },
    { id: 'SUPPLIERS', label: 'Suppliers', count: suppliers.length, addType: 'SUPPLIER' as QuickAddType, endpoint: '/api/suppliers' },
    { id: 'PARTNERS', label: 'Partners', count: partners.length, addType: 'PARTNER' as QuickAddType, endpoint: '/api/partners' },
    { id: 'WORKERS', label: 'Workers', count: workers.length, addType: 'WORKER' as QuickAddType, endpoint: '/api/workers' },
    { id: 'VEHICLES', label: 'Vehicles', count: vehicles.length, addType: 'VEHICLE' as QuickAddType, endpoint: '/api/vehicles' },
    { id: 'PAYMENT_METHODS', label: 'Payment Instruments', count: paymentMethods.length, addType: 'PAYMENT_METHOD' as QuickAddType, endpoint: '/api/payment-methods' }
  ];

  const currentTabInfo = subTabs.find(s => s.id === activeSubTab)!;

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const user = 'Finance Supervisor';
      if (deletingItem.type === 'ACCOUNT') await api.deleteAccount(deletingItem.id, user);
      else if (deletingItem.type === 'BANK') await api.deleteBank(deletingItem.id, user);
      else if (deletingItem.type === 'CATEGORY') await api.deleteCategory(deletingItem.id, user);
      else if (deletingItem.type === 'CLIENT') await api.deleteClient(deletingItem.id, user);
      else if (deletingItem.type === 'SUPPLIER') await api.deleteSupplier(deletingItem.id, user);
      else if (deletingItem.type === 'PARTNER') await api.deletePartner(deletingItem.id, user);
      else if (deletingItem.type === 'WORKER') await api.deleteWorker(deletingItem.id, user);
      else if (deletingItem.type === 'VEHICLE') await api.deleteVehicle(deletingItem.id, user);
      else if (deletingItem.type === 'PAYMENT_METHOD') await api.deletePaymentMethod(deletingItem.id, user);

      setDeletingItem(null);
      onRefreshData();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete entity');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleWipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWipeError('');
    setWipeSuccess('');

    const requiredText = getRequiredConfirmText(wipeMode);
    if (wipeConfirmText.trim().toUpperCase() !== requiredText) {
      setWipeError(`Please type "${requiredText}" to confirm data clearance.`);
      return;
    }

    setWipeLoading(true);
    try {
      const res = await api.wipeData(wipeMode, 'System Administrator');
      setWipeSuccess(res.message || 'Data clearance completed successfully.');
      onRefreshData();
      setTimeout(() => {
        setShowWipeModal(false);
        setWipeSuccess('');
        setWipeConfirmText('');
      }, 1500);
    } catch (err: any) {
      setWipeError(err.message || 'Failed to wipe data');
    } finally {
      setWipeLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-white to-slate-50 text-slate-900 rounded-xl p-6 border border-indigo-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Master Data Management System</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configuration-driven financial entities. Fully customizable master categories, clients, suppliers, accounts, and partners.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setWipeError('');
              setWipeSuccess('');
              setWipeConfirmText('');
              setShowWipeModal(true);
            }}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Perform Data Clearance or Factory Reset"
          >
            <Flame className="w-4 h-4 text-rose-600" /> Data Clearance / Wipe
          </button>

          <button
            onClick={() => setQuickAddType(currentTabInfo.addType)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New {activeSubTab.slice(0, -1)}
          </button>
        </div>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id as any);
              setSearch('');
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono ${
              activeSubTab === tab.id ? 'bg-indigo-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeSubTab.toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* ACCOUNTS TABLE */}
        {activeSubTab === 'ACCOUNTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Account Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Bank Name</th>
                  <th className="py-2.5 px-3">Account #</th>
                  <th className="py-2.5 px-3 text-right">Opening Balance</th>
                  <th className="py-2.5 px-3 text-right">Current Balance</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {accounts
                  .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
                  .map(a => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">{a.name}</td>
                      <td className="py-3 px-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md text-[10px]">{a.accountType}</span></td>
                      <td className="py-3 px-3 text-slate-600">{a.bankName || '-'}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{a.accountNumber || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">Rs. {a.openingBalance.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">Rs. {a.currentBalance.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingItem({ type: 'ACCOUNT', item: a })}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Account"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: 'ACCOUNT', id: a.id, name: a.name, endpoint: '/api/accounts' })}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BANKS TABLE */}
        {activeSubTab === 'BANKS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Bank Code</th>
                  <th className="py-2.5 px-3">Bank Name</th>
                  <th className="py-2.5 px-3">Branch</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {banks
                  .filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.code.toLowerCase().includes(search.toLowerCase()))
                  .map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600">{b.code}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{b.name}</td>
                      <td className="py-3 px-3 text-slate-600">{b.branch || '-'}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingItem({ type: 'BANK', item: b })}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Bank"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: 'BANK', id: b.id, name: `${b.name} (${b.code})`, endpoint: '/api/banks' })}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Bank"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CATEGORIES TABLE */}
        {activeSubTab === 'CATEGORIES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Category Name</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Rules / Requirements</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {categories
                  .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
                  .map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                          c.direction === 'IN' ? 'bg-emerald-100 text-emerald-800' : c.direction === 'OUT' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {c.direction}
                        </span>
                      </td>
                      <td className="py-3 px-3 space-x-1">
                        {c.requiresClient && <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-semibold rounded">Client</span>}
                        {c.requiresSupplier && <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-semibold rounded">Supplier</span>}
                        {c.requiresPartner && <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-semibold rounded">Partner</span>}
                        {c.requiresWorker && <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-semibold rounded">Worker</span>}
                        {c.requiresVehicle && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">Vehicle *</span>}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{c.description}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingItem({ type: 'CATEGORY', item: c })}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: 'CATEGORY', id: c.id, name: c.name, endpoint: '/api/categories' })}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CLIENTS TABLE */}
        {activeSubTab === 'CLIENTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Client Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Address</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Balance</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {clients
                  .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
                  .map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600">{c.code}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3 px-3 text-slate-600">{c.phone || '-'}</td>
                      <td className="py-3 px-3 text-slate-600">{c.address || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">Rs. {c.balance.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingItem({ type: 'CLIENT', item: c })}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Client"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: 'CLIENT', id: c.id, name: `${c.name} (${c.code})`, endpoint: '/api/clients' })}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Client"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUPPLIERS TABLE */}
        {activeSubTab === 'SUPPLIERS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Supplier Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Address</th>
                  <th className="py-2.5 px-3 text-right">Payable Balance</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {suppliers
                  .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()))
                  .map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600">{s.code}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{s.name}</td>
                      <td className="py-3 px-3 text-slate-600">{s.phone || '-'}</td>
                      <td className="py-3 px-3 text-slate-600">{s.address || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-rose-700">Rs. {s.balance.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingItem({ type: 'SUPPLIER', item: s })}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Supplier"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: 'SUPPLIER', id: s.id, name: `${s.name} (${s.code})`, endpoint: '/api/suppliers' })}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PARTNERS TABLE */}
        {activeSubTab === 'PARTNERS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Partner Name</th>
                  <th className="py-2.5 px-3 text-center">Share %</th>
                  <th className="py-2.5 px-3 text-right">Equity Balance</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {partners
                  .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
                  .map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600">{p.code}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3 px-3 text-center font-bold text-indigo-700">{p.sharePercentage}%</td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">Rs. {p.balance.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingItem({ type: 'PARTNER', item: p })}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Partner"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: 'PARTNER', id: p.id, name: `${p.name} (${p.code})`, endpoint: '/api/partners' })}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Partner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* WORKERS TABLE */}
        {activeSubTab === 'WORKERS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Worker Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3 text-right">Daily Wage (Rs.)</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {workers
                  .filter(w => w.name.toLowerCase().includes(search.toLowerCase()))
                  .map(w => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600">{w.code}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{w.name}</td>
                      <td className="py-3 px-3 text-slate-700">{w.role}</td>
                      <td className="py-3 px-3 text-slate-600">{w.phone || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">Rs. {(w.dailyWage || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingItem({ type: 'WORKER', item: w })}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Worker"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: 'WORKER', id: w.id, name: `${w.name} (${w.code})`, endpoint: '/api/workers' })}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Worker"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VEHICLES TABLE */}
        {activeSubTab === 'VEHICLES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Plate #</th>
                  <th className="py-2.5 px-3">Vehicle Model / Type</th>
                  <th className="py-2.5 px-3">Assigned Driver</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vehicles
                  .filter(v => v.plateNumber.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase()))
                  .map(v => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-700">{v.plateNumber}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{v.model}</td>
                      <td className="py-3 px-3 text-slate-700">{v.driverName || '-'}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingItem({ type: 'VEHICLE', item: v })}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Vehicle"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: 'VEHICLE', id: v.id, name: v.plateNumber, endpoint: '/api/vehicles' })}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Vehicle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAYMENT METHODS TABLE */}
        {activeSubTab === 'PAYMENT_METHODS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Instrument Code</th>
                  <th className="py-2.5 px-3">Payment Instrument Title</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paymentMethods
                  .filter(pm => pm.name.toLowerCase().includes(search.toLowerCase()) || pm.code.toLowerCase().includes(search.toLowerCase()))
                  .map(pm => (
                    <tr key={pm.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-700">{pm.code}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{pm.name}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 font-bold rounded-md text-[10px] ${
                          pm.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {pm.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingItem({ type: 'PAYMENT_METHOD', item: pm })}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Payment Instrument"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ type: 'PAYMENT_METHOD', id: pm.id, name: `${pm.name} (${pm.code})`, endpoint: '/api/payment-methods' })}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Payment Instrument"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Add Modal (Add Mode) */}
      {quickAddType && (
        <QuickAddModal
          type={quickAddType}
          isOpen={true}
          onClose={() => setQuickAddType(null)}
          banks={banks}
          onSuccess={() => {
            onRefreshData();
          }}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <QuickAddModal
          type={editingItem.type}
          isOpen={true}
          itemToEdit={editingItem.item}
          onClose={() => setEditingItem(null)}
          banks={banks}
          onSuccess={() => {
            onRefreshData();
          }}
        />
      )}

      {/* Delete Item Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-rose-600 text-white font-bold text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete {deletingItem.type}
            </div>
            <div className="p-5 space-y-4 text-xs">
              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {deleteError}
                </div>
              )}
              <p className="text-slate-700 font-medium">
                Are you sure you want to permanently delete <strong className="text-slate-900">{deletingItem.name}</strong>?
              </p>
              <p className="text-slate-500 text-[11px]">
                This action will remove the record from master data, automatically clean up all associated residual transactions and account links, and log an immutable audit entry.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM DATA WIPEOUT & CLEARANCE MODAL */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-rose-700 to-red-600 text-white font-extrabold text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-300" />
                Data Wipeout & System Clearance Engine
              </div>
              <button
                type="button"
                onClick={() => setShowWipeModal(false)}
                className="text-white/80 hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWipeSubmit} className="p-6 space-y-5 text-xs">
              {wipeError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-bold text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {wipeError}
                </div>
              )}

              {wipeSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  {wipeSuccess}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-2 text-xs">Select Clearance Scope *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setWipeMode('TRANSACTIONS_ONLY_ZERO_BALANCES');
                      setWipeConfirmText('');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      wipeMode === 'TRANSACTIONS_ONLY_ZERO_BALANCES'
                        ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-xs font-extrabold text-rose-700">
                        <RotateCcw className="w-3.5 h-3.5" /> Clear All Transactions (Rs. 0)
                      </span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-rose-200 text-rose-900 font-mono font-bold">CLEAR</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                      Wipes all transactions & closures. Resets all accounts & entities to <strong>Rs. 0.00</strong>.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWipeMode('TRANSACTIONS_ONLY');
                      setWipeConfirmText('');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      wipeMode === 'TRANSACTIONS_ONLY'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-xs font-extrabold text-amber-800">
                        <RotateCcw className="w-3.5 h-3.5" /> Keep Opening Balances
                      </span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-amber-200 text-amber-900 font-mono font-bold">RESET LEDGER</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                      Wipes transactions and resets each account to its assigned opening balance.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWipeMode('FULL_SYSTEM_RESET');
                      setWipeConfirmText('');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      wipeMode === 'FULL_SYSTEM_RESET'
                        ? 'bg-rose-100 border-rose-600 ring-2 ring-rose-600/30 text-rose-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-xs font-extrabold text-rose-800">
                        <Flame className="w-3.5 h-3.5 text-rose-600" /> Full Factory Reset (Rs. 0)
                      </span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-rose-300 text-rose-950 font-mono font-bold">WIPE OUT</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                      Factory reset with fresh standard master entities with <strong>Rs. 0.00 balances</strong>.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWipeMode('PURGE_ALL_DATA_BLANK');
                      setWipeConfirmText('');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      wipeMode === 'PURGE_ALL_DATA_BLANK'
                        ? 'bg-red-100 border-red-700 ring-2 ring-red-700/40 text-red-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-xs font-extrabold text-red-900">
                        <Trash2 className="w-3.5 h-3.5 text-red-700" /> Total Database Purge
                      </span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-red-300 text-red-950 font-mono font-bold">PURGE</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                      Completely empties all cloud database collections to a blank empty state.
                    </p>
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed">
                <strong>Warning:</strong> This operation performs irreversible data clearance in Cloud Firestore and syncs across all live screens instantly.
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 text-xs">
                  Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-rose-700 border border-slate-200 font-extrabold">{getRequiredConfirmText(wipeMode)}</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Type ${getRequiredConfirmText(wipeMode)} here...`}
                  value={wipeConfirmText}
                  onChange={e => setWipeConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 uppercase tracking-wider font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWipeModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={wipeLoading || wipeConfirmText.trim().toUpperCase() !== getRequiredConfirmText(wipeMode)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer disabled:opacity-40 flex items-center gap-2 transition-all"
                >
                  <Flame className="w-4 h-4" />
                  {wipeLoading ? 'Processing Clearance...' : `Execute ${getRequiredConfirmText(wipeMode)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
