import { formatCurrency } from './utils'

/**
 * Calculate rent with annual 10% escalation based on tenant join date
 * Every year from move_in_date, rent increases by 10%
 */
export function calculateCurrentRent(baseRent: number, moveInDate: string): {
  currentRent: number
  yearsCompleted: number
  nextIncreaseDate: string
  nextRent: number
  escalationHistory: { year: number; rent: number; effectiveFrom: string }[]
} {
  const moveIn = new Date(moveInDate)
  const now = new Date()
  
  const diffMs = now.getTime() - moveIn.getTime()
  const yearsCompleted = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000))
  
  // Calculate current rent with compound 10% increase
  const currentRent = Math.round(baseRent * Math.pow(1.10, yearsCompleted))
  
  // Next increase date
  const nextIncreaseDate = new Date(moveIn)
  nextIncreaseDate.setFullYear(nextIncreaseDate.getFullYear() + yearsCompleted + 1)
  
  const nextRent = Math.round(baseRent * Math.pow(1.10, yearsCompleted + 1))
  
  // Build escalation history
  const escalationHistory = []
  for (let i = 0; i <= yearsCompleted; i++) {
    const effectiveFrom = new Date(moveIn)
    effectiveFrom.setFullYear(effectiveFrom.getFullYear() + i)
    escalationHistory.push({
      year: i,
      rent: Math.round(baseRent * Math.pow(1.10, i)),
      effectiveFrom: effectiveFrom.toISOString().split('T')[0],
    })
  }
  
  return {
    currentRent,
    yearsCompleted,
    nextIncreaseDate: nextIncreaseDate.toISOString().split('T')[0],
    nextRent,
    escalationHistory,
  }
}

/**
 * Check if any tenant's rent is due for annual increase
 * Returns tenants whose anniversary is within the next 30 days
 */
export function getUpcomingRentIncreases(tenants: { id: string; name: string; baseRent: number; moveInDate: string }[]): {
  tenantId: string
  tenantName: string
  currentRent: number
  newRent: number
  effectiveDate: string
  daysUntil: number
}[] {
  const now = new Date()
  const upcoming: any[] = []
  
  for (const tenant of tenants) {
    const moveIn = new Date(tenant.moveInDate)
    const yearsCompleted = Math.floor((now.getTime() - moveIn.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    
    const nextAnniversary = new Date(moveIn)
    nextAnniversary.setFullYear(nextAnniversary.getFullYear() + yearsCompleted + 1)
    
    const daysUntil = Math.ceil((nextAnniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil <= 30 && daysUntil >= 0) {
      const currentRent = Math.round(tenant.baseRent * Math.pow(1.10, yearsCompleted))
      const newRent = Math.round(tenant.baseRent * Math.pow(1.10, yearsCompleted + 1))
      
      upcoming.push({
        tenantId: tenant.id,
        tenantName: tenant.name,
        currentRent,
        newRent,
        effectiveDate: nextAnniversary.toISOString().split('T')[0],
        daysUntil,
      })
    }
  }
  
  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil)
}
