import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Centralized debug logging utility function
 * @param message - The message to log
 * @param data - Optional data to log alongside the message
 */
export function setDebugLog(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    if (data !== undefined) {
      console.log(`[DEBUG] ${message}`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
}
