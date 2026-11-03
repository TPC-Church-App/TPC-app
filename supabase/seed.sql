-- ===============================================================
-- seed.sql
-- Provides the initial giving funds for local database setup.
-- ===============================================================

-- ===============================================================
-- INITIAL GIVING FUNDS
-- Repeated seeding preserves existing fund records and avoids
-- duplicate names instead of changing administrator-managed data.
-- ===============================================================

INSERT INTO funds (name, description, is_active) VALUES
  ('Tithe', '10% of income', true),
  ('Offering', 'General offering', true),
  ('Building', 'Building project fund', true),
  ('Missions', 'Missionary support', true),
  ('Evangelist support', 'Support for evangelism and visiting ministers', true),
  ('Church outreach program', 'Church outreach and community care', true)
ON CONFLICT (name) DO NOTHING;
