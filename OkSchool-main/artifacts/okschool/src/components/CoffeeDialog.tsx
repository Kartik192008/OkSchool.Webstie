"use client"

import { useEffect, useState, useCallback } from "react"
import { Coffee, X, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { API_BASE } from "@/lib/api"

const AMOUNTS = [10, 20, 50, 100, 150] as const

export function CoffeeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const loadRazorpay = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.head.appendChild(script)
    })
  }, [])

  const handlePay = async () => {
    if (!selectedAmount) return
    setLoading(true)
    setStatus("processing")
    setError(null)

    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token

      const orderRes = await fetch(`${API_BASE}/api/razorpay/create-donation-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: selectedAmount }),
      })

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}))
        throw new Error(err.error || "Failed to create order")
      }

      const order = await orderRes.json()
      const ok = await loadRazorpay()
      if (!ok) throw new Error("Razorpay failed to load")

      const options: any = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "OkSchool",
        description: `Coffee donation - ₹${selectedAmount}`,
        order_id: order.order_id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/razorpay/verify-donation-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: selectedAmount,
              }),
            })

            if (!verifyRes.ok) {
              const err = await verifyRes.json().catch(() => ({}))
              throw new Error(err.error || "Verification failed")
            }

            setStatus("success")
            setLoading(false)
            setTimeout(() => onClose(), 1200)
          } catch (err: any) {
            setStatus("error")
            setError(err.message || "Payment verification failed")
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => {
            setStatus("idle")
            setLoading(false)
          },
        },
        theme: {
          color: "#CC5A27",
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        notes: {
          purpose: "donation",
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      setStatus("error")
      setError(err.message || "Failed to start payment")
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="relative z-[61] w-full max-w-xs rounded-3xl bg-card border border-card-border shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-background/50 border-b border-card-border px-6 py-4 flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-foreground">
              ☕ Buy OkSchool a coffee
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <p className="text-sm text-muted-foreground text-center">
              Everything here is free for students. A coffee keeps the notes coming. Choose an amount:
            </p>

            <div className="grid grid-cols-3 gap-3">
              {AMOUNTS.map((amt) => {
                const isSelected = selectedAmount === amt
                return (
                  <button
                    key={amt}
                    onClick={() => setSelectedAmount(amt)}
                    className={`rounded-xl border py-3 text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_0_2px_rgba(204,90,39,0.4)]"
                        : "bg-card text-muted-foreground border-card-border hover:bg-muted hover:text-foreground hover:border-primary"
                    }`}
                  >
                    ₹{amt}
                  </button>
                )
              })}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={!selectedAmount || loading || status === "success"}
              className={`w-full py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                loading
                  ? "bg-muted"
                  : status === "success"
                  ? "bg-green-600"
                  : "bg-primary hover:bg-accent shadow-md"
              }`}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : status === "success" ? (
                <CheckCircle2 className="h-5 w-5 mr-2" />
              ) : (
                <ArrowRight className="h-5 w-5 mr-2" />
              )}
              {loading ? "Processing…" : status === "success" ? "Thank you! ☕" : `Pay ₹${selectedAmount}`}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
