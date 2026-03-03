-- Sample Data for Development/Testing
-- Brisbane-based contractors with Australian context

-- Sample Contractors
INSERT INTO contractors (id, name, mobile, abn, email, specialisation) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'John Smith', '0412 345 678', '12 345 678 901', 'john@example.com.au', 'Water Damage Restoration'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', '0423 456 789', '23 456 789 012', 'sarah@example.com.au', 'Fire Damage Repair'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Mike Brown', '0434 567 890', NULL, 'mike@example.com.au', 'Mould Remediation');

-- Sample Availability Slots (Brisbane suburbs)
-- John Smith - Indooroopilly
INSERT INTO availability_slots (contractor_id, date, start_time, end_time, suburb, state, postcode, status, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '2026-01-06 00:00:00+10', '09:00:00', '12:00:00', 'Indooroopilly', 'QLD', '4068', 'available', 'Available for water damage inspection'),
  ('550e8400-e29b-41d4-a716-446655440001', '2026-01-06 00:00:00+10', '14:00:00', '17:00:00', 'Indooroopilly', 'QLD', '4068', 'available', NULL),
  ('550e8400-e29b-41d4-a716-446655440001', '2026-01-07 00:00:00+10', '09:00:00', '12:00:00', 'Toowong', 'QLD', '4066', 'available', NULL);

-- Sarah Johnson - West End
INSERT INTO availability_slots (contractor_id, date, start_time, end_time, suburb, state, postcode, status, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', '2026-01-06 00:00:00+10', '09:00:00', '12:00:00', 'West End', 'QLD', '4101', 'available', NULL),
  ('550e8400-e29b-41d4-a716-446655440002', '2026-01-06 00:00:00+10', '14:00:00', '17:00:00', 'West End', 'QLD', '4101', 'booked', 'Booked for emergency repair'),
  ('550e8400-e29b-41d4-a716-446655440002', '2026-01-07 00:00:00+10', '09:00:00', '17:00:00', 'South Brisbane', 'QLD', '4101', 'available', NULL);

-- Mike Brown - Woolloongabba
INSERT INTO availability_slots (contractor_id, date, start_time, end_time, suburb, state, postcode, status, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', '2026-01-06 00:00:00+10', '08:00:00', '12:00:00', 'Woolloongabba', 'QLD', '4102', 'available', NULL),
  ('550e8400-e29b-41d4-a716-446655440003', '2026-01-06 00:00:00+10', '13:00:00', '17:00:00', 'Woolloongabba', 'QLD', '4102', 'tentative', 'Pending confirmation'),
  ('550e8400-e29b-41d4-a716-446655440003', '2026-01-08 00:00:00+10', '09:00:00', '15:00:00', 'Brisbane CBD', 'QLD', '4000', 'available', NULL);

-- Verify data inserted
DO $$
BEGIN
  RAISE NOTICE 'Sample data inserted:';
  RAISE NOTICE '  - % contractors', (SELECT COUNT(*) FROM contractors);
  RAISE NOTICE '  - % availability slots', (SELECT COUNT(*) FROM availability_slots);
  RAISE NOTICE '  - Brisbane suburbs: Indooroopilly, Toowong, West End, South Brisbane, Woolloongabba, Brisbane CBD';
END $$;
