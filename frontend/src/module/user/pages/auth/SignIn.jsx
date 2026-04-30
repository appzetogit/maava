import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Mail, Phone, AlertCircle, Loader2 } from "lucide-react"
import AnimatedPage from "../../components/AnimatedPage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { authAPI } from "@/lib/api"
import { firebaseAuth, googleProvider, ensureFirebaseInitialized } from "@/lib/firebase"
import { setAuthData } from "@/lib/utils/auth"
import loginBanner from "@/assets/loginbanner.png"

// Common country codes
const countryCodes = [
  { code: "+91", country: "IN", flag: "🇮🇳" },
]

export default function SignIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isSignUp = searchParams.get("mode") === "signup"

  const [authMethod, setAuthMethod] = useState("phone") // "phone" or "email"
  const [formData, setFormData] = useState({
    phone: "",
    countryCode: "+91",
    email: "",
    name: "",
    rememberMe: false,
  })
  const [errors, setErrors] = useState({
    phone: "",
    email: "",
    name: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const redirectHandledRef = useRef(false)
  // Handle sign-in result processing
  const processSignedInUser = useCallback(async (user, source = "unknown") => {
    if (redirectHandledRef.current) {
      console.log(`ℹ️ [Auth] User already being processed, skipping (source: ${source})`)
      return
    }

    console.log(`✅ [Auth] Processing signed-in user from ${source}:`, {
      email: user.email,
      uid: user.uid,
      displayName: user.displayName
    })

    redirectHandledRef.current = true
    setIsLoading(true)
    setAuthError("")

    try {
      const idToken = await user.getIdToken()
      console.log(`✅ [Auth] Got ID token from ${source}, calling backend...`)

      const response = await authAPI.firebaseGoogleLogin(idToken, "user")
      const data = response?.data?.data || {}

      console.log(`✅ [Auth] Backend response from ${source}:`, {
        hasAccessToken: !!data.accessToken,
        hasUser: !!data.user,
        userEmail: data.user?.email
      })

      const accessToken = data.accessToken
      const appUser = data.user

      if (accessToken && appUser) {
        setAuthData("user", accessToken, appUser)
        window.dispatchEvent(new Event("userAuthChanged"))

        // Clear any URL hash or params
        if (window.location.hash.length > 0 || window.location.search.length > 0) {
          window.history.replaceState({}, document.title, window.location.pathname)
        }

        console.log(`✅ [Auth] Sign-in successful! Navigating to home...`)
        // Direct navigation to home to avoid intermediate redirects
        navigate("/", { replace: true })
      } else {
        throw new Error("Invalid response from server. Missing access token or user data.")
      }
    } catch (error) {
      console.error(`❌ [Auth] Error processing user from ${source}:`, error)
      redirectHandledRef.current = false
      setIsLoading(false)

      let errorMessage = "Failed to complete sign-in. Please try again."
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }
      setAuthError(errorMessage)
    }
  }, [navigate])

  // Set up Firebase Auth listeners and handle redirect results
  useEffect(() => {
    let unsubscribe = null

    const initAuth = async () => {
      try {
        const { getRedirectResult, onAuthStateChanged } = await import("firebase/auth")
        ensureFirebaseInitialized()

        // 1. Set up Auth State Listener (Most reliable for session restoration)
        unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
          console.log("🔔 [Auth] State changed:", {
            hasUser: !!user,
            email: user?.email,
            handled: redirectHandledRef.current
          })

          if (user && !redirectHandledRef.current) {
            await processSignedInUser(user, "auth-state-listener")
          }
        })

        // 2. Immediate check for current user
        if (firebaseAuth.currentUser && !redirectHandledRef.current) {
          console.log("🔍 [Auth] Current user found immediately")
          await processSignedInUser(firebaseAuth.currentUser, "immediate-check")
          return
        }

        // 3. Check for redirect result (in case user arrives via redirect)
        try {
          const result = await Promise.race([
            getRedirectResult(firebaseAuth),
            new Promise(resolve => setTimeout(() => resolve(null), 5000))
          ])

          if (result?.user && !redirectHandledRef.current) {
            console.log("✅ [Auth] Redirect result found")
            await processSignedInUser(result.user, "redirect-result")
          }
        } catch (redirectError) {
          console.warn("ℹ️ [Auth] getRedirectResult error (non-critical):", redirectError.message)
        }

      } catch (error) {
        console.error("❌ [Auth] Initialization error:", error)
      }
    }

    initAuth()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [processSignedInUser])


  // Get selected country details dynamically
  const selectedCountry = countryCodes.find(c => c.code === formData.countryCode) || countryCodes[0] // Default to India (+91)

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email is required"
    }
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address"
    }
    return ""
  }

  const validatePhone = (phone, countryCode) => {
    if (!phone.trim()) {
      return "Phone number is required"
    }
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "")

    // India specific validation
    if (countryCode === "+91") {
      if (cleanPhone.length !== 10) {
        return "Phone number must be 10 digits"
      }
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return "Invalid Indian mobile number"
      }
      return ""
    }

    const phoneRegex = /^\d{7,15}$/
    if (!phoneRegex.test(cleanPhone)) {
      return "Phone number must be 7-15 digits"
    }
    return ""
  }

  const validateName = (name) => {
    if (!name.trim()) {
      return "Name is required"
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters"
    }
    if (name.trim().length > 50) {
      return "Name must be less than 50 characters"
    }
    const nameRegex = /^[a-zA-Z\s'-]+$/
    if (!nameRegex.test(name.trim())) {
      return "Name can only contain letters, spaces, hyphens, and apostrophes"
    }
    return ""
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Real-time validation
    if (name === "email") {
      setErrors({ ...errors, email: validateEmail(value) })
    } else if (name === "phone") {
      setErrors({ ...errors, phone: validatePhone(value, formData.countryCode) })
    } else if (name === "name") {
      setErrors({ ...errors, name: validateName(value) })
    }
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setAuthError("")

    // Validate based on auth method
    let hasErrors = false
    const newErrors = { phone: "", email: "", name: "" }

    if (authMethod === "phone") {
      const phoneError = validatePhone(formData.phone, formData.countryCode)
      newErrors.phone = phoneError
      if (phoneError) hasErrors = true
    } else {
      const emailError = validateEmail(formData.email)
      newErrors.email = emailError
      if (emailError) hasErrors = true
    }

    // Validate name for sign up
    if (isSignUp) {
      const nameError = validateName(formData.name)
      newErrors.name = nameError
      if (nameError) hasErrors = true
    }

    setErrors(newErrors)

    if (hasErrors) {
      setIsLoading(false)
      return
    }

    try {
      const purpose = isSignUp ? "register" : "login"
      const fullPhone = authMethod === "phone" ? `${formData.countryCode} ${formData.phone}`.trim() : null
      const email = authMethod === "email" ? formData.email.trim() : null

      // Call backend to send OTP
      await authAPI.sendOTP(fullPhone, purpose, email)

      // Store auth data in sessionStorage for OTP page
      const authData = {
        method: authMethod,
        phone: fullPhone,
        email: email,
        name: isSignUp ? formData.name.trim() : null,
        isSignUp,
        module: "user",
      }
      sessionStorage.setItem("userAuthData", JSON.stringify(authData))

      // Navigate to OTP page
      navigate("/user/auth/otp")
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to send OTP. Please try again."
      setAuthError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthError("")
    setIsLoading(true)
    redirectHandledRef.current = false // Reset flag when starting new sign-in

    try {
      // Ensure Firebase is initialized before use
      ensureFirebaseInitialized()

      // Validate Firebase Auth instance
      if (!firebaseAuth) {
        throw new Error("Firebase Auth is not initialized. Please check your Firebase configuration.")
      }

      console.log("🚀 Starting Google sign-in...")

      const { signInWithPopup, signInWithRedirect, signInWithCredential, GoogleAuthProvider } = await import("firebase/auth")

      // 1. Check if we are inside the Flutter Mobile App (WebView)
      if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
        try {
          console.log("📱 [Flutter] Detected Flutter WebView, using native bridge...")

          // 2. Call the Native Android/iOS Google Account List handled by Flutter
          const result = await window.flutter_inappwebview.callHandler('nativeGoogleSignIn')

          if (result && result.success && result.idToken) {
            console.log("✅ [Flutter] Received ID token from Flutter App")

            // 3. Authenticate with Firebase using the Flutter App's ID Token
            const credential = GoogleAuthProvider.credential(result.idToken)
            const userCredential = await signInWithCredential(firebaseAuth, credential)

            if (userCredential?.user) {
              console.log("✅ [Flutter] Firebase login successful via native bridge")
              await processSignedInUser(userCredential.user, "flutter-native-bridge")
            }
            return // Stop here, native login handled
          } else {
            console.log("ℹ️ [Flutter] Native sign-in canceled or failed. Falling back...")
          }
        } catch (bridgeError) {
          console.error("❌ [Flutter] Native bridge error:", bridgeError)
          // Fallback to normal flow if bridge fails
        }
      }

      // 4. Normal Browser Flow (Chrome, Safari, etc.)
      try {
        // Try popup first (most reliable for session restoration on localhost)
        const result = await signInWithPopup(firebaseAuth, googleProvider)
        if (result?.user) {
          console.log("✅ Popup sign-in successful")
          await processSignedInUser(result.user, "popup")
        }
      } catch (popupError) {
        console.warn("ℹ️ Popup failed or blocked, falling back to redirect:", popupError.code)

        // If popup was blocked or failed, fallback to redirect
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/cancelled-popup-request' || popupError.code === 'auth/popup-closed-by-user') {
          await signInWithRedirect(firebaseAuth, googleProvider)
          console.log("✅ Redirect initiated...")
          // Note: page will redirect, so we don't set loading to false
        } else {
          throw popupError
        }
      }
    } catch (error) {
      console.error("❌ Google sign-in error:", error)
      setIsLoading(false)
      redirectHandledRef.current = false

      const errorCode = error?.code || ""
      let message = "Google sign-in failed. Please try again."

      if (errorCode === "auth/configuration-not-found") {
        message = "Firebase configuration error. Please ensure your domain is authorized in Firebase Console."
      } else if (errorCode === "auth/network-request-failed") {
        message = "Network error. Please check your connection and try again."
      } else if (error?.message) {
        message = error.message
      }

      setAuthError(message)
    }
  }

  const toggleMode = () => {
    const newMode = isSignUp ? "signin" : "signup"
    navigate(`/user/auth/sign-in?mode=${newMode}`, { replace: true })
    // Reset form
    setFormData({ phone: "", countryCode: "+91", email: "", name: "", rememberMe: false })
    setErrors({ phone: "", email: "", name: "" })
  }

  const handleLoginMethodChange = () => {
    setAuthMethod(authMethod === "email" ? "phone" : "email")
  }

  const handleSkip = () => {
    sessionStorage.setItem("user_skipped_login", "true")
    window.location.href = "/" // Force refresh to re-evaluate auth status
  }

  return (
    <AnimatedPage className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a] !pb-0 md:flex-row">

      {/* Mobile: Top Section - Banner Image */}
      {/* Desktop: Left Section - Banner Image */}
      <div className="relative md:hidden w-full shrink-0" style={{ height: "45vh", minHeight: "300px" }}>
        <img
          src={loginBanner}
          alt="Food Banner"
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="relative hidden md:block w-full shrink-0 md:w-1/2 md:h-screen md:sticky md:top-0">
        <img
          src={loginBanner}
          alt="Food Banner"
          className="w-full h-full object-cover object-center"
        />
        {/* Overlay gradient for better text readability on desktop */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
      </div>

      {/* Mobile: Bottom Section - White Login Form */}
      {/* Desktop: Right Section - Login Form */}
      <div className="bg-white dark:bg-[#1a1a1a] p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 md:w-1/2 md:flex md:items-center md:justify-center">
        <div className="max-w-md lg:max-w-lg xl:max-w-xl mx-auto space-y-6 md:space-y-8 lg:space-y-10 w-full">
          {/* Heading */}
          <div className="text-center space-y-2 md:space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black dark:text-white leading-tight">
              Local Food & Grocery Delivery App
            </h2>
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">
                Log in or sign up
              </p>
              <button
                type="button"
                onClick={handleSkip}
                className="text-green-600 hover:text-green-700 font-bold text-sm flex items-center gap-1 transition-colors border border-green-600/20 px-3 py-1 rounded-full bg-green-50/50"
              >
                Skip for now
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            {/* Name field for sign up - hidden by default, shown only when needed */}
            {isSignUp && (
              <div className="space-y-2">
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`text-base md:text-lg h-12 md:h-14 bg-white dark:bg-[#1a1a1a] text-black dark:text-white ${errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-700"} transition-colors`}
                  aria-invalid={errors.name ? "true" : "false"}
                />
                {errors.name && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Phone Number Input */}
            {authMethod === "phone" && (
              <div className="space-y-2">
                <div className="flex gap-2 items-stretch">
                  <div className="w-[80px] md:w-[90px] h-12 md:h-14 border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1a1a1a] text-black dark:text-white rounded-lg flex items-center justify-center gap-2 shrink-0 select-none">
                    <span className="text-sm md:text-base">{selectedCountry.flag}</span>
                    <span className="text-sm md:text-base font-medium">{selectedCountry.code}</span>
                  </div>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`flex-1 h-12 md:h-14 text-base md:text-lg bg-white dark:bg-[#1a1a1a] text-black dark:text-white border-gray-300 dark:border-gray-700 rounded-lg ${errors.phone ? "border-red-500" : ""} transition-colors`}
                    aria-invalid={errors.phone ? "true" : "false"}
                  />
                </div>
                {errors.phone && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.phone}</span>
                  </div>
                )}
                {authError && authMethod === "phone" && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Email Input */}
            {authMethod === "email" && (
              <div className="space-y-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full h-12 md:h-14 text-base md:text-lg bg-white dark:bg-[#1a1a1a] text-black dark:text-white border-gray-300 dark:border-gray-700 rounded-lg ${errors.email ? "border-red-500" : ""} transition-colors`}
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.email}</span>
                  </div>
                )}
                {authError && authMethod === "email" && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>{authError}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("phone")
                    setAuthError("")
                  }}
                  className="text-xs text-black hover:underline text-left font-bold"
                >
                  Use phone instead
                </button>
              </div>
            )}

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, rememberMe: checked })
                }
                className="w-4 h-4 border-2 border-black rounded data-[state=checked]:bg-white data-[state=checked]:text-black flex items-center justify-center transition-colors"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
              >
                Remember my login for faster sign-in
              </label>
            </div>

            {/* Continue Button */}
            <Button
              type="submit"
              className="w-full h-12 md:h-14 bg-black hover:bg-zinc-800 text-white font-bold text-base md:text-lg rounded-lg transition-all hover:shadow-lg active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isSignUp ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>

          {/* Or Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-[#1a1a1a] px-2 text-sm text-gray-500 dark:text-gray-400">
                or
              </span>
            </div>
          </div>

          {/* Social Login Icons */}
          <div className="flex justify-center gap-4 md:gap-6">
            {/* Google Login */}
            {/* <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-black dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:shadow-md active:scale-95"
              aria-label="Sign in with Google"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </button> */}

            {/* Email Login */}
            {/* <button
              type="button"
              onClick={handleLoginMethodChange}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-black dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:shadow-md active:scale-95 bg-white shadow-sm"
              aria-label="Sign in with Email"
            >
              {authMethod == "phone" ? <Mail className="h-5 w-5 md:h-6 md:w-6 text-black dark:text-white" /> : <Phone className="h-5 w-5 md:h-6 md:w-6 text-black dark:text-white" />}
            </button> */}
          </div>

          <div className="text-center text-xs md:text-sm text-gray-500 dark:text-gray-400 pt-1 md:pt-2">
            <p className="mb-2">
              By continuing, you agree to our{' '}
              <span
                className="underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
                onClick={() => navigate("/user/privacy")}
              >
                Privacy Policy
              </span>
              {' '}and{' '}
              <span
                className="underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
                onClick={() => navigate("/user/support")}
              >
                Support
              </span>
            </p>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
