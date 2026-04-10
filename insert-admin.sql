-- Loopin CRM - Insert Admin User
-- Execute this AFTER running the main schema

-- Delete existing admin if any
DELETE FROM users WHERE email = 'admin@loopin.com';

-- Insert admin with password: admin123
-- The hash below was generated with: bcrypt.hashSync('admin123', 12)
INSERT INTO users (email, password_hash, name) 
VALUES (
  'admin@loopin.com', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYWPQFQfN6Fe', 
  'Administrador'
);
