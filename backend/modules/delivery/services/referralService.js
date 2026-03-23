import Delivery from '../models/Delivery.js';
import DeliveryWallet from '../models/DeliveryWallet.js';
import BusinessSettings from '../../admin/models/BusinessSettings.js';
import { sendNotificationToUser } from '../../notification/services/pushNotificationService.js';

export const processReferralBonuses = async (refereeDocId, referrerDeliveryIdField) => {
  try {
    // refereeDocId is the _id of the delivery boy who just completed their first order
    const referee = await Delivery.findById(refereeDocId);
    if (!referee || referee.referralStatus !== 'pending') return;

    // referrerDeliveryIdField is the 'DELxxxxxx' string of the referrer
    const referrer = await Delivery.findOne({ deliveryId: referrerDeliveryIdField });
    if (!referrer) return;

    // Fetch Global Settings for bonus amounts
    const settings = await BusinessSettings.findOne({});
    const referralBonus = settings?.deliveryReferralBonus || 0;
    const unlockBonus = settings?.deliveryUnlockBonus || 0;

    // Award Referral Bonus to Referrer
    if (referralBonus > 0) {
      const referrerWallet = await DeliveryWallet.findOrCreateByDeliveryId(referrer._id);
      referrerWallet.addTransaction({
        amount: referralBonus,
        type: 'bonus',
        // Instead of payment collected, this is a distinct deposit
        // We will just use 'payment' to align with UI showing 'payment' as earning or maybe 'deposit'
        status: 'Completed',
        description: `Referral Bonus for inviting ${referee.name || referee.phone}`
      });
      await referrerWallet.save();
    }

    // Award Unlock Bonus to Referee
    if (unlockBonus > 0) {
      const refereeWallet = await DeliveryWallet.findOrCreateByDeliveryId(referee._id);
      refereeWallet.addTransaction({
        amount: unlockBonus,
        type: 'bonus',
        status: 'Completed',
        description: `Welcome Unlock Bonus for completing your first order!`
      });
      await refereeWallet.save();
    }

    // Mark referral status as completed
    referee.referralStatus = 'completed';
    await referee.save();
    console.log(`✅ Referral bonuses processed. Referrer: ${referrerDeliveryIdField}, Referee: ${referee._id}`);

    // --- SEND COMPLETION NOTIFICATIONS ---
    try {
      if (referralBonus > 0) {
        await sendNotificationToUser(
          referrer._id.toString(),
          'delivery',
          '🎉 Referral Bonus Unlocked!',
          `Awesome! Your friend ${referee.name || 'a new partner'} just completed their first ride. ₹${referralBonus.toLocaleString('en-IN')} has been credited to your wallet.`,
          { type: 'REFERRAL_BONUS_CREDITED' }
        );
      }
      
      if (unlockBonus > 0) {
        await sendNotificationToUser(
          referee._id.toString(),
          'delivery',
          '🛵 Welcome Bonus Unlocked!',
          `Congratulations on completing your first ride! ₹${unlockBonus.toLocaleString('en-IN')} joining bonus has been added to your wallet.`,
          { type: 'JOINING_BONUS_CREDITED' }
        );
      }
    } catch (notifErr) {
      console.error('❌ Error sending referral completion notifications:', notifErr);
    }

  } catch (error) {
    console.error('❌ Error processing referral bonuses:', error);
  }
};
