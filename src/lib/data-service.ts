import {
  demoClients,
  demoDashboard,
  demoEmployees,
  demoExpenses,
  demoFiles,
  demoInvoices,
  demoLeads,
  demoProjects,
  demoTasks,
  demoTimeEntries,
  demoUser,
} from "@/data/demo";
import { isDemoMode } from "./env";
import { createServerSupabaseClient } from "./supabase/server";
import {
  type Client,
  type DashboardMetrics,
  type DocumentFile,
  type Employee,
  type Expense,
  type Invoice,
  type Lead,
  type Project,
  type Task,
  type TimeEntry,
  type UserProfile,
} from "./types";

const logError = (message: string, error?: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(message, error);
  }
};

const ensureArray = <T>(value?: T[] | null): T[] => {
  return Array.isArray(value) ? value : [];
};

const normalizeDashboard = (data?: Partial<DashboardMetrics>): DashboardMetrics => ({
  totalClients: data?.totalClients ?? 0,
  activeClients: data?.activeClients ?? 0,
  totalProjects: data?.totalProjects ?? 0,
  revenueThisMonth: data?.revenueThisMonth ?? 0,
  outstandingInvoices: data?.outstandingInvoices ?? 0,
  paidInvoices: data?.paidInvoices ?? 0,
  totalExpenses: data?.totalExpenses ?? 0,
  profit: data?.profit ?? 0,
  projectsByStatus: ensureArray(data?.projectsByStatus),
  revenueTrend: ensureArray(data?.revenueTrend),
  newClientsTrend: ensureArray(data?.newClientsTrend),
  completedProjectsTrend: ensureArray(data?.completedProjectsTrend),
  topClients: ensureArray(data?.topClients),
  employeeWorkload: ensureArray(data?.employeeWorkload),
});

type ClientRow = {
  id: string;
  name: string;
  company: string;
  website?: string | null;
  primary_contact?: string | null;
  primaryContact?: string | null;
  email: string;
  phone?: string | null;
  country?: string | null;
  timezone?: string | null;
  industry?: string | null;
  relationship_status?: Client["relationshipStatus"];
  relationshipStatus?: Client["relationshipStatus"];
  notes?: string | null;
  tags?: string[] | null;
  projects?: Project[];
  invoices?: Invoice[];
  files?: DocumentFile[];
};

const mapClientRow = (row: ClientRow): Client => ({
  id: row.id,
  name: row.name,
  company: row.company,
  website: row.website ?? undefined,
  primaryContact: row.primary_contact ?? row.primaryContact ?? "Primary contact",
  email: row.email,
  phone: row.phone ?? undefined,
  country: row.country ?? undefined,
  timezone: row.timezone ?? undefined,
  industry: row.industry ?? undefined,
  relationshipStatus: row.relationship_status ?? row.relationshipStatus ?? "Active",
  notes: row.notes ?? undefined,
  tags: row.tags ?? [],
  projects: row.projects ?? [],
  invoices: row.invoices ?? [],
  files: row.files ?? [],
});

type DocumentRow = {
  id: string;
  file_name?: string;
  fileName?: string;
  storage_path?: string;
  storagePath?: string;
  linked_type?: DocumentFile["linkedType"];
  linkedType?: DocumentFile["linkedType"];
  linked_entity_id?: string;
  linkedEntityId?: string;
  category: DocumentFile["category"];
  uploaded_by?: string;
  uploadedBy?: string;
  uploaded_at?: string;
  uploadedAt?: string;
  url?: string | null;
};

const mapDocumentRow = (row: DocumentRow): DocumentFile => ({
  id: row.id,
  fileName: row.file_name ?? row.fileName ?? "Unknown file",
  storagePath: row.storage_path ?? row.storagePath ?? "",
  linkedType: row.linked_type ?? row.linkedType ?? "Generic",
  linkedEntityId: row.linked_entity_id ?? row.linkedEntityId,
  category: row.category,
  uploadedBy: row.uploaded_by ?? row.uploadedBy ?? "",
  uploadedAt: row.uploaded_at ?? row.uploadedAt ?? new Date().toISOString(),
  url: row.url ?? undefined,
});

type ProjectRow = {
  id: string;
  name: string;
  client_id: string;
  client?: { name: string };
  category: string;
  description?: string | null;
  status: Project["status"];
  priority: Project["priority"];
  start_date?: string | null;
  target_end_date?: string | null;
  completion_date?: string | null;
  owner_id: string;
  owner_name?: string | null;
  budget?: number | null;
  tags?: string[] | null;
  tasks?: Task[];
  invoices?: Invoice[];
  expenses?: Expense[];
};

