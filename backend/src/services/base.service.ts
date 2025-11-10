/**
 * Base service class with common database operations
 */

import { getSupabaseClient } from '../config/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export abstract class BaseService {
  protected db: SupabaseClient;

  constructor() {
    this.db = getSupabaseClient();
  }

  /**
   * Handle database errors consistently
   */
  protected handleError(error: any, context: string): never {
    console.error(`[${this.constructor.name}] Error in ${context}:`, error);
    throw new Error(`${context} failed: ${error.message}`);
  }

  /**
   * Ensure date is a Date object
   */
  protected ensureDate(date: Date | string): Date {
    return date instanceof Date ? date : new Date(date);
  }

  /**
   * Log service action (can be enhanced with proper logging later)
   */
  protected log(message: string, data?: any): void {
    console.log(`[${this.constructor.name}] ${message}`, data || '');
  }
}
