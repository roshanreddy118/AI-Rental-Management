'use client'

import { useEffect, useState } from 'react'
import { Plus, Home, MapPin, Users, MoreVertical } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, Select, EmptyState } from '@/components/ui'

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [form, setForm] = useState({
    name: '', address: '', city: '', state: '', pincode: '', type: 'apartment', total_units: '1', description: ''
  })

  useEffect(() => { fetchProperties() }, [])

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/properties', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setProperties(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    setAddLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, total_units: parseInt(form.total_units) }),
      })
      const data = await res.json()
      if (res.ok) {
        setShowAdd(false)
        setForm({ name: '', address: '', city: '', state: '', pincode: '', type: 'apartment', total_units: '1', description: '' })
        fetchProperties()
      } else {
        setAddError(data.error || 'Failed to add property. Please try again.')
      }
    } catch {
      setAddError('Network error. Please check your connection.')
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Properties</h2>
          <p className="text-surface-500 text-sm mt-1">Manage all your rental properties</p>
        </div>
        <Button onClick={() => setShowAdd(true)} icon={<Plus className="w-4 h-4" />}>
          Add Property
        </Button>
      </div>

      {properties.length === 0 && !loading ? (
        <EmptyState
          icon={<Home className="w-8 h-8" />}
          title="No properties yet"
          description="Add your first property to start managing tenants and rent."
          action={<Button onClick={() => setShowAdd(true)} icon={<Plus className="w-4 h-4" />}>Add Property</Button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-glow transition-all duration-300 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Home className="w-5 h-5 text-primary-600" />
                </div>
                <Badge variant={property.type === 'apartment' ? 'info' : property.type === 'house' ? 'success' : 'warning'}>
                  {property.type}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-1">{property.name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-surface-500 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                <span>{property.city}, {property.state}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-surface-100">
                <div className="flex items-center gap-1.5 text-sm text-surface-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>{property.occupied_units || 0}/{property.total_units} occupied</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setAddError('') }} title="Add New Property">
        {addError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            {addError}
          </div>
        )}
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Property Name" placeholder="e.g., Green Valley Apartments" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label="Address" placeholder="Full street address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" placeholder="Mumbai" value={form.city} onChange={e => setForm({...form, city: e.target.value})} required />
            <Input label="State" placeholder="Maharashtra" value={form.state} onChange={e => setForm({...form, state: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Pincode" placeholder="400001" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} required />
            <Select label="Type" value={form.type} onChange={e => setForm({...form, type: e.target.value})} options={[
              { value: 'apartment', label: 'Apartment' },
              { value: 'house', label: 'House' },
              { value: 'pg', label: 'PG' },
              { value: 'commercial', label: 'Commercial' },
            ]} />
          </div>
          <Input label="Total Units" type="number" min="1" value={form.total_units} onChange={e => setForm({...form, total_units: e.target.value})} required />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => { setShowAdd(false); setAddError('') }}>Cancel</Button>
            <Button type="submit" loading={addLoading}>Add Property</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
