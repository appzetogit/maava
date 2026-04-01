import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Gift } from "lucide-react"
import { deliveryAPI } from "@/lib/api"
import { useCompanyName } from "@/lib/hooks/useCompanyName"
import deliveryHeroImg from "@/assets/purple_delivery_boy.png"

// Common country codes
const countryCodes = [
  { code: "+91", country: "IN", flag: "🇮🇳" },
]

export default function DeliverySignIn() {
  const companyName = useCompanyName()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    phone: "",
    countryCode: "+91",
    referralCode: "",
  })
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const refCode = searchParams.get("ref")
    if (refCode) {
      setFormData(prev => ({
        ...prev,
        referralCode: refCode.toUpperCase()
      }))
    }
  }, [searchParams])
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)

  // Get selected country details dynamically
  const selectedCountry = countryCodes.find(c => c.code === formData.countryCode) || countryCodes[0] // Default to India (+91)

  const validatePhone = (phone, countryCode) => {
    if (!phone || phone.trim() === "") {
      return "Phone number is required"
    }

    const digitsOnly = phone.replace(/\D/g, "")

    if (digitsOnly.length < 7) {
      return "Phone number must be at least 7 digits"
    }

    // India-specific validation
    if (countryCode === "+91") {
      if (digitsOnly.length !== 10) {
        return "Indian phone number must be 10 digits"
      }
      const firstDigit = digitsOnly[0]
      if (!["6", "7", "8", "9"].includes(firstDigit)) {
        return "Invalid Indian mobile number"
      }
    }

    return ""
  }

  const handleSendOTP = async () => {
    setError("")

    const phoneError = validatePhone(formData.phone, formData.countryCode)
    if (phoneError) {
      setError(phoneError)
      return
    }

    const fullPhone = `${formData.countryCode} ${formData.phone}`.trim()

    try {
      setIsSending(true)

      // Call backend to send OTP for delivery login
      await deliveryAPI.sendOTP(fullPhone, "login")

      // Store auth data in sessionStorage for OTP page
      const authData = {
        method: "phone",
        phone: fullPhone,
        isSignUp: false,
        module: "delivery",
        referralCode: formData.referralCode?.trim()?.toUpperCase() || null,
      }
      sessionStorage.setItem("deliveryAuthData", JSON.stringify(authData))

      // Navigate to OTP page
      navigate("/delivery/otp")
    } catch (err) {
      console.error("Send OTP Error:", err)
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to send OTP. Please try again."
      setError(message)
      setIsSending(false)
    }
  }

  const handlePhoneChange = (e) => {
    // Only allow digits
    const value = e.target.value.replace(/\D/g, "")
    setFormData({
      ...formData,
      phone: value,
    })
  }


  const handleReferralChange = (e) => {
    setFormData({
      ...formData,
      referralCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
    })
  }

  const isValid = !validatePhone(formData.phone, formData.countryCode)

  return (
    <div className="max-h-screen h-screen bg-white flex flex-col overflow-y-auto">
      {/* Hero Image at Top */}
      <div className="w-full bg-white flex flex-col items-center justify-center p-4">
        <img
          src={deliveryHeroImg}
          alt="Delivery Hero"
          className="w-full max-h-[300px] object-contain"
        />
      </div>

      {/* Top Section - Logo and Badge (Restored as previous) */}
      <div className="flex flex-col items-center pt-8 pb-6 px-6">
        <div>
          <h1 className="text-3xl text-black font-extrabold italic lowercase tracking-tight">
            {companyName.toLowerCase()}
          </h1>
        </div>

        <div className="bg-black px-6 py-2 rounded mt-2">
          <span className="text-white font-semibold text-sm uppercase tracking-wide">
            DELIVERY
          </span>
        </div>
      </div>

      {/* Main Content - Form Section (Restored as previous) */}
      <div className="flex-1 flex flex-col px-6 pb-8">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-black">
              Sign in to your account
            </h2>
            <p className="text-base text-gray-600">
              Login or create an account
            </p>
          </div>

          {/* Mobile Number Input */}
          <div className="space-y-2 w-full">
            <div className="flex gap-2 items-stretch w-full">
              <div className="w-[80px] h-12 border border-gray-300 bg-gray-50 flex items-center justify-center gap-2 rounded-lg shrink-0 select-none">
                <span className="text-base">{selectedCountry.flag}</span>
                <span className="text-base font-semibold text-black">{selectedCountry.code}</span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Enter mobile number"
                value={formData.phone}
                onChange={handlePhoneChange}
                autoComplete="off"
                autoFocus={false}
                className={`flex-1 h-12 px-4 text-gray-900 placeholder-gray-400 focus:outline-none text-base border rounded-lg min-w-0 ${error ? "border-red-500" : "border-gray-300"
                  }`}
              />
            </div>

            <p className="text-sm text-gray-500">
              Enter a valid 10 digit mobile number
            </p>

            {error && (
              <p className="text-sm text-red-500 text-center">
                {error}
              </p>
            )}
          </div>

          {/* Referral Code Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Referral Code (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Gift size={20} />
              </span>
              <input
                type="text"
                placeholder="e.g. DEL000001"
                value={formData.referralCode}
                onChange={handleReferralChange}
                className="w-full h-12 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none text-base border border-gray-300 rounded-lg uppercase"
              />
            </div>
            <p className="text-xs text-gray-500">
              Got a code from a friend? Enter it here!
            </p>
          </div>

          {/* Continue Button (Restored Green) */}
          <button
            onClick={handleSendOTP}
            disabled={!isValid || isSending}
            className={`w-full py-4 rounded-lg font-bold text-base transition-colors ${isValid && !isSending
              ? "bg-[#00B761] hover:bg-[#00A055] active:bg-[#009049] text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            {isSending ? "Sending OTP..." : "Continue"}
          </button>

          {/* Terms and Conditions */}
          <p className="text-xs text-center text-gray-600 px-4">
            By continuing, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Terms and Conditions
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