const mapProjectRow = (row: ProjectRow): Project => ({
  id: row.id,
  name: row.name,
  clientId: row.client_id,
  clientName: row.client?.name,
  category: row.category,
  description: row.description ?? undefined,
  status: row.status,
  priority: row.priority,
  startDate: row.start_date ?? undefined,
  targetEndDate: row.target_end_date ?? undefined,
  completionDate: row.completion_date ?? undefined,
  ownerId: row.owner_id,
  ownerName: row.owner_name ?? undefined,
  budget: row.budget ?? undefined,
  tags: row.tags ?? [],
  tasks: row.tasks ?? [],
  invoices: row.invoices ?? [],
  expenses: row.expenses ?? [],
});

type TaskRow = {
  id: string;
  title: string;
  description?: string | null;
  project_id: string;
  project?: { name: string };
  assignee_id: string;
  assignee?: { full_name: string | null };
  status: Task["status"];
  priority: Task["priority"];
  start_date?: string | null;
  due_date?: string | null;
  estimated_hours?: number | null;
  logged_hours?: number | null;
};

const mapTaskRow = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  projectId: row.project_id,
  projectName: row.project?.name,
  assigneeId: row.assignee_id,
  assigneeName: row.assignee?.full_name ?? undefined,
  status: row.status,
  priority: row.priority,
  startDate: row.start_date ?? undefined,
  dueDate: row.due_date ?? undefined,
  estimatedHours: row.estimated_hours ?? undefined,
  loggedHours: row.logged_hours ?? undefined,
});

type InvoiceLineRow = {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number | null;
  subtotal?: number | null;
};

type InvoiceRow = {
  id: string;
  client_id: string;
  client?: { name?: string | null };
  project_id?: string | null;
  project?: { name?: string | null };
  issue_date: string;
  due_date: string;
  currency: string;
  status: Invoice["status"];
  payment_date?: string | null;
  notes?: string | null;
  total?: number | null;
  line_items?: InvoiceLineRow[] | null;
};

