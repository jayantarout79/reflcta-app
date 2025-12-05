import { GraduationCap, CheckCircle2, Users, Globe2 } from "lucide-react";
import { StudentEnrollmentTable } from "@/components/courses/enrollment-table";
import { MetricCard } from "@/components/dashboard/metric-card";
import { getCurrentUserProfile, getStudentEnrollments } from "@/lib/data-service";
import { canAccess } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export default async function CoursesPage() {
  const [enrollments, user] = await Promise.all([getStudentEnrollments(), getCurrentUserProfile()]);
  const canEdit = user ? canAccess(user.role, "courses", "update") : false;

  const total = enrollments.length;
  const paidCount = enrollments.filter((item) =>
    item.paymentStatus.toLowerCase().includes("paid"),
  ).length;
  const demoCount = enrollments.filter((item) => item.isDemoOnly).length;
  const pendingCount = total - paidCount;
  const batches = Array.from(new Set(enrollments.map((item) => item.batchLabel)));
  const countries = Array.from(
    new Set(enrollments.map((item) => item.country).filter(Boolean) as string[]),
  );
  const lastSignup = enrollments[0]?.createdAt ? formatDate(enrollments[0].createdAt) : "—";
  const now = new Date().getTime();
  const weeklyIntake = enrollments.filter((item) => {
    const created = new Date(item.createdAt);
    const diff = (now - created.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;
  const courseBreakdown = Array.from(
    enrollments.reduce((map, item) => {
      const existing = map.get(item.courseCode) ?? {
        course: item.courseCode,
        count: 0,
        paid: 0,
        demo: 0,
      };
      existing.count += 1;
      existing.paid += item.paymentStatus.toLowerCase().includes("paid") ? 1 : 0;
      existing.demo += item.isDemoOnly ? 1 : 0;
      map.set(item.courseCode, existing);
      return map;
    }, new Map<string, { course: string; count: number; paid: number; demo: number }>()),
  )
    .map(([, value]) => value)
    .sort((a, b) => b.count - a.count);

  const leadSourceBreakdown = Array.from(
    enrollments.reduce((map, item) => {
      const key = item.leadSource || "Unknown";
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-muted)]">
            Yuktra courses
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">
            Student enrollments
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            Snapshot of cohorts, payments, and lead flow across every Yuktra course.
          </p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-[var(--color-surface-muted)]/70 px-4 py-2 text-xs font-semibold text-[var(--color-muted)] shadow-sm">
          Last signup {lastSignup} • {weeklyIntake} this week
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total enrolled"
          value={total}
          trend={`${courseBreakdown.length} courses`}
          icon={GraduationCap}
        />
        <MetricCard
          label="Paid confirmations"
          value={paidCount}
          trend={`${pendingCount} pending`}
          icon={CheckCircle2}
          progress={{
            label: "Paid share",
            value: total ? paidCount / total : 0,
            tone: paidCount / (total || 1) > 0.7 ? "success" : "warning",
          }}
        />
        <MetricCard
          label="Demo signups"
          value={demoCount}
          trend={`${((demoCount / (total || 1)) * 100).toFixed(0)}% of pipeline`}
          icon={Users}
        />
        <MetricCard
          label="Active batches"
          value={batches.length}
          trend={`${countries.length || "No"} country footprint`}
          icon={Globe2}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2" data-hover="true">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
                Course-level summary
              </p>
              <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                Enrollment by course
              </h2>
              <p className="text-sm text-[var(--color-muted)]">
                Breakdown of paid vs demo students for every curriculum.
              </p>
            </div>
            <div className="rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-xs font-semibold text-[var(--color-primary)]">
              {total} total signups
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {courseBreakdown.map((course) => {
              const paidShare = course.count ? Math.round((course.paid / course.count) * 100) : 0;
              const demoShare = course.count ? Math.round((course.demo / course.count) * 100) : 0;
              const courseShare = total ? Math.round((course.count / total) * 100) : 0;
              return (
                <div
                  key={course.course}
                  className="flex items-center justify-between rounded-2xl border border-white/80 bg-[var(--color-surface-muted)]/70 p-4 shadow-sm transition hover:-translate-y-0.5"
                >
                  <div>
                    <p className="text-lg font-semibold text-[var(--color-foreground)]">
                      {course.course}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {paidShare}% paid • {demoShare}% demo • {courseShare}% of total
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-[var(--color-foreground)]">
                      {course.count}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[var(--color-muted)]">
                      <span className="inline-block h-2 w-20 rounded-full bg-white/70">
                        <span
                          className="block h-full rounded-full bg-[var(--color-primary)]"
                          style={{ width: `${courseShare}%` }}
                        />
                      </span>
                      <span>{courseShare}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {courseBreakdown.length === 0 && (
              <p className="text-sm text-[var(--color-muted)]">
                No enrollments yet. Students will show here once signups start flowing in.
              </p>
            )}
          </div>
        </div>

        <div className="card space-y-4 p-6" data-hover="true">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
              Pipeline signals
            </p>
            <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
              Lead and payment mix
            </h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/80 bg-[var(--color-surface-muted)]/70 p-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
                Lead sources
              </p>
              <div className="mt-2 space-y-2">
                {leadSourceBreakdown.map((source) => (
                  <div key={source.source} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[var(--color-foreground)]">{source.source}</span>
                    <span className="text-[var(--color-muted)]">{source.count}</span>
                  </div>
                ))}
                {leadSourceBreakdown.length === 0 && (
                  <p className="text-sm text-[var(--color-muted)]">No leads tracked yet.</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Conversion pulse</p>
              <p className="mt-2 text-sm text-emerald-800">
                {paidCount} paid / {pendingCount} pending · {demoCount} demo signups to nurture.
              </p>
              <p className="text-xs text-emerald-700">
                Avg. {Math.round(total / Math.max(batches.length, 1))} students per batch
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-[var(--color-surface-muted)]/70 p-3 text-sm text-[var(--color-muted)]">
              Geographic spread: {countries.length || "No"} countries • {batches.length} batches
              • {weeklyIntake} new this week.
            </div>
          </div>
        </div>
      </div>

      <StudentEnrollmentTable enrollments={enrollments} canEdit={canEdit} />
    </div>
  );
}
