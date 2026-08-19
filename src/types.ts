export type TransactionDirection = 'IN' | 'OUT' | 'TRANSFER';

export type AccountType = 'CASH' | 'BANK' | 'DIGITAL' | 'PETTY_CASH';

export interface Bank {
  id: string;
  code: string;
  name: string;
  branch?: string;
  active: boolean;
  createdAt: string;
}

export interface FinancialAccount {
  id: string;
  name: string;
  bankId?: string;
  bankName?: string;
  accountNumber?: string;
  accountType: AccountType;
  openingBalance: number;
  currentBalance: number;
  active: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
  direction: 'IN' | 'OUT' | 'TRANSFER' | 'BOTH';
  active: boolean;
  requiresClient?: boolean;
  requiresSupplier?: boolean;
  requiresPartner?: boolean;
  requiresWorker?: boolean;
  requiresVehicle?: boolean;
  requiresBill?: boolean;
  requiresReference?: boolean;
  requiresDescription?: boolean;
  requiresAttachment?: boolean;
  description?: string;
}

export type EntityType = 'CLIENT' | 'SUPPLIER' | 'PARTNER' | 'WORKER' | 'NONE';

export interface Client {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Partner {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  sharePercentage?: number;
  balance: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Worker {
  id: string;
  code: string;
  name: string;
  role: string;
  phone?: string;
  dailyWage?: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  driverName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

export type SourceModule = 'MANUAL' | 'SALE' | 'CLIENT_PAYMENT' | 'SUPPLIER_PAYMENT' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT';

export interface LedgerTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  direction: TransactionDirection;
  accountId: string;
  accountName: string;
  targetAccountId?: string;
  targetAccountName?: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  paymentMethod: string;
  entityType?: EntityType;
  entityId?: string;
  entityName?: string;
  vehicleId?: string;
  vehicleInfo?: string;
  referenceNumber?: string;
  sourceModule: SourceModule;
  sourceId?: string;
  description: string;
  attachmentUrl?: string;
  status: 'POSTED' | 'VOIDED' | 'REVERSED';
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  createdBy: string;
  createdAt: string;
  reconciledDay?: string;
}

export type DayStatus = 'OPEN' | 'PENDING_RECONCILIATION' | 'RECONCILED' | 'CLOSED';

export interface DailyAccountPosition {
  id: string;
  date: string; // YYYY-MM-DD
  accountId: string;
  accountName: string;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  transferIn: number;
  transferOut: number;
  expectedClosing: number;
  actualCountedBalance?: number;
  difference?: number;
  status: DayStatus;
  settlementType?: 'NONE' | 'LOSS' | 'EXCESS';
  settlementTxnId?: string;
  notes?: string;
  reconciledBy?: string;
  reconciledAt?: string;
}

export interface DailyClosingSession {
  date: string;
  status: DayStatus;
  closedBy?: string;
  closedAt?: string;
  totalOpening: number;
  totalExpectedClosing: number;
  totalActualCounted: number;
  totalDifference: number;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  user: string;
  ipAddress?: string;
}

export interface TrackingFilter {
  datePreset: 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';
  fromDate?: string;
  toDate?: string;
  direction?: 'ALL' | TransactionDirection;
  categoryId?: string;
  accountId?: string;
  bankId?: string;
  clientId?: string;
  supplierId?: string;
  partnerId?: string;
  workerId?: string;
  vehicleId?: string;
  minAmount?: string;
  maxAmount?: string;
  searchQuery?: string;
  sourceModule?: string;
  status?: string;
  paymentMethod?: string;
}

export interface FilterSummary {
  totalIn: number;
  totalOut: number;
  transferIn: number;
  transferOut: number;
  netMovement: number;
  transactionCount: number;
  categoryBreakdown: { categoryName: string; direction: string; totalAmount: number; count: number }[];
  accountBreakdown: { accountName: string; totalIn: number; totalOut: number; netChange: number; count: number }[];
  entitySummary?: { entityName: string; entityType: string; totalIn: number; totalOut: number; netMovement: number; count: number };
}
