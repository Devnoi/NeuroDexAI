create table if not exists public.patients (
  patient_id text primary key,
  name text not null,
  affected_side text not null check (affected_side in ('left', 'right')),
  therapist_email text default 'therapist@neurodex.com',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  session_id text primary key,
  patient_id text not null references public.patients(patient_id) on delete cascade,
  assessment_date timestamptz not null default now(),
  game_mode text not null default 'random',
  metrics jsonb not null default '{}'::jsonb,
  raw_logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sessions_patient_date
  on public.sessions(patient_id, assessment_date desc);

create index if not exists idx_sessions_metrics_gin
  on public.sessions using gin(metrics);

create index if not exists idx_sessions_raw_logs_gin
  on public.sessions using gin(raw_logs);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_patients_updated_at on public.patients;
create trigger set_patients_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

drop trigger if exists set_sessions_updated_at on public.sessions;
create trigger set_sessions_updated_at
before update on public.sessions
for each row execute function public.set_updated_at();
