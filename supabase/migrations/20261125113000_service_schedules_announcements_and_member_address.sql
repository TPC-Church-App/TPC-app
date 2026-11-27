-- ===============================================================
-- 20261125113000_service_schedules_announcements_and_member_address.sql
-- Adds recurring service schedule templates, church announcements,
-- default church venue/directions settings, and member address
-- provisioning without modifying already-applied migrations.
-- ===============================================================

-- ===============================================================
-- SHARED UPDATED_AT HELPER
-- ===============================================================

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := pg_catalog.now();
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_updated_at()
    FROM PUBLIC, anon, authenticated;

-- ===============================================================
-- EXTEND SERVICES WITH PERIOD METADATA AND DIRECTIONS
-- All added columns are nullable or carry safe constant defaults.
-- ===============================================================

ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS period_type TEXT NOT NULL DEFAULT 'one_time',
    ADD COLUMN IF NOT EXISTS period_label TEXT,
    ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
    ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
    ADD COLUMN IF NOT EXISTS directions_url TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'services_period_type_check'
          AND conrelid = 'public.services'::regclass
    ) THEN
        ALTER TABLE public.services
            ADD CONSTRAINT services_period_type_check
            CHECK (period_type IN ('one_time', 'weekly', 'biweekly', 'monthly', 'special_period'));
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS touch_services_updated_at ON public.services;
CREATE TRIGGER touch_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_services_active_schedule
    ON public.services (is_active, service_date, start_time);

-- ===============================================================
-- RECURRING SERVICE SCHEDULES (ADMIN-MANAGED TEMPLATES)
-- ===============================================================

CREATE TABLE IF NOT EXISTS public.service_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'biweekly', 'monthly', 'special_period')),
    period_label TEXT,
    day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
    day_of_month SMALLINT CHECK (day_of_month BETWEEN 1 AND 31),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
    location TEXT,
    directions_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT service_schedules_time_order_check CHECK (end_time > start_time)
);

ALTER TABLE public.service_schedules ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS touch_service_schedules_updated_at ON public.service_schedules;
CREATE TRIGGER touch_service_schedules_updated_at
    BEFORE UPDATE ON public.service_schedules
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_service_schedules_active_period
    ON public.service_schedules (is_active, period_type);

DROP POLICY IF EXISTS "Everyone can view active service schedules" ON public.service_schedules;
CREATE POLICY "Everyone can view active service schedules"
    ON public.service_schedules
    FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Pastors/Admins can manage service schedules" ON public.service_schedules;
CREATE POLICY "Pastors/Admins can manage service schedules"
    ON public.service_schedules
    FOR ALL
    TO authenticated
    USING (public.has_role('pastor') OR public.has_role('super_admin'))
    WITH CHECK (public.has_role('pastor') OR public.has_role('super_admin'));

REVOKE ALL ON TABLE public.service_schedules FROM PUBLIC;
GRANT SELECT ON TABLE public.service_schedules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.service_schedules TO authenticated;

-- ===============================================================
-- CHURCH ANNOUNCEMENTS
-- ===============================================================

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'youth', 'office', 'event', 'weekly')),
    icon_type TEXT NOT NULL DEFAULT 'megaphone' CHECK (icon_type IN ('megaphone', 'church', 'calendar', 'heart')),
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS touch_announcements_updated_at ON public.announcements;
CREATE TRIGGER touch_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_announcements_active_published
    ON public.announcements (is_active, published_at DESC);

DROP POLICY IF EXISTS "Everyone can view active announcements" ON public.announcements;
CREATE POLICY "Everyone can view active announcements"
    ON public.announcements
    FOR SELECT
    USING (
        is_active = true
        AND published_at <= NOW()
        AND (expires_at IS NULL OR expires_at > NOW())
    );

DROP POLICY IF EXISTS "Pastors/Admins can manage announcements" ON public.announcements;
CREATE POLICY "Pastors/Admins can manage announcements"
    ON public.announcements
    FOR ALL
    TO authenticated
    USING (public.has_role('pastor') OR public.has_role('super_admin'))
    WITH CHECK (public.has_role('pastor') OR public.has_role('super_admin'));

REVOKE ALL ON TABLE public.announcements FROM PUBLIC;
GRANT SELECT ON TABLE public.announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.announcements TO authenticated;

-- ===============================================================
-- DEFAULT CHURCH SETTINGS (SINGLETON ROW)
-- ===============================================================

