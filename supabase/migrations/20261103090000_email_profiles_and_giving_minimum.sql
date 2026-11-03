-- ===============================================================
-- 20261103090000_email_profiles_and_giving_minimum.sql
-- Provision member profiles for the alpha email/password flow and
-- enforce the current minimum without breaking historical payments.
-- ===============================================================

BEGIN;

-- ===============================================================
-- EMAIL SIGN-UP PROFILE SUPPORT
-- Email sign-up stores the submitted phone in Auth metadata; it does
-- not populate auth.users.phone. Keep profile phone nullable until a
-- phone is supplied through Auth, and never grant staff authority or
-- verification from metadata.
-- ===============================================================

ALTER TABLE public.profiles
    ALTER COLUMN phone DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.provision_phone_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    profile_name text;
    auth_phone text;
BEGIN
    profile_name := NULLIF(
        pg_catalog.btrim(NEW.raw_user_meta_data ->> 'full_name'),
        ''
    );
    auth_phone := NULLIF(pg_catalog.btrim(NEW.phone), '');

    IF profile_name IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.profiles (id, full_name, phone, role, is_verified)
    VALUES (NEW.id, profile_name, auth_phone, 'member', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.members (user_id)
    SELECT NEW.id
    WHERE EXISTS (
        SELECT 1 FROM public.profiles AS profile WHERE profile.id = NEW.id
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Existing email accounts with a submitted display name receive a
-- profile and member row. Keep their phone unset until Auth owns it.
INSERT INTO public.profiles (id, full_name, phone, role, is_verified)
SELECT auth_user.id,
       NULLIF(pg_catalog.btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
       NULL,
       'member'::public.user_role,
       false
FROM auth.users AS auth_user
WHERE NULLIF(pg_catalog.btrim(auth_user.raw_user_meta_data ->> 'full_name'), '') IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.members (user_id)
SELECT profile.id
FROM public.profiles AS profile
ON CONFLICT (user_id) DO NOTHING;

-- ===============================================================
-- ₦500 MINIMUM FOR NEW OR REPRICED OFFERINGS
-- Leave historical amounts intact so pending legacy gifts can still
-- be verified and settled. Status-only updates remain permitted.
-- ===============================================================

CREATE OR REPLACE FUNCTION public.enforce_offerings_minimum_ngn_500()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.amount IS NULL OR NEW.amount < 500 THEN
        RAISE EXCEPTION 'Offering amount must be at least NGN 500'
            USING ERRCODE = '23514',
                  CONSTRAINT = 'offerings_amount_minimum_ngn_500';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_offerings_minimum_ngn_500()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS offerings_minimum_on_insert ON public.offerings;
CREATE TRIGGER offerings_minimum_on_insert
    BEFORE INSERT ON public.offerings
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_offerings_minimum_ngn_500();

DROP TRIGGER IF EXISTS offerings_minimum_on_amount_update ON public.offerings;
CREATE TRIGGER offerings_minimum_on_amount_update
    BEFORE UPDATE OF amount ON public.offerings
    FOR EACH ROW
    WHEN (NEW.amount IS DISTINCT FROM OLD.amount)
    EXECUTE FUNCTION public.enforce_offerings_minimum_ngn_500();

COMMIT;
