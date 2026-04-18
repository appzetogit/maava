import { useState, useEffect } from 'react';
import { loadBusinessSettings, getCachedSettings } from '../utils/businessSettings';

/**
 * Custom hook to get delivery settings (referral bonus, unlock bonus, etc.) from business settings
 * @returns {Object} Delivery settings with defaults
 */
export const useDeliverySettings = () => {
  const [settings, setSettings] = useState(() => {
    // Initialize with cached value if available
    const cached = getCachedSettings();
    return {
      referralBonus: cached?.deliveryReferralBonus ?? 200,
      unlockBonus: cached?.deliveryUnlockBonus ?? 100,
      cashLimit: cached?.deliveryCashLimit ?? 750,
      withdrawalLimit: cached?.deliveryWithdrawalLimit ?? 100,
    };
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const fetchedSettings = await loadBusinessSettings();
        if (fetchedSettings) {
          setSettings({
            referralBonus: fetchedSettings.deliveryReferralBonus ?? 200,
            unlockBonus: fetchedSettings.deliveryUnlockBonus ?? 100,
            cashLimit: fetchedSettings.deliveryCashLimit ?? 750,
            withdrawalLimit: fetchedSettings.deliveryWithdrawalLimit ?? 100,
          });
        }
      } catch (error) {
        // Keep default values on error
        console.warn('Failed to load delivery settings:', error);
      }
    };

    // Load if not cached properly with the new fields
    const cached = getCachedSettings();
    if (cached?.deliveryReferralBonus === undefined) {
      loadSettings();
    }

    // Listen for business settings updates
    const handleSettingsUpdate = () => {
      const updated = getCachedSettings();
      if (updated) {
        setSettings({
          referralBonus: updated.deliveryReferralBonus ?? 200,
          unlockBonus: updated.deliveryUnlockBonus ?? 100,
          cashLimit: updated.deliveryCashLimit ?? 750,
          withdrawalLimit: updated.deliveryWithdrawalLimit ?? 100,
        });
      }
    };

    window.addEventListener('businessSettingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('businessSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  return settings;
};
