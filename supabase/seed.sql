INSERT INTO funds (name, description, is_active) VALUES
  ('Tithe', '10% of income', true),
  ('Offering', 'General offering', true),
  ('Building', 'Building project fund', true),
  ('Missions', 'Missionary support', true)
ON CONFLICT (name) DO NOTHING;