import { z } from "zod";

export const leadFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  source: z.enum(["LinkedIn", "Email", "Referral", "Website", "Other"]),
  status: z.enum(["New", "Contacted", "Proposal Sent", "Won", "Lost"]),
  notes: z.string().optional(),
  nextFollowUp: z.string().optional(),
});

export const clientFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  company: z.string().min(2),
  website: z
    .string()
    .trim()
    .refine((val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        try {
          new URL(`https://${val}`);
          return true;
        } catch {
          return false;
        }
      }
    }, { message: "Please provide a valid URL (with or without https://)" })
    .optional(),
  primaryContact: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  industry: z.string().optional(),
  relationshipStatus: z.enum(["Active", "Dormant", "Past", "High-Risk"]),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const projectFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  clientId: z.string(),
  category: z.string(),
  description: z.string().optional(),
  status: z.enum(["Planned", "In Progress", "On Hold", "Completed", "Cancelled"]),
  priority: z.enum(["Low", "Medium", "High"]),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
  ownerId: z.string(),
  budget: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export const taskFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  projectId: z.string(),
  assigneeId: z.string(),
  status: z.enum(["To Do", "In Progress", "Blocked", "Done"]),
  priority: z.enum(["Low", "Medium", "High"]),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().optional(),
});

export const timeEntrySchema = z.object({
  taskId: z.string(),
  employeeId: z.string(),
  employeeRecordId: z.string().optional(),
  employeeName: z.string().optional(),
  date: z.string(),
  hours: z.number().min(0.25),
  notes: z.string().max(500).optional(),
  id: z.string().optional(),
});

export const invoiceFormSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  projectId: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  currency: z.string().default("USD").optional(),
  status: z.enum(["Draft", "Sent", "Paid", "Overdue"]).default("Draft").optional(),
  notes: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(2),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        taxRate: z.number().optional(),
      }),
    )
    .min(1),
});

export const expenseFormSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  amount: z.number(),
  currency: z.string().default("USD").optional(),
  category: z.enum(["Software", "Contractor", "Travel", "Salary", "Misc"]),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

export const employeeFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["admin", "manager", "employee", "viewer"]),
  jobTitle: z.string().optional(),
  location: z.string().optional(),
  joinDate: z.string().optional(),
  employmentType: z.enum([
    "Full-time",
    "Part-time",
    "Contractor",
    "Freelancer",
  ]),
  status: z.enum(["Active", "On Leave", "Exited"]).optional(),
  salary: z.number().optional(),
  skills: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const documentFormSchema = z.object({
  linkedType: z.enum(["Client", "Project", "Invoice", "Employee", "Generic"]),
  linkedEntityId: z.string().optional(),
  category: z.enum([
    "Contract",
    "NDA",
    "Proposal",
    "Report",
    "Invoice PDF",
    "Receipt",
    "Misc",
  ]),
  uploadedBy: z.string().optional(),
});
