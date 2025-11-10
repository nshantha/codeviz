/**
 * Student Model Service
 * Manages comprehensive student profiles, preferences, and learning history
 */

import { BaseService } from './base.service';
import {
  calculateLearningVelocity,
  calculateOverallMastery,
  calculateConsistencyScore,
  calculateCurrentStreak,
  calculateLongestStreak,
  identifyStrengthsAndWeaknesses,
} from '../utils/statistics';
import type {
  StudentModel,
  StudentPreferences,
  UserGoal,
  Breakthrough,
  LearningSession,
  PatternKnowledge,
  Misconception,
} from '../types/learning-science';

export class StudentModelService extends BaseService {
  /**
   * Get or create student preferences
   */
  async getPreferences(userId: string): Promise<StudentPreferences> {
    try {
      const { data, error } = await this.db
        .from('student_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Not found, create default
        return await this.createDefaultPreferences(userId);
      }

      if (error) throw error;

      return {
        ...data,
        codeLanguagePreferences: data.code_language_preferences || [],
        createdAt: this.ensureDate(data.created_at),
        updatedAt: this.ensureDate(data.updated_at),
      };
    } catch (error) {
      this.handleError(error, 'getPreferences');
    }
  }

  /**
   * Create default preferences for new user
   */
  private async createDefaultPreferences(userId: string): Promise<StudentPreferences> {
    try {
      const defaultPrefs: Omit<StudentPreferences, 'createdAt' | 'updatedAt'> = {
        userId,
        preferredExplanationStyle: 'balanced',
        pacePreference: 'moderate',
        difficultyPreference: 'comfortable',
        hintAggressiveness: 'moderate',
        visualizationPreference: true,
        codeLanguagePreferences: ['javascript', 'python'],
      };

      const { data, error } = await this.db
        .from('student_preferences')
        .insert({
          user_id: defaultPrefs.userId,
          preferred_explanation_style: defaultPrefs.preferredExplanationStyle,
          pace_preference: defaultPrefs.pacePreference,
          difficulty_preference: defaultPrefs.difficultyPreference,
          hint_aggressiveness: defaultPrefs.hintAggressiveness,
          visualization_preference: defaultPrefs.visualizationPreference,
          code_language_preferences: defaultPrefs.codeLanguagePreferences,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...defaultPrefs,
        createdAt: this.ensureDate(data.created_at),
        updatedAt: this.ensureDate(data.updated_at),
      };
    } catch (error) {
      this.handleError(error, 'createDefaultPreferences');
    }
  }

  /**
   * Update student preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<Omit<StudentPreferences, 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<StudentPreferences> {
    try {
      const dbUpdates: any = {};

      if (updates.preferredExplanationStyle) dbUpdates.preferred_explanation_style = updates.preferredExplanationStyle;
      if (updates.pacePreference) dbUpdates.pace_preference = updates.pacePreference;
      if (updates.difficultyPreference) dbUpdates.difficulty_preference = updates.difficultyPreference;
      if (updates.hintAggressiveness) dbUpdates.hint_aggressiveness = updates.hintAggressiveness;
      if (updates.visualizationPreference !== undefined) dbUpdates.visualization_preference = updates.visualizationPreference;
      if (updates.codeLanguagePreferences) dbUpdates.code_language_preferences = updates.codeLanguagePreferences;
      if (updates.studyTimePreference) dbUpdates.study_time_preference = updates.studyTimePreference;
      if (updates.sessionLengthPreference) dbUpdates.session_length_preference = updates.sessionLengthPreference;

      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await this.db
        .from('student_preferences')
        .update(dbUpdates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        codeLanguagePreferences: data.code_language_preferences || [],
        createdAt: this.ensureDate(data.created_at),
        updatedAt: this.ensureDate(data.updated_at),
      };
    } catch (error) {
      this.handleError(error, 'updatePreferences');
    }
  }

  /**
   * Get or create user goals
   */
  async getGoals(userId: string): Promise<UserGoal | null> {
    try {
      const { data, error } = await this.db
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        return null;
      }

      if (error) throw error;

      return {
        ...data,
        targetDate: data.target_date ? this.ensureDate(data.target_date) : undefined,
        interviewsScheduled: data.interviews_scheduled || [],
        createdAt: this.ensureDate(data.created_at),
        updatedAt: this.ensureDate(data.updated_at),
      };
    } catch (error) {
      this.handleError(error, 'getGoals');
    }
  }

