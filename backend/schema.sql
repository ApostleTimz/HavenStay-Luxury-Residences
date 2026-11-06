CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'guest' CHECK (role IN ('guest', 'host', 'admin')),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_code_hash VARCHAR(255),
    verification_code_expires_at TIMESTAMP WITH TIME ZONE,
    verification_code_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apartments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    price_per_night DECIMAL(10, 2) NOT NULL,
    cleaning_fee DECIMAL(10, 2) DEFAULT 0.00,
    service_fee DECIMAL(10, 2) DEFAULT 0.00,
    bedrooms INT NOT NULL DEFAULT 1,
    bathrooms INT NOT NULL DEFAULT 1,
    max_guests INT NOT NULL DEFAULT 2,
    images TEXT[] NOT NULL DEFAULT '{}',
    amenities TEXT[] DEFAULT '{}',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES users(id) ON DELETE CASCADE,
    guest_name VARCHAR(120),
    guest_email VARCHAR(255),
    access_token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_nights INT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    cleaning_fee DECIMAL(10, 2) NOT NULL,
    service_fee DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reference VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NGN',
    payment_status VARCHAR(30) DEFAULT 'pending',
    paystack_response JSONB,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(120),
    is_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
    token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP WITH TIME ZONE
);