export type Role = 'admin' | 'supervisor' | 'employee';

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  location?: string;
  head?: User | string;
  isActive: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  department?: Department | string;
  designation?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export type AssetStatus = 'active' | 'under_maintenance' | 'critical' | 'decommissioned';
export type Criticality = 'low' | 'medium' | 'high' | 'critical';

export interface Asset {
  _id: string;
  assetId: string;
  name: string;
  category: string;
  department: Department | string;
  location?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiry?: string;
  status: AssetStatus;
  criticality: Criticality;
  utilization: number;
  qrCodeUrl?: string;
  image?: string;
  assignedTo?: User | string;
  notes?: string;
  createdAt: string;
}

export type ComplaintStatus =
  | 'open'
  | 'in_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'rejected';

export interface Complaint {
  _id: string;
  complaintId: string;
  title: string;
  description: string;
  asset?: Asset | string;
  department?: Department | string;
  location?: string;
  raisedBy: User | string;
  assignedTo?: User | string;
  attachments: string[];
  aiCategory?: string;
  aiSeverity?: 'low' | 'medium' | 'high' | 'critical';
  aiSentiment?: 'neutral' | 'frustrated' | 'urgent';
  aiSummary?: string;
  aiSuggestedAction?: string;
  status: ComplaintStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  resolutionNotes?: string;
  linkedMaintenance?: string;
  createdAt: string;
}

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export interface Maintenance {
  _id: string;
  asset: Asset | string;
  type: 'preventive' | 'corrective' | 'predictive' | 'emergency';
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  aiPriorityScore?: number;
  aiPriorityReasoning?: string;
  status: MaintenanceStatus;
  scheduledDate: string;
  completedDate?: string;
  assignedTo?: User | string;
  linkedComplaint?: Complaint | string;
  cost?: number;
  partsUsed?: { name: string; quantity: number; cost: number }[];
  remarks?: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'complaint' | 'maintenance' | 'asset' | 'transfer' | 'system' | 'ai_alert';
  relatedId?: string;
  link?: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { total: number; page: number; limit: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
