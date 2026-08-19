import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  Link2,
  Car,
  User,
  Building,
  CreditCard
} from 'lucide-react';
import {
  FinancialAccount,
  TransactionCategory,
  Client,
  Supplier,
  Partner,
  Worker,
  Vehicle,
  PaymentMethod,
  TransactionDirection
} from '../types';
import { SearchableCombobox, ComboboxItem } from './SearchableCombobox';
import { QuickAddModal, QuickAddType } from './QuickAddModal';

interface TransactionFormProps {
  accounts: FinancialAccount[];
  categories: TransactionCategory[];
  clients: Client[];
  suppliers: Supplier[];
  partners: Partner[];
  workers: Worker[];
  vehicles: Vehicle[];
  paymentMethods: PaymentMethod[];
  banks: any[];
  onSuccess: () => void;
  onRefreshData: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  accounts,
  categories,
  clients,
  suppliers,
  partners,
  workers,
  vehicles,
  paymentMethods,
  banks,
  onSuccess,
  onRefreshData
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  const [direction, setDirection] = useState<TransactionDirection>('IN');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowTime);
  const [accountId, setAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const [entityType, setEntityType] = useState<'CLIENT' | 'SUPPLIER' | 'PARTNER' | 'WORKER' | 'NONE'>('NONE');
  const [entityId, setEntityId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Quick Add Modal State
  const [quickAddType, setQuickAddType] = useState<QuickAddType | null>(null);

  // Filter categories by direction
  const activeCategories = categories.filter(c => c.active && (c.direction === direction || c.direction === 'BOTH'));

  // Get selected category configuration
  const selectedCategory = categories.find(c => c.id === categoryId);

  // Format Items for SearchableCombobox
  const accountItems: ComboboxItem[] = accounts.filter(a => a.active).map(a => ({
    id: a.id,
    label: a.name,
    subtext: `${a.accountType} • Balance: Rs. ${a.currentBalance.toLocaleString()}`,
    badge: a.accountType
  }));

  const categoryItems: ComboboxItem[] = activeCategories.map(c => ({
    id: c.id,
    label: c.name,
    subtext: c.description
  }));

  const clientItems: ComboboxItem[] = clients.filter(c => c.status === 'ACTIVE').map(c => ({
    id: c.id,
    label: `${c.name} (${c.code})`,
    subtext: `Balance: Rs. ${c.balance.toLocaleString()}`
  }));

  const supplierItems: ComboboxItem[] = suppliers.filter(s => s.status === 'ACTIVE').map(s => ({
    id: s.id,
    label: `${s.name} (${s.code})`,
    subtext: `Balance: Rs. ${s.balance.toLocaleString()}`
  }));

  const partnerItems: ComboboxItem[] = partners.filter(p => p.status === 'ACTIVE').map(p => ({
    id: p.id,
    label: `${p.name} (${p.code})`,
    subtext: `Share: ${p.sharePercentage || 0}%`
  }));

  const workerItems: ComboboxItem[] = workers.filter(w => w.status === 'ACTIVE').map(w => ({
    id: w.id,
    label: `${w.name} (${w.code})`,
    subtext: `Role: ${w.role}`
  }));

  const vehicleItems: ComboboxItem[] = vehicles.filter(v => v.status === 'ACTIVE').map(v => ({
    id: v.id,
    label: v.plateNumber,
    subtext: `${v.model} ${v.driverName ? `(${v.driverName})` : ''}`
  }));

  const methodItems: ComboboxItem[] = paymentMethods.filter(p => p.active).map(p => ({
    id: p.name,
    label: p.name
  }));

  // Auto-detect or default Entity Type / Transfer Category
  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    if (cat.requiresClient) {
      setEntityType('CLIENT');
    } else if (cat.requiresSupplier) {
      setEntityType('SUPPLIER');
    } else if (cat.requiresPartner) {
      setEntityType('PARTNER');
    } else if (cat.requiresWorker) {
      setEntityType('WORKER');
    }

    // Reset vehicle selection if newly selected category is not vehicle-related
    const isVehicleCat = Boolean(
      cat.requiresVehicle ||
      (cat.name && /vehicle|fuel|petrol|diesel|repair|maintenance|fleet|transport|freight/i.test(cat.name)) ||
      (cat.description && /vehicle|fuel|petrol|diesel|repair|maintenance|fleet|transport|freight/i.test(cat.description))
    );
    if (!isVehicleCat) {
      setVehicleId('');
    }
  };

  // Auto-recommend transfer category whenever source or destination account changes during TRANSFER
  const handleAccountChange = (accId: string) => {
    setAccountId(accId);
    if (direction === 'TRANSFER') {
      const srcAcc = accounts.find(a => a.id === accId);
      const tgtAcc = accounts.find(a => a.id === targetAccountId);
      autoSelectTransferCategory(srcAcc, tgtAcc);
    }
  };

  const handleTargetAccountChange = (tgtId: string) => {
    setTargetAccountId(tgtId);
    if (direction === 'TRANSFER') {
      const srcAcc = accounts.find(a => a.id === accountId);
      const tgtAcc = accounts.find(a => a.id === tgtId);
      autoSelectTransferCategory(srcAcc, tgtAcc);
    }
  };

  const autoSelectTransferCategory = (srcAcc?: FinancialAccount, tgtAcc?: FinancialAccount) => {
    if (!srcAcc || !tgtAcc) return;
    const srcType = srcAcc.accountType;
    const tgtType = tgtAcc.accountType;

    if ((srcType === 'CASH' || srcType === 'PETTY_CASH') && (tgtType === 'BANK' || tgtType === 'DIGITAL')) {
      const cat = categories.find(c => c.id === 'CAT-TR-1') || categories.find(c => c.direction === 'TRANSFER');
      if (cat) setCategoryId(cat.id);
    } else if ((srcType === 'BANK' || srcType === 'DIGITAL') && (tgtType === 'CASH' || tgtType === 'PETTY_CASH')) {
      const cat = categories.find(c => c.id === 'CAT-TR-2') || categories.find(c => c.direction === 'TRANSFER');
      if (cat) setCategoryId(cat.id);
    } else if ((srcType === 'BANK' || srcType === 'DIGITAL') && (tgtType === 'BANK' || tgtType === 'DIGITAL')) {
      const cat = categories.find(c => c.id === 'CAT-TR-3') || categories.find(c => c.direction === 'TRANSFER');
      if (cat) setCategoryId(cat.id);
    } else {
      const cat = categories.find(c => c.direction === 'TRANSFER');
      if (cat) setCategoryId(cat.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!accountId) {
      setError('Please select a Source Account');
      return;
    }

    if (direction === 'TRANSFER') {
      if (!targetAccountId) {
        setError('Please select a Destination Account for Transfer');
        return;
      }
      if (accountId === targetAccountId) {
        setError('Source and Destination accounts must be different');
        return;
      }
    }

    let finalCategoryId = categoryId;
    if (direction === 'TRANSFER' && !finalCategoryId) {
      const defaultTrCat = categories.find(c => c.direction === 'TRANSFER')?.id || 'CAT-TR-1';
      finalCategoryId = defaultTrCat;
    }

    if (!finalCategoryId) {
      setError('Please select a Category');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (selectedCategory?.requiresVehicle && !vehicleId) {
      setError(`Category '${selectedCategory.name}' requires a Vehicle selection.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User': 'Finance Operator'
        },
        body: JSON.stringify({
          date,
          time,
          direction,
          accountId,
          targetAccountId: direction === 'TRANSFER' ? targetAccountId : undefined,
          categoryId: finalCategoryId,
          amount: Number(amount),
          paymentMethod,
          entityType: direction === 'TRANSFER' ? 'NONE' : entityType,
          entityId: direction !== 'TRANSFER' && entityType !== 'NONE' ? entityId : undefined,
          vehicleId: vehicleId || undefined,
          referenceNumber,
          description: description || (direction === 'TRANSFER' ? `Fund Transfer from ${accounts.find(a => a.id === accountId)?.name} to ${accounts.find(a => a.id === targetAccountId)?.name}` : ''),
          attachmentUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post transaction');

      setSuccessMsg(`Transaction ${data.id} posted successfully!`);
      onRefreshData();
      onSuccess();

      // Reset form fields
      setAmount('');
      setReferenceNumber('');
      setDescription('');
      setAttachmentUrl('');
      setVehicleId('');
      setEntityId('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Title */}
        <div className="bg-gradient-to-r from-indigo-50/90 via-white to-slate-50 text-slate-900 p-6 border-b border-slate-200">
          <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-slate-900">
            <Save className="w-5 h-5 text-indigo-600" />
            Financial Transaction Entry
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Category-driven double-entry ledger posting with real-time balance calculations.
          </p>

          {/* STEP 1: Direction Selector Tabs */}
          <div className="mt-5 grid grid-cols-3 gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setDirection('IN');
                setCategoryId('');
                setTargetAccountId('');
              }}
              className={`py-3 px-4 rounded-lg font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                direction === 'IN'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              RECEIPT [ IN ]
            </button>

            <button
              type="button"
              onClick={() => {
                setDirection('OUT');
                setCategoryId('');
                setTargetAccountId('');
              }}
              className={`py-3 px-4 rounded-lg font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                direction === 'OUT'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              PAYMENT [ OUT ]
            </button>

            <button
              type="button"
              onClick={() => {
                setDirection('TRANSFER');
                setCategoryId('');
              }}
              className={`py-3 px-4 rounded-lg font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                direction === 'TRANSFER'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              TRANSFER [ INTERNAL ]
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* Date, Time & Amount Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Transaction Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> Time *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                Amount (PKR) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-indigo-500 rounded-lg text-base font-extrabold font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Account & Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account / Source Account */}
            <SearchableCombobox
              label={direction === 'TRANSFER' ? 'From Source Account (OUT) *' : direction === 'IN' ? 'Receiving Account (IN) *' : 'Paying Account (OUT) *'}
              placeholder="Select Account..."
              items={accountItems}
              value={accountId}
              onChange={handleAccountChange}
              required
              allowAddNew
              addNewLabel="+ Add New Account"
              onAddNew={() => setQuickAddType('ACCOUNT')}
            />

            {/* Target Account if TRANSFER */}
            {direction === 'TRANSFER' ? (
              <SearchableCombobox
                label="To Destination Account (IN) *"
                placeholder="Select Target Account..."
                items={accountItems.filter(a => a.id !== accountId)}
                value={targetAccountId}
                onChange={handleTargetAccountChange}
                required
              />
            ) : (
              /* Category Selector for IN / OUT */
              <SearchableCombobox
                label="Transaction Category *"
                placeholder="Select Category..."
                items={categoryItems}
                value={categoryId}
                onChange={handleCategoryChange}
                required
                allowAddNew
                addNewLabel="+ Add New Category"
                onAddNew={() => setQuickAddType('CATEGORY')}
              />
            )}
          </div>

          {/* Transfer Flow Visualizer & Category Selector */}
          {direction === 'TRANSFER' && (
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 text-white rounded-lg font-bold">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-indigo-950 uppercase tracking-wider block text-[11px]">
                      Account Transfer Direction
                    </span>
                    <span className="text-slate-600 font-medium">
                      {accounts.find(a => a.id === accountId)?.name || 'Source Account'} ➔ {accounts.find(a => a.id === targetAccountId)?.name || 'Destination Account'}
                    </span>
                  </div>
                </div>

                {amount && Number(amount) > 0 && (
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-indigo-200 font-mono font-extrabold text-indigo-700 text-sm">
                    Rs. {Number(amount).toLocaleString()}
                  </div>
                )}
              </div>

              <SearchableCombobox
                label="Transfer Ledger Category *"
                placeholder="Select Transfer Category..."
                items={categoryItems}
                value={categoryId}
                onChange={handleCategoryChange}
                required
                allowAddNew
                addNewLabel="+ Add New Category"
                onAddNew={() => setQuickAddType('CATEGORY')}
              />
            </div>
          )}

          {/* Party Selection (Client / Supplier / Partner / Worker) */}
          {direction !== 'TRANSFER' && (
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  Associated Party / Entity
                </label>
                <div className="flex items-center gap-2 text-xs">
                  {['NONE', 'CLIENT', 'SUPPLIER', 'PARTNER', 'WORKER'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setEntityType(type as any);
                        setEntityId('');
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        entityType === type
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {entityType === 'CLIENT' && (
                <SearchableCombobox
                  label="Select Client *"
                  placeholder="Search client..."
                  items={clientItems}
                  value={entityId}
                  onChange={setEntityId}
                  allowAddNew
                  addNewLabel="+ Add New Client"
                  onAddNew={() => setQuickAddType('CLIENT')}
                />
              )}

              {entityType === 'SUPPLIER' && (
                <SearchableCombobox
                  label="Select Supplier *"
                  placeholder="Search supplier..."
                  items={supplierItems}
                  value={entityId}
                  onChange={setEntityId}
                  allowAddNew
                  addNewLabel="+ Add New Supplier"
                  onAddNew={() => setQuickAddType('SUPPLIER')}
                />
              )}

              {entityType === 'PARTNER' && (
                <SearchableCombobox
                  label="Select Partner *"
                  placeholder="Search partner..."
                  items={partnerItems}
                  value={entityId}
                  onChange={setEntityId}
                  allowAddNew
                  addNewLabel="+ Add New Partner"
                  onAddNew={() => setQuickAddType('PARTNER')}
                />
              )}

              {entityType === 'WORKER' && (
                <SearchableCombobox
                  label="Select Worker / Labour *"
                  placeholder="Search worker..."
                  items={workerItems}
                  value={entityId}
                  onChange={setEntityId}
                  allowAddNew
                  addNewLabel="+ Add New Worker"
                  onAddNew={() => setQuickAddType('WORKER')}
                />
              )}
            </div>
          )}

          {/* Vehicle & Payment Method */}
          {(() => {
            const isVehicleCat = Boolean(
              selectedCategory?.requiresVehicle ||
              (selectedCategory?.name && /vehicle|fuel|petrol|diesel|repair|maintenance|fleet|transport|freight/i.test(selectedCategory.name)) ||
              (selectedCategory?.description && /vehicle|fuel|petrol|diesel|repair|maintenance|fleet|transport|freight/i.test(selectedCategory.description))
            );

            return (
              <div className={`grid grid-cols-1 ${isVehicleCat ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {isVehicleCat && (
                  <div>
                    <SearchableCombobox
                      label={`Vehicle Selection ${selectedCategory?.requiresVehicle ? '*' : '(Optional)'}`}
                      placeholder="Select Vehicle (fuel/transport/repair)..."
                      items={vehicleItems}
                      value={vehicleId}
                      onChange={setVehicleId}
                      allowAddNew
                      addNewLabel="+ Add New Vehicle"
                      onAddNew={() => setQuickAddType('VEHICLE')}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Fleet tag to allocate fuel, freight, or maintenance costs to a specific vehicle.
                    </p>
                  </div>
                )}

                <SearchableCombobox
                  label="Payment Instrument / Method"
                  placeholder="Select Method..."
                  items={methodItems}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                />
              </div>
            );
          })()}

          {/* Reference & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> Reference # / Bill / Cheque No.
              </label>
              <input
                type="text"
                placeholder="e.g. INV-8842, RTGS-992, CHQ-10029"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-indigo-600" /> Attachment Document / Receipt URL
              </label>
              <input
                type="text"
                placeholder="https://... (Optional proof link)"
                value={attachmentUrl}
                onChange={e => setAttachmentUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Transaction Narration / Description *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Detailed description of the financial movement..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
            />
          </div>

          {/* Submit Action Bar */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-xl font-extrabold text-sm text-white shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 ${
                direction === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : direction === 'OUT'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
              }`}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Posting Transaction...' : `Post ${direction} Transaction`}
            </button>
          </div>
        </form>
      </div>

      {/* Quick Add Modal */}
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
    </div>
  );
};
