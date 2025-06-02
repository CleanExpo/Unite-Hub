-- Create permissions table
CREATE TABLE permissions (
  name TEXT PRIMARY KEY,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  action TEXT
);
