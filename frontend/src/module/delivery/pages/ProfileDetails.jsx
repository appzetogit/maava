import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, Edit2, ChevronRight, FileText, CheckCircle, XCircle, Eye, X, Camera, Loader2, Image, GalleryVertical } from "lucide-react"
import BottomPopup from "../components/BottomPopup"
import { toast } from "sonner"
import { deliveryAPI, uploadAPI } from "@/lib/api"

export default function ProfileDetails() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [showVehiclePopup, setShowVehiclePopup] = useState(false)
  const [vehicleInput, setVehicleInput] = useState("")
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showBankDetailsPopup, setShowBankDetailsPopup] = useState(false)
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: ""
  })
  const [bankDetailsErrors, setBankDetailsErrors] = useState({})
  const [isUpdatingBankDetails, setIsUpdatingBankDetails] = useState(false)
  const [showPersonalDetailsPopup, setShowPersonalDetailsPopup] = useState(false)
  const [personalDetails, setPersonalDetails] = useState({
    name: "",
    phone: "",
    email: "",
    aadharNumber: ""
  })
  const [personalDetailsErrors, setPersonalDetailsErrors] = useState({})
  const [isUpdatingPersonalDetails, setIsUpdatingPersonalDetails] = useState(false)
  const [showCityPopup, setShowCityPopup] = useState(false)
  const [cityInput, setCityInput] = useState("")
  const [isUpdatingCity, setIsUpdatingCity] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef(null)

  // Note: All alternate phone related code has been removed

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await deliveryAPI.getProfile()
        if (response?.data?.success && response?.data?.data?.profile) {
          const profileData = response.data.data.profile
          setProfile(profileData)
          setVehicleNumber(profileData?.vehicle?.number || "")
          setVehicleInput(profileData?.vehicle?.number || "")
          // Set bank details
          setBankDetails({
            accountHolderName: profileData?.documents?.bankDetails?.accountHolderName || "",
            accountNumber: profileData?.documents?.bankDetails?.accountNumber || "",
            ifscCode: profileData?.documents?.bankDetails?.ifscCode || "",
            bankName: profileData?.documents?.bankDetails?.bankName || ""
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        
        // More detailed error handling
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          toast.error("Cannot connect to server. Please check if backend is running.")
        } else if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.")
          // Optionally redirect to login
          setTimeout(() => {
            navigate("/delivery/sign-in", { replace: true })
          }, 2000)
        } else {
          toast.error(error?.response?.data?.message || "Failed to load profile data")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB")
      return
    }

    try {
      setIsUploadingPhoto(true)
      
      // Show immediate preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setProfile(prev => ({
          ...prev,
          profileImage: { ...prev?.profileImage, url: event.target.result }
        }))
      }
      reader.readAsDataURL(file)

      
      // 1. Upload to Cloudinary
      const uploadRes = await uploadAPI.uploadMedia(file, { folder: 'delivery_profiles' })
      
      if (uploadRes?.data?.success && uploadRes?.data?.data) {
        const data = uploadRes.data.data
        const url = data.url || data.secure_url
        const publicId = data.publicId || data.public_id
        console.log("📸 Photo uploaded, updating profile:", { url, publicId })
        
        // 2. Update profile with new image info
        const updateRes = await deliveryAPI.updateProfile({
          profileImage: { url, publicId },
          documents: { photo: url }
        })

        console.log("✅ Profile update response:", updateRes.data)
        
        toast.success("Profile picture updated successfully")
        
        // 3. Update local state
        setProfile(prev => ({
          ...prev,
          profileImage: { url, publicId },
          documents: {
            ...prev?.documents,
            photo: url
          }
        }))
      }
    } catch (error) {
      console.error("❌ Error uploading photo:", error)
      toast.error(error?.response?.data?.message || error.message || "Failed to update photo")
      if (typeof fetchProfile === 'function') fetchProfile()
    } finally {
      setIsUploadingPhoto(false)
      // Reset input value to allow selecting same file again
      if (e.target) e.target.value = ""
    }
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
        <h1 className="text-lg font-medium">Profile</h1>
      </div>

      {/* Profile Picture Area */}
      <div className="relative w-full bg-gray-200 overflow-hidden flex items-center justify-center">
        <img
          src={profile?.profileImage?.url || profile?.documents?.photo || "https://i.pravatar.cc/400?img=12"}
          alt="Profile"
          className="w-full h-auto max-h-96 object-contain"
        />
        
        {/* Profile Picture Edit Button */}
        <div className="absolute bottom-4 right-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg border-2 border-white transition-all ${
              isUploadingPhoto ? "bg-gray-400" : "bg-[#00B761] hover:bg-green-700"
            }`}
          >
            {isUploadingPhoto ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Image className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Rider Details Section */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">Rider details</h2>
          <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-2 px-3 flex items-center justify-between">
              <p className="text-base text-gray-900">
                {loading ? "Loading..." : `${profile?.name || "N/A"} (${profile?.deliveryId || "N/A"})`}
              </p>
            </div>
            <div className="divide-y divide-gray-200">
            <div className="p-2 px-3 flex items-center justify-between">
                <p className="text-sm text-gray-900">Zone</p>
                <p className="text-base text-gray-900">
                  {profile?.availability?.zones?.length > 0 ? "Assigned" : "Not assigned"}
                </p>
              </div>
            <div className="p-2 px-3 flex items-center justify-between">
                <p className="text-sm text-gray-900">City</p>
                <div className="flex items-center gap-2">
                   <p className="text-base text-gray-900">
                     {profile?.location?.city || "N/A"}
                   </p>
                   <button
                     onClick={() => {
                        setCityInput(profile?.location?.city || "")
                        setShowCityPopup(true)
                     }}
                     className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                   >
                     <Edit2 className="w-4 h-4 text-green-600" />
                   </button>
                </div>
              </div>
            <div className="p-2 px-3 flex items-center justify-between">
                <p className="text-sm text-gray-900">Vehicle type</p>
                <p className="text-base text-gray-900 capitalize">
                  {profile?.vehicle?.type || "N/A"}
                </p>
              </div>
            <div className="p-2 px-3 flex items-center justify-between">
                <p className="text-sm text-gray-900">Vehicle number</p>
                {vehicleNumber ? (
                  <div className="flex items-center gap-2">
                    <p className="text-base text-gray-900">{vehicleNumber}</p>
                    <button
                      onClick={() => {
                        setVehicleInput(vehicleNumber)
                        setShowVehiclePopup(true)
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-green-600" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setVehicleInput("")
                      setShowVehiclePopup(true)
                    }}
                    className="flex items-center gap-2 text-green-600 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div>
          <h2 className="text-base font-medium text-gray-900 mb-3">Documents</h2>
          <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
            {/* Aadhar Card */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-base font-medium text-gray-900">Aadhar Card</p>
                <p className="text-xs text-gray-500 mt-1">
                  {profile?.documents?.aadhar?.verified ? "Verified" : profile?.documents?.aadhar?.document ? "Not verified" : "Not uploaded"}
                </p>
              </div>
              {profile?.documents?.aadhar?.document && (
                <button
                  onClick={() => {
                    setSelectedDocument({
                      name: "Aadhar Card",
                      url: profile.documents.aadhar.document
                    })
                    setShowDocumentModal(true)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Eye className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            {/* PAN Card */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-base font-medium text-gray-900">PAN Card</p>
                <p className="text-xs text-gray-500 mt-1">
                  {profile?.documents?.pan?.verified ? "Verified" : profile?.documents?.pan?.document ? "Not verified" : "Not uploaded"}
                </p>
              </div>
              {profile?.documents?.pan?.document && (
                <button
                  onClick={() => {
                    setSelectedDocument({
                      name: "PAN Card",
                      url: profile.documents.pan.document
                    })
                    setShowDocumentModal(true)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Eye className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            {/* Driving License */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-base font-medium text-gray-900">Driving License</p>
                <p className="text-xs text-gray-500 mt-1">
                  {profile?.documents?.drivingLicense?.verified ? "Verified" : profile?.documents?.drivingLicense?.document ? "Not verified" : "Not uploaded"}
                </p>
              </div>
              {profile?.documents?.drivingLicense?.document && (
                <button
                  onClick={() => {
                    setSelectedDocument({
                      name: "Driving License",
                      url: profile.documents.drivingLicense.document
                    })
                    setShowDocumentModal(true)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Eye className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Personal Details Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Personal details</h2>
            <button
              onClick={() => {
                setShowPersonalDetailsPopup(true)
                setPersonalDetails({
                  name: profile?.name || "",
                  phone: profile?.phone || "",
                  email: profile?.email || "",
                  aadharNumber: profile?.documents?.aadhar?.number || ""
                })
                setPersonalDetailsErrors({})
              }}
              className="text-green-600 font-medium text-sm flex items-center gap-1 hover:text-green-700"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-2 px-3 flex items-center justify-between">
              <div className="w-full align-center flex content-center justify-between">
                <p className="text-sm text-gray-900 mb-1">Name</p>
                <p className="text-base text-gray-900">
                  {profile?.name || "N/A"}
                </p>
              </div>
            </div>
            <div className="p-2 px-3 flex items-center justify-between">
              <div className="w-full align-center flex content-center justify-between">
                <p className="text-sm text-gray-900 mb-1">Phone</p>
                <p className="text-base text-gray-900">
                  {profile?.phone || "N/A"}
                </p>
              </div>
            </div>
            <div className="p-2 px-3 flex items-center justify-between">
              <div className="w-full align-center flex content-center justify-between">
                <p className="text-sm text-gray-900 mb-1">Email</p>
                <p className="text-base text-gray-900">{profile?.email || "-"}</p>
              </div>
            </div>
            <div className="p-2 px-3 flex items-center justify-between">
              <div className="w-full align-center flex content-center justify-between">
                <p className="text-sm text-gray-900 mb-1">Aadhar Card Number</p>
                <p className="text-base text-gray-900">
                  {profile?.documents?.aadhar?.number || "-"}
                </p>
              </div>
            </div>
            <div className="p-2 px-3 flex items-center justify-between">
              <div className="w-full align-center flex content-center justify-between">
                <p className="text-sm text-gray-900 mb-1">Wallet Balance</p>
                <p className="text-base text-gray-900">
                  ₹{profile?.wallet?.balance?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
            <div className="p-2 px-3 flex items-center justify-between">
              <div className="w-full align-center flex content-center justify-between">
                <p className="text-sm text-gray-900 mb-1">Status</p>
                <p className="text-base text-gray-900 capitalize">
                  {profile?.status || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Bank details</h2>
            <button
              onClick={() => {
                setShowBankDetailsPopup(true)
                // Pre-fill form with existing data
                setBankDetails({
                  accountHolderName: profile?.documents?.bankDetails?.accountHolderName || "",
                  accountNumber: profile?.documents?.bankDetails?.accountNumber || "",
                  ifscCode: profile?.documents?.bankDetails?.ifscCode || "",
                  bankName: profile?.documents?.bankDetails?.bankName || ""
                })
                setBankDetailsErrors({})
              }}
              className="text-green-600 font-medium text-sm flex items-center gap-1 hover:text-green-700"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-2 px-3 flex items-center justify-between">
              <div className="w-full align-center flex content-center justify-between">
                <p className="text-sm text-gray-900 mb-1">Account Holder Name</p>
                <p className="text-base text-gray-900">
                  {profile?.documents?.bankDetails?.accountHolderName || "-"}
                </p>
              </div>
            </div>
            <div className="p-2 px-3 flex items-center justify-between">
              <div className="w-full align-center flex content-center justify-between">
                <p className="text-sm text-gray-900 mb-1">Account Number</p>
                <p className="text-base text-gray-900">
                  {profile?.documents?.bankDetails?.accountNumber 
                    ? `****${profile.documents.bankDetails.accountNumber.slice(-4)}`
                    : "-"}
                </p>
              </div>
            </div>
            <div className="p-2 px-3 flex items-center justify-between">
              <div className="w-full align-center flex content-center justify-between">
                <p className="text-sm text-gray-900 mb-1">IFSC Code</p>
                <p className="text-base text-gray-900">
                  {profile?.documents?.bankDetails?.ifscCode || "-"}
                </p>
              </div>
            </div>
            <div className="p-2 px-3 flex items-center justify-between">
              <div className="w-full align-center flex content-center justify-between">
                <p className="text-sm text-gray-900 mb-1">Bank Name</p>
                <p className="text-base text-gray-900">
                  {profile?.documents?.bankDetails?.bankName || "-"}
                </p>
              </div>
            </div>
            <div className="p-2 px-3 flex items-center justify-between">
              <div className="w-full align-center flex content-center justify-between">
                <p className="text-sm text-gray-900 mb-1">Pan Card Number</p>
                <p className="text-base text-gray-900">
                  {profile?.documents?.pan?.number || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Number Popup */}
      <BottomPopup
        isOpen={showVehiclePopup}
        onClose={() => setShowVehiclePopup(false)}
        title={vehicleNumber ? "Edit Vehicle Number" : "Add Vehicle Number"}
        showCloseButton={true}
        closeOnBackdropClick={true}
        maxHeight="50vh"
      >
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={vehicleInput}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                setVehicleInput(value)
              }}
              placeholder="Enter vehicle number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
              autoFocus
            />
          </div>
          <button
            onClick={async () => {
              const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{1,4}$/
              const trimmedValue = vehicleInput.trim().toUpperCase().replace(/\s+/g, "")
              
              if (!trimmedValue) {
                toast.error("Please enter a vehicle number")
                return
              }

              if (!vehicleRegex.test(trimmedValue)) {
                toast.error("Invalid vehicle number format. e.g. MH12DE1433")
                return
              }

              try {
                await deliveryAPI.updateProfile({
                  vehicle: {
                    ...profile?.vehicle,
                    number: trimmedValue
                  }
                })
                setVehicleNumber(trimmedValue)
                setShowVehiclePopup(false)
                toast.success("Vehicle number updated successfully")
                // Refetch profile
                const response = await deliveryAPI.getProfile()
                if (response?.data?.success && response?.data?.data?.profile) {
                  setProfile(response.data.data.profile)
                }
              } catch (error) {
                console.error("Error updating vehicle number:", error)
                toast.error(error?.response?.data?.message || "Failed to update vehicle number")
              }
            }}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            {vehicleNumber ? "Update" : "Add"}
          </button>
        </div>
      </BottomPopup>

      {/* Document Image Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowDocumentModal(false)
                setSelectedDocument(null)
              }}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Document Title */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{selectedDocument.name}</h3>
            </div>
            
            {/* Document Image */}
            <div className="p-4">
              <img
                src={selectedDocument.url}
                alt={selectedDocument.name}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bank Details Edit Popup */}
      <BottomPopup
        isOpen={showBankDetailsPopup}
        onClose={() => {
          setShowBankDetailsPopup(false)
          setBankDetailsErrors({})
        }}
        title="Edit Bank Details"
        showCloseButton={true}
        closeOnBackdropClick={true}
        maxHeight="80vh"
      >
        <div className="space-y-4">
          {/* Account Holder Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Holder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bankDetails.accountHolderName}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z\s]/g, "")
                setBankDetails(prev => ({ ...prev, accountHolderName: value }))
                setBankDetailsErrors(prev => ({ ...prev, accountHolderName: "" }))
              }}
              placeholder="Enter account holder name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                bankDetailsErrors.accountHolderName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {bankDetailsErrors.accountHolderName && (
              <p className="text-red-500 text-xs mt-1">{bankDetailsErrors.accountHolderName}</p>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bankDetails.accountNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '') // Only numbers
                setBankDetails(prev => ({ ...prev, accountNumber: value }))
                setBankDetailsErrors(prev => ({ ...prev, accountNumber: "" }))
              }}
              placeholder="Enter account number"
              maxLength={18}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                bankDetailsErrors.accountNumber ? "border-red-500" : "border-gray-300"
              }`}
            />
            {bankDetailsErrors.accountNumber && (
              <p className="text-red-500 text-xs mt-1">{bankDetailsErrors.accountNumber}</p>
            )}
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IFSC Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bankDetails.ifscCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') // Only uppercase letters and numbers
                setBankDetails(prev => ({ ...prev, ifscCode: value }))
                setBankDetailsErrors(prev => ({ ...prev, ifscCode: "" }))
              }}
              placeholder="Enter IFSC code"
              maxLength={11}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                bankDetailsErrors.ifscCode ? "border-red-500" : "border-gray-300"
              }`}
            />
            {bankDetailsErrors.ifscCode && (
              <p className="text-red-500 text-xs mt-1">{bankDetailsErrors.ifscCode}</p>
            )}
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bankDetails.bankName}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z\s]/g, "")
                setBankDetails(prev => ({ ...prev, bankName: value }))
                setBankDetailsErrors(prev => ({ ...prev, bankName: "" }))
              }}
              placeholder="Enter bank name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                bankDetailsErrors.bankName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {bankDetailsErrors.bankName && (
              <p className="text-red-500 text-xs mt-1">{bankDetailsErrors.bankName}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={async () => {
              // Validate
              const errors = {}
              if (!bankDetails.accountHolderName.trim()) {
                errors.accountHolderName = "Account holder name is required"
              }
              if (!bankDetails.accountNumber.trim()) {
                errors.accountNumber = "Account number is required"
              } else if (bankDetails.accountNumber.length < 9 || bankDetails.accountNumber.length > 18) {
                errors.accountNumber = "Account number must be between 9 and 18 digits"
              }
              if (!bankDetails.ifscCode.trim()) {
                errors.ifscCode = "IFSC code is required"
              } else if (bankDetails.ifscCode.length !== 11) {
                errors.ifscCode = "IFSC code must be 11 characters"
              }
              if (!bankDetails.bankName.trim()) {
                errors.bankName = "Bank name is required"
              }

              if (Object.keys(errors).length > 0) {
                setBankDetailsErrors(errors)
                toast.error("Please fill all required fields correctly")
                return
              }

              setIsUpdatingBankDetails(true)
              try {
                await deliveryAPI.updateProfile({
                  documents: {
                    ...profile?.documents,
                    bankDetails: {
                      accountHolderName: bankDetails.accountHolderName.trim(),
                      accountNumber: bankDetails.accountNumber.trim(),
                      ifscCode: bankDetails.ifscCode.trim(),
                      bankName: bankDetails.bankName.trim()
                    }
                  }
                })
                toast.success("Bank details updated successfully")
                setShowBankDetailsPopup(false)
                // Refetch profile
                const response = await deliveryAPI.getProfile()
                if (response?.data?.success && response?.data?.data?.profile) {
                  setProfile(response.data.data.profile)
                }
              } catch (error) {
                console.error("Error updating bank details:", error)
                toast.error(error?.response?.data?.message || "Failed to update bank details")
              } finally {
                setIsUpdatingBankDetails(false)
              }
            }}
            disabled={isUpdatingBankDetails}
            className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
              isUpdatingBankDetails
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#00B761] hover:bg-[#00A055]"
            }`}
          >
            {isUpdatingBankDetails ? "Updating..." : "Save Bank Details"}
          </button>
        </div>
      </BottomPopup>

      {/* Personal Details Edit Popup */}
      <BottomPopup
        isOpen={showPersonalDetailsPopup}
        onClose={() => {
          setShowPersonalDetailsPopup(false)
          setPersonalDetailsErrors({})
        }}
        title="Edit Personal Details"
        showCloseButton={true}
        closeOnBackdropClick={true}
        maxHeight="80vh"
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={personalDetails.name}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z\s]/g, "")
                setPersonalDetails(prev => ({ ...prev, name: value }))
                setPersonalDetailsErrors(prev => ({ ...prev, name: "" }))
              }}
              placeholder="Enter your name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                personalDetailsErrors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {personalDetailsErrors.name && (
              <p className="text-red-500 text-xs mt-1">{personalDetailsErrors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={personalDetails.phone}
              onChange={(e) => {
                setPersonalDetails(prev => ({ ...prev, phone: e.target.value }))
                setPersonalDetailsErrors(prev => ({ ...prev, phone: "" }))
              }}
              placeholder="Enter phone number"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                personalDetailsErrors.phone ? "border-red-500" : "border-gray-300"
              }`}
            />
            {personalDetailsErrors.phone && (
              <p className="text-red-500 text-xs mt-1">{personalDetailsErrors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={personalDetails.email}
              onChange={(e) => {
                setPersonalDetails(prev => ({ ...prev, email: e.target.value }))
                setPersonalDetailsErrors(prev => ({ ...prev, email: "" }))
              }}
              placeholder="Enter email address"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                personalDetailsErrors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {personalDetailsErrors.email && (
              <p className="text-red-500 text-xs mt-1">{personalDetailsErrors.email}</p>
            )}
          </div>

          {/* Aadhar Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aadhar Card Number
            </label>
            <input
              type="text"
              value={personalDetails.aadharNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 12)
                setPersonalDetails(prev => ({ ...prev, aadharNumber: value }))
                setPersonalDetailsErrors(prev => ({ ...prev, aadharNumber: "" }))
              }}
              placeholder="Enter 12 digit Aadhar number"
              maxLength={12}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                personalDetailsErrors.aadharNumber ? "border-red-500" : "border-gray-300"
              }`}
            />
            {personalDetailsErrors.aadharNumber && (
              <p className="text-red-500 text-xs mt-1">{personalDetailsErrors.aadharNumber}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={async () => {
              // Validate
              const errors = {}
              if (!personalDetails.name.trim()) {
                errors.name = "Name is required"
              }
              if (!personalDetails.phone.trim()) {
                errors.phone = "Phone number is required"
              }
              if (personalDetails.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalDetails.email)) {
                errors.email = "Invalid email format"
              }
              if (personalDetails.aadharNumber.trim() && personalDetails.aadharNumber.length !== 12) {
                errors.aadharNumber = "Aadhar number must be 12 digits"
              }

              if (Object.keys(errors).length > 0) {
                setPersonalDetailsErrors(errors)
                return
              }

              setIsUpdatingPersonalDetails(true)
              try {
                await deliveryAPI.updateProfile({
                  name: personalDetails.name.trim(),
                  phone: personalDetails.phone.trim(),
                  email: personalDetails.email.trim() || null,
                  documents: {
                    ...profile?.documents,
                    aadhar: {
                      ...profile?.documents?.aadhar,
                      number: personalDetails.aadharNumber.trim() || null
                    }
                  }
                })
                toast.success("Personal details updated successfully")
                setShowPersonalDetailsPopup(false)
                // Refetch profile
                const response = await deliveryAPI.getProfile()
                if (response?.data?.success && response?.data?.data?.profile) {
                  setProfile(response.data.data.profile)
                }
              } catch (error) {
                console.error("Error updating personal details:", error)
                toast.error(error?.response?.data?.message || "Failed to update personal details")
              } finally {
                setIsUpdatingPersonalDetails(false)
              }
            }}
            disabled={isUpdatingPersonalDetails}
            className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
              isUpdatingPersonalDetails
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#00B761] hover:bg-[#00A055]"
            }`}
          >
            {isUpdatingPersonalDetails ? "Updating..." : "Save Personal Details"}
          </button>
        </div>
      </BottomPopup>
      {/* City Edit Popup */}
      <BottomPopup
        isOpen={showCityPopup}
        onClose={() => setShowCityPopup(false)}
        title="Edit City"
        showCloseButton={true}
        closeOnBackdropClick={true}
        maxHeight="50vh"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cityInput}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z\s]/g, "")
                setCityInput(value)
              }}
              placeholder="Enter city name (e.g. Mumbai)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <button
            onClick={async () => {
              const trimmedCity = cityInput.trim()
              if (!trimmedCity) {
                toast.error("Please enter a city name")
                return
              }
              if (trimmedCity.length < 2) {
                toast.error("City name is too short")
                return
              }

              setIsUpdatingCity(true)
              try {
                await deliveryAPI.updateProfile({
                  location: {
                    ...profile?.location,
                    city: trimmedCity
                  }
                })
                toast.success("City updated successfully")
                setShowCityPopup(false)
                // Refetch profile
                const response = await deliveryAPI.getProfile()
                if (response?.data?.success && response?.data?.data?.profile) {
                  setProfile(response.data.data.profile)
                }
              } catch (error) {
                console.error("Error updating city:", error)
                toast.error(error?.response?.data?.message || "Failed to update city")
              } finally {
                setIsUpdatingCity(false)
              }
            }}
            disabled={isUpdatingCity}
            className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
              isUpdatingCity
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
            }`}
          >
            {isUpdatingCity ? "Updating..." : "Update City"}
          </button>
        </div>
      </BottomPopup>

    </div>
  )
}

