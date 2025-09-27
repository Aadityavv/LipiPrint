-- Add canEdit column to users table
ALTER TABLE users ADD COLUMN can_edit BOOLEAN DEFAULT FALSE;

-- Set the first admin user (if any exists) to have canEdit permission
-- This ensures at least one admin can edit services and settings
UPDATE users 
SET can_edit = TRUE 
WHERE role = 'ADMIN' 
AND id = (SELECT MIN(id) FROM users WHERE role = 'ADMIN');

-- If no admin exists, this will be handled when the first admin is created
