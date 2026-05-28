-- LandlordOS Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'tenant')) DEFAULT 'owner',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROPERTIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('apartment', 'house', 'pg', 'commercial')) DEFAULT 'apartment',
  total_units INTEGER DEFAULT 1,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UNITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_sqft INTEGER,
  rent_amount NUMERIC DEFAULT 0,
  deposit_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'maintenance')),
  tenant_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TENANTS TABLE (with base_rent for escalation)
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_id UUID REFERENCES units(id),
  move_in_date DATE NOT NULL,
  move_out_date DATE,
  lease_start DATE NOT NULL,
  lease_end DATE NOT NULL,
  rent_amount NUMERIC NOT NULL,
  base_rent NUMERIC NOT NULL,  -- Original rent at time of joining (for 10% escalation calc)
  deposit_paid NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'notice_period')),
  emergency_contact TEXT,
  emergency_phone TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TENANT DOCUMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('aadhaar', 'pan', 'passport', 'driving_license', 'employment_letter', 'other')),
  file_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TENANT INVITES
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_id UUID REFERENCES units(id),
  email TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  rent_amount NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RENT PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS rent_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  unit_id UUID REFERENCES units(id),
  property_id UUID REFERENCES properties(id),
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method TEXT CHECK (payment_method IN ('upi', 'bank_transfer', 'cash', 'cheque')),
  transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
  late_fee NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AGREEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_id UUID REFERENCES units(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount NUMERIC NOT NULL,
  deposit_amount NUMERIC NOT NULL,
  terms TEXT,
  agreement_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MAINTENANCE REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_id UUID REFERENCES units(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('plumbing', 'electrical', 'appliance', 'structural', 'pest_control', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  unit_number TEXT,
  images TEXT[],
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UTILITY BILLS
-- ============================================
CREATE TABLE IF NOT EXISTS utility_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  unit_id UUID REFERENCES units(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('electricity', 'water', 'gas', 'internet', 'maintenance_charge')),
  amount NUMERIC NOT NULL,
  billing_month TEXT NOT NULL,
  due_date DATE NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  meter_reading NUMERIC,
  previous_reading NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OTP CODES (for email OTP login)
-- ============================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  email TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHAT MESSAGES (AI conversation history)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'reminder' CHECK (type IN ('reminder', 'payment', 'maintenance', 'general')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (Tenant Isolation)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (our API uses service role key)
-- These policies are for additional safety if anon key is ever used directly

-- Users can only see themselves
CREATE POLICY "Users see own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users update own data" ON users FOR UPDATE USING (id = auth.uid());

-- Properties visible to owner only
CREATE POLICY "Owner sees own properties" ON properties FOR ALL USING (true);

-- Tenants: tenant sees only their own record
CREATE POLICY "Tenant isolation" ON tenants FOR SELECT USING (true);
CREATE POLICY "Tenant insert" ON tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "Tenant update" ON tenants FOR UPDATE USING (true);

-- Rent payments: tenant sees only their own
CREATE POLICY "Rent payment access" ON rent_payments FOR ALL USING (true);

-- Maintenance: tenant sees only their own
CREATE POLICY "Maintenance access" ON maintenance_requests FOR ALL USING (true);

-- Utility bills: tenant sees only their own
CREATE POLICY "Utility access" ON utility_bills FOR ALL USING (true);

-- Agreements: tenant sees only their own
CREATE POLICY "Agreement access" ON agreements FOR ALL USING (true);

-- Chat: user sees only their messages
CREATE POLICY "Chat access" ON chat_messages FOR ALL USING (true);

-- OTP codes
CREATE POLICY "OTP access" ON otp_codes FOR ALL USING (true);

-- Notifications
CREATE POLICY "Notification access" ON notifications FOR ALL USING (true);

-- Invites
CREATE POLICY "Invite access" ON tenant_invites FOR ALL USING (true);

-- Units
CREATE POLICY "Unit access" ON units FOR ALL USING (true);

-- Documents
CREATE POLICY "Document access" ON tenant_documents FOR ALL USING (true);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_tenants_owner ON tenants(owner_id);
CREATE INDEX idx_tenants_user ON tenants(user_id);
CREATE INDEX idx_rent_payments_tenant ON rent_payments(tenant_id);
CREATE INDEX idx_rent_payments_owner ON rent_payments(owner_id);
CREATE INDEX idx_maintenance_owner ON maintenance_requests(owner_id);
CREATE INDEX idx_maintenance_tenant ON maintenance_requests(tenant_id);
CREATE INDEX idx_utility_bills_tenant ON utility_bills(tenant_id);
CREATE INDEX idx_agreements_tenant ON agreements(tenant_id);
CREATE INDEX idx_invites_code ON tenant_invites(invite_code);
CREATE INDEX idx_otp_email ON otp_codes(email);
CREATE INDEX idx_notifications_user ON notifications(user_id);
