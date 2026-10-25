-- ===============================================================
-- 20261022090000_harden_access_and_payments.sql
-- Restricts protected writes and settles verified Paystack payments
-- in one transaction. This follows the original migration without
-- changing an already-applied migration's executable statements.
-- ===============================================================

BEGIN;

-- ===============================================================
-- SAFE ROLE LOOKUP
-- Fully qualified names prevent caller-controlled search paths
-- from changing which objects a privileged function accesses.
-- Pending profiles do not receive a staff role's permissions.
-- ===============================================================

CREATE OR REPLACE FUNCTION public.has_role(required_role public.user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles AS profile
        WHERE profile.id = auth.uid()
          AND profile.role = required_role
          AND profile.is_verified IS TRUE
    );
$$;

REVOKE ALL ON FUNCTION public.has_role(public.user_role) FROM PUBLIC, anon;
-- Public service/fund SELECT policies also evaluate this helper.
-- An anonymous caller has no auth.uid(), so the helper returns false.
GRANT EXECUTE ON FUNCTION public.has_role(public.user_role)
    TO anon, authenticated, service_role;

-- ===============================================================
-- PROTECTED PROFILE AND NOTIFICATION FIELDS
-- A member can rename their own profile, not assign staff authority
-- or alter an Auth-managed phone number. Staff authority changes
-- use the checked operations below instead of generic row updates.
-- ===============================================================

REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;

DROP POLICY "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Ushers can look up member profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.has_role('usher'));

REVOKE UPDATE ON public.notifications FROM anon, authenticated;
GRANT UPDATE (is_read) ON public.notifications TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_profile_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := pg_catalog.now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER touch_profile_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_profile_updated_at();

-- ===============================================================
-- LIMITED PROFILE PROVISIONING
-- Auth metadata supplies a display name only. Role and verification
-- never come from user metadata. Missing name/phone data leaves
-- profile completion pending without breaking an OTP signup.
-- ===============================================================

CREATE OR REPLACE FUNCTION public.provision_phone_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    profile_name text;
BEGIN
    profile_name := pg_catalog.btrim(NEW.raw_user_meta_data ->> 'full_name');

    IF NEW.phone IS NULL OR pg_catalog.btrim(NEW.phone) = ''
       OR profile_name IS NULL OR profile_name = '' THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.profiles (id, full_name, phone, role, is_verified)
    VALUES (NEW.id, profile_name, NEW.phone, 'member', false)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.members (user_id)
    SELECT NEW.id
    WHERE EXISTS (SELECT 1 FROM public.profiles AS profile WHERE profile.id = NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.provision_phone_profile()
    FROM PUBLIC, anon, authenticated;

CREATE TRIGGER provision_phone_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.provision_phone_profile();

-- Existing users receive profiles only when real required data is
-- available. Incomplete Auth records need a later completion flow.
INSERT INTO public.profiles (id, full_name, phone, role, is_verified)
SELECT auth_user.id,
       pg_catalog.btrim(auth_user.raw_user_meta_data ->> 'full_name'),
       auth_user.phone,
       'member'::public.user_role,
       false
FROM auth.users AS auth_user
WHERE auth_user.phone IS NOT NULL
  AND pg_catalog.btrim(auth_user.phone) <> ''
  AND NULLIF(pg_catalog.btrim(auth_user.raw_user_meta_data ->> 'full_name'), '') IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.members (user_id)
SELECT profile.id FROM public.profiles AS profile
ON CONFLICT (user_id) DO NOTHING;

-- ===============================================================
-- AUTHORIZED MEMBERSHIP VERIFICATION AND ROLE CHANGES
-- Ushers confirm other members; revocation requires a Pastor/Admin.
-- Only a Super Admin can change roles, and neither operation grants
-- a caller new powers over self.
-- ===============================================================

CREATE OR REPLACE FUNCTION public.set_member_verification(
    p_user_id uuid,
    p_is_verified boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    previous_verification boolean;
    target_role public.user_role;
BEGIN
    IF auth.uid() IS NULL
       OR NOT (public.has_role('usher') OR public.has_role('pastor')
               OR public.has_role('super_admin')) THEN
        RAISE EXCEPTION 'Membership verification requires an authorized staff role'
            USING ERRCODE = '42501';
    END IF;

    IF p_user_id = auth.uid() OR p_is_verified IS NULL THEN
        RAISE EXCEPTION 'Cannot verify yourself or submit an empty verification value'
            USING ERRCODE = '22023';
    END IF;

    IF p_is_verified IS FALSE
       AND NOT (public.has_role('pastor') OR public.has_role('super_admin')) THEN
        RAISE EXCEPTION 'Only a Pastor or Super Admin may revoke membership verification'
            USING ERRCODE = '42501';
    END IF;

    SELECT profile.is_verified, profile.role INTO previous_verification, target_role
    FROM public.profiles AS profile
    WHERE profile.id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Member profile not found' USING ERRCODE = 'P0002';
    END IF;

    IF target_role <> 'member' AND NOT public.has_role('super_admin') THEN
        RAISE EXCEPTION 'Only a Super Admin may change staff verification'
            USING ERRCODE = '42501';
    END IF;

    IF previous_verification IS NOT DISTINCT FROM p_is_verified THEN
        RETURN;
    END IF;

    UPDATE public.profiles SET is_verified = p_is_verified WHERE id = p_user_id;

    INSERT INTO public.audit_logs (user_id, action, details)
    VALUES (auth.uid(), 'membership.verification_changed',
        pg_catalog.jsonb_build_object('target_user_id', p_user_id,
            'previous', previous_verification, 'current', p_is_verified));
END;
$$;

CREATE OR REPLACE FUNCTION public.set_member_role(
    p_user_id uuid,
    p_role public.user_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    previous_role public.user_role;
BEGIN
    IF auth.uid() IS NULL OR NOT public.has_role('super_admin') THEN
        RAISE EXCEPTION 'Role changes require a Super Admin'
            USING ERRCODE = '42501';
    END IF;

    IF p_user_id = auth.uid() OR p_role IS NULL THEN
        RAISE EXCEPTION 'Cannot change your own role or submit an empty role'
            USING ERRCODE = '22023';
    END IF;

    SELECT profile.role INTO previous_role
    FROM public.profiles AS profile
    WHERE profile.id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Member profile not found' USING ERRCODE = 'P0002';
    END IF;

    IF previous_role = p_role THEN
        RETURN;
    END IF;

    UPDATE public.profiles SET role = p_role WHERE id = p_user_id;

    INSERT INTO public.audit_logs (user_id, action, details)
    VALUES (auth.uid(), 'membership.role_changed',
        pg_catalog.jsonb_build_object('target_user_id', p_user_id,
            'previous', previous_role, 'current', p_role));
END;
$$;

REVOKE ALL ON FUNCTION public.set_member_verification(uuid, boolean)
    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_member_role(uuid, public.user_role)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_member_verification(uuid, boolean)
    TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_member_role(uuid, public.user_role)
    TO authenticated;

-- ===============================================================
-- REMOVE CLIENT-CONTROLLED FINANCIAL AND CHECK-IN WRITES
-- Offering initialization is performed by the authenticated Edge
-- Function using its server-only credential. Attendance writes stay
-- closed until a trusted QR/manual check-in operation exists.
-- ===============================================================

DROP POLICY "Members can insert own offerings" ON public.offerings;
REVOKE INSERT, UPDATE, DELETE ON public.offerings FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.webhook_events FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;

DROP POLICY "Members can insert own attendance" ON public.attendance;
DROP POLICY "Ushers can insert attendance" ON public.attendance;
REVOKE INSERT, UPDATE, DELETE ON public.attendance FROM anon, authenticated;

-- ===============================================================
-- PAYMENT INTEGRITY AND FINANCIAL RETENTION
-- Amounts remain decimal naira in offerings and integer kobo in
-- provider payloads. Existing duplicates or invalid historical data
-- must be reconciled before this migration can succeed; no records
-- are silently removed to make a constraint pass.
-- ===============================================================

ALTER TABLE public.offerings
    ADD COLUMN currency text NOT NULL DEFAULT 'NGN',
    ADD CONSTRAINT offerings_currency_ngn CHECK (currency = 'NGN'),
    ADD CONSTRAINT offerings_amount_max CHECK (amount <= 1000000);

ALTER TABLE public.payments
    ADD COLUMN provider_transaction_id text,
    ADD CONSTRAINT payments_one_per_offering UNIQUE (offering_id),
    ADD CONSTRAINT payments_provider_transaction_unique
        UNIQUE (provider, provider_transaction_id);

-- Deleting an Auth user/profile or offering must not cascade through
-- saved financial records. Retention/anonymization policy remains a
-- separate documented decision rather than an accidental FK effect.
ALTER TABLE public.offerings
    DROP CONSTRAINT offerings_user_id_fkey,
    ADD CONSTRAINT offerings_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.payments
    DROP CONSTRAINT payments_offering_id_fkey,
    ADD CONSTRAINT payments_offering_id_fkey
        FOREIGN KEY (offering_id) REFERENCES public.offerings(id) ON DELETE RESTRICT;

-- ===============================================================
-- INITIALIZATION AUDIT EVENTS
-- The checked server insert/failure update and its audit record
-- share one transaction, so failed audit writes cannot be ignored.
-- Successful settlement records its own audit event below.
-- ===============================================================

CREATE OR REPLACE FUNCTION public.audit_offering_initialization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (user_id, action, details)
        VALUES (NEW.user_id, 'offering.created',
            pg_catalog.jsonb_build_object('offering_id', NEW.id,
                'reference', NEW.reference, 'amount', NEW.amount,
                'currency', NEW.currency, 'status', NEW.status));
    ELSIF NEW.status = 'failed' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.audit_logs (user_id, action, details)
        VALUES (NEW.user_id, 'offering.initialization_failed',
            pg_catalog.jsonb_build_object('offering_id', NEW.id,
                'reference', NEW.reference));
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_offering_initialization()
    FROM PUBLIC, anon, authenticated;

CREATE TRIGGER audit_offering_initialization
AFTER INSERT OR UPDATE OF status ON public.offerings
FOR EACH ROW EXECUTE FUNCTION public.audit_offering_initialization();

-- ===============================================================
-- ATOMIC PAYSTACK SETTLEMENT
-- Only trusted server callers can use this operation. The Edge
-- Function first verifies Paystack's signature/response and caller
-- ownership. This function locks the offering and validates exact
-- monetary identity before changing any financial records.
-- ===============================================================

CREATE OR REPLACE FUNCTION public.settle_paystack_payment(
    p_reference text,
    p_amount_minor bigint,
    p_currency text,
    p_provider_transaction_id text,
    p_channel text,
    p_paid_at timestamptz,
    p_event_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    offering_row public.offerings%ROWTYPE;
    payment_row public.payments%ROWTYPE;
    was_settled boolean;
    event_reference text;
BEGIN
    IF p_reference IS NULL OR pg_catalog.btrim(p_reference) = ''
       OR p_amount_minor IS NULL OR p_amount_minor <= 0
       OR p_currency IS NULL OR p_currency <> 'NGN'
       OR p_provider_transaction_id IS NULL
       OR pg_catalog.btrim(p_provider_transaction_id) = ''
       OR p_paid_at IS NULL THEN
        RAISE EXCEPTION 'Incomplete or invalid verified payment data'
            USING ERRCODE = '22023';
    END IF;

    IF p_event_key IS NOT NULL
       AND p_event_key <> ('charge.success:' || p_provider_transaction_id) THEN
        RAISE EXCEPTION 'Unexpected payment event identity'
            USING ERRCODE = '22023';
    END IF;

    SELECT offering.* INTO offering_row
    FROM public.offerings AS offering
    WHERE offering.reference = p_reference
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Offering reference not found' USING ERRCODE = 'P0002';
    END IF;

    IF offering_row.amount * 100 <> p_amount_minor
       OR offering_row.currency <> p_currency THEN
        RAISE EXCEPTION 'Verified payment amount or currency does not match the offering'
            USING ERRCODE = '22023';
    END IF;

    IF offering_row.status = 'refunded' THEN
        RAISE EXCEPTION 'A refunded offering cannot be settled again'
            USING ERRCODE = '22023';
    END IF;

    SELECT payment.* INTO payment_row
    FROM public.payments AS payment
    WHERE payment.offering_id = offering_row.id;

    IF FOUND AND (payment_row.reference <> p_reference
                  OR payment_row.provider IS DISTINCT FROM 'paystack'
                  OR (payment_row.provider_transaction_id IS NOT NULL
                      AND payment_row.provider_transaction_id <> p_provider_transaction_id)) THEN
        RAISE EXCEPTION 'Existing payment identity does not match the verified transaction'
            USING ERRCODE = '22023';
    END IF;

    was_settled := offering_row.status = 'successful'
        AND payment_row.id IS NOT NULL
        AND payment_row.verified IS TRUE
        AND payment_row.provider_transaction_id = p_provider_transaction_id;

    IF p_event_key IS NOT NULL THEN
        -- An event key cannot be reused for a different reference.
        SELECT payment.reference INTO event_reference
        FROM public.payments AS payment
        JOIN public.webhook_events AS event
          ON event.event_id = p_event_key
        WHERE payment.provider = 'paystack'
          AND payment.provider_transaction_id = p_provider_transaction_id;

        IF FOUND AND event_reference <> p_reference THEN
            RAISE EXCEPTION 'Payment event belongs to another offering'
                USING ERRCODE = '22023';
        END IF;
    END IF;

    IF NOT COALESCE(was_settled, false) THEN
        UPDATE public.offerings SET status = 'successful' WHERE id = offering_row.id;

        INSERT INTO public.payments (
            offering_id, reference, provider, provider_transaction_id,
            verified, channel, paid_at
        )
        VALUES (
            offering_row.id, p_reference, 'paystack', p_provider_transaction_id,
            true, p_channel, p_paid_at
        )
        ON CONFLICT (offering_id) DO UPDATE
            SET provider_transaction_id = EXCLUDED.provider_transaction_id,
                verified = true,
                channel = EXCLUDED.channel,
                paid_at = EXCLUDED.paid_at
        RETURNING * INTO payment_row;

        INSERT INTO public.audit_logs (user_id, action, details)
        VALUES (offering_row.user_id, 'payment.settled',
            pg_catalog.jsonb_build_object(
                'offering_id', offering_row.id,
                'reference', p_reference,
                'provider_transaction_id', p_provider_transaction_id,
                'amount_minor', p_amount_minor,
                'currency', p_currency));
    END IF;

    IF p_event_key IS NOT NULL THEN
        INSERT INTO public.webhook_events (event_id, event_type)
        VALUES (p_event_key, 'charge.success')
        ON CONFLICT (event_id) DO NOTHING;
    END IF;

    RETURN pg_catalog.jsonb_build_object(
        'offering_id', offering_row.id,
        'payment_id', payment_row.id,
        'status', 'successful',
        'already_settled', COALESCE(was_settled, false));
END;
$$;

REVOKE ALL ON FUNCTION public.settle_paystack_payment(
    text, bigint, text, text, text, timestamptz, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_paystack_payment(
    text, bigint, text, text, text, timestamptz, text
) TO service_role;

COMMIT;
