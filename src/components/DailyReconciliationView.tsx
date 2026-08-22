import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Calendar,
  Save,
  HelpCircle,
  FileCheck,
  Building2,
  RefreshCw
} from 'lucide-react';
import { DailyAccountPosition, DailyClosingSession } from '../types';
import { api } from '../services/apiClient';
import { getKarachiToday } from '../utils/dateTime';

interface DailyReconciliationViewProps {
  onRefreshData: () => void;
}

export const DailyReconciliationView: React.FC<DailyReconciliationViewProps> = ({ onRefreshData }) => {
  const todayStr = getKarachiToday();
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [session, setSession] = useState<DailyClosingSession | undefined>();
  const [positions, setPositions] = useState<DailyAccountPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Settlement Modal State
  const [settleAccId, setSettleAccId] = useState<string | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleReason, setSettleReason] = useState('');

  // Count Edit Modal State
  const [countAccId, setCountAccId] = useState<string | null>(null);
  const [countValue, setCountValue] = useState<string>('');
  const [countNotes, setCountNotes] = useState('');

  // Reopen Day Modal
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // Close Day Notes
  const [closeNotes, setCloseNotes] = useState('');

  const fetchReconciliationData = async (dateStr: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getReconciliation(dateStr);
      setSession(data.session);
      setPositions(data.positions);
    } catch (err: any) {
      setError(err.message || 'Failed to load reconciliation state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliationData(selectedDate);
  }, [selectedDate]);

  const handleSaveCount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countAccId) return;

    try {
      await api.saveReconciliationCount(
        selectedDate,
        countAccId,
        Number(countValue),
        countNotes,
        'Finance Auditor'
      );
      setCountAccId(null);
      fetchReconciliationData(selectedDate);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to save actual count');
    }
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleAccId || !settleReason) return;

    const type = settleAmount < 0 ? 'DEFICIT' : 'SURPLUS';

    try {
      await api.settleDifference(
        selectedDate,
        settleAccId,
        type,
        Math.abs(settleAmount),
        settleReason,
        'Finance Supervisor'
      );

      setSettleAccId(null);
      setSettleReason('');
      setSuccessMsg(`Difference settled as ${type} adjustment!`);
      fetchReconciliationData(selectedDate);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to settle difference');
    }
  };

  const handleCloseDay = async () => {
    try {
      await api.closeDay(selectedDate, closeNotes, 'Finance Controller');
      setSuccessMsg(`Financial day ${selectedDate} is now CLOSED and protected.`);
      fetchReconciliationData(selectedDate);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to close day');
    }
  };

  const handleReopenDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason) return;

    try {
      await api.reopenDay(selectedDate, reopenReason, 'Finance Director');
      setShowReopenModal(false);
      setReopenReason('');
      setSuccessMsg(`Day ${selectedDate} reopened for modification.`);
      fetchReconciliationData(selectedDate);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to reopen day');
    }
  };

  const isClosed = session?.status === 'CLOSED';
  const totalExpected = positions.reduce((sum, p) => sum + p.expectedClosing, 0);
  const totalCounted = positions.reduce((sum, p) => sum + (p.actualCountedBalance ?? p.expectedClosing), 0);
  const totalDifference = totalCounted - totalExpected;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* HEADER BAR & DATE PICKER */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-white to-slate-50 text-slate-900 rounded-xl p-6 border border-indigo-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Daily Cash & Bank Reconciliation</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verify actual counted cash/bank balances against ledger expected closing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono shadow-2xs">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-slate-600 font-semibold">Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-slate-900 font-bold focus:outline-none"
            />
          </div>

          <button
            onClick={() => fetchReconciliationData(selectedDate)}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Refresh reconciliation grid"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DAY STATUS BANNER */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isClosed ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      }`}>
        <div className="flex items-center gap-3">
          {isClosed ? (
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Unlock className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="font-extrabold text-sm tracking-wide uppercase">
              Financial Day Status: {isClosed ? 'CLOSED & LOCKED' : 'OPEN FOR RECONCILIATION'}
            </h3>
            <p className="text-xs mt-0.5 opacity-80">
              {isClosed
                ? `Closed by ${session?.closedBy || 'Controller'} at ${new Date(session?.closedAt || '').toLocaleString()}`
                : 'All account balances can be counted and settled for this date.'}
            </p>
          </div>
        </div>

        <div>
          {isClosed ? (
            <button
              onClick={() => setShowReopenModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Unlock className="w-4 h-4 text-emerald-400" /> Re-open Closed Day
            </button>
          ) : (
            <button
              onClick={handleCloseDay}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <FileCheck className="w-4 h-4" /> Verify & Lock / Close Day
            </button>
          )}
        </div>
      </div>

      {/* OVERALL RECONCILIATION TOTALS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500">Total Expected Ledger Balance</span>
          <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
            Rs. {totalExpected.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500">Total Actual Counted Balance</span>
          <p className="text-2xl font-extrabold text-indigo-600 font-mono mt-1">
            Rs. {totalCounted.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500">Net Difference</span>
          <p className={`text-2xl font-extrabold font-mono mt-1 ${totalDifference === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalDifference > 0 ? '+' : ''} Rs. {totalDifference.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ACCOUNT BY ACCOUNT RECONCILIATION GRID */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Account Positions for {selectedDate}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Account Name</th>
                <th className="py-3 px-3 text-right">Opening</th>
                <th className="py-3 px-3 text-right">IN</th>
                <th className="py-3 px-3 text-right">OUT</th>
                <th className="py-3 px-3 text-right">Transfer IN</th>
                <th className="py-3 px-3 text-right">Transfer OUT</th>
                <th className="py-3 px-3 text-right">Expected Closing</th>
                <th className="py-3 px-3 text-right">Actual Counted</th>
                <th className="py-3 px-3 text-right">Difference</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {positions.map(p => {
                const diff = p.difference || 0;
                const isReconciled = diff === 0;

                return (
                  <tr key={p.accountId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900">{p.accountName}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600">Rs. {p.openingBalance.toLocaleString()}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-emerald-700">+ Rs. {p.totalIn.toLocaleString()}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-rose-700">- Rs. {p.totalOut.toLocaleString()}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-blue-600">+ Rs. {p.transferIn.toLocaleString()}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-indigo-600">- Rs. {p.transferOut.toLocaleString()}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-extrabold text-slate-900">
                      Rs. {p.expectedClosing.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-extrabold text-indigo-700 bg-indigo-50/50">
                      Rs. {(p.actualCountedBalance ?? p.expectedClosing).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold">
                      {isReconciled ? (
                        <span className="text-emerald-600 font-extrabold">0 (RECONCILED)</span>
                      ) : (
                        <span className="text-rose-600 font-extrabold">
                          {diff > 0 ? '+' : ''} Rs. {diff.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center space-x-1">
                      {!isClosed && (
                        <>
                          <button
                            onClick={() => {
                              setCountAccId(p.accountId);
                              setCountValue((p.actualCountedBalance ?? p.expectedClosing).toString());
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-md transition-colors"
                          >
                            Edit Count
                          </button>
                          {!isReconciled && (
                            <button
                              onClick={() => {
                                setSettleAccId(p.accountId);
                                setSettleAmount(diff);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-md shadow-xs"
                            >
                              Settle Diff
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT ACTUAL COUNT MODAL */}
      {countAccId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-100 text-slate-800 border-b border-slate-200 font-bold text-sm">
              Enter Actual Verified Counted Balance
            </div>
            <form onSubmit={handleSaveCount} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Actual Verified Amount (Rs.) *</label>
                <input
                  type="number"
                  required
                  value={countValue}
                  onChange={e => setCountValue(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-indigo-500 rounded-lg text-lg font-bold font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Audit Notes / Remark</label>
                <input
                  type="text"
                  placeholder="e.g. Verified by cashier & physical count"
                  value={countNotes}
                  onChange={e => setCountNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCountAccId(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTLE DIFFERENCE MODAL */}
      {settleAccId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-rose-600 text-white font-bold text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Settle Discrepancy Difference
            </div>
            <form onSubmit={handleSettleSubmit} className="p-5 space-y-4 text-xs">
              <p className="text-slate-700 font-semibold">
                Difference: <strong className="font-mono text-rose-600">{settleAmount < 0 ? 'Shortage' : 'Excess'} of Rs. {Math.abs(settleAmount).toLocaleString()}</strong>
              </p>
              <p className="text-slate-500">
                Settling will post an auditable adjustment transaction ({settleAmount < 0 ? 'Cash Shortage / Loss OUT' : 'Unidentified Excess IN'}) so difference becomes zero.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Investigation / Reason *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed investigation note explaining the shortage/excess..."
                  value={settleReason}
                  onChange={e => setSettleReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleAccId(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REOPEN DAY MODAL */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-amber-600 text-white font-bold text-sm flex items-center gap-2">
              <Unlock className="w-5 h-5" />
              Re-open Financial Day {selectedDate}
            </div>
            <form onSubmit={handleReopenDay} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Re-opening a closed day allows edits to transactions for this date. An audit entry will record this action.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Re-opening *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why this closed day is being re-opened..."
                  value={reopenReason}
                  onChange={e => setReopenReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Re-open Day
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