  /**
   * Set user goals
   */
  async setGoals(userId: string, goals: Omit<UserGoal, 'userId' | 'createdAt' | 'updatedAt'>): Promise<UserGoal> {
    try {
      const { data, error } = await this.db
        .from('user_goals')
        .upsert({
          user_id: userId,
          target_role: goals.targetRole,
          target_companies: goals.targetCompanies,
          target_date: goals.targetDate?.toISOString(),
          weekly_time_commitment: goals.weeklyTimeCommitment,
          current_level: goals.currentLevel,
          interviews_scheduled: goals.interviewsScheduled,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        targetDate: data.target_date ? this.ensureDate(data.target_date) : undefined,
        interviewsScheduled: data.interviews_scheduled || [],
        createdAt: this.ensureDate(data.created_at),
        updatedAt: this.ensureDate(data.updated_at),
      };
    } catch (error) {
      this.handleError(error, 'setGoals');
    }
  }

  /**
   * Record a breakthrough moment
   */
  async recordBreakthrough(breakthrough: Omit<Breakthrough, 'id'>): Promise<Breakthrough> {
    try {
      const { data, error } = await this.db
        .from('breakthroughs')
        .insert({
          user_id: breakthrough.userId,
          pattern_id: breakthrough.patternId,
          problem_id: breakthrough.problemId,
          description: breakthrough.description,
          insight: breakthrough.insight,
          mastery_before: breakthrough.masteryBefore,
          mastery_after: breakthrough.masteryAfter,
          timestamp: breakthrough.timestamp.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      this.log(`Breakthrough recorded for pattern ${breakthrough.patternId}`);

      return {
        ...data,
        timestamp: this.ensureDate(data.timestamp),
      };
    } catch (error) {
      this.handleError(error, 'recordBreakthrough');
    }
  }

  /**
   * Get breakthroughs for user
   */
  async getBreakthroughs(userId: string, limit?: number): Promise<Breakthrough[]> {
    try {
      let query = this.db
        .from('breakthroughs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(b => ({
        ...b,
        timestamp: this.ensureDate(b.timestamp),
      }));
    } catch (error) {
      this.handleError(error, 'getBreakthroughs');
    }
  }

  /**
   * Get comprehensive student model
   */
  async getStudentModel(userId: string): Promise<StudentModel> {
    try {
      // Fetch all components in parallel
      const [
        preferences,
        goals,
        sessions,
        knowledgeState,
        misconceptions,
        breakthroughs,
      ] = await Promise.all([
        this.getPreferences(userId),
        this.getGoals(userId),
        this.getLeaningSessions(userId),
        this.getKnowledgeState(userId),
        this.getMisconceptions(userId),
        this.getBreakthroughs(userId, 10), // Last 10 breakthroughs
      ]);

      // Calculate learning profile metrics
      const learningVelocity = calculateLearningVelocity(sessions);
      const consistencyScore = calculateConsistencyScore(sessions);
      const currentStreak = calculateCurrentStreak(sessions);
      const longestStreak = calculateLongestStreak(sessions);

      const avgSessionLength = sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / sessions.length
        : 0;

      // Calculate knowledge state metrics
      const patternsMap = new Map<string, PatternKnowledge>(
        knowledgeState.map(k => [k.pattern_id, {
          patternId: k.pattern_id,
          mastery: k.mastery_probability,
          subskillMastery: new Map(), // TODO: fetch from subskill_mastery table
          lastPracticed: this.ensureDate(k.last_practiced),
          nextReviewDue: new Date(), // TODO: fetch from review_schedule
          practiceCount: k.problems_attempted,
          successRate: k.problems_attempted > 0 ? k.problems_solved / k.problems_attempted : 0,
          averageSolveTime: 0, // TODO: calculate from sessions
          commonMistakes: [], // TODO: fetch from misconceptions
        }])
      );

      const overallMastery = calculateOverallMastery(patternsMap);
      const { strengths, weaknesses } = identifyStrengthsAndWeaknesses(patternsMap);

      // Build student model
      const model: StudentModel = {
        userId,
        knowledgeState: {
          patterns: patternsMap,
          overallMastery,
          strengths,
          weaknesses,
        },
        learningProfile: {
          preferences,
          learningVelocity,
          confidenceCalibration: 0, // TODO: implement tracking
          frustrationTolerance: 0.5, // TODO: implement tracking
          averageSessionLength: Math.round(avgSessionLength),
          consistencyScore,
        },
        history: {
          misconceptions,
          breakthroughs,
          strugglesAndSupports: [], // TODO: implement tracking
          totalSessionCount: sessions.length,
          totalPracticeDays: new Set(sessions.map(s =>
            new Date(s.startTime).toISOString().split('T')[0]
          )).size,
          longestStreak,
          currentStreak,
        },
        goals: goals || {
          userId,
          targetRole: 'Software Engineer',
          weeklyTimeCommitment: 10,
          currentLevel: 'intermediate',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        readinessScore: 0, // TODO: implement calculation
        recommendedPace: this.calculateRecommendedPace(learningVelocity, consistencyScore),
        nextMilestone: this.calculateNextMilestone(overallMastery, patternsMap.size),
      };

      return model;
    } catch (error) {
      this.handleError(error, 'getStudentModel');
    }
  }

  /**
   * Helper: Get learning sessions
   */
  private async getLeaningSessions(userId: string): Promise<LearningSession[]> {
    const { data } = await this.db
      .from('learning_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    return (data || []).map(s => ({
      ...s,
      startTime: this.ensureDate(s.start_time),
      endTime: s.end_time ? this.ensureDate(s.end_time) : undefined,
    }));
  }

