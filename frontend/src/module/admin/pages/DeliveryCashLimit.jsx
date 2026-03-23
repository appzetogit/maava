import { useEffect, useState } from "react"
import { IndianRupee, Loader2, Wallet } from "lucide-react"
import { adminAPI } from "@/lib/api"
import { toast } from "sonner"

export default function DeliveryCashLimit() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingWithdrawal, setSavingWithdrawal] = useState(false)
  const [deliveryCashLimit, setDeliveryCashLimit] = useState("")
  const [deliveryWithdrawalLimit, setDeliveryWithdrawalLimit] = useState("")
  const [deliveryReferralBonus, setDeliveryReferralBonus] = useState("")
  const [deliveryUnlockBonus, setDeliveryUnlockBonus] = useState("")

  const fetchLimit = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getDeliveryCashLimit()
      const data = response?.data?.data ?? response?.data ?? {}
      const limit = data.deliveryCashLimit
      const wl = data.deliveryWithdrawalLimit ?? 100
      const rb = data.deliveryReferralBonus ?? 6000
      const ub = data.deliveryUnlockBonus ?? 100
      setDeliveryCashLimit(limit !== undefined && limit !== null ? String(limit) : "")
      setDeliveryWithdrawalLimit(wl !== undefined && wl !== null ? String(wl) : "100")
      setDeliveryReferralBonus(rb !== undefined && rb !== null ? String(rb) : "6000")
      setDeliveryUnlockBonus(ub !== undefined && ub !== null ? String(ub) : "100")
    } catch (error) {
      console.error("Error fetching delivery cash limit:", error)
      toast.error(error.response?.data?.message || "Failed to load delivery cash limit")
      setDeliveryCashLimit("")
      setDeliveryWithdrawalLimit("100")
      setDeliveryReferralBonus("6000")
      setDeliveryUnlockBonus("100")
    } finally {
      setLoading(false)
    }
  }

  const saveLimit = async () => {
    const value = Number(deliveryCashLimit)
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Cash limit must be a number (>= 0)")
      return
    }

    try {
      setSaving(true)
      const response = await adminAPI.updateDeliveryCashLimit({ deliveryCashLimit: value })
      const saved =
        response?.data?.data?.deliveryCashLimit ??
        response?.data?.deliveryCashLimit ??
        value
      setDeliveryCashLimit(String(saved))
      toast.success("Delivery cash limit updated successfully")
    } catch (error) {
      console.error("Error saving delivery cash limit:", error)
      toast.error(error.response?.data?.message || "Failed to update delivery cash limit")
    } finally {
      setSaving(false)
    }
  }

  const saveWithdrawalLimit = async () => {
    const value = Number(deliveryWithdrawalLimit)
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Withdrawal limit must be a number (>= 0)")
      return
    }

    try {
      setSavingWithdrawal(true)
      const response = await adminAPI.updateDeliveryCashLimit({ deliveryWithdrawalLimit: value })
      const saved =
        response?.data?.data?.deliveryWithdrawalLimit ??
        response?.data?.deliveryWithdrawalLimit ??
        value
      setDeliveryWithdrawalLimit(String(saved))
      toast.success("Withdrawal limit updated successfully")
    } catch (error) {
      console.error("Error saving withdrawal limit:", error)
      toast.error(error.response?.data?.message || "Failed to update withdrawal limit")
    } finally {
      setSavingWithdrawal(false)
    }
  }

  const saveReferralBonus = async () => {
    const value = Number(deliveryReferralBonus)
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Referral bonus must be a number (>= 0)")
      return
    }

    try {
      setSaving(true)
      const response = await adminAPI.updateDeliveryCashLimit({ deliveryReferralBonus: value })
      const saved =
        response?.data?.data?.deliveryReferralBonus ??
        response?.data?.deliveryReferralBonus ??
        value
      setDeliveryReferralBonus(String(saved))
      toast.success("Referral bonus updated successfully")
    } catch (error) {
      console.error("Error saving referral bonus:", error)
      toast.error(error.response?.data?.message || "Failed to update referral bonus")
    } finally {
      setSaving(false)
    }
  }

  const saveUnlockBonus = async () => {
    const value = Number(deliveryUnlockBonus)
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Unlock bonus must be a number (>= 0)")
      return
    }

    try {
      setSaving(true)
      const response = await adminAPI.updateDeliveryCashLimit({ deliveryUnlockBonus: value })
      const saved =
        response?.data?.data?.deliveryUnlockBonus ??
        response?.data?.deliveryUnlockBonus ??
        value
      setDeliveryUnlockBonus(String(saved))
      toast.success("Unlock bonus updated successfully")
    } catch (error) {
      console.error("Error saving unlock bonus:", error)
      toast.error(error.response?.data?.message || "Failed to update unlock bonus")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchLimit()
  }, [])

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <IndianRupee className="w-5 h-5 text-slate-700" />
            <h1 className="text-2xl font-bold text-slate-900">Delivery Global Settings</h1>
          </div>

          <p className="text-sm text-slate-600 mb-6">
            Set global configurations for all delivery partners including limits, withdrawal rules, and the referral program bonuses.
          </p>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <IndianRupee className="w-5 h-5 text-emerald-700 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-emerald-900 mb-1">
                  Delivery Boy Available Cash Limit (Global)
                </div>
                <div className="text-sm text-emerald-800/80 mb-3">
                  When COD cash is collected, delivery partner&apos;s remaining limit will decrease automatically.
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={deliveryCashLimit}
                      onChange={(e) => setDeliveryCashLimit(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm border-emerald-200"
                      placeholder={loading ? "Loading..." : "e.g., 2000"}
                      disabled={loading || saving}
                    />
                    {loading && (
                      <p className="text-xs text-emerald-700/80 mt-1 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading current limit…
                      </p>
                    )}
                  </div>
                  <button
                    onClick={saveLimit}
                    disabled={loading || saving}
                    className="px-4 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Wallet className="w-5 h-5 text-amber-700 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-amber-900 mb-1">
                  Minimum Withdrawal Amount (Global)
                </div>
                <div className="text-sm text-amber-800/80 mb-3">
                  Delivery boy can withdraw only when withdrawable amount is <strong>above</strong> this value. Utni
                  amount ke upar rahega tabhi withdrawal hoga.
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={deliveryWithdrawalLimit}
                      onChange={(e) => setDeliveryWithdrawalLimit(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm border-amber-200"
                      placeholder={loading ? "Loading..." : "e.g., 100"}
                      disabled={loading || savingWithdrawal}
                    />
                    {loading && (
                      <p className="text-xs text-amber-700/80 mt-1 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading…
                      </p>
                    )}
                  </div>
                  <button
                    onClick={saveWithdrawalLimit}
                    disabled={loading || savingWithdrawal}
                    className="px-4 py-2.5 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {savingWithdrawal && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6 mt-6">
            <div className="flex items-start gap-3">
              <IndianRupee className="w-5 h-5 text-blue-700 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-blue-900 mb-1">
                  Referral Bonus (Global)
                </div>
                <div className="text-sm text-blue-800/80 mb-3">
                  This amount is rewarded to the delivery partner who referred a friend.
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={deliveryReferralBonus}
                      onChange={(e) => setDeliveryReferralBonus(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm border-blue-200"
                      placeholder={loading ? "Loading..." : "e.g., 6000"}
                      disabled={loading || saving}
                    />
                    {loading && (
                      <p className="text-xs text-blue-700/80 mt-1 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading…
                      </p>
                    )}
                  </div>
                  <button
                    onClick={saveReferralBonus}
                    disabled={loading || saving}
                    className="px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <IndianRupee className="w-5 h-5 text-purple-700 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-purple-900 mb-1">
                  Unlock Bonus (Global)
                </div>
                <div className="text-sm text-purple-800/80 mb-3">
                  This amount is unlocked by the newly joined delivery boy on completing their 1st order.
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={deliveryUnlockBonus}
                      onChange={(e) => setDeliveryUnlockBonus(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm border-purple-200"
                      placeholder={loading ? "Loading..." : "e.g., 100"}
                      disabled={loading || saving}
                    />
                    {loading && (
                      <p className="text-xs text-purple-700/80 mt-1 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading…
                      </p>
                    )}
                  </div>
                  <button
                    onClick={saveUnlockBonus}
                    disabled={loading || saving}
                    className="px-4 py-2.5 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

