/**
 * Safely formats various date formats (JavaScript Date, ISO String, Firestore Timestamp)
 * into a human-readable string.
 * 
 * @param {any} dateValue - The date value to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string or 'Invalid Date'
 */
export const formatDate = (dateValue, options = {}) => {
  if (!dateValue) return 'N/A';
  
  try {
    let date;
    
    // Handle Firestore Timestamp object (has toDate() method)
    if (dateValue && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } 
    // Handle Firestore Timestamp from plain object (has seconds/nanoseconds)
    else if (dateValue && typeof dateValue === 'object' && (dateValue.seconds !== undefined || dateValue._seconds !== undefined)) {
      const seconds = dateValue.seconds !== undefined ? dateValue.seconds : dateValue._seconds;
      const nanoseconds = dateValue.nanoseconds !== undefined ? dateValue.nanoseconds : (dateValue._nanoseconds || 0);
      date = new Date(seconds * 1000 + nanoseconds / 1000000);
    }
    // Handle JavaScript Date object
    else if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Handle everything else (strings, numbers)
    else {
      date = new Date(dateValue);
    }
    
    // Check if the resulting date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value provided to formatDate:', dateValue);
      return 'Invalid Date';
    }
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
  } catch (error) {
    console.error('Error in formatDate utility:', error);
    return 'Invalid Date';
  }
};
