import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

export type QuickAddType = 'CLIENT' | 'SUPPLIER' | 'PARTNER' | 'WORKER' | 'VEHICLE' | 'BANK' | 'ACCOUNT' | 'CATEGORY' | 'PAYMENT_METHOD';

interface QuickAddModalProps {
  type: QuickAddType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: any) => void;
  banks?: any[];
  itemToEdit?: any;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  type,
  isOpen,
  onClose,
  onSuccess,
  banks = [],
  itemToEdit
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = Boolean(itemToEdit && itemToEdit.id);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({ ...itemToEdit });
    } else {
      setFormData({
        direction: 'OUT',
        requiresClient: false,
        requiresSupplier: false,
        requiresPartner: false,
        requiresWorker: false,
        requiresVehicle: false
      });
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const titles: Record<QuickAddType, string> = {
    CLIENT: isEditMode ? 'Edit Client' : 'Add New Client',
    SUPPLIER: isEditMode ? 'Edit Supplier' : 'Add New Supplier',
    PARTNER: isEditMode ? 'Edit Partner' : 'Add New Partner',
    WORKER: isEditMode ? 'Edit Worker / Labour' : 'Add New Worker / Labour',
    VEHICLE: isEditMode ? 'Edit Vehicle' : 'Add New Vehicle',
    BANK: isEditMode ? 'Edit Bank' : 'Add New Bank',
    ACCOUNT: isEditMode ? 'Edit Financial Account' : 'Add New Financial Account',
    CATEGORY: isEditMode ? 'Edit Category' : 'Add New Category',
    PAYMENT_METHOD: isEditMode ? 'Edit Payment Instrument' : 'Add New Payment Instrument'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let endpoint = '';
      if (type === 'CLIENT') endpoint = '/api/clients';
      else if (type === 'SUPPLIER') endpoint = '/api/suppliers';
      else if (type === 'PARTNER') endpoint = '/api/partners';
      else if (type === 'WORKER') endpoint = '/api/workers';
      else if (type === 'VEHICLE') endpoint = '/api/vehicles';
      else if (type === 'BANK') endpoint = '/api/banks';
      else if (type === 'ACCOUNT') endpoint = '/api/accounts';
      else if (type === 'CATEGORY') endpoint = '/api/categories';
      else if (type === 'PAYMENT_METHOD') endpoint = '/api/payment-methods';

      const url = isEditMode ? `${endpoint}/${itemToEdit.id}` : endpoint;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-User': 'Finance Operator' },
        body: JSON.stringify({ active: true, status: 'ACTIVE', ...formData })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save record');

      onSuccess(data);
      onClose();
      setFormData({});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
            {titles[type]}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* CLIENT / SUPPLIER / PARTNER Fields */}
          {(type === 'CLIENT' || type === 'SUPPLIER' || type === 'PARTNER') && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Full Business / Entity Name"
                  value={formData.name || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+92 300 0000000"
                    value={formData.phone || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="contact@domain.com"
                    value={formData.email || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Street / City / Industrial Area"
                  value={formData.address || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </>
          )}

          {/* WORKER Fields */}
          {type === 'WORKER' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Worker Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Worker / Labour Name"
                  value={formData.name || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operator, Driver, Helper"
                    value={formData.role || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Wage (Rs.)</label>
                  <input
                    type="number"
                    placeholder="2500"
                    value={formData.dailyWage ?? ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    onChange={e => setFormData({ ...formData, dailyWage: Number(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}

          {/* VEHICLE Fields */}
          {type === 'VEHICLE' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plate Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LEA-2026-99"
                  value={formData.plateNumber || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  onChange={e => setFormData({ ...formData, plateNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Model / Type *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hino Heavy Truck / Mazda Pickup"
                  value={formData.model || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Driver Name</label>
                <input
                  type="text"
                  placeholder="Driver name"
                  value={formData.driverName || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                />
              </div>
            </>
          )}

          {/* BANK Fields */}
          {type === 'BANK' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HBL, MEEZAN"
                    value={formData.code || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Bank Title"
                    value={formData.name || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  placeholder="Main Branch"
                  value={formData.branch || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  onChange={e => setFormData({ ...formData, branch: e.target.value })}
                />
              </div>
            </>
          )}

          {/* ACCOUNT Fields */}
          {type === 'ACCOUNT' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HBL Current Account / Main Cash Safe"
                  value={formData.name || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Type *</label>
                  <select
                    required
                    value={formData.accountType || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    onChange={e => setFormData({ ...formData, accountType: e.target.value })}
                  >
                    <option value="">Select Type</option>
                    <option value="CASH">CASH</option>
                    <option value="BANK">BANK</option>
                    <option value="PETTY_CASH">PETTY CASH</option>
                    <option value="DIGITAL">DIGITAL WALLET</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Bank</label>
                  <select
                    value={formData.bankId || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    onChange={e => {
                      const b = banks.find(x => x.id === e.target.value);
                      setFormData({ ...formData, bankId: e.target.value, bankName: b?.name });
                    }}
                  >
                    <option value="">None / Cash</option>
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="1001928301"
                    value={formData.accountNumber || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Balance (Rs.) *</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={formData.openingBalance ?? ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    onChange={e => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}

          {/* CATEGORY Fields */}
          {type === 'CATEGORY' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diesel Fuel, Freight Revenue, Raw Materials"
                  value={formData.name || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Direction / Flow *</label>
                  <select
                    required
                    value={formData.direction || 'OUT'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    onChange={e => setFormData({ ...formData, direction: e.target.value })}
                  >
                    <option value="IN">IN (Income / Revenue)</option>
                    <option value="OUT">OUT (Expense / Cost)</option>
                    <option value="TRANSFER">TRANSFER (Internal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Brief details"
                    value={formData.description || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Requirements checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Rule Requirements (Optional)</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded border border-slate-200">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.requiresClient)}
                      onChange={e => setFormData({ ...formData, requiresClient: e.target.checked })}
                    />
                    <span>Requires Client</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded border border-slate-200">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.requiresSupplier)}
                      onChange={e => setFormData({ ...formData, requiresSupplier: e.target.checked })}
                    />
                    <span>Requires Supplier</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded border border-slate-200">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.requiresPartner)}
                      onChange={e => setFormData({ ...formData, requiresPartner: e.target.checked })}
                    />
                    <span>Requires Partner</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded border border-slate-200">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.requiresWorker)}
                      onChange={e => setFormData({ ...formData, requiresWorker: e.target.checked })}
                    />
                    <span>Requires Worker</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer col-span-2 p-2 bg-indigo-50 border border-indigo-200 rounded text-indigo-900 font-medium">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.requiresVehicle)}
                      onChange={e => setFormData({ ...formData, requiresVehicle: e.target.checked })}
                    />
                    <span>Requires Vehicle Plate Number</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* PAYMENT METHOD Fields */}
          {type === 'PAYMENT_METHOD' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instrument / Method Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cash, Bank Transfer, Cheque, Online Gateway, LC, Credit Card"
                  value={formData.name || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instrument Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CASH, ONLINE, CHEQUE, CARD, BANK"
                  value={formData.code || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase"
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.active !== undefined ? Boolean(formData.active) : true}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-xs font-semibold text-slate-700">Active Payment Instrument Method</span>
                </label>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : isEditMode ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
