-- ============================================================
-- TPC CHURCH APP — INITIAL SCHEMA
-- ============================================================

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('member', 'usher', 'finance', 'pastor', 'super_admin');
CREATE TYPE attendance_method AS ENUM ('qr', 'manual');
CREATE TYPE offering_status AS ENUM ('pending', 'successful', 'failed', 'refunded');

-- 2. TABLES

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'member',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE members (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    address TEXT,
    birthday DATE,
    group_name TEXT
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    service_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    qr_code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    method attendance_method NOT NULL,
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, service_id)
);

CREATE TABLE funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 100),
    fund_id UUID NOT NULL REFERENCES funds(id),
    status offering_status DEFAULT 'pending',
    reference TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
    reference TEXT UNIQUE NOT NULL,
    provider TEXT DEFAULT 'paystack',
    verified BOOLEAN DEFAULT false,
    channel TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS POLICIES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (has_role('super_admin') OR has_role('pastor'));

CREATE POLICY "Members can view own details" ON members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage members" ON members FOR ALL USING (has_role('super_admin') OR has_role('pastor'));

CREATE POLICY "Everyone can view active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Pastors/Admins can manage services" ON services FOR ALL USING (has_role('pastor') OR has_role('super_admin'));

CREATE POLICY "Members can view own attendance" ON attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Members can insert own attendance" ON attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Ushers/Pastors/Admins can view all attendance" ON attendance FOR SELECT USING (has_role('usher') OR has_role('pastor') OR has_role('super_admin'));
CREATE POLICY "Ushers can insert attendance" ON attendance FOR INSERT WITH CHECK (has_role('usher'));

CREATE POLICY "Everyone can view active funds" ON funds FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage funds" ON funds FOR ALL USING (has_role('super_admin'));

CREATE POLICY "Members can view own offerings" ON offerings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Members can insert own offerings" ON offerings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Finance/Pastors/Admins can view all offerings" ON offerings FOR SELECT USING (has_role('finance') OR has_role('pastor') OR has_role('super_admin'));

CREATE POLICY "Members can view own payments" ON payments FOR SELECT USING (EXISTS (SELECT 1 FROM offerings WHERE offerings.id = payments.offering_id AND offerings.user_id = auth.uid()));
CREATE POLICY "Finance/Pastors/Admins can view all payments" ON payments FOR SELECT USING (has_role('finance') OR has_role('pastor') OR has_role('super_admin'));

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Only super admins can view audit logs" ON audit_logs FOR SELECT USING (has_role('super_admin'));