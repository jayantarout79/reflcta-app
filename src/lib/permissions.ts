import { type Role } from "./types";

type CrudAction = "read" | "create" | "update" | "delete";

export type Resource =
  | "clients"
  | "leads"
  | "projects"
  | "tasks"
  | "time"
  | "invoices"
  | "expenses"
  | "employees"
  | "files"
  | "analytics"
  | "ai"
  | "courses";

const CRUD: CrudAction[] = ["create", "read", "update", "delete"];
const READ: CrudAction[] = ["read"];

const ROLE_MATRIX: Record<Resource, Record<Role, CrudAction[]>> = {
  clients: {
    admin: CRUD,
    manager: CRUD,
    employee: READ,
    viewer: READ,
  },
  leads: {
    admin: CRUD,
    manager: CRUD,
    employee: READ,
    viewer: READ,
  },
  projects: {
    admin: CRUD,
    manager: CRUD,
    employee: ["read", "update"],
    viewer: READ,
  },
  tasks: {
    admin: CRUD,
    manager: CRUD,
    employee: ["read", "update"],
    viewer: READ,
  },
  time: {
    admin: CRUD,
    manager: CRUD,
    employee: ["create", "read"],
    viewer: [],
  },
  invoices: {
    admin: CRUD,
    manager: CRUD,
    employee: READ,
    viewer: READ,
  },
  expenses: {
    admin: CRUD,
    manager: ["create", "read", "update"],
    employee: ["create", "read"],
    viewer: [],
  },
  employees: {
    admin: CRUD,
    manager: READ,
    employee: READ,
    viewer: [],
  },
  files: {
    admin: CRUD,
    manager: CRUD,
    employee: ["create", "read"],
    viewer: READ,
  },
  analytics: {
    admin: READ,
    manager: READ,
    employee: READ,
    viewer: READ,
  },
  ai: {
    admin: CRUD,
    manager: CRUD,
    employee: ["create", "read"],
    viewer: [],
  },
  courses: {
    admin: CRUD,
    manager: CRUD,
    employee: READ,
    viewer: READ,
  },
};

export function canAccess(
  role: Role,
  resource: Resource,
  action: CrudAction = "read",
) {
  const allowed = ROLE_MATRIX[resource]?.[role] ?? [];
  return allowed.includes(action);
}

export function assertPermission(params: {
  role: Role;
  resource: Resource;
  action?: CrudAction;
}) {
  if (!canAccess(params.role, params.resource, params.action)) {
    throw new Error("You do not have permission to perform this action.");
  }
}
