-- Add admin tracking columns to orders table
ALTER TABLE orders ADD COLUMN printed_by_admin_id BIGINT;
ALTER TABLE orders ADD COLUMN processed_by_admin_id BIGINT;
ALTER TABLE orders ADD COLUMN completed_by_admin_id BIGINT;
ALTER TABLE orders ADD COLUMN printed_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN processed_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN completed_at TIMESTAMP;

-- Add foreign key constraints
ALTER TABLE orders ADD CONSTRAINT fk_orders_printed_by_admin 
    FOREIGN KEY (printed_by_admin_id) REFERENCES users(id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_processed_by_admin 
    FOREIGN KEY (processed_by_admin_id) REFERENCES users(id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_completed_by_admin 
    FOREIGN KEY (completed_by_admin_id) REFERENCES users(id);
