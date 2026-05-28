export async function chatWithAI(messages: { role: string; content: string }[]) {
  const response = await fetch(process.env.AI_ENDPOINT || 'https://ai-server-lime.vercel.app/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AI_API_KEY || 'my-super-secret-key-change-me'}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are LandlordOS AI Assistant — a smart, helpful property management assistant for Indian landlords and tenants. You help with:
- Answering questions about rental agreements, tenant rights, landlord obligations
- Drafting rent reminders, notices, and agreement clauses
- Suggesting maintenance solutions
- Calculating rent splits, utility bills, late fees
- Providing Indian real estate law guidance (Rent Control Act, Model Tenancy Act 2021)
- Helping with tenant verification checklists
- Multilingual support (Hindi, English, regional languages)

Be concise, practical, and friendly. Use Indian context (₹, Indian laws, local practices).
When generating agreements, use standard Indian rental agreement format.`,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    throw new Error('AI request failed')
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || data.message?.content || 'Sorry, I could not process that request.'
}
