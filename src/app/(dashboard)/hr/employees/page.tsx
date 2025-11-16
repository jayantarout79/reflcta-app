import { EmployeeForm } from "@/components/forms/employee-form";
import { getCurrentUserProfile, getEmployees } from "@/lib/data-service";
import { EmployeeCardList } from "@/components/hr/employee-card-list";

export default async function EmployeesPage() {
  const [employees, user] = await Promise.all([getEmployees(), getCurrentUserProfile()]);
  const canViewSalary = user?.role === "admin";
  const canEdit = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">People & HR records</p>
          <h1 className="text-2xl font-semibold text-zinc-900">Employees</h1>
        </div>
        <p className="text-sm text-zinc-500">{employees.length} teammates</p>
      </div>
      {canEdit && <EmployeeForm />}
      <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
        <EmployeeCardList
          employees={employees}
          canViewSalary={Boolean(canViewSalary)}
          canEdit={Boolean(canEdit)}
          canDelete={Boolean(canEdit)}
        />
      </div>
    </div>
  );
}
