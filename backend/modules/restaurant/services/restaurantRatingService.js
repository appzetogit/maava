import Order from '../../order/models/Order.js';
import Restaurant from '../models/Restaurant.js';
import mongoose from 'mongoose';

/**
 * Recalculates and updates a restaurant's average rating and total ratings count
 * based on all delivered orders that have a review rating.
 *
 * BEHAVIOR:
 * - If there ARE actual order reviews → overwrite Restaurant.rating with computed average
 * - If there are NO order reviews yet → do NOT touch the manually-set rating
 *   (admin may have set it during restaurant registration for initial display)
 *
 * @param {string|mongoose.Types.ObjectId} restaurantId - The restaurant's _id
 * @returns {Promise<Object|null>} The updated restaurant document, or null if nothing changed
 */
export const updateRestaurantAverageRating = async (restaurantId) => {
  try {
    if (!restaurantId) return null;

    const restaurantIdStr = restaurantId.toString();

    // Aggregate average rating and total count from delivered orders
    const statsResult = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurantIdStr,
          status: 'delivered',
          'review.rating': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$restaurantId',
          averageRating: { $avg: '$review.rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    // If no real order reviews yet, preserve the manually-set rating
    if (statsResult.length === 0) {
      console.log(`ℹ️ No order reviews yet for restaurant ${restaurantIdStr}. Manually-set rating preserved.`);
      return null;
    }

    // Round to 1 decimal place (e.g., 4.3)
    const rating = Math.round(statsResult[0].averageRating * 10) / 10;
    const totalRatings = statsResult[0].totalRatings;

    // Overwrite only when real reviews exist
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { $set: { rating, totalRatings } },
      { new: true }
    );

    if (updatedRestaurant) {
      console.log(`⭐ Restaurant ${restaurantIdStr} dynamic rating updated: ${rating} (${totalRatings} real reviews)`);
    } else {
      console.warn(`⚠️ Restaurant ${restaurantIdStr} not found for rating update`);
    }

    return updatedRestaurant;
  } catch (error) {
    console.error(`❌ Error updating restaurant average rating for ${restaurantId}:`, error.message);
    return null;
  }
};
