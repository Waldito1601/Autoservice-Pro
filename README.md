# AutoService Pro

Internal service management app for a car service business.  
Replaces the paper notebook workflow with a digital system shared in real time via Supabase.

---

## Quick Start

### 1. Set up the Supabase table

Go to your Supabase project → SQL Editor and run:

```sql
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone_number text,
  car_model text not null,
  service_type text not null,
  service_description text,
  price numeric(10,2) not null default 0,
  service_date date not null,
  service_time time,
  payment_status text not null default 'pending',
  created_at timestamptz default now()
);

alter table services enable row level security;

create policy "Allow all for MVP"
  on services for all
  using (true)
  with check (true);
```

### 2. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:5173

### 3. Connect Supabase

When the app opens, a settings dialog will appear.  
Enter your:
- **Project URL** — found at Supabase → Settings → API (e.g. `https://xxxx.supabase.co`)
- **Publishable / Anon key** — same page, labeled "Publishable key"

Click **Connect**. Credentials are saved in localStorage so you only do this once.

---

## Sections

| Section | Purpose |
|---|---|
| Dashboard | Live overview of today's stats and recent services |
| Service Dept. | Enter new service records |
| Administration | Search records, mark payments as Paid |
| Daily Report | Generate printable end-of-day report with calculations |

## Daily Report Calculation Logic

```
total      = sum of all service prices
base       = total / 1.16          (removes IVA)
iva        = total - base
commission = base * 0.30           (30% tools & space)
remaining  = base - commission
svc_pay    = remaining / 2         (service dept.)
co_pay     = remaining / 2         (company)
```

## Tech Stack

- React 18 + Vite
- Supabase JS v2 (database + realtime)
- Vanilla CSS (no UI framework)
