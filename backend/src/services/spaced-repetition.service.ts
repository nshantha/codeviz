/**
 * Spaced Repetition Service
 * Manages review scheduling using SM-2 algorithm
 */

import { BaseService } from './base.service';
import { calculateSM2, isDueForReview, calculateReviewUrgency } from '../utils/spaced-repetition';
import { SM2_CONSTANTS } from '../constants';
import type {
  ReviewSchedule,
  InsertReviewSchedule,
  UpdateReviewSchedule,
  SM2Quality,
} from '../types/learning-science';

export class SpacedRepetitionService extends BaseService {
  /**
   * Get review schedule for a pattern
   */
  async getReviewSchedule(userId: string, patternId: string): Promise<ReviewSchedule | null> {
    try {
      const { data, error } = await this.db
        .from('review_schedule')
        .select('*')
        .eq('user_id', userId)
        .eq('pattern_id', patternId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        nextReviewDate: this.ensureDate(data.next_review_date),
        lastReviewDate: data.last_review_date ? this.ensureDate(data.last_review_date) : undefined,
        createdAt: this.ensureDate(data.created_at),
        updatedAt: this.ensureDate(data.updated_at),
      };
    } catch (error) {
      this.handleError(error, 'getReviewSchedule');
    }
  }

  /**
   * Initialize review schedule for a new pattern
   */
  async initializeReviewSchedule(userId: string, patternId: string): Promise<ReviewSchedule> {
    try {
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + SM2_CONSTANTS.INITIAL_INTERVAL);

      const schedule: InsertReviewSchedule = {
        userId,
        patternId,
        nextReviewDate,
        intervalDays: SM2_CONSTANTS.INITIAL_INTERVAL,
        easeFactor: SM2_CONSTANTS.INITIAL_EASE_FACTOR,
        reviewCount: 0,
      };

      const { data, error } = await this.db
        .from('review_schedule')
        .insert({
          user_id: schedule.userId,
          pattern_id: schedule.patternId,
          next_review_date: schedule.nextReviewDate.toISOString(),
          interval_days: schedule.intervalDays,
          ease_factor: schedule.easeFactor,
          review_count: schedule.reviewCount,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        nextReviewDate: this.ensureDate(data.next_review_date),
        createdAt: this.ensureDate(data.created_at),
        updatedAt: this.ensureDate(data.updated_at),
      };
    } catch (error) {
      this.handleError(error, 'initializeReviewSchedule');
    }
  }

  /**
   * Update review schedule after practice
   */
  async updateReviewSchedule(
    userId: string,
    patternId: string,
    quality: SM2Quality
  ): Promise<ReviewSchedule> {
    try {
      // Get current schedule or create new one
      let currentSchedule = await this.getReviewSchedule(userId, patternId);
      if (!currentSchedule) {
        currentSchedule = await this.initializeReviewSchedule(userId, patternId);
      }

      // Calculate new schedule using SM-2
      const sm2Result = calculateSM2(
        quality,
        currentSchedule.intervalDays,
        currentSchedule.easeFactor,
        currentSchedule.reviewCount
      );

      // Update in database
      const { data, error } = await this.db
        .from('review_schedule')
        .update({
          next_review_date: sm2Result.nextReviewDate.toISOString(),
          interval_days: sm2Result.intervalDays,
          ease_factor: sm2Result.easeFactor,
          review_count: sm2Result.reviewCount,
          last_review_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('pattern_id', patternId)
        .select()
        .single();

      if (error) throw error;

      this.log(`Updated review schedule for pattern ${patternId}, next review in ${sm2Result.intervalDays} days`);

      return {
        ...data,
        nextReviewDate: this.ensureDate(data.next_review_date),
        lastReviewDate: this.ensureDate(data.last_review_date),
        createdAt: this.ensureDate(data.created_at),
        updatedAt: this.ensureDate(data.updated_at),
      };
    } catch (error) {
      this.handleError(error, 'updateReviewSchedule');
    }
  }

  /**
   * Get all patterns due for review
   */
  async getDueReviews(userId: string): Promise<Array<ReviewSchedule & { urgency: number }>> {
    try {
      const { data, error } = await this.db
        .from('review_schedule')
        .select('*')
        .eq('user_id', userId)
        .lte('next_review_date', new Date().toISOString());

      if (error) throw error;

      // Get knowledge state for urgency calculation
      const { data: knowledgeData } = await this.db
        .from('knowledge_state')
        .select('pattern_id, mastery_probability, last_practiced')
        .eq('user_id', userId);

      const knowledgeMap = new Map(
        knowledgeData?.map(k => [k.pattern_id, k]) || []
      );

      return (data || []).map(schedule => {
        const knowledge = knowledgeMap.get(schedule.pattern_id);
        const mastery = knowledge?.mastery_probability || 0;
        const lastPracticed = knowledge?.last_practiced ? new Date(knowledge.last_practiced) : new Date();
        const daysSinceLastPractice = Math.floor(
          (new Date().getTime() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24)
        );

        const urgency = calculateReviewUrgency(
          new Date(schedule.next_review_date),
          mastery,
          daysSinceLastPractice
        );

        return {
          ...schedule,
          nextReviewDate: this.ensureDate(schedule.next_review_date),
          lastReviewDate: schedule.last_review_date ? this.ensureDate(schedule.last_review_date) : undefined,
          createdAt: this.ensureDate(schedule.created_at),
          updatedAt: this.ensureDate(schedule.updated_at),
          urgency,
        };
      }).sort((a, b) => b.urgency - a.urgency); // Sort by urgency
    } catch (error) {
      this.handleError(error, 'getDueReviews');
    }
  }

  /**
   * Get upcoming reviews in next N days
   */
  async getUpcomingReviews(userId: string, daysAhead: number = 7): Promise<ReviewSchedule[]> {
    try {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + daysAhead);

      const { data, error } = await this.db
        .from('review_schedule')
        .select('*')
        .eq('user_id', userId)
        .gte('next_review_date', new Date().toISOString())
        .lte('next_review_date', maxDate.toISOString())
        .order('next_review_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(schedule => ({
        ...schedule,
        nextReviewDate: this.ensureDate(schedule.next_review_date),
        lastReviewDate: schedule.last_review_date ? this.ensureDate(schedule.last_review_date) : undefined,
        createdAt: this.ensureDate(schedule.created_at),
        updatedAt: this.ensureDate(schedule.updated_at),
      }));
    } catch (error) {
      this.handleError(error, 'getUpcomingReviews');
    }
  }

  /**
   * Check if pattern is due for review
   */
  async isPatternDueForReview(userId: string, patternId: string): Promise<boolean> {
    const schedule = await this.getReviewSchedule(userId, patternId);
    if (!schedule) return true; // Never reviewed = due

    return isDueForReview(schedule.nextReviewDate);
  }

  /**
   * Get total due review count
   */
  async getDueReviewCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.db
        .from('review_schedule')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lte('next_review_date', new Date().toISOString());

      if (error) throw error;

      return count || 0;
    } catch (error) {
      this.handleError(error, 'getDueReviewCount');
    }
  }
}

// Singleton instance
export const spacedRepetitionService = new SpacedRepetitionService();
