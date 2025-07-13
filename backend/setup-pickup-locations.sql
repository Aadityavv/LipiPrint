-- Create pickup_locations table
CREATE TABLE IF NOT EXISTS pickup_locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    distance VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    working_hours VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample pickup locations
INSERT INTO pickup_locations (name, address, distance, phone, email, working_hours, active) VALUES
('LipiPrint Main Store', '123 Main Street, City Center, Mumbai, Maharashtra 400001', '0.5 km', '+91-9876543210', 'main@lipiprint.com', '9:00 AM - 8:00 PM', true),
('LipiPrint Mall Branch', '456 Shopping Mall, Downtown, Mumbai, Maharashtra 400002', '1.2 km', '+91-9876543211', 'mall@lipiprint.com', '10:00 AM - 9:00 PM', true),
('LipiPrint University Branch', '789 University Road, Campus Area, Mumbai, Maharashtra 400003', '2.1 km', '+91-9876543212', 'university@lipiprint.com', '8:00 AM - 7:00 PM', true),
('LipiPrint Station Branch', '321 Railway Station, Central Mumbai, Maharashtra 400004', '1.8 km', '+91-9876543213', 'station@lipiprint.com', '7:00 AM - 10:00 PM', true),
('LipiPrint Tech Park', '654 Tech Park, Andheri East, Mumbai, Maharashtra 400005', '3.5 km', '+91-9876543214', 'techpark@lipiprint.com', '8:30 AM - 8:30 PM', true); 