-- ===============================================================
-- access_and_payment_regression.sql
-- Exercises protected writes and payment settlement against a local
-- disposable Supabase database after both migrations are applied.
-- Run with psql -v ON_ERROR_STOP=1 -f <this-file>. Every fixture is
-- enclosed in a transaction and rolled back; never use live data.
-- These are executable regression checks, not completed test claims.
-- ===============================================================

BEGIN;

-- ===============================================================
-- PRIVILEGE BOUNDARIES
-- Catalog checks catch accidental broad grants before fixtures run.
-- ===============================================================

DO $$
BEGIN
    IF pg_catalog.has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE')
       OR pg_catalog.has_column_privilege('authenticated', 'public.profiles', 'is_verified', 'UPDATE')
       OR pg_catalog.has_column_privilege('authenticated', 'public.profiles', 'phone', 'UPDATE') THEN
        RAISE EXCEPTION 'Authenticated users can update protected profile columns';
    END IF;

    IF NOT pg_catalog.has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE') THEN
        RAISE EXCEPTION 'The permitted profile-name update was removed';
    END IF;

    IF pg_catalog.has_table_privilege('authenticated', 'public.offerings', 'INSERT')
       OR pg_catalog.has_table_privilege('authenticated', 'public.attendance', 'INSERT') THEN
        RAISE EXCEPTION 'Client-controlled financial/check-in inserts remain available';
    END IF;

    IF pg_catalog.has_function_privilege('authenticated',
        'public.settle_paystack_payment(text,bigint,text,text,text,timestamp with time zone,text)', 'EXECUTE')
       OR pg_catalog.has_function_privilege('anon',
        'public.settle_paystack_payment(text,bigint,text,text,text,timestamp with time zone,text)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Public clients can execute payment settlement';
    END IF;

    IF NOT pg_catalog.has_function_privilege('service_role',
        'public.settle_paystack_payment(text,bigint,text,text,text,timestamp with time zone,text)', 'EXECUTE') THEN
        RAISE EXCEPTION 'The trusted settlement caller lacks execute permission';
    END IF;
END;
$$;

-- ===============================================================
-- ISOLATED FIXTURES
-- Role metadata deliberately requests elevated authority; the Auth
-- trigger must ignore it and create an unverified member instead.
-- ===============================================================

INSERT INTO auth.users (id, phone, raw_user_meta_data)
VALUES
    ('00000000-0000-4000-a000-000000000101', '+2340000000101',
     '{"full_name":"TPC regression member","role":"super_admin","is_verified":true}'),
    ('00000000-0000-4000-a000-000000000102', '+2340000000102',
     '{"full_name":"TPC regression usher"}'),
    ('00000000-0000-4000-a000-000000000103', '+2340000000103',
     '{"full_name":"TPC regression admin"}');

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = '00000000-0000-4000-a000-000000000101'
          AND role = 'member' AND is_verified IS FALSE
    ) THEN
        RAISE EXCEPTION 'Auth metadata changed protected profile authority';
    END IF;
END;
$$;

UPDATE public.profiles SET is_verified = true
WHERE id IN ('00000000-0000-4000-a000-000000000101',
             '00000000-0000-4000-a000-000000000102',
             '00000000-0000-4000-a000-000000000103');

UPDATE public.profiles SET role = 'usher'
WHERE id = '00000000-0000-4000-a000-000000000102';
UPDATE public.profiles SET role = 'super_admin'
WHERE id = '00000000-0000-4000-a000-000000000103';

INSERT INTO public.funds (id, name)
VALUES ('00000000-0000-4000-a000-000000000201', 'TPC regression fund');

INSERT INTO public.offerings (id, user_id, amount, fund_id, reference)
VALUES
    ('00000000-0000-4000-a000-000000000301',
     '00000000-0000-4000-a000-000000000101', 100,
     '00000000-0000-4000-a000-000000000201', 'tpc-regression-payment-1'),
    ('00000000-0000-4000-a000-000000000302',
     '00000000-0000-4000-a000-000000000101', 100,
     '00000000-0000-4000-a000-000000000201', 'tpc-regression-payment-2');

-- ===============================================================
-- MEMBER WRITE DENIALS
-- Actual authenticated calls complement the catalog grant checks.
-- ===============================================================

SELECT pg_catalog.set_config('request.jwt.claims',
    '{"sub":"00000000-0000-4000-a000-000000000101","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
    changed_rows integer;
BEGIN
    UPDATE public.profiles SET full_name = 'TPC regression renamed'
    WHERE id = '00000000-0000-4000-a000-000000000101';
    GET DIAGNOSTICS changed_rows = ROW_COUNT;

    IF changed_rows <> 1 THEN
        RAISE EXCEPTION 'A member could not update their own display name';
    END IF;

    BEGIN
        UPDATE public.profiles SET role = 'super_admin'
        WHERE id = '00000000-0000-4000-a000-000000000101';
        RAISE EXCEPTION 'A member changed their own role';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    BEGIN
        UPDATE public.profiles SET is_verified = true
        WHERE id = '00000000-0000-4000-a000-000000000101';
        RAISE EXCEPTION 'A member changed their own verification';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    BEGIN
        PERFORM public.set_member_verification(
            '00000000-0000-4000-a000-000000000102', true);
        RAISE EXCEPTION 'A member called privileged membership verification';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    BEGIN
        INSERT INTO public.offerings (user_id, amount, fund_id, status, reference)
        VALUES ('00000000-0000-4000-a000-000000000101', 100,
                '00000000-0000-4000-a000-000000000201', 'successful', 'tpc-forged');
        RAISE EXCEPTION 'A member inserted a forged successful offering';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    BEGIN
        INSERT INTO public.attendance (user_id, service_id, method)
        VALUES ('00000000-0000-4000-a000-000000000101',
                '00000000-0000-4000-a000-000000000999', 'qr');
        RAISE EXCEPTION 'A member bypassed a trusted check-in operation';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    BEGIN
        PERFORM public.settle_paystack_payment('tpc-regression-payment-1', 10000,
            'NGN', 'tpc-regression-provider-1', 'card', pg_catalog.now());
        RAISE EXCEPTION 'A member executed server-only payment settlement';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END;
$$;

RESET ROLE;

-- ===============================================================
-- STAFF AUTHORITY
-- An usher can verify another member without gaining role powers.
-- ===============================================================

UPDATE public.profiles SET is_verified = false
WHERE id = '00000000-0000-4000-a000-000000000101';

SELECT pg_catalog.set_config('request.jwt.claims',
    '{"sub":"00000000-0000-4000-a000-000000000102","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

DO $$
BEGIN
    BEGIN
        PERFORM public.set_member_verification('00000000-0000-4000-a000-000000000101', false);
        RAISE EXCEPTION 'An usher revoked membership verification';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    PERFORM public.set_member_verification('00000000-0000-4000-a000-000000000101', true);

    BEGIN
        PERFORM public.set_member_verification('00000000-0000-4000-a000-000000000102', true);
        RAISE EXCEPTION 'An usher verified their own account';
    EXCEPTION WHEN invalid_parameter_value THEN NULL;
    END;

    BEGIN
        PERFORM public.set_member_role('00000000-0000-4000-a000-000000000101', 'pastor');
        RAISE EXCEPTION 'An usher assigned a privileged role';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END;
$$;

RESET ROLE;

-- ===============================================================
-- PAYMENT MATCHING, REPLAY, AND DUPLICATE-PROVIDER PROTECTION
-- Verification followed by webhook delivery must save one payment
-- and one settlement audit event, even when the webhook is retried.
-- ===============================================================

SELECT pg_catalog.set_config('request.jwt.claims', '{"role":"service_role"}', true);
SET LOCAL ROLE service_role;

DO $$
DECLARE
    result jsonb;
BEGIN
    BEGIN
        PERFORM public.settle_paystack_payment('tpc-regression-payment-1', 9999,
            'NGN', 'tpc-regression-provider-1', 'card', pg_catalog.now());
        RAISE EXCEPTION 'An amount mismatch was accepted';
    EXCEPTION WHEN invalid_parameter_value THEN NULL;
    END;

    IF EXISTS (SELECT 1 FROM public.payments
               WHERE offering_id = '00000000-0000-4000-a000-000000000301')
       OR EXISTS (SELECT 1 FROM public.offerings
                  WHERE id = '00000000-0000-4000-a000-000000000301'
                    AND status <> 'pending') THEN
        RAISE EXCEPTION 'Rejected payment data changed financial state';
    END IF;

    result := public.settle_paystack_payment('tpc-regression-payment-1', 10000,
        'NGN', 'tpc-regression-provider-1', 'card', pg_catalog.now());

    IF (result ->> 'already_settled')::boolean IS NOT FALSE THEN
        RAISE EXCEPTION 'First settlement was incorrectly reported as a replay';
    END IF;

    result := public.settle_paystack_payment('tpc-regression-payment-1', 10000,
        'NGN', 'tpc-regression-provider-1', 'card', pg_catalog.now(),
        'charge.success:tpc-regression-provider-1');

    IF (result ->> 'already_settled')::boolean IS NOT TRUE THEN
        RAISE EXCEPTION 'A verified payment was not treated as an idempotent replay';
    END IF;

    PERFORM public.settle_paystack_payment('tpc-regression-payment-1', 10000,
        'NGN', 'tpc-regression-provider-1', 'card', pg_catalog.now(),
        'charge.success:tpc-regression-provider-1');

    IF (SELECT count(*) FROM public.payments
        WHERE offering_id = '00000000-0000-4000-a000-000000000301') <> 1
       OR (SELECT count(*) FROM public.webhook_events
           WHERE event_id = 'charge.success:tpc-regression-provider-1') <> 1
       OR (SELECT count(*) FROM public.audit_logs
           WHERE action = 'payment.settled'
             AND details ->> 'reference' = 'tpc-regression-payment-1') <> 1 THEN
        RAISE EXCEPTION 'Replay created duplicate payment, event, or settlement audit rows';
    END IF;

    BEGIN
        PERFORM public.settle_paystack_payment('tpc-regression-payment-2', 10000,
            'NGN', 'tpc-regression-provider-1', 'card', pg_catalog.now());
        RAISE EXCEPTION 'A provider transaction settled two different offerings';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;

    IF EXISTS (SELECT 1 FROM public.offerings
               WHERE id = '00000000-0000-4000-a000-000000000302'
                 AND status <> 'pending') THEN
        RAISE EXCEPTION 'A failed duplicate-provider write left a partial settlement';
    END IF;

    UPDATE public.offerings SET status = 'refunded'
    WHERE id = '00000000-0000-4000-a000-000000000301';

    BEGIN
        PERFORM public.settle_paystack_payment('tpc-regression-payment-1', 10000,
            'NGN', 'tpc-regression-provider-1', 'card', pg_catalog.now());
        RAISE EXCEPTION 'Settlement reversed a refunded offering';
    EXCEPTION WHEN invalid_parameter_value THEN NULL;
    END;
END;
$$;

RESET ROLE;
ROLLBACK;
