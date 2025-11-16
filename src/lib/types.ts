export type Role = "admin" | "manager" | "employee" | "viewer";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  jobTitle?: string;
  location?: string;
  avatarUrl?: string;
  permissions?: string[];
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  country?: string;
  industry?: string;
  source: "LinkedIn" | "Email" | "Referral" | "Website" | "Other";
  status: "New" | "Contacted" | "Proposal Sent" | "Won" | "Lost";
  notes?: string;
  nextFollowUp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  website?: string;
  primaryContact: string;
  email: string;
  phone?: string;
  country?: string;
  timezone?: string;
  industry?: string;
  relationshipStatus: "Active" | "Dormant" | "Past" | "High-Risk";
  notes?: string;
  tags?: string[];
  projects?: Project[];
  invoices?: Invoice[];
  files?: DocumentFile[];
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName?: string;
  category: string;
  description?: string;
  status: "Planned" | "In Progress" | "On Hold" | "Completed" | "Cancelled";
  priority: "Low" | "Medium" | "High";
  startDate?: string;
  targetEndDate?: string;
  completionDate?: string;
  ownerId: string;
  ownerName?: string;
  team?: EmployeeSummary[];
  budget?: number;
  tags?: string[];
  tasks?: Task[];
  invoices?: Invoice[];
  expenses?: Expense[];
  activities?: ProjectActivity[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  projectName?: string;
  assigneeId: string;
  assigneeName?: string;
  status: "To Do" | "In Progress" | "Blocked" | "Done";
  priority: "Low" | "Medium" | "High";
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  loggedHours?: number;
  timeEntries?: TimeEntry[];
}

export interface TimeEntry {
  id: string;
  taskId: string;
  employeeId: string;
  employeeName?: string;
  employeeRecordId?: string;
  projectId?: string;
  taskName?: string;
  projectName?: string;
  date: string;
  hours: number;
  notes?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
  paymentDate?: string;
  notes?: string;
  lineItems: InvoiceLineItem[];
  total: number;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  currency: string;
  category: "Software" | "Contractor" | "Travel" | "Salary" | "Misc";
  projectId?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  vendor?: string;
  notes?: string;
  attachmentUrl?: string;
}

export interface EmployeeSummary {
  id: string;
  name: string;
  role: Role;
  jobTitle?: string;
  profileId?: string;
}

export interface Employee extends EmployeeSummary {
  email: string;
  location?: string;
  joinDate?: string;
  employmentType: "Full-time" | "Part-time" | "Contractor" | "Freelancer";
  status: "Active" | "On Leave" | "Exited";
  salary?: number;
  skills?: string[];
  notes?: string;
}

export interface DocumentFile {
  id: string;
  fileName: string;
  storagePath: string;
  linkedType: "Client" | "Project" | "Invoice" | "Employee" | "Generic";
  linkedEntityId?: string;
  category:
    | "Contract"
    | "NDA"
    | "Proposal"
    | "Report"
    | "Invoice PDF"
    | "Receipt"
    | "Misc";
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
}

export interface ProjectActivity {
  id: string;
  message: string;
  createdAt: string;
  author?: string;
  type?: "status" | "comment" | "note";
}

export interface DashboardMetrics {
  totalClients: number;
  activeClients: number;
  totalProjects: number;
  revenueThisMonth: number;
  outstandingInvoices: number;
  paidInvoices: number;
  totalExpenses: number;
  profit: number;
  projectsByStatus: { status: string; value: number }[];
  revenueTrend: { month: string; revenue: number; expenses: number }[];
  newClientsTrend: { month: string; value: number }[];
  completedProjectsTrend: { month: string; value: number }[];
  topClients: { client: string; value: number }[];
  employeeWorkload: {
    employee: string;
    projects: number;
    openTasks: number;
  }[];
}

export interface ProposalDraftInput {
  clientId: string;
  projectType: string;
  summary: string;
}

export interface ProposalDraft {
  scope: string[];
  milestones: { name: string; description: string }[];
  timelineWeeks: number;
  deliverables: string[];
}
