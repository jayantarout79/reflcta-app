## YuktraAI CRM

Internal CRM + operations cockpit for the YuktraAI services org. Built with Next.js (App Router + TypeScript), Tailwind CSS 4, Supabase (Auth, DB, Storage), OpenAI, React Query, and Recharts.

### Features

- **Role-aware layout** with Supabase Auth, middleware route protection, and per-resource permissions (Admin, Manager, Employee, Viewer).
- **Clients & Leads:** Pipeline board, lead-to-client conversion, searchable client cards, and client detail view with AI situation summaries plus linked projects/invoices/files.
- **Projects, Tasks, Time:** Project list/detail pages, task management, activity stream, and time logging tied to Supabase actions.
- **Finance:** Invoice builder with line items, statuses, PDF-ready cards, and expenses tracker with categories + allocations.
- **HR:** Employee directory with admin-only salary visibility.
- **Files:** Supabase Storage upload workflow mapped to CRM entities.
- **Analytics Dashboard:** Metrics, charts (Recharts), and workload view.
- **AI Studio:** OpenAI-powered summaries and proposal drafts with safe prompts and env-configured keys.

### Local Development

```bash
npm install
cp .env.example .env.local
# fill Supabase + OpenAI secrets
npm run dev
```

Visit `http://localhost:3000`. `NEXT_PUBLIC_ENABLE_DEMO=true` (default) seeds mock data so the UI works without Supabase while still exercising the same data layer.

### Environment Variables

| Variable | Description |
| -------- | ----------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for client/session APIs |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side service role key for privileged actions |
| `OPENAI_API_KEY` | OpenAI API key for summaries/proposals |
| `NEXT_PUBLIC_ENABLE_DEMO` | Optional toggle (default `true`) to run without Supabase |

### Database Sketch

See `/src/lib/types.ts` for the entity model. Recommended Supabase tables: `profiles`, `leads`, `clients`, `projects`, `tasks`, `time_entries`, `invoices`, `expenses`, `employees`, `documents`. Each server action in `/src/actions/*` outlines expected columns.

### Testing & Linting

```bash
npm run lint
```

The app relies on React Query, Suspense-friendly server components, and Tailwind utility classes, so no extra build steps are required beyond `next build`.