CREATE TABLE IF NOT EXISTS public.church_settings (
    id TEXT PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
    church_name TEXT NOT NULL DEFAULT 'The Pentecostal Congregation',
    default_location TEXT NOT NULL DEFAULT 'Main Auditorium',
    default_address TEXT,
    default_directions_url TEXT,
    default_timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.church_settings ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS touch_church_settings_updated_at ON public.church_settings;
CREATE TRIGGER touch_church_settings_updated_at
    BEFORE UPDATE ON public.church_settings
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.church_settings (
    id,
    church_name,
    default_location,
    default_timezone
)
VALUES (
    'default',
    'The Pentecostal Congregation',
    'Main Auditorium',
    'Africa/Lagos'
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Everyone can view church settings" ON public.church_settings;
CREATE POLICY "Everyone can view church settings"
    ON public.church_settings
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Pastors/Admins can manage church settings" ON public.church_settings;
CREATE POLICY "Pastors/Admins can manage church settings"
    ON public.church_settings
    FOR ALL
    TO authenticated
    USING (public.has_role('pastor') OR public.has_role('super_admin'))
    WITH CHECK (public.has_role('pastor') OR public.has_role('super_admin'));

REVOKE ALL ON TABLE public.church_settings FROM PUBLIC;
GRANT SELECT ON TABLE public.church_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.church_settings TO authenticated;

-- ===============================================================
-- PERSIST MEMBER ADDRESS FROM SIGN-UP METADATA AND ALLOW OWN UPDATE
-- ===============================================================

CREATE OR REPLACE FUNCTION public.provision_phone_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    profile_name text;
    auth_phone text;
    member_address text;
BEGIN
    profile_name := NULLIF(
        pg_catalog.btrim(NEW.raw_user_meta_data ->> 'full_name'),
        ''
    );
    auth_phone := NULLIF(pg_catalog.btrim(NEW.phone), '');
    member_address := NULLIF(
        pg_catalog.btrim(NEW.raw_user_meta_data ->> 'address'),
        ''
    );

    IF profile_name IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.profiles (id, full_name, phone, role, is_verified)
    VALUES (NEW.id, profile_name, auth_phone, 'member', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.members (user_id, address)
    SELECT NEW.id, member_address
    WHERE EXISTS (
        SELECT 1 FROM public.profiles AS profile WHERE profile.id = NEW.id
    )
    ON CONFLICT (user_id) DO UPDATE
        SET address = COALESCE(public.members.address, EXCLUDED.address);

    RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Members can update own details" ON public.members;
CREATE POLICY "Members can update own details"
    ON public.members
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

REVOKE UPDATE ON public.members FROM anon, authenticated;
GRANT UPDATE (address) ON public.members TO authenticated;

-- ===============================================================
-- SEED DEFAULT TPC RECURRING SERVICES (IDEMPOTENT)
-- Sunday Workers Prayer (8:30 AM), Sunday Worship (9:00 AM),
-- and Wednesday Midweek Service (6:00 PM) in Africa/Lagos (WAT).
-- ===============================================================

INSERT INTO public.service_schedules (
    title,
    description,
    period_type,
    period_label,
    day_of_week,
    start_time,
    end_time,
    timezone,
    location,
    is_active
)
SELECT
    seed.title,
    seed.description,
    seed.period_type,
    seed.period_label,
    seed.day_of_week,
    seed.start_time,
    seed.end_time,
    'Africa/Lagos',
    'Main Auditorium',
    true
FROM (
    VALUES
        (
            'Workers Prayer Meeting',
            'Pre-service prayer and preparation for church workers.',
            'weekly',
            'Every Sunday • 8:30 AM',
            0::smallint,
            '08:30:00'::time,
            '09:00:00'::time
        ),
        (
            'Sunday Worship Service',
            'Come together for worship, prayer and the Word.',
            'weekly',
            'Every Sunday • 9:00 AM',
            0::smallint,
            '09:00:00'::time,
            '11:30:00'::time
        ),
        (
            'Wednesday Midweek Service',
            'Midweek Bible study, prayer and fellowship.',
            'weekly',
            'Every Wednesday • 6:00 PM',
            3::smallint,
            '18:00:00'::time,
            '19:30:00'::time
        )
) AS seed(title, description, period_type, period_label, day_of_week, start_time, end_time)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.service_schedules existing
    WHERE existing.title = seed.title
);

