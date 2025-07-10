/**
 * Strips HTML tags from a string to return plain text.
 * @param {string} html The HTML string to clean.
 * @returns {string} The plain text representation.
 */
export const stripHtml = (html) => {
  if (!html) return '';
  // Uses the browser's built-in parser to safely handle HTML.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};
