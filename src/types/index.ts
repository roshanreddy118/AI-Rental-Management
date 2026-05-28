export type UserRole = 'owner' | 'tenant'

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  owner_id: string
  name: string
  address: string
  city: string
  state: string
  pincode: string
  type: 'apartment' | 'house' | 'pg' | 'commercial'
  total_units: number
  description?: string
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  property_id: string
  unit_number: string
  floor?: number
  bedrooms?: number
  bathrooms?: number
  area_sqft?: number
  rent_amount: number
  deposit_amount: number
  status: 'vacant' | 'occupied' | 'maintenance'
  created_at: string
}

export interface Tenant {
  id: string
  user_id: string
  owner_id: string
  unit_id: string
  property_id: string
  move_in_date: string
  move_out_date?: string
  lease_start: string
  lease_end: string
  rent_amount: number
  deposit_paid: number
  status: 'active' | 'inactive' | 'notice_period'
  emergency_contact?: string
  emergency_phone?: string
  verification_status: 'pending' | 'verified' | 'rejected'
  documents: TenantDocument[]
  created_at: string
  updated_at: string
}

export interface TenantDocument {
  id: string
  tenant_id: string
  type: 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'employment_letter' | 'other'
  file_url: string
  verified: boolean
  uploaded_at: string
}

export interface RentPayment {
  id: string
  tenant_id: string
  unit_id: string
  property_id: string
  amount: number
  due_date: string
  paid_date?: string
  payment_method?: 'upi' | 'bank_transfer' | 'cash' | 'cheque'
  transaction_id?: string
  status: 'pending' | 'paid' | 'overdue' | 'partial'
  late_fee?: number
  notes?: string
  created_at: string
}

export interface Agreement {
  id: string
  tenant_id: string
  property_id: string
  unit_id: string
  owner_id: string
  start_date: string
  end_date: string
  rent_amount: number
  deposit_amount: number
  terms: string
  agreement_url?: string
  status: 'draft' | 'active' | 'expired' | 'terminated'
  created_at: string
  updated_at: string
}

export interface MaintenanceRequest {
  id: string
  tenant_id: string
  property_id: string
  unit_id: string
  title: string
  description: string
  category: 'plumbing' | 'electrical' | 'appliance' | 'structural' | 'pest_control' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  images?: string[]
  resolution_notes?: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

export interface UtilityBill {
  id: string
  property_id: string
  unit_id: string
  tenant_id: string
  type: 'electricity' | 'water' | 'gas' | 'internet' | 'maintenance_charge'
  amount: number
  billing_month: string
  due_date: string
  paid: boolean
  paid_date?: string
  meter_reading?: number
  previous_reading?: number
  created_at: string
}

export interface TenantInvite {
  id: string
  owner_id: string
  property_id: string
  unit_id: string
  email: string
  invite_code: string
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}
