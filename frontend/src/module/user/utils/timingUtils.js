/**
 * Utilities for restaurant timings
 */

/**
 * Parses a time string (e.g., "09:00 AM", "22:00", "9:00 pm") to minutes from start of day
 * @param {string} timeStr The time string to parse
 * @returns {number} Minutes from start of day
 */
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  
  const normalized = timeStr.trim().toUpperCase();
  // Match formats like "09:00 AM", "09:00AM", "22:00", "9 : 00 PM"
  const match = normalized.match(/^(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM)?$/);
  
  if (!match) return 0;
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const modifier = match[3];
  
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
};

/**
 * Checks if a restaurant is currently open based on its timings
 * @param {Array} timings Array of day timing objects
 * @returns {Object} { isOpen: boolean, currentDayTiming: Object }
 */
export const checkIsRestaurantOpen = (timings) => {
  if (!timings || !Array.isArray(timings) || timings.length === 0) {
    return { isOpen: true, currentDayTiming: null };
  }
  
  const now = new Date();
  // Get day of week in English
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = days[now.getDay()];
  
  // Use case-insensitive match for the day
  const dayTiming = timings.find(t => 
    t && t.day && t.day.trim().toLowerCase() === currentDay.toLowerCase()
  );
  
  if (!dayTiming) {
    return { isOpen: true, currentDayTiming: null };
  }
  
  // If not open specifically for this day
  if (dayTiming.isOpen === false) {
    return { isOpen: false, currentDayTiming: dayTiming };
  }
  
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
  const openTimeInMinutes = parseTimeToMinutes(dayTiming.openingTime);
  const closeTimeInMinutes = parseTimeToMinutes(dayTiming.closingTime);
  
  // If times are not validly parsed
  if (dayTiming.openingTime && dayTiming.closingTime && 
      openTimeInMinutes === 0 && closeTimeInMinutes === 0) {
     return { isOpen: true, currentDayTiming: dayTiming };
  }

  // Handle overnight timings (e.g., 10 PM to 4 AM)
  if (closeTimeInMinutes < openTimeInMinutes) {
    const isOpen = currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes <= closeTimeInMinutes;
    return { isOpen, currentDayTiming: dayTiming };
  }
  
  const isOpen = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes;
  return { isOpen, currentDayTiming: dayTiming };
};

