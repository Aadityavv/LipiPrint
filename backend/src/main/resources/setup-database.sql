CREATE TABLE payments (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    razorpay_order_id NVARCHAR(255) UNIQUE,
    razorpay_payment_id NVARCHAR(255),
    status NVARCHAR(32),
    amount FLOAT,
    user_id BIGINT,
    order_id BIGINT,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id)
);
ALTER TABLE files ADD COLUMN deleted BOOLEAN DEFAULT FALSE; 