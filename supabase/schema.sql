-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_url text,
  category_id uuid references public.categories(id) on delete set null,
  author_name text default 'Admin',
  status text not null default 'draft', -- draft | published
  published_at timestamptz,
  views int not null default 0,
  tags text[] default '{}'::text[],
  tts_parts jsonb,
  tts_voice text,
  tts_hash text,
  tts_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_articles_status_published_at on public.articles(status, published_at desc);
create index if not exists idx_articles_category on public.articles(category_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_articles_updated_at on public.articles;
create trigger trg_articles_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

-- Views log table for trending
create table if not exists public.article_views (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_article_views_article_id_created_at
on public.article_views(article_id, created_at);

-- RLS
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.article_views enable row level security;

-- Public reads
create policy "public read categories"
on public.categories for select
using (true);

create policy "public read published articles"
on public.articles for select
using (status = 'published');

-- Admin writes (authenticated)
create policy "auth write categories"
on public.categories for insert
to authenticated
with check (true);

create policy "auth update categories"
on public.categories for update
to authenticated
using (true)
with check (true);

create policy "auth delete categories"
on public.categories for delete
to authenticated
using (true);

create policy "auth write articles"
on public.articles for insert
to authenticated
with check (true);

create policy "auth update articles"
on public.articles for update
to authenticated
using (true)
with check (true);

create policy "auth delete articles"
on public.articles for delete
to authenticated
using (true);

-- Optional read for debugging
create policy "public read article_views (optional)"
on public.article_views for select
using (true);

-- RPC trending
create or replace function public.get_trending_24h(p_limit int default 8)
returns table (id uuid, title text, slug text, cover_url text, published_at timestamptz, views_24h bigint)
language sql stable as $$
  select a.id, a.title, a.slug, a.cover_url, a.published_at, count(v.id) as views_24h
  from public.articles a
  join public.article_views v on v.article_id = a.id
  where a.status='published' and v.created_at >= now() - interval '24 hours'
  group by a.id
  order by views_24h desc, a.published_at desc
  limit p_limit;
$$;

create or replace function public.get_trending_7d(p_limit int default 8)
returns table (id uuid, title text, slug text, cover_url text, published_at timestamptz, views_7d bigint)
language sql stable as $$
  select a.id, a.title, a.slug, a.cover_url, a.published_at, count(v.id) as views_7d
  from public.articles a
  join public.article_views v on v.article_id = a.id
  where a.status='published' and v.created_at >= now() - interval '7 days'
  group by a.id
  order by views_7d desc, a.published_at desc
  limit p_limit;
$$;

create or replace function public.get_trending_30d(p_limit int default 8)
returns table (id uuid, title text, slug text, cover_url text, published_at timestamptz, views_30d bigint)
language sql stable as $$
  select a.id, a.title, a.slug, a.cover_url, a.published_at, count(v.id) as views_30d
  from public.articles a
  join public.article_views v on v.article_id = a.id
  where a.status='published' and v.created_at >= now() - interval '30 days'
  group by a.id
  order by views_30d desc, a.published_at desc
  limit p_limit;
$$;

-- Seed categories
insert into public.categories (name, slug, sort_order) values
('ទាំងអស់','all',0),
('ទូទៅ','general',1),
('បច្ចេកវិទ្យា','tech',2),
('អន្តរជាតិ','world',3),
('កីឡា','sport',4),
('សុខភាព','health',5),
('កម្សាន្ត','entertainment',6)
on conflict (slug) do nothing;
