-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Files
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    content_type VARCHAR(100),
    size BIGINT,
    url VARCHAR(255),
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Print Jobs
CREATE TABLE print_jobs (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id),
    user_id INTEGER REFERENCES users(id),
    order_id INTEGER REFERENCES orders(id),
    status VARCHAR(20),
    options TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(20),
    delivery_type VARCHAR(20),
    delivery_address VARCHAR(255),
    total_amount NUMERIC(10,2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message VARCHAR(255),
    "read" BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
);

-- Help Center Articles
CREATE TABLE help_center_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Support Tickets
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    subject VARCHAR(255),
    description TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Settings
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    "key" VARCHAR(255),
    value VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Services (Print Options)
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,         -- e.g., 'color', 'black_and_white'
    display_name VARCHAR(100) NOT NULL, -- e.g., 'Color Print'
    active BOOLEAN DEFAULT TRUE,
    price NUMERIC(10,2) NOT NULL
);

-- Service Combinations (dynamic pricing for all print options)
CREATE TABLE service_combinations (
    id SERIAL PRIMARY KEY,
    color VARCHAR(20) NOT NULL,           -- 'Colour' or 'B&W'
    paper_size VARCHAR(10) NOT NULL,      -- 'A4', 'A3'
    paper_quality VARCHAR(20) NOT NULL,   -- '70 GSM', '100 GSM'
    print_option VARCHAR(20) NOT NULL,    -- 'Single Side', 'Double Side'
    cost_per_page NUMERIC(10,2) NOT NULL
);

-- Discount Rules (discounts after a certain number of pages)
CREATE TABLE discount_rules (
    id SERIAL PRIMARY KEY,
    color VARCHAR(20) NOT NULL,
    paper_size VARCHAR(10) NOT NULL,
    paper_quality VARCHAR(20) NOT NULL,
    print_option VARCHAR(20) NOT NULL,
    min_pages INTEGER NOT NULL,
    amount_off NUMERIC(10,2) NOT NULL
);

-- Binding Options (spiral binding pricing)
CREATE TABLE binding_options (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL,            -- 'spiral', 'staple', etc.
    per_page_price NUMERIC(10,2) NOT NULL,
    min_price NUMERIC(10,2) NOT NULL
);

-- Service Combinations (dynamic pricing for all print options)
INSERT INTO service_combinations (color, paper_size, paper_quality, print_option, cost_per_page) VALUES
('Colour', 'A4', '70 GSM', 'Single Side', 6.00),
('Colour', 'A4', '70 GSM', 'Double Side', 5.50),
('Colour', 'A4', '100 GSM', 'Single Side', 7.00),
('Colour', 'A4', '100 GSM', 'Double Side', 6.50),
('Colour', 'A3', '100 GSM', 'Single Side', 10.00),
('Colour', 'A3', '100 GSM', 'Double Side', 9.00),
('B&W', 'A4', '70 GSM', 'Single Side', 2.00),
('B&W', 'A4', '70 GSM', 'Double Side', 1.80),
('B&W', 'A4', '100 GSM', 'Single Side', 2.50),
('B&W', 'A4', '100 GSM', 'Double Side', 2.20),
('B&W', 'A3', '100 GSM', 'Single Side', 4.00),
('B&W', 'A3', '100 GSM', 'Double Side', 3.50);

-- Discount Rules (example: discount after 100 pages)
INSERT INTO discount_rules (color, paper_size, paper_quality, print_option, min_pages, amount_off) VALUES
('Colour', 'A4', '70 GSM', 'Single Side', 100, 0.50),
('Colour', 'A4', '70 GSM', 'Double Side', 100, 0.50),
('Colour', 'A4', '100 GSM', 'Single Side', 100, 0.70),
('Colour', 'A4', '100 GSM', 'Double Side', 100, 0.70),
('Colour', 'A3', '100 GSM', 'Single Side', 100, 1.00),
('Colour', 'A3', '100 GSM', 'Double Side', 100, 1.00),
('B&W', 'A4', '70 GSM', 'Single Side', 100, 0.20),
('B&W', 'A4', '70 GSM', 'Double Side', 100, 0.20),
('B&W', 'A4', '100 GSM', 'Single Side', 100, 0.30),
('B&W', 'A4', '100 GSM', 'Double Side', 100, 0.30),
('B&W', 'A3', '100 GSM', 'Single Side', 100, 0.50),
('B&W', 'A3', '100 GSM', 'Double Side', 100, 0.50);

-- Binding Options (spiral binding)
INSERT INTO binding_options (type, per_page_price, min_price) VALUES
('spiral', 1.00, 35.00),
('staple', 0.50, 10.00);

-- MIGRATION: Ensure all user foreign keys have ON DELETE CASCADE
-- FILES
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_uploaded_by_fkey;
ALTER TABLE files ADD CONSTRAINT files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE;

-- PRINT JOBS
ALTER TABLE print_jobs DROP CONSTRAINT IF EXISTS print_jobs_user_id_fkey;
ALTER TABLE print_jobs ADD CONSTRAINT print_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ORDERS
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- PAYMENTS
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- USER ADDRESSES
ALTER TABLE user_addresses DROP CONSTRAINT IF EXISTS user_addresses_user_id_fkey;
ALTER TABLE user_addresses ADD CONSTRAINT user_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- SUPPORT TICKETS
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- NOTIFICATIONS
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- SETTINGS
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_user_id_fkey;
ALTER TABLE settings ADD CONSTRAINT settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; 