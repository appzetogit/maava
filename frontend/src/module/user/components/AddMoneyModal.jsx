import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IndianRupee, Loader2 } from "lucide-react"
import { userAPI } from "@/lib/api"
import { initRazorpayPayment } from "@/lib/utils/razorpay"
import { toast } from "sonner"
import { getCompanyNameAsync } from "@/lib/utils/businessSettings"
import { cn } from "@/lib/utils"

export default function AddMoneyModal({ open, onOpenChange, onSuccess }) {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Quick amount buttons
  const quickAmounts = [100, 250, 500, 1000, 2000, 5000]

  const handleAmountSelect = (selectedAmount) => {
    setAmount(selectedAmount.toString())
  }

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, "")
    if (value === "" || (parseFloat(value) >= 1 && parseFloat(value) <= 50000)) {
      setAmount(value)
    }
  }

  const handleAddMoney = async () => {
    const amountNum = parseFloat(amount)

    if (!amount || isNaN(amountNum) || amountNum < 1) {
      toast.error("Please enter a valid amount (minimum ₹1)")
      return
    }

    if (amountNum > 50000) {
      toast.error("Maximum amount is ₹50,000")
      return
    }

    try {
      setLoading(true)

      // Create Razorpay order
      console.log('Creating wallet top-up order for amount:', amountNum)
      const orderResponse = await userAPI.createWalletTopupOrder(amountNum)
      console.log('Order response:', orderResponse)

      const { razorpay } = orderResponse.data.data

      if (!razorpay || !razorpay.orderId || !razorpay.key) {
        console.error('Invalid Razorpay response:', { razorpay, orderResponse })
        throw new Error("Failed to initialize payment gateway")
      }

      setLoading(false)

      // Close the modal before opening Razorpay to avoid z-index conflicts
      onOpenChange(false)

      // Small delay to ensure modal is closed
      await new Promise(resolve => setTimeout(resolve, 100))

      setProcessing(true)

      // Get user info for Razorpay prefill
      let userInfo = {}
      try {
        const userResponse = await userAPI.getProfile()
        userInfo = userResponse?.data?.data?.user || userResponse?.data?.user || {}
      } catch (err) {
        console.warn("Could not fetch user profile for Razorpay prefill:", err)
      }

      const userPhone = userInfo.phone || ""
      const userEmail = userInfo.email || ""
      const userName = userInfo.name || ""

      // Format phone number (remove non-digits, take last 10 digits)
      const formattedPhone = userPhone.replace(/\D/g, "").slice(-10)

      // Get company name for Razorpay
      const companyName = await getCompanyNameAsync()

      // Initialize Razorpay payment
      await initRazorpayPayment({
        key: razorpay.key,
        amount: razorpay.amount, // Already in paise from backend
        currency: razorpay.currency || 'INR',
        order_id: razorpay.orderId,
        name: companyName,
        description: `Wallet Top-up - ₹${amountNum.toFixed(2)}`,
        prefill: {
          name: userName,
          email: userEmail,
          contact: formattedPhone
        },
        notes: {
          type: 'wallet_topup',
          amount: amountNum.toString()
        },
        handler: async (response) => {
          try {
            // Verify payment and add money to wallet
            const verifyResponse = await userAPI.verifyWalletTopupPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              amount: amountNum
            })

            toast.success(`₹${amountNum} added to wallet successfully!`)

            // Reset form
            setAmount("")
            setProcessing(false)
            onOpenChange(false)

            // Refresh wallet data
            if (onSuccess) {
              onSuccess()
            }
          } catch (error) {
            console.error("Payment verification error:", error)
            toast.error(error?.response?.data?.message || "Payment verification failed. Please contact support.")
            setProcessing(false)
          }
        },
        onError: (error) => {
          console.error("Razorpay payment error:", error)
          toast.error(error?.description || "Payment failed. Please try again.")
          setProcessing(false)
        },
        onClose: () => {
          setProcessing(false)
          // Modal already closed, no need to close again
        }
      })
    } catch (error) {
      console.error("Error creating payment order:", error)
      console.error("Error response:", error?.response)
      console.error("Error response data:", error?.response?.data)

      // Extract error message from response
      let errorMessage = "Failed to initialize payment. Please try again."

      if (error?.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        }
      } else if (error?.message) {
        errorMessage = error.message
      }

      console.error("Final error message:", errorMessage)
      toast.error(errorMessage)
      setLoading(false)
      setProcessing(false)
    }
  }

  const handleClose = () => {
    if (!loading && !processing) {
      setAmount("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[92%] sm:max-w-sm rounded-2xl dark:bg-[#1a1a1a] dark:border-gray-800 p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg md:text-xl font-bold text-gray-900 dark:text-white text-center">
            Add Money to Wallet
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
            Enter the amount for your wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block text-center">
              Enter Amount
            </label>
            <div className="relative w-[92%] mx-auto">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                <IndianRupee className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <Input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter amount"
                className="pl-8 h-8 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-green-500 rounded-lg"
                disabled={loading || processing}
              />
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
              Min: ₹1 | Max: ₹50,000
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block text-center">
              Quick Select
            </label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((quickAmount) => {
                const isSelected = amount === quickAmount.toString()
                return (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "h-8 transition-all text-xs",
                      isSelected
                        ? "bg-green-600 hover:bg-green-700 text-white border-transparent"
                        : "bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800"
                    )}
                    onClick={() => handleAmountSelect(quickAmount)}
                    disabled={loading || processing}
                  >
                    ₹{quickAmount}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Add Money Button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={handleAddMoney}
              disabled={!amount || loading || processing || parseFloat(amount) < 1}
              className="w-[85%] h-10 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl"
            >
              {loading || processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loading ? "Processing..." : "Opening..."}
                </>
              ) : (
                `Add ₹${amount || "0"}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

