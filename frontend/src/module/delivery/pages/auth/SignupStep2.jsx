import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Upload, X, Check } from "lucide-react"
import { deliveryAPI } from "@/lib/api"
import apiClient from "@/lib/api/axios"
import { toast } from "sonner"

export default function SignupStep2() {
  // Refs for camera input for each doc type
  const cameraInputRefs = {
    profilePhoto: useRef(),
    aadharPhoto: useRef(),
    panPhoto: useRef(),
    drivingLicensePhoto: useRef(),
  }
  const navigate = useNavigate()
  const [documents, setDocuments] = useState({
    profilePhoto: null,
    aadharPhoto: null,
    panPhoto: null,
    drivingLicensePhoto: null
  })
  const [uploadedDocs, setUploadedDocs] = useState({
    profilePhoto: null,
    aadharPhoto: null,
    panPhoto: null,
    drivingLicensePhoto: null
  })
  const [uploading, setUploading] = useState({
    profilePhoto: false,
    aadharPhoto: false,
    panPhoto: false,
    drivingLicensePhoto: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileSelect = async (docType, file) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    setUploading(prev => ({ ...prev, [docType]: true }))

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'appzeto/delivery/documents')

      // Upload to Cloudinary via backend
      const response = await apiClient.post('/upload/media', formData)

      if (response?.data?.success && response?.data?.data) {
        const { url, publicId } = response.data.data
        
        setDocuments(prev => ({
          ...prev,
          [docType]: file
        }))
        
        setUploadedDocs(prev => ({
          ...prev,
          [docType]: { url, publicId }
        }))

        toast.success(`${docType.replace(/([A-Z])/g, ' $1').trim()} uploaded successfully`)
      }
    } catch (error) {
      console.error(`Error uploading ${docType}:`, error)
      toast.error(`Failed to upload ${docType.replace(/([A-Z])/g, ' $1').trim()}`)
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }))
    }
  }

  const handleRemove = (docType) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: null
    }))
    setUploadedDocs(prev => ({
      ...prev,
      [docType]: null
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check if all required documents are uploaded
    if (!uploadedDocs.profilePhoto || !uploadedDocs.aadharPhoto || !uploadedDocs.panPhoto || !uploadedDocs.drivingLicensePhoto) {
      toast.error("Please upload all required documents")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await deliveryAPI.submitSignupDocuments({
        profilePhoto: uploadedDocs.profilePhoto,
        aadharPhoto: uploadedDocs.aadharPhoto,
        panPhoto: uploadedDocs.panPhoto,
        drivingLicensePhoto: uploadedDocs.drivingLicensePhoto
      })

      if (response?.data?.success) {
        toast.success("Signup completed successfully!")
        // Redirect to delivery home page
        setTimeout(() => {
          navigate("/delivery", { replace: true })
        }, 1000)
      }
    } catch (error) {
      console.error("Error submitting documents:", error)
      const message = error?.response?.data?.message || "Failed to submit documents. Please try again."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Camera capture handler (mobile support)
  // Flutter InAppWebView camera handler (for mobile app)
  const handleCameraCapture = async (docType) => {
    try {
      if (window.flutter_inappwebview && typeof window.flutter_inappwebview.callHandler === 'function') {
        const result = await window.flutter_inappwebview.callHandler('openCamera', {
          source: 'camera',
          accept: 'image/*',
          multiple: false,
          quality: 0.8
        })
        if (result && result.success) {
          let file = null
          const res = Array.isArray(result.files) ? result.files[0] : result
          if (res?.file) {
            file = res.file
          } else if (res?.base64) {
            let base64Data = res.base64
            if (base64Data.includes(',')) base64Data = base64Data.split(',')[1]
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const mimeType = res.mimeType || 'image/jpeg'
            const blob = new Blob([byteArray], { type: mimeType })
            file = new File([blob], res.fileName || `${docType}-photo-${Date.now()}.jpg`, { type: mimeType })
          }
          if (file) {
            handleFileSelect(docType, file)
          }
        }
      } else {
        cameraInputRefs[docType]?.current?.click()
      }
    } catch (error) {
      console.error('❌ Error opening camera:', error)
      toast.error('Failed to open camera')
      cameraInputRefs[docType]?.current?.click()
    }
  }

  const DocumentUpload = ({ docType, label, required = true }) => {
    const file = documents[docType]
    const uploaded = uploadedDocs[docType]
    const isUploading = uploading[docType]

    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {uploaded ? (
          <div className="relative">
            <img
              src={uploaded.url}
              alt={label}
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => handleRemove(docType)}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm">
              <Check className="w-4 h-4" />
              <span>Uploaded</span>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 w-full">
            {/* Main upload label (gallery/file) */}
            <label className="flex-1 flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-2"></div>
                    <p className="text-sm text-gray-500">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-1">Click to upload</p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const selectedFile = e.target.files[0]
                  if (selectedFile) {
                    handleFileSelect(docType, selectedFile)
                  }
                }}
                disabled={isUploading}
              />
            </label>
            {/* Camera button (mobile/photo capture) */}
            <button
              type="button"
              className="flex flex-col items-center justify-center h-48 w-16 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors bg-gray-50"
              style={{ minWidth: 56 }}
              onClick={() => handleCameraCapture(docType)}
              disabled={isUploading}
              tabIndex={-1}
              aria-label={`Capture ${label} with camera`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-green-500 mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5V6.75A2.25 2.25 0 0 1 5.25 4.5h2.086a1.5 1.5 0 0 0 1.06-.44l.828-.828A1.5 1.5 0 0 1 10.284 3h3.432a1.5 1.5 0 0 1 1.06.44l.828.828a1.5 1.5 0 0 0 1.06.44h2.086A2.25 2.25 0 0 1 21 6.75v.75" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5h18M3 7.5v9.75A2.25 2.25 0 0 0 5.25 19.5h13.5A2.25 2.25 0 0 0 21 17.25V7.5M3 7.5l2.25 2.25m13.5-2.25L21 9.75M12 15.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              </svg>
              <span className="text-xs text-gray-500">Camera</span>
              {/* Hidden camera input */}
              <input
                ref={cameraInputRefs[docType]}
                type="file"
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const selectedFile = e.target.files[0]
                  if (selectedFile) {
                    handleFileSelect(docType, selectedFile)
                  }
                }}
                disabled={isUploading}
              />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium">Upload Documents</h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Document Verification</h2>
          <p className="text-sm text-gray-600">Please upload clear photos of your documents</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <DocumentUpload docType="profilePhoto" label="Profile Photo" required={true} />
          <DocumentUpload docType="aadharPhoto" label="Aadhar Card Photo" required={true} />
          <DocumentUpload docType="panPhoto" label="PAN Card Photo" required={true} />
          <DocumentUpload docType="drivingLicensePhoto" label="Driving License Photo" required={true} />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !uploadedDocs.profilePhoto || !uploadedDocs.aadharPhoto || !uploadedDocs.panPhoto || !uploadedDocs.drivingLicensePhoto}
            className={`w-full py-4 rounded-lg font-bold text-white text-base transition-colors mt-6 ${
              isSubmitting || !uploadedDocs.profilePhoto || !uploadedDocs.aadharPhoto || !uploadedDocs.panPhoto || !uploadedDocs.drivingLicensePhoto
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#00B761] hover:bg-[#00A055]"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Complete Signup"}
          </button>
        </form>
      </div>
    </div>
  )
}

