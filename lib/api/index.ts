import { authService } from './authService';
import { profileService } from './profileService';
import { dutyService } from './dutyService';
import { swapService } from './swapService';
import { preferencesService } from './preferencesService';
import { ERROR_MESSAGES } from '../constants';

/**
 * formatError : Transforme n'importe quel objet d'erreur en String pure.
 * C'est la garde de sécurité ultime contre l'erreur React #31.
 */
export const formatError = (err: any): string => {
  if (!err) return ERROR_MESSAGES.UNKNOWN;
  
  // Si c'est déjà du texte
  if (typeof err === 'string') {
    // Nettoyer les messages d'erreur potentiellement exposant des infos internes
    return sanitizeErrorMessage(err);
  }
  
  // Erreurs HTTP courantes
  if (err.status) {
    switch (err.status) {
      case 400:
        return ERROR_MESSAGES.VALIDATION_ERROR;
      case 401:
        return ERROR_MESSAGES.AUTH_ERROR;
      case 403:
        return ERROR_MESSAGES.PERMISSION_ERROR;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 429:
        return ERROR_MESSAGES.RATE_LIMIT;
      case 500:
      case 502:
      case 503:
        return ERROR_MESSAGES.API_ERROR;
    }
  }

  // Si c'est une erreur Vercel 500 (INTERNAL_SERVER_ERROR)
  if (err.code === 'INTERNAL_SERVER_ERROR' || 
      err.message?.includes('500') || 
      err.code?.includes('MIDDLEWARE_INVOCATION_FAILED')) {
    return "Une erreur serveur est survenue. Notre équipe technique en a été informée.";
  }

  // Erreurs Supabase courantes
  if (err.code) {
    switch (err.code) {
      case 'PGRST116':
        return ERROR_MESSAGES.NOT_FOUND;
      case '23505':
        return 'Cette entrée existe déjà.';
      case '42501':
        return ERROR_MESSAGES.PERMISSION_ERROR;
      case '57014':
        return 'Opération trop longue. Veuillez réessayer avec moins de données.';
      case 'P0001':
        return 'Violation de contrainte. Vérifiez vos données.';
    }
  }

  // Si c'est un objet Error standard
  if (err instanceof Error) {
    return sanitizeErrorMessage(err.message);
  }

  // Si c'est un objet complexe (Supabase, API, etc)
  if (typeof err === 'object') {
    try {
      // Extraction intelligente du message
      const extracted = err.message || err.error || err.error_description || err.msg || err.details || err.reason;
      
      if (extracted) {
        if (typeof extracted === 'string') {
          return sanitizeErrorMessage(extracted);
        } else if (typeof extracted === 'object') {
          const nestedMessage = extracted.message || extracted.error;
          if (nestedMessage && typeof nestedMessage === 'string') {
            return sanitizeErrorMessage(nestedMessage);
          }
        }
      }
      
      // Fallback sécurisé
      return ERROR_MESSAGES.UNKNOWN + (err.code ? ` (Code: ${err.code})` : '');
      
    } catch (e) {
      return ERROR_MESSAGES.UNKNOWN;
    }
  }

  // Tout autre type
  return sanitizeErrorMessage(String(err));
};

/**
 * Sanitize error message to prevent leaking internal information
 */
const sanitizeErrorMessage = (message: string): string => {
  if (!message) return ERROR_MESSAGES.UNKNOWN;
  
  // Masquer les chemins de fichier et les stack traces
  const sanitized = message
    .replace(/at\s+.*\s+\(.*\)/g, '') // Supprime les stack traces
    .replace(/file:\/\/\/.*\//g, '')  // Supprime les chemins de fichier
    .replace(/\/.*\//g, '')           // Supprime les chemins d'accès
    .replace(/\s+/g, ' ')             // Normalise les espaces
    .trim();
  
  // Si le message est trop court ou vide après nettoyage
  if (sanitized.length < 3) {
    return ERROR_MESSAGES.UNKNOWN;
  }
  
  // Limiter la longueur pour éviter les messages trop longs
  if (sanitized.length > 500) {
    return sanitized.substring(0, 497) + '...';
  }
  
  return sanitized;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (err: any): boolean => {
  if (!err) return false;
  
  if (err.message?.includes('network') || 
      err.message?.includes('Network') || 
      err.message?.includes('fetch') || 
      err.message?.includes('Fetch') ||
      err.message?.includes('offline') ||
      err.message?.includes('timeout')) {
    return true;
  }
  
  if (err.code === 'NETWORK_ERROR' || err.name === 'NetworkError') {
    return true;
  }
  
  return false;
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (err: any): boolean => {
  if (!err) return false;
  
  if (err.status === 401 || 
      err.code === 'PGRST301' || 
      err.message?.includes('unauthorized') ||
      err.message?.includes('Unauthorized') ||
      err.message?.includes('auth') ||
      err.message?.includes('session')) {
    return true;
  }
  
  return false;
};

/**
 * Create a standardized error object
 */
export const createErrorObject = (
  message: string, 
  code?: string, 
  originalError?: any
): { message: string; code?: string; originalError?: any } => {
  return {
    message,
    code,
    originalError
  };
};

/**
 * Retry promise with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on auth errors
      if (isAuthError(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      
      // Add jitter to prevent thundering herd
      const jitter = delay * 0.1 * Math.random();
      const totalDelay = delay + jitter;
      
      if (attempt < maxRetries) {
        console.log(`Tentative ${attempt}/${maxRetries} échouée, nouvelle tentative dans ${totalDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Safe JSON parsing with error handling
 */
export const safeJsonParse = <T>(text: string, fallback: T): T => {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.warn('JSON parsing failed:', error);
    return fallback;
  }
};

/**
 * Safe JSON stringify with error handling
 */
export const safeJsonStringify = (value: any): string => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('JSON stringify failed:', error);
    return '{}';
  }
};

/**
 * Extract error code from error object
 */
export const extractErrorCode = (err: any): string | undefined => {
  if (!err) return undefined;
  
  return err.code || err.error_code || err.status || err.name;
};

/**
 * Log error for debugging (only in development)
 */
export const logError = (err: any, context?: string): void => {
  if (process.env.NODE_ENV === 'development') {
    console.group(context || 'Error');
    console.error('Message:', err?.message || err);
    console.error('Code:', extractErrorCode(err));
    console.error('Stack:', err?.stack);
    console.groupEnd();
  }
};

// Export all services
export {
  authService,
  profileService,
  dutyService,
  swapService,
  preferencesService
};