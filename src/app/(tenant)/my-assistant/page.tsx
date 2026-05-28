'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, User, Sparkles } from 'lucide-react'
import { Button, Card } from '@/components/ui'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const quickPrompts = [
  'What are my rights as a tenant?',
  'How do I get my deposit back?',
  'Can landlord increase rent anytime?',
  'What is the notice period for leaving?',
  'How to report a maintenance issue?',
  'What does 10% annual escalation mean?',
]

export default function TenantAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim()) return
    
    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages([...newMessages, { role: 'assistant', content: data.response }])
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-surface-900">AI Assistant</h2>
        <p className="text-surface-500 text-sm mt-1">Ask about tenant rights, rent, maintenance, or lease queries</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden !p-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-accent-600" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">How can I help?</h3>
              <p className="text-sm text-surface-500 max-w-md mb-6">
                I can answer questions about your rental, tenant rights, and Indian tenancy laws.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="text-left px-4 py-3 rounded-xl border border-surface-200 hover:border-accent-300 hover:bg-accent-50 text-sm text-surface-600 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 inline mr-2 text-accent-500" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-accent-600" />
                  </div>
                )}
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' ? 'bg-accent-600 text-white' : 'bg-surface-100 text-surface-800'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-accent-600" />
              </div>
              <div className="bg-surface-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-surface-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-surface-100 p-4">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input) }} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about rent, rights, maintenance..."
              className="flex-1 input-field"
              disabled={loading}
            />
            <Button type="submit" disabled={!input.trim() || loading} icon={<Send className="w-4 h-4" />}>
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
