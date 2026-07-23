
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');
CREATE TYPE public.newsletter_status AS ENUM ('draft', 'published', 'archived');

-- Shared updated_at trigger fn
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Profiles
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles self read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO anon, authenticated;

-- Admins can manage roles
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can read all profiles
CREATE POLICY "admins read profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-provision profile + first user = admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_count INT;
BEGIN
  INSERT INTO public.profiles(user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT count(*) INTO user_count FROM public.user_roles WHERE role = 'admin';
  IF user_count = 0 THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Newsletters
CREATE TABLE public.newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  edition_number TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  publication_date DATE NOT NULL,
  publication_month INT,
  publication_year INT,
  pdf_path TEXT NOT NULL,
  pdf_filename TEXT,
  pdf_size BIGINT,
  cover_image_path TEXT,
  status public.newsletter_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  categories TEXT[] NOT NULL DEFAULT '{}',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  tech_spotlight_title TEXT,
  tech_spotlight_description TEXT,
  tech_spotlight_image_path TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX newsletters_status_pub_date_idx ON public.newsletters(status, publication_date DESC);
CREATE INDEX newsletters_year_idx ON public.newsletters(publication_year);

GRANT SELECT ON public.newsletters TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.newsletters TO authenticated;
GRANT ALL ON public.newsletters TO service_role;
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read published" ON public.newsletters FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY "admins read all" ON public.newsletters FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins write" ON public.newsletters FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update" ON public.newsletters FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete" ON public.newsletters FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER newsletters_updated BEFORE UPDATE ON public.newsletters
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Admin activity
CREATE TABLE public.admin_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  newsletter_id UUID REFERENCES public.newsletters(id) ON DELETE SET NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_activity TO authenticated;
GRANT ALL ON public.admin_activity TO service_role;
ALTER TABLE public.admin_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read activity" ON public.admin_activity FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert activity" ON public.admin_activity FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid());

-- App settings (key/value)
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins write settings" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER app_settings_updated BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.app_settings(key, value) VALUES
  ('contact_email', '"info@khmtechnology.com"'::jsonb),
  ('homepage_spotlight', '{"enabled": false}'::jsonb);

-- Seed 6 sample newsletters (Feb-Jul 2026). PDF path points to a sample file uploaded to storage separately.
INSERT INTO public.newsletters
  (title, slug, edition_number, description, publication_date, publication_month, publication_year,
   pdf_path, pdf_filename, status, categories, keywords, is_featured, published_at,
   tech_spotlight_title, tech_spotlight_description)
VALUES
  ('People, Progress, Innovation — February 2026', 'khm-info-hub-feb-2026', 'Edition 01 / 2026',
   'Kicking off the year with a look at KHM''s connected vision, new hires across our African markets, and the priorities shaping our 2026 roadmap.',
   '2026-02-14', 2, 2026, 'samples/khm-newsletter-sample.pdf', 'khm-feb-2026.pdf', 'published',
   ARRAY['Company Updates','People'], ARRAY['2026','vision','africa','hiring'], false, '2026-02-14 09:00:00+00',
   NULL, NULL),
  ('Building Momentum — March 2026', 'khm-info-hub-mar-2026', 'Edition 02 / 2026',
   'Progress reports from our connected services teams, employee achievements, and a spotlight on our expanding partnerships across the region.',
   '2026-03-13', 3, 2026, 'samples/khm-newsletter-sample.pdf', 'khm-mar-2026.pdf', 'published',
   ARRAY['Company Updates','Partnerships'], ARRAY['services','partnerships','achievements'], false, '2026-03-13 09:00:00+00',
   NULL, NULL),
  ('Connected Services in Focus — April 2026', 'khm-info-hub-apr-2026', 'Edition 03 / 2026',
   'A deeper look at how our connected services are transforming customer experiences, plus training programmes rolling out this quarter.',
   '2026-04-17', 4, 2026, 'samples/khm-newsletter-sample.pdf', 'khm-apr-2026.pdf', 'published',
   ARRAY['Technology','Training'], ARRAY['connected services','training','q2'], false, '2026-04-17 09:00:00+00',
   NULL, NULL),
  ('One Connected Vision — May 2026', 'khm-info-hub-may-2026', 'Edition 04 / 2026',
   'Cross-market updates from our African operations, a wrap-up of employee recognition awards, and news from our engineering practice.',
   '2026-05-15', 5, 2026, 'samples/khm-newsletter-sample.pdf', 'khm-may-2026.pdf', 'published',
   ARRAY['People','Engineering'], ARRAY['recognition','engineering','africa'], false, '2026-05-15 09:00:00+00',
   NULL, NULL),
  ('Mid-Year Progress — June 2026', 'khm-info-hub-jun-2026', 'Edition 05 / 2026',
   'Half-year highlights, portfolio momentum, and a look ahead at organisational priorities as we head into H2.',
   '2026-06-19', 6, 2026, 'samples/khm-newsletter-sample.pdf', 'khm-jun-2026.pdf', 'published',
   ARRAY['Company Updates','Strategy'], ARRAY['h1 review','strategy','roadmap'], true, '2026-06-19 09:00:00+00',
   NULL, NULL),
  ('Momentum Continues — July 2026', 'khm-info-hub-jul-2026', 'Edition 06 / 2026',
   'This edition features new capabilities from the technology team, updates from our customer success partners, and a preview of Q3 initiatives.',
   '2026-07-17', 7, 2026, 'samples/khm-newsletter-sample.pdf', 'khm-jul-2026.pdf', 'published',
   ARRAY['Technology','Customer Success'], ARRAY['q3','platform','customer success'], true, '2026-07-17 09:00:00+00',
   'YourPass', 'A new customer engagement toolset piloted across selected markets this month. (Note: name "YourPass" pending brand and spelling confirmation.)');
