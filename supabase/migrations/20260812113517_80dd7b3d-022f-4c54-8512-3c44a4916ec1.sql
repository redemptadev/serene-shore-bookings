
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ===== enums =====
CREATE TYPE public.app_role AS ENUM ('user','admin');
CREATE TYPE public.booking_status AS ENUM ('pending','confirmed','cancelled','completed');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','failed','refunded');
CREATE TYPE public.property_status AS ENUM ('draft','published');

-- ===== shared trigger =====
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== profiles =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER t_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== roles =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());

-- profile bootstrap + admin bootstrap for the host email
CREATE OR REPLACE FUNCTION public.sync_profile(
  _full_name TEXT DEFAULT NULL, _phone TEXT DEFAULT NULL,
  _country TEXT DEFAULT NULL, _avatar_url TEXT DEFAULT NULL
) RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _email TEXT := COALESCE(auth.jwt() -> 'user_metadata' ->> 'email', auth.jwt() ->> 'email');
  _phone_claim TEXT := auth.jwt() ->> 'phone';
  _meta_name TEXT := auth.jwt() -> 'user_metadata' ->> 'full_name';
  _row public.profiles;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.profiles (id, email, full_name, phone, country, avatar_url)
  VALUES (_uid, _email, COALESCE(_full_name, _meta_name), COALESCE(_phone, NULLIF(_phone_claim,'')), _country, _avatar_url)
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    country = COALESCE(EXCLUDED.country, public.profiles.country),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url)
  RETURNING * INTO _row;

  IF lower(COALESCE(_email,'')) = 'coastalhavenbnb@outlook.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'user') ON CONFLICT DO NOTHING;
  RETURN _row;
END; $$;
GRANT EXECUTE ON FUNCTION public.sync_profile(TEXT,TEXT,TEXT,TEXT) TO authenticated;

-- ===== properties =====
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  map_url TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  property_type TEXT NOT NULL DEFAULT 'villa',
  max_guests INT NOT NULL DEFAULT 2 CHECK (max_guests > 0),
  bedrooms INT NOT NULL DEFAULT 1 CHECK (bedrooms >= 0),
  beds INT NOT NULL DEFAULT 1 CHECK (beds >= 0),
  bathrooms NUMERIC NOT NULL DEFAULT 1 CHECK (bathrooms >= 0),
  amenities TEXT[] NOT NULL DEFAULT '{}',
  house_rules TEXT[] NOT NULL DEFAULT '{}',
  check_in_time TEXT NOT NULL DEFAULT '14:00',
  check_out_time TEXT NOT NULL DEFAULT '10:00',
  base_price NUMERIC NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  weekend_price NUMERIC CHECK (weekend_price >= 0),
  cleaning_fee NUMERIC NOT NULL DEFAULT 0 CHECK (cleaning_fee >= 0),
  extra_fees JSONB NOT NULL DEFAULT '[]',
  min_nights INT NOT NULL DEFAULT 1 CHECK (min_nights >= 1),
  status public.property_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_featured ON public.properties(is_featured);
GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER t_properties_updated BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "published properties public" ON public.properties FOR SELECT USING (status = 'published');
CREATE POLICY "admin reads all properties" ON public.properties FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin writes properties" ON public.properties FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ===== property images =====
CREATE TABLE public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_images_property ON public.property_images(property_id, sort_order);
GRANT SELECT ON public.property_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_images TO authenticated;
GRANT ALL ON public.property_images TO service_role;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "images of published properties public" ON public.property_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.status = 'published'));
CREATE POLICY "admin reads images" ON public.property_images FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin writes images" ON public.property_images FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ===== pricing rules (seasonal) =====
CREATE TABLE public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Season',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  nightly_price NUMERIC CHECK (nightly_price >= 0),
  discount_percent NUMERIC CHECK (discount_percent >= 0 AND discount_percent <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE INDEX idx_pricing_rules_property ON public.pricing_rules(property_id, start_date);
GRANT SELECT ON public.pricing_rules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_rules TO authenticated;
GRANT ALL ON public.pricing_rules TO service_role;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing rules public" ON public.pricing_rules FOR SELECT USING (true);
CREATE POLICY "admin writes pricing rules" ON public.pricing_rules FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ===== availability blocks =====
CREATE TABLE public.availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);
CREATE INDEX idx_blocks_property ON public.availability_blocks(property_id, start_date);
GRANT SELECT ON public.availability_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_blocks TO authenticated;
GRANT ALL ON public.availability_blocks TO service_role;
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks public" ON public.availability_blocks FOR SELECT USING (true);
CREATE POLICY "admin writes blocks" ON public.availability_blocks FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ===== bookings =====
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT ('CH-' || upper(substr(md5(gen_random_uuid()::text), 1, 8))),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  guest_name TEXT NOT NULL DEFAULT '',
  guest_email TEXT NOT NULL DEFAULT '',
  guest_phone TEXT,
  guest_notes TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INT NOT NULL DEFAULT 1 CHECK (guests > 0),
  nights INT NOT NULL DEFAULT 1,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  fees NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  booking_status public.booking_status NOT NULL DEFAULT 'pending',
  created_by_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_property ON public.bookings(property_id, check_in);
ALTER TABLE public.bookings ADD CONSTRAINT no_overlapping_active_bookings
  EXCLUDE USING gist (
    property_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  ) WHERE (booking_status IN ('pending','confirmed'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER t_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "own bookings read" ON public.bookings FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "own bookings insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "own bookings update" ON public.bookings FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "admin deletes bookings" ON public.bookings FOR DELETE TO authenticated USING (public.is_admin());

-- refuse bookings clashing with host blocked dates
CREATE OR REPLACE FUNCTION public.check_booking_against_blocks() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.booking_status IN ('pending','confirmed') AND EXISTS (
    SELECT 1 FROM public.availability_blocks b
    WHERE b.property_id = NEW.property_id
      AND daterange(b.start_date, b.end_date, '[)') && daterange(NEW.check_in, NEW.check_out, '[)')
  ) THEN
    RAISE EXCEPTION 'These dates are not available';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER t_bookings_blocks BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.check_booking_against_blocks();

-- public availability read (no personal data exposed)
CREATE OR REPLACE FUNCTION public.property_booked_ranges(_property_id UUID)
RETURNS TABLE (check_in DATE, check_out DATE)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.check_in, b.check_out FROM public.bookings b
  WHERE b.property_id = _property_id AND b.booking_status IN ('pending','confirmed');
$$;
GRANT EXECUTE ON FUNCTION public.property_booked_ranges(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_range_available(_property_id UUID, _check_in DATE, _check_out DATE)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _check_out > _check_in
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings b WHERE b.property_id = _property_id
        AND b.booking_status IN ('pending','confirmed')
        AND daterange(b.check_in, b.check_out, '[)') && daterange(_check_in, _check_out, '[)'))
    AND NOT EXISTS (
      SELECT 1 FROM public.availability_blocks a WHERE a.property_id = _property_id
        AND daterange(a.start_date, a.end_date, '[)') && daterange(_check_in, _check_out, '[)'));
$$;
GRANT EXECUTE ON FUNCTION public.is_range_available(UUID,DATE,DATE) TO anon, authenticated;

-- ===== payments =====
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'mpesa',
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  status public.payment_status NOT NULL DEFAULT 'pending',
  provider_reference TEXT,
  checkout_request_id TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_booking ON public.payments(booking_id);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER t_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "own payments read" ON public.payments FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()));

-- ===== reviews =====
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  author_name TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_property ON public.reviews(property_id);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER t_reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "visible reviews public" ON public.reviews FOR SELECT USING (is_hidden = false);
CREATE POLICY "own or admin reviews read" ON public.reviews FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "reviews after completed stay" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.user_id = auth.uid() AND b.property_id = reviews.property_id AND b.booking_status = 'completed'));
CREATE POLICY "own reviews update" ON public.reviews FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "own or admin reviews delete" ON public.reviews FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- ===== favorites =====
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own favorites" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ===== notifications =====
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  audience TEXT NOT NULL DEFAULT 'user',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'info',
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (audience = 'admin' AND public.is_admin()));
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR (audience = 'admin' AND public.is_admin()))
  WITH CHECK (user_id = auth.uid() OR (audience = 'admin' AND public.is_admin()));

-- ===== admin settings (singleton) =====
CREATE TABLE public.admin_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  business_name TEXT NOT NULL DEFAULT 'Coastal Haven',
  business_description TEXT NOT NULL DEFAULT 'Boutique coastal stays in Kilifi, Kenya.',
  host_name TEXT NOT NULL DEFAULT '',
  host_email TEXT NOT NULL DEFAULT 'coastalhavenbnb@outlook.com',
  host_phone TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT NOT NULL DEFAULT '+254105845387',
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  website_url TEXT,
  location_info TEXT NOT NULL DEFAULT 'Kilifi, Kenya',
  check_in_instructions TEXT NOT NULL DEFAULT '',
  check_out_instructions TEXT NOT NULL DEFAULT '',
  cancellation_policy TEXT NOT NULL DEFAULT '',
  booking_policy TEXT NOT NULL DEFAULT '',
  payment_instructions TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'KES',
  theme TEXT NOT NULL DEFAULT 'ocean-blue',
  contact_email TEXT NOT NULL DEFAULT 'coastalhavenbnb@outlook.com',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER t_settings_updated BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "settings public read" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "admin writes settings" ON public.admin_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.admin_settings (id) VALUES (true);
