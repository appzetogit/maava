import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { restaurantAPI, authAPI } from "@/lib/api"
import { firebaseAuth, googleProvider, ensureFirebaseInitialized } from "@/lib/firebase"
import { setAuthData } from "@/lib/utils/auth"
import { Mail, Lock, EyeOff, Eye, CheckSquare, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import loginBg from "@/assets/loginbanner.png"
import { useCompanyName } from "@/lib/hooks/useCompanyName"

export default function RestaurantSignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const companyName = useCompanyName()
  const redirectHandledRef = useRef(false)

  // Redirect to restaurant home if already authenticated, and handle Firebase redirect results
  useEffect(() => {
    // 1. Basic local check
    const isAuthenticated = localStorage.getItem("restaurant_authenticated") === "true"
    if (isAuthenticated) {
      navigate("/restaurant", { replace: true })
      return
    }

    let unsubscribe = null

    const initAuth = async () => {
      try {
        const { getRedirectResult, onAuthStateChanged } = await import("firebase/auth")
        ensureFirebaseInitialized()

        if (!firebaseAuth) return

        // 2. Set up Auth State Listener
        unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
          console.log("🔔 [Auth] Restaurant SignIn state changed:", {
            hasUser: !!user,
            email: user?.email,
            handled: redirectHandledRef.current
          })

          if (user && !redirectHandledRef.current) {
            await processSignedInUser(user, "auth-state-listener")
          }
        })

        // 3. Check for current user
        if (firebaseAuth.currentUser && !redirectHandledRef.current) {
          await processSignedInUser(firebaseAuth.currentUser, "immediate-check")
          return
        }

        // 4. Check for redirect result
        try {
          const result = await Promise.race([
            getRedirectResult(firebaseAuth),
            new Promise(resolve => setTimeout(() => resolve(null), 4000))
          ])

          if (result?.user && !redirectHandledRef.current) {
            console.log("✅ [Auth] Redirect result found in Restaurant SignIn")
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
  }, [navigate, processSignedInUser])

  const processSignedInUser = useCallback(async (user, source = "unknown") => {
    if (redirectHandledRef.current) {
      console.log(`ℹ️ [Auth] Restaurant already being processed, skipping (source: ${source})`)
      return
    }

    console.log(`✅ [Auth] Processing restaurant signed-in user from ${source}:`, {
      email: user.email,
      uid: user.uid
    })

    redirectHandledRef.current = true
    setIsLoading(true)
    setError("")

    try {
      const idToken = await user.getIdToken()
      console.log(`✅ [Auth] Got ID token from ${source}, calling backend...`)

      // Call the specialized restaurant google login endpoint
      const response = await restaurantAPI.firebaseGoogleLogin(idToken)
      const data = response?.data?.data || {}

      if (data.accessToken && data.restaurant) {
        setAuthData("restaurant", data.accessToken, data.restaurant)
        window.dispatchEvent(new Event('restaurantAuthChanged'))
        
        console.log(`✅ [Auth] Sign-in successful! Navigating to restaurant dashboard...`)
        navigate("/restaurant", { replace: true })
      } else {
        throw new Error("Invalid response from server. Missing access token or restaurant data.")
      }
    } catch (error) {
      console.error(`❌ [Auth] Error processing restaurant from ${source}:`, error)
      redirectHandledRef.current = false
      setIsLoading(false)

      let errorMessage = "Failed to complete sign-in. Please try again."
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }
      setError(errorMessage)
    }
  }, [navigate])

  const handleGoogleSignIn = async () => {
    setError("")
    setIsLoading(true)
    redirectHandledRef.current = false

    try {
      ensureFirebaseInitialized()

      if (!firebaseAuth) {
        throw new Error("Firebase Auth is not initialized.")
      }

      const { signInWithPopup, signInWithRedirect, signInWithCredential, GoogleAuthProvider } = await import("firebase/auth")

      // 1. Check if inside Flutter Mobile App (WebView)
      if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
        try {
          console.log("📱 [Flutter] Starting Google sign-in via Flutter native bridge...")
          
          const result = await window.flutter_inappwebview.callHandler('nativeGoogleSignIn')
          
          if (result && result.success && result.idToken) {
            console.log("✅ [Flutter] Received ID token from Flutter App")
            const credential = GoogleAuthProvider.credential(result.idToken)
            const userCredential = await signInWithCredential(firebaseAuth, credential)
            
            if (userCredential?.user) {
              console.log("✅ [Flutter] Firebase login successful via native bridge")
              await processSignedInUser(userCredential.user, "flutter-native-bridge")
              return
            }
          } else {
            // ✨ FIX: User cancelled the popup. Do NOTHING here. ✨
            // DO NOT fall back to web popup. Just log it and stop.
            console.log("ℹ️ [Flutter] User cancelled native sign in. Staying on login page.")
            setIsLoading(false)
            return // <--- This stops the function from continuing
          }
        } catch (bridgeError) {
          console.error("❌ [Flutter] Flutter Bridge Error", bridgeError)
          // Fall through to web flow if bridge fails completely
        }
      }

      // 2. Normal Browser Flow
      console.log("🚀 Starting Google sign-in (Web/Popup)...")
      
      // Check if we are in a WebView that might not support popups
      const isWebView = /wv|Android.*Version\/[\d.]+/i.test(navigator.userAgent) || 
                       (navigator.userAgent.includes('Mobile') && !navigator.userAgent.includes('Safari'));

      if (isWebView) {
        console.log("📱 WebView detected, skipping popup. Using redirect...")
        await signInWithRedirect(firebaseAuth, googleProvider)
        return
      }

      try {
        // Try popup first (most common for desktop)
        const result = await signInWithPopup(firebaseAuth, googleProvider)
        if (result?.user) {
          await processSignedInUser(result.user, "popup")
        } else {
          setIsLoading(false)
        }
      } catch (popupError) {
        // If popup was blocked or failed, fallback to redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/cancelled-popup-request' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/internal-error' ||
            popupError.message?.includes('popup')) {
          console.log("ℹ️ Popup error detected, falling back to redirect...", popupError.code)
          await signInWithRedirect(firebaseAuth, googleProvider)
        } else {
          throw popupError
        }
      }
    } catch (error) {
      console.error("❌ Google sign-in error:", error)
      setIsLoading(false)
      redirectHandledRef.current = false
      setError(error.message || "Google sign-in failed.")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Login with restaurant auth endpoint
      const response = await restaurantAPI.login(email, password)
      const data = response?.data?.data || response?.data
      
      if (data.accessToken && data.restaurant) {
        // Replace old token with new one (handles cross-module login)
        setAuthData("restaurant", data.accessToken, data.restaurant)
        
        // Dispatch custom event for same-tab updates
        window.dispatchEvent(new Event('restaurantAuthChanged'))
        
        navigate("/restaurant", { replace: true })
      } else {
        throw new Error("Login failed. Please try again.")
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed. Please check your credentials."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-white overflow-y-auto">
      {/* Left image section */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src={loginBg}
          alt="Restaurant background"
          className="w-full h-full object-cover"
        />
        {/* Orange half-circle text block attached to the left with animation */}
        <div className="absolute inset-0 flex items-center text-white pointer-events-none">
          <div
            className="bg-primary-orange/80 rounded-r-full py-10 xl:py-20 pl-10 xl:pl-14 pr-10 xl:pr-20 max-w-[70%] shadow-xl backdrop-blur-[1px]"
            style={{ animation: "slideInLeft 0.8s ease-out both" }}
          >
            <h1 className="text-3xl xl:text-4xl font-extrabold mb-4 tracking-wide leading-tight">
              WELCOME TO
              <br />
              {companyName.toUpperCase()}
            </h1>
            <p className="text-base xl:text-lg opacity-95 max-w-xl">
              Manage your restaurant, orders and website easily from a single dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Right form section */}
      <div className="w-full lg:w-1/2 h-full flex flex-col">
        {/* Top logo and version */}
        <div className="relative flex items-center justify-center px-6 sm:px-10 lg:px-16 pt-6 pb-4">
          <div
            className="flex items-center gap-3"
            style={{ animation: "fadeInDown 0.7s ease-out both" }}
          >
            <div className="h-11 w-11 rounded-xl bg-primary-orange flex items-center justify-center text-white shadow-lg">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-2xl font-bold tracking-wide text-primary-orange">
                {companyName}
              </span>
              <span className="text-xs font-medium text-gray-500">
                Restaurant Panel
              </span>
            </div>
          </div>
          <div className="absolute right-6 sm:right-10 lg:right-16 top-6 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700 shadow-sm">
            Software Version : 1.0.0
          </div>
        </div>

        {/* Centered content (title + form + info) */}
        <div
          className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 lg:px-16 pb-8"
          style={{ animation: "fadeInUp 0.8s ease-out 0.15s both" }}
        >
          {/* Title */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
              Signin To Your Restaurant Panel
            </h2>
            <p className="text-sm text-gray-500">
              Enter your credentials to access the restaurant dashboard.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 w-full max-w-lg rounded-xl bg-white/80 backdrop-blur-sm p-1 sm:p-2"
          >
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Your Email
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                  <Mail className="h-4 w-4" />
                </span>
                <Input
                  id="email"
                  type="email"
                  placeholder="test.restaurant@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 pl-9 border-gray-300 rounded-md shadow-sm focus-visible:ring-primary-orange focus-visible:ring-2 transition-colors placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-9 pr-10 border-gray-300 rounded-md shadow-sm focus-visible:ring-primary-orange focus-visible:ring-2 transition-colors placeholder:text-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(Boolean(v))}
                  className="border-gray-300 data-[state=checked]:bg-primary-orange data-[state=checked]:border-primary-orange"
                />
                <span className="text-gray-700">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => navigate("/restaurant/forgot-password")}
                className="text-primary-orange hover:underline font-medium"
              >
                Forgot Password
              </button>
            </div>

            {/* Sign in button */}
            <Button
              type="submit"
              className="mt-2 h-11 w-full bg-primary-orange hover:bg-primary-orange/90 text-white text-base font-semibold rounded-md shadow-md transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* OR Divider */}
          <div className="relative my-6 w-full max-w-lg">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 font-medium">
                Or continue with Google
              </span>
            </div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full max-w-lg h-11 flex items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary-orange transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
            Sign in with Google
          </button>

          {/* Sign up link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/restaurant/signup-email")}
              className="text-primary-orange hover:underline font-medium"
            >
              Sign up
            </button>
          </div>

          {/* Demo credentials / info bar */}
          <div className="mt-8 w-full max-w-lg rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-xs sm:text-sm text-gray-800 flex items-start gap-3">
            <div className="mt-0.5 text-primary-orange">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold mb-1">Demo Credentials</div>
              <div>
                <span className="font-semibold">Email :</span> test.restaurant@gmail.com
              </div>
              <div>
                <span className="font-semibold">Password :</span> 12345678
              </div>
            </div>
          </div>
        </div>

        {/* Simple keyframe animations */}
        <style>{`
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-40px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-16px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  )
}

