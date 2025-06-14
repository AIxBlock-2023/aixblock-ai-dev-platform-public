/**
 * Security utilities for preventing XSS attacks
 * Author: Bug Bounty Security Fix
 * Date: 2025
 */

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} html - Raw HTML content
 * @returns {string} - Sanitized HTML content
 */
export function sanitizeHTML(html) {
  if (typeof html !== 'string') {
    return '';
  }

  // Create a temporary element to safely parse HTML
  const temp = document.createElement('div');

  temp.textContent = html;
  return temp.innerHTML;
}

/**
 * Prevents payload splitting attacks by validating script content
 * @param {string} content - Content to validate
 * @returns {boolean} - True if content is safe
 */
export function validateScriptContent(content) {
  if (typeof content !== 'string') {
    return false;
  }

  // Check for payload splitting patterns
  const dangerousPatterns = [
    /<scr\s*\+\s*ipt>/i,  // Payload splitting: <scr + ipt>
    /<script[^>]*>/i,      // Script tags
    /javascript:/i,        // JavaScript protocol
    /on\w+\s*=/i,         // Event handlers
    /eval\s*\(/i,         // eval() function
    /Function\s*\(/i,     // Function constructor
    /setTimeout\s*\(/i,   // setTimeout with string
    /setInterval\s*\(/i,  // setInterval with string
  ];

  return !dangerousPatterns.some(pattern => pattern.test(content));
}

/**
 * Safely sets innerHTML with XSS protection
 * @param {HTMLElement} element - Target element
 * @param {string} content - Content to set
 */
export function safeInnerHTML(element, content) {
  if (!element || !content) {
    return;
  }

  // Validate content first
  if (!validateScriptContent(content)) {
    console.warn('Security: Potentially dangerous content blocked', content);
    element.textContent = '[Content blocked for security]';
    return;
  }

  // Sanitize content
  const sanitized = sanitizeHTML(content);

  element.innerHTML = sanitized;
}

/**
 * Creates a secure element with content validation
 * @param {string} tagName - HTML tag name
 * @param {string} content - Content to add
 * @returns {HTMLElement} - Secure element
 */
export function createSecureElement(tagName, content) {
  const element = document.createElement(tagName);
  
  if (content) {
    safeInnerHTML(element, content);
  }
  
  return element;
}

/**
 * Validates and sanitizes storage data
 * @param {string} key - Storage key
 * @param {string} value - Storage value
 * @returns {string} - Sanitized value
 */
export function sanitizeStorageData(key, value) {
  if (typeof value !== 'string') {
    return '';
  }

  // Log potentially dangerous storage attempts
  if (!validateScriptContent(value)) {
    console.warn('Security: Dangerous content blocked from storage', { key, value });
    return '[Blocked by security policy]';
  }

  return sanitizeHTML(value);
}

// CSP violation reporting
export function reportCSPViolation(violation) {
  console.error('CSP Violation:', violation);
  
  // In production, you might want to send this to your security monitoring service
  // fetch('/api/csp-violation', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(violation)
  // });
}

// Set up CSP violation reporting
if (typeof window !== 'undefined') {
  document.addEventListener('securitypolicyviolation', reportCSPViolation);
} 