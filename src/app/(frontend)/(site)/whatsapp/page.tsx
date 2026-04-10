'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhoneNumber {
  id: string
  verified_name: string
  display_phone_number: string
  quality_rating: string
}

interface RegisterResult {
  ok: boolean
  message: string
}

// ─── Quality badge ────────────────────────────────────────────────────────────

function QualityBadge({ rating }: { rating: string }) {
  const map: Record<string, string> = {
    GREEN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    YELLOW: 'bg-amber-100 text-amber-700 border-amber-200',
    RED: 'bg-red-100 text-red-700 border-red-200',
  }
  const cls = map[rating] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <Badge variant="outline" className={`text-[11px] font-medium ${cls}`}>
      {rating}
    </Badge>
  )
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={copy}
      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
      title="Copy ID"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WhatsAppToolPage() {
  // phone numbers
  const [numbers, setNumbers] = useState<PhoneNumber[]>([])
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')

  // register
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [pin, setPin] = useState('')
  const [registering, setRegistering] = useState(false)
  const [registerResult, setRegisterResult] = useState<RegisterResult | null>(null)

  // ── Fetch phone numbers ────────────────────────────────────────────────────

  async function fetchNumbers() {
    setFetching(true)
    setFetchError('')
    setNumbers([])

    try {
      const res = await fetch(`/api/whatsapp/phone-numbers`)
      const data = await res.json()

      if (!res.ok) {
        setFetchError(data?.error ?? `Error ${res.status}`)
      } else {
        setNumbers(data.data ?? [])
        if ((data.data ?? []).length === 0) setFetchError('No phone numbers found in this WABA.')
      }
    } catch {
      setFetchError('Network error — could not reach the server.')
    } finally {
      setFetching(false)
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    setRegistering(true)
    setRegisterResult(null)

    try {
      const res = await fetch('/api/whatsapp/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: phoneNumberId.trim(),
          pin: pin.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setRegisterResult({
          ok: false,
          message: data?.error ?? data?.error?.message ?? `Error ${res.status}`,
        })
      } else {
        setRegisterResult({
          ok: true,
          message: 'Phone number registered successfully for Cloud API.',
        })
        setPin('')
      }
    } catch {
      setRegisterResult({ ok: false, message: 'Network error — could not reach the server.' })
    } finally {
      setRegistering(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">WhatsApp Business Tool</h1>
        <p className="text-sm text-muted-foreground mt-1">Dev utility — not for production use.</p>
      </div>

      {/* ── Get Phone Numbers ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Get Phone Numbers
          </h2>
          <Button size="sm" variant="outline" onClick={fetchNumbers} disabled={fetching}>
            {fetching ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
            {fetching ? 'Fetching…' : 'Fetch'}
          </Button>
        </div>

        {/* Error */}
        {fetchError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            <AlertCircle className="size-4 shrink-0" />
            {fetchError}
          </div>
        )}

        {/* Results table */}
        {numbers.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                    Name
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                    Number
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                    ID
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                    Quality
                  </th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {numbers.map((n, i) => (
                  <tr
                    key={n.id}
                    className={`border-b last:border-0 hover:bg-accent/40 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
                  >
                    <td className="px-3 py-2.5 font-medium">{n.verified_name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{n.display_phone_number}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs">{n.id}</span>
                      <CopyButton value={n.id} />
                    </td>
                    <td className="px-3 py-2.5">
                      <QualityBadge rating={n.quality_rating} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => {
                          setPhoneNumberId(n.id)
                          setRegisterResult(null)
                        }}
                      >
                        Use
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Separator />

      {/* ── Register Phone Number ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Register Phone Number
        </h2>
        <p className="text-sm text-muted-foreground">
          Registers a number for Cloud API.{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
            POST /{'{phoneNumberId}'}/register
          </code>
        </p>

        <form onSubmit={handleRegister} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumberId">Phone Number ID</Label>
            <Input
              id="phoneNumberId"
              placeholder="e.g. 1906385232743451"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              Click <span className="font-medium">Use</span> on a row above to fill this
              automatically.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pin">
              2FA PIN <span className="text-muted-foreground font-normal">(6 digits)</span>
            </Label>
            <Input
              id="pin"
              type="password"
              placeholder="••••••"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="font-mono w-32 tracking-widest"
              required
            />
          </div>

          {registerResult && (
            <div
              className={`flex items-start gap-2 text-sm rounded-lg border px-3 py-2.5 ${
                registerResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {registerResult.ok ? (
                <CheckCircle2 className="size-4 shrink-0 mt-px" />
              ) : (
                <AlertCircle className="size-4 shrink-0 mt-px" />
              )}
              {registerResult.message}
            </div>
          )}

          <Button
            type="submit"
            disabled={registering || !phoneNumberId.trim() || pin.length !== 6}
            size="sm"
          >
            {registering ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
            {registering ? 'Registering…' : 'Register'}
          </Button>
        </form>
      </section>
    </div>
  )
}