const mapInvoiceRow = (row: InvoiceRow): Invoice => {
  const lineItems =
    row.line_items?.map((item, index) => {
      const base = item.quantity * item.unit_price;
      const subtotal = item.subtotal ?? base;
      return {
        id: item.id ?? `${row.id}-line-${index}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        taxRate: item.tax_rate ?? undefined,
        subtotal,
      };
    }) ?? [];
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxTotal = lineItems.reduce((sum, item) => {
    const taxRate = item.taxRate ?? 0;
    return sum + ((item.quantity * item.unitPrice * taxRate) / 100);
  }, 0);
  const computedTotal = subtotal + taxTotal;
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client?.name ?? undefined,
    projectId: row.project_id ?? undefined,
    projectName: row.project?.name ?? undefined,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    currency: row.currency,
    status: row.status,
    paymentDate: row.payment_date ?? undefined,
    notes: row.notes ?? undefined,
    lineItems,
    total: computedTotal,
  };
};

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  if (isDemoMode) return demoUser;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return null;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();
  return (
    profile ?? {
      id: authData.user.id,
      email: authData.user.email ?? "",
      name: authData.user.user_metadata?.full_name ?? "YuktraAI User",
      role: (authData.user.app_metadata.role as UserProfile["role"]) ?? "viewer",
    }
  );
}

export async function getLeads(): Promise<Lead[]> {
  if (isDemoMode) return demoLeads;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoLeads;
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) {
    logError("Unable to fetch leads", error);
    return demoLeads;
  }
  return data as Lead[];
}

export async function getClients(): Promise<Client[]> {
  if (isDemoMode) return demoClients;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoClients;
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) {
    logError("Unable to fetch clients", error);
    return demoClients;
  }
  return data.map(mapClientRow);
}

export async function getClientById(id: string): Promise<Client | null> {
  if (isDemoMode) {
    const client = demoClients.find((c) => c.id === id);
    if (!client) return null;
    return {
      ...client,
      projects: demoProjects.filter((p) => p.clientId === id),
      invoices: demoInvoices.filter((inv) => inv.clientId === id),
      files: demoFiles.filter((f) => f.linkedEntityId === id),
    };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
  if (error) {
    logError("Unable to fetch client", error);
    return null;
  }
  const { data: documentsData } = await supabase
    .from("documents")
    .select("*")
    .eq("linked_entity_id", id);
  const client = mapClientRow(data);
  const files = (documentsData ?? []).map(mapDocumentRow);
  return { ...client, files };
}

export async function getProjects(): Promise<Project[]> {
  if (isDemoMode) return demoProjects;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoProjects;
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
        *,
        client:clients(name),
        tasks(*),
        invoices(*),
        expenses(*)
      `,
    )
    .order("created_at", { ascending: false });
  if (error || !data) {
    logError("Unable to fetch projects", error);
    return demoProjects;
  }
  return data.map((row) => mapProjectRow(row as ProjectRow));
}

export async function getProjectById(id: string): Promise<Project | null> {
  if (isDemoMode) {
    const project = demoProjects.find((p) => p.id === id);
    if (!project) return null;
    return {
      ...project,
      tasks: demoTasks.filter((t) => t.projectId === id),
      invoices: demoInvoices.filter((inv) => inv.projectId === id),
      expenses: demoExpenses.filter((exp) => exp.projectId === id),
    };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error || !data) {
    logError("Unable to fetch project", error);
    return null;
  }
  const [tasks, invoices, expenses] = await Promise.all([
    supabase.from("tasks").select("*").eq("project_id", id),
    supabase.from("invoices").select("*").eq("project_id", id),
    supabase.from("expenses").select("*").eq("project_id", id),
  ]);
  const baseProject = mapProjectRow(data as ProjectRow);
  return {
    ...baseProject,
    tasks: tasks.data ?? [],
    invoices: invoices.data ?? [],
    expenses: expenses.data ?? [],
  };
}

export async function getTasks(): Promise<Task[]> {
  if (isDemoMode) return demoTasks;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoTasks;
  const { data, error } = await supabase
    .from("tasks")
    .select("*, project:projects(name), assignee:profiles(full_name)")
    .order("due_date", { ascending: true });
  if (error || !data) {
    logError("Unable to fetch tasks", error);
    return demoTasks;
  }
  return data.map((row) => mapTaskRow(row as TaskRow));
}

type TimeEntryRow = {
  id: string;
  task_id: string;
  employee_id?: string | null;
  profile_id?: string | null;
  employee_name?: string | null;
  entry_date?: string | null;
  date?: string | null;
  hours: number;
  notes?: string | null;
};

export async function getTimeEntries(): Promise<TimeEntry[]> {
  if (isDemoMode) return demoTimeEntries;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoTimeEntries;
  const [{ data, error }, { data: employeeRows }, { data: profileRows }, { data: taskRows }, { data: projectRows }] =
    await Promise.all([
      supabase.from("time_entries").select("*").order("entry_date", { ascending: false }),
      supabase.from("employees").select("id,name,profile_id"),
      supabase.from("profiles").select("id,full_name"),
      supabase.from("tasks").select("id,title,project_id"),
      supabase.from("projects").select("id,name"),
    ]);
  if (error || !data) {
    logError("Unable to fetch time entries", error);
    return demoTimeEntries;
  }
  const employeeById = new Map(
    (employeeRows ?? []).map((employee) => [
      (employee.id as string) ?? "",
      (employee.name as string | null | undefined) ?? "",
    ]),
  );
  const employeeByProfile = new Map(
    (employeeRows ?? []).map((employee) => [
      (employee.profile_id as string | null | undefined) ?? "",
      (employee.name as string | null | undefined) ?? "",
    ]),
  );
  const profileLookup = new Map(
    (profileRows ?? []).map((profile) => [
      (profile.id as string) ?? "",
      (profile.full_name as string | null | undefined) ?? "",
    ]),
  );
  const taskLookup = new Map(
    (taskRows ?? []).map((task) => [
      task.id as string,
      { title: task.title as string, projectId: task.project_id as string | null | undefined },
    ]),
  );
  const projectLookup = new Map(
    (projectRows ?? []).map((project) => [project.id as string, project.name as string]),
  );
  return (data as TimeEntryRow[]).map((row) => {
    const taskMeta = taskLookup.get(row.task_id);
    return {
      id: row.id,
      taskId: row.task_id,
      employeeId: row.employee_id ?? row.profile_id ?? "",
      employeeRecordId: row.employee_id ?? undefined,
      employeeName:
        employeeById.get(row.employee_id ?? "") ??
        employeeByProfile.get(row.profile_id ?? "") ??
        profileLookup.get(row.profile_id ?? "") ??
        row.employee_name ??
        "Unassigned",
      projectId: taskMeta?.projectId ?? undefined,
      taskName: taskMeta?.title,
      projectName: taskMeta?.projectId ? projectLookup.get(taskMeta.projectId) : undefined,
      date: row.entry_date ?? row.date ?? new Date().toISOString(),
      hours: row.hours,
      notes: row.notes ?? undefined,
    };
  });
}

export async function getInvoices(): Promise<Invoice[]> {
  if (isDemoMode) return demoInvoices;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoInvoices;
  const { data, error } = await supabase
    .from("invoices")
    .select(
      `
        *,
        client:clients(name),
        project:projects(name),
        line_items:invoice_line_items(*)
      `,
    )
    .order("issue_date", { ascending: false });
  if (error || !data) {
    logError("Unable to fetch invoices", error);
    return demoInvoices;
  }
  return (data as InvoiceRow[]).map(mapInvoiceRow);
}

export async function getExpenses(): Promise<Expense[]> {
  if (isDemoMode) return demoExpenses;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoExpenses;
  const [{ data, error }, { data: clientRows }, { data: projectRows }] = await Promise.all([
    supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
    supabase.from("clients").select("id,name"),
    supabase.from("projects").select("id,name"),
  ]);
  if (error || !data) {
    logError("Unable to fetch expenses", error);
    return demoExpenses;
  }
  const clientLookup = new Map((clientRows ?? []).map((row) => [row.id, row.name]));
  const projectLookup = new Map((projectRows ?? []).map((row) => [row.id, row.name]));
  return data.map((row) => ({
    id: row.id,
    date: row.expense_date ?? row.date,
    amount: row.amount,
    currency: row.currency,
    category: row.category,
    projectId: row.project_id ?? undefined,
    projectName: projectLookup.get(row.project_id) ?? undefined,
    clientId: row.client_id ?? undefined,
    clientName: clientLookup.get(row.client_id) ?? undefined,
    vendor: row.vendor ?? undefined,
    notes: row.notes ?? undefined,
  })) as Expense[];
}

export async function getEmployees(): Promise<Employee[]> {
  if (isDemoMode) return demoEmployees;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoEmployees;
  const [{ data, error }, { data: profiles }] = await Promise.all([
    supabase.from("employees").select("*"),
    supabase.from("profiles").select("id,email"),
  ]);
  if (error || !data) {
    logError("Unable to fetch employees", error);
    return demoEmployees;
  }
  const profileLookup = new Map(
    (profiles ?? []).map((p) => [p.email?.toLowerCase() ?? "", p.id as string]),
  );
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    jobTitle: row.job_title ?? undefined,
    location: row.location ?? undefined,
    joinDate: row.join_date ?? undefined,
    employmentType: row.employment_type,
    status: row.status,
    salary: row.salary ?? undefined,
    skills: row.skills ?? [],
    notes: row.notes ?? undefined,
    profileId:
      row.profile_id ??
      profileLookup.get((row.email ?? "").toLowerCase()) ??
      undefined,
  })) as Employee[];
}