  /**
   * Helper: Get knowledge state
   */
  private async getKnowledgeState(userId: string) {
    const { data } = await this.db
      .from('knowledge_state')
      .select('*')
      .eq('user_id', userId);

    return data || [];
  }

  /**
   * Helper: Get misconceptions
   */
  private async getMisconceptions(userId: string): Promise<Misconception[]> {
    const { data } = await this.db
      .from('misconceptions')
      .select('*')
      .eq('user_id', userId)
      .eq('resolved', false);

    return (data || []).map(m => ({
      ...m,
      firstDetected: this.ensureDate(m.first_detected),
      lastObserved: this.ensureDate(m.last_observed),
      resolutionDate: m.resolution_date ? this.ensureDate(m.resolution_date) : undefined,
    }));
  }

  /**
   * Calculate recommended pace
   */
  private calculateRecommendedPace(
    velocity: number,
    consistency: number
  ): 'intensive' | 'moderate' | 'relaxed' {
    if (velocity > 5 && consistency > 0.7) return 'intensive';
    if (velocity > 2 && consistency > 0.5) return 'moderate';
    return 'relaxed';
  }

  /**
   * Calculate next milestone
   */
  private calculateNextMilestone(mastery: number, patternsLearned: number): string {
    if (patternsLearned < 3) return 'Learn 3 core patterns';
    if (mastery < 0.5) return 'Reach 50% overall mastery';
    if (patternsLearned < 8) return 'Learn 8 essential patterns';
    if (mastery < 0.7) return 'Reach 70% overall mastery';
    return 'Schedule mock interview';
  }
}

// Singleton instance
export const studentModelService = new StudentModelService();
