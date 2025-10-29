import timeago from "time-ago";

/**
 * Format time ago for comments with a minimum of 1 second
 * Prevents showing milliseconds (e.g., "173ms")
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted time string
 */
export function formatCommentTime(date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now - dateObj;

  // If less than 1 second, show "1 second ago"
  if (diffMs < 1000) {
    return "1s";
  }

  // Otherwise use the standard timeago formatter
  return timeago.ago(dateObj);
}
