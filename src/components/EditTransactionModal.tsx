import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Calendar, ArrowRightLeft } from 'lucide-react';
import {
  LedgerTransaction,
  FinancialAccount,
  TransactionCategory,
  Client,
  Supplier,
  Partner,
  Worker,
  Vehicle,
  PaymentMethod
} from '../types';
import { api } from '../services/apiClient';

interface EditTransactionModalProps {
  transaction: LedgerTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: FinancialAccount[];
  categories: TransactionCategory[];
  clients: Client[];
  suppliers: Supplier[];
  partners: Partner[];
  workers: Worker[];
  vehicles: Vehicle[];
  paymentMethods: PaymentMethod[];
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onSuccess,
  accounts,
  categories,
  clients,
  suppliers,
  partners,
  workers,
  vehicles,
  paymentMethods
}) => {
  const [formData, setFormData] = useState<Partial<LedgerTransaction>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setFormData({ ...transaction });
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.updateTransaction(transaction.id, formData, 'Finance Supervisor');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base tracking-wide">
              Edit Transaction #{transaction.id}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date || ''}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
              <input
                type="text"
                value={formData.time || ''}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type / Direction *</label>
              <select
                required
                value={formData.direction || 'IN'}
                onChange={e => setFormData({ ...formData, direction: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="IN">IN (Receipt / Cash In)</option>
                <option value="OUT">OUT (Payment / Expense)</option>
                <option value="TRANSFER">TRANSFER (Account Transfer)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account *</label>
              <select
                required
                value={formData.accountId || ''}
                onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">Select Account</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.accountType})</option>
                ))}
              </select>
            </div>

            {formData.direction === 'TRANSFER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Account *</label>
                <select
                  required
                  value={formData.targetAccountId || ''}
                  onChange={e => setFormData({ ...formData, targetAccountId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">Select Target Account</option>
                  {accounts.filter(a => a.id !== formData.accountId).map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.accountType})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                required
                value={formData.categoryId || ''}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.direction})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Party Entity Type</label>
              <select
                value={formData.entityType || 'NONE'}
                onChange={e => setFormData({ ...formData, entityType: e.target.value as any, entityId: '' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="NONE">None / General</option>
                <option value="CLIENT">Client</option>
                <option value="SUPPLIER">Supplier</option>
                <option value="PARTNER">Partner</option>
                <option value="WORKER">Worker</option>
              </select>
            </div>

            {formData.entityType === 'CLIENT' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Client</label>
                <select
                  value={formData.entityId || ''}
                  onChange={e => setFormData({ ...formData, entityId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">Select Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
            )}

            {formData.entityType === 'SUPPLIER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Supplier</label>
                <select
                  value={formData.entityId || ''}
                  onChange={e => setFormData({ ...formData, entityId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
            )}

            {formData.entityType === 'PARTNER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Partner</label>
                <select
                  value={formData.entityId || ''}
                  onChange={e => setFormData({ ...formData, entityId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">Select Partner</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>
            )}

            {formData.entityType === 'WORKER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Worker</label>
                <select
                  value={formData.entityId || ''}
                  onChange={e => setFormData({ ...formData, entityId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">Select Worker</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (Rs.) *</label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                value={formData.amount ?? ''}
                onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod || 'CASH'}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {paymentMethods.map(pm => (
                  <option key={pm.id} value={pm.name}>{pm.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Cheque #</label>
              <input
                type="text"
                value={formData.referenceNumber || ''}
                onChange={e => setFormData({ ...formData, referenceNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Memo</label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Updating...' : 'Update Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
