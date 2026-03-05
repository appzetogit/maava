import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export default function ChangeLanguage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || "en")

  const languages = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "hi", name: "Hindi", nativeName: "हिंदी" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  ]

  const handleLanguageChange = (code) => {
    setSelectedLanguage(code)
    i18n.changeLanguage(code)
    localStorage.setItem('i18nextLng', code)
    toast.success(t('delivery.language_changed', { defaultValue: 'Language changed successfully' }))
    // Optional: navigate back after a short delay
    setTimeout(() => navigate(-1), 1000)
  }

  useEffect(() => {
    setSelectedLanguage(i18n.language)
  }, [i18n.language])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('delivery.change_language')}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {t('delivery.select_preferred_language')}
        </p>

        {/* Language List */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
            >
              <div className="flex flex-col items-start">
                <span className={`font-semibold ${selectedLanguage === language.code ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                  {language.name}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{language.nativeName}</span>
              </div>
              {selectedLanguage === language.code && (
                <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
          <p className="text-sm text-blue-900 dark:text-blue-300 flex items-center gap-2">
            <span className="text-lg">ℹ️</span>
            {t('delivery.app_will_restart')}
          </p>
        </div>
      </div>
    </div>
  )
}
