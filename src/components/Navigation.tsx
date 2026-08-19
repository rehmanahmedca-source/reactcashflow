import React, { useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  CheckCircle2,
  Database,
  ShieldCheck,
  Building2,
  Calendar,
  Lock,
  Unlock,
  Menu,
  X,
  Wallet,
  ChevronRight,
  Settings
} from 'lucide-react';

export type NavTab = 'dashboard' | 'transaction' | 'tracking' | 'reconciliation' | 'master' | 'audit' | 'settings';

interface NavigationProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentDate: string;
  isDayClosed: boolean;
  totalCashBalance: number;
  totalBankBalance: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  currentDate,
  isDayClosed,
  totalCashBalance,
  totalBankBalance
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard & Balances', icon: LayoutDashboard },
    { id: 'transaction', label: 'New Transaction', icon: PlusCircle, highlight: true },
    { id: 'tracking', label: 'Financial Reports', icon: BarChart3 },
    { id: 'reconciliation', label: 'Daily Reconciliation', icon: CheckCircle2 },
    { id: 'master', label: 'Master Data', icon: Database },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
    { id: 'settings', label: 'Settings & Clearance', icon: Settings }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 space-y-6">
      {/* Brand Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900 truncate font-sans">
                FBM FINANCIAL
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate font-medium">
              Ledger & Control System
            </p>
          </div>
        </div>

        {/* Date & System Status Widget */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Date
            </span>
            <span className="font-mono font-bold text-slate-800">{currentDate}</span>
          </div>
          <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Ledger State</span>
            {isDayClosed ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                <Lock className="w-3 h-3" /> CLOSED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Unlock className="w-3 h-3" /> OPEN
              </span>
            )}
          </div>
        </div>

        {/* Quick Balances Light Widget */}
        <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100/80 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Wallet className="w-3 h-3 text-indigo-600" /> Liquidity
            </span>
            <span className="text-[10px] text-indigo-600 font-extrabold">LIVE</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
              <p className="text-[9px] uppercase font-bold text-slate-400">Cash</p>
              <p className="text-xs font-bold text-emerald-600 font-mono mt-0.5">
                Rs. {totalCashBalance.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
              <p className="text-[9px] uppercase font-bold text-slate-400">Bank</p>
              <p className="text-xs font-bold text-blue-600 font-mono mt-0.5">
                Rs. {totalBankBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Menu */}
        <nav className="space-y-1 pt-2">
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
            Main Navigation
          </p>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as NavTab);
                  setMobileOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : tab.highlight
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.highlight ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-200" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile / Status */}
      <div className="pt-4 border-t border-slate-200">
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
            FO
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs font-bold text-slate-800 truncate">Finance Operator</p>
            <p className="text-[10px] text-slate-500 truncate">Audit & Posting Access</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Left-hand fixed menu) */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-slate-200 shadow-2xs h-screen sticky top-0 flex-col shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header with Hamburger Menu Button */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-xs text-slate-900">FBM FINANCIAL</h1>
            <p className="text-[10px] text-slate-500 font-mono">Date: {currentDate}</p>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay / Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex">
          <div className="w-72 bg-white h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
};