export async function getFiles(): Promise<DocumentFile[]> {
  if (isDemoMode) return demoFiles;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoFiles;
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("uploaded_at", { ascending: false });
  if (error || !data) {
    logError("Unable to fetch documents", error);
    return demoFiles;
  }
  return data.map(mapDocumentRow);
}

export async function getDashboard(): Promise<DashboardMetrics> {
  if (isDemoMode) return normalizeDashboard(demoDashboard);
  const supabase = await createServerSupabaseClient();
  if (!supabase) return normalizeDashboard(demoDashboard);
  const { data, error } = await supabase
    .rpc("yuktra_dashboard_metrics")
    .single();
  if (error || !data) {
    logError("Unable to fetch dashboard metrics", error);
    return buildFallbackDashboard(supabase);
  }
  return normalizeDashboard(data as DashboardMetrics);
}

async function buildFallbackDashboard(
  supabasePromise: ReturnType<typeof createServerSupabaseClient>,
): Promise<DashboardMetrics> {
  const supabase = await supabasePromise;
  if (!supabase) {
    return normalizeDashboard(demoDashboard);
  }
  const [clientsRes, projectsRes, invoicesRes, expensesRes] = await Promise.all([
    supabase.from("clients").select("id,relationship_status"),
    supabase.from("projects").select("id,status"),
    supabase.from("invoices").select("status,total,issue_date,payment_date"),
    supabase.from("expenses").select("amount,expense_date"),
  ]);
  const clientsData = clientsRes.data ?? [];
  const projectsData = projectsRes.data ?? [];
  const invoicesData = invoicesRes.data ?? [];
  const expensesData = expensesRes.data ?? [];
  const now = new Date();
  const revenueThisMonth = invoicesData
    .filter((invoice) => {
      if (!invoice.issue_date) return false;
      const dt = new Date(invoice.issue_date);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    })
    .reduce((sum, invoice) => sum + (invoice.total ?? 0), 0);
  const outstanding = invoicesData
    .filter((invoice) => invoice.status !== "Paid")
    .reduce((sum, invoice) => sum + (invoice.total ?? 0), 0);
  const paid = invoicesData
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + (invoice.total ?? 0), 0);
  const totalExpenses = expensesData.reduce((sum, expense) => sum + (expense.amount ?? 0), 0);
  return normalizeDashboard({
    totalClients: clientsData.length,
    activeClients: clientsData.filter((client) => client.relationship_status === "Active").length,
    totalProjects: projectsData.length,
    revenueThisMonth,
    outstandingInvoices: outstanding,
    paidInvoices: paid,
    totalExpenses,
  });
}
