/**
 * Misconception Detector Service
 * Detects and tracks common misconceptions in student understanding
 */

import { BaseService } from './base.service';
import { detectMisconceptions } from '../utils/text-analysis';
import type { Misconception, DetectedMisconception } from '../types/learning-science';

export class MisconceptionDetectorService extends BaseService {
  /**
   * Analyze text for misconceptions
   */
  async analyzeForMisconceptions(
    userId: string,
    text: string,
    patternName: string,
    patternId: string
  ): Promise<DetectedMisconception[]> {
    try {
      const detected = detectMisconceptions(text, patternName);

      // Store detected misconceptions in database
      for (const misconception of detected) {
        await this.recordMisconception(userId, patternId, misconception);
      }

      return detected;
    } catch (error) {
      this.log('Error analyzing for misconceptions', error);
      return [];
    }
  }

  /**
   * Record a misconception (or update if already exists)
   */
  async recordMisconception(
    userId: string,
    patternId: string,
    detected: DetectedMisconception
  ): Promise<void> {
    try {
      // Check if this misconception already exists
      const { data: existing } = await this.db
        .from('misconceptions')
        .select('*')
        .eq('user_id', userId)
        .eq('pattern_id', patternId)
        .eq('description', detected.misconception)
        .eq('resolved', false)
        .single();

      if (existing) {
        // Update occurrence count and last observed
        await this.db
          .from('misconceptions')
          .update({
            last_observed: new Date().toISOString(),
            occurrence_count: existing.occurrence_count + 1,
          })
          .eq('id', existing.id);

        this.log(`Updated existing misconception: ${detected.misconception}`);
      } else {
        // Create new misconception record
        await this.db
          .from('misconceptions')
          .insert({
            user_id: userId,
            pattern_id: patternId,
            description: detected.misconception,
            first_detected: new Date().toISOString(),
            last_observed: new Date().toISOString(),
            resolved: false,
            occurrence_count: 1,
            correction: detected.correction,
          });

        this.log(`Recorded new misconception: ${detected.misconception}`);
      }
    } catch (error) {
      this.log('Error recording misconception', error);
    }
  }

  /**
   * Get active misconceptions for a user
   */
  async getMisconceptions(userId: string, patternId?: string): Promise<Misconception[]> {
    try {
      let query = this.db
        .from('misconceptions')
        .select('*')
        .eq('user_id', userId)
        .eq('resolved', false)
        .order('occurrence_count', { ascending: false });

      if (patternId) {
        query = query.eq('pattern_id', patternId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(m => ({
        ...m,
        firstDetected: this.ensureDate(m.first_detected),
        lastObserved: this.ensureDate(m.last_observed),
        resolutionDate: m.resolution_date ? this.ensureDate(m.resolution_date) : undefined,
      }));
    } catch (error) {
      this.handleError(error, 'getMisconceptions');
    }
  }

  /**
   * Mark a misconception as resolved
   */
  async resolveMisconception(misconceptionId: string): Promise<void> {
    try {
      await this.db
        .from('misconceptions')
        .update({
          resolved: true,
          resolution_date: new Date().toISOString(),
        })
        .eq('id', misconceptionId);

      this.log(`Resolved misconception: ${misconceptionId}`);
    } catch (error) {
      this.handleError(error, 'resolveMisconception');
    }
  }

  /**
   * Check if student has shown understanding of a misconception
   * (if they explain it correctly, mark as resolved)
   */
  async checkForResolution(
    userId: string,
    patternId: string,
    correctExplanation: string
  ): Promise<void> {
    try {
      const misconceptions = await this.getMisconceptions(userId, patternId);

      for (const misconception of misconceptions) {
        // Simple check: if correction appears in student's explanation
        const normalizedExplanation = correctExplanation.toLowerCase();
        const normalizedCorrection = misconception.correction.toLowerCase();

        // Extract key phrases from correction
        const keyPhrases = this.extractKeyPhrases(normalizedCorrection);
        const matchCount = keyPhrases.filter(phrase =>
          normalizedExplanation.includes(phrase)
        ).length;

        // If student mentions most key concepts, mark as resolved
        if (matchCount >= keyPhrases.length * 0.7) {
          await this.resolveMisconception(misconception.id);
          this.log(`Auto-resolved misconception based on student explanation: ${misconception.description}`);
        }
      }
    } catch (error) {
      this.log('Error checking for resolution', error);
    }
  }

  /**
   * Extract key phrases from correction text
   */
  private extractKeyPhrases(text: string): string[] {
    // Split by common separators and filter meaningful phrases
    return text
      .split(/[,.\(\)]/g)
      .map(phrase => phrase.trim())
      .filter(phrase => phrase.length > 10) // Keep substantial phrases
      .map(phrase => phrase.toLowerCase());
  }

  /**
   * Generate gentle correction message
   */
  generateGentleCorrection(detected: DetectedMisconception): string {
    return `I notice you mentioned "${detected.detectedIn}". That's a common misconception! ${detected.correction}`;
  }

  /**
   * Get misconception statistics
   */
  async getMisconceptionStats(userId: string): Promise<{
    totalDetected: number;
    totalResolved: number;
    activeCount: number;
    mostCommon: Array<{ description: string; count: number }>;
  }> {
    try {
      const { data } = await this.db
        .from('misconceptions')
        .select('*')
        .eq('user_id', userId);

      const all = data || [];
      const resolved = all.filter(m => m.resolved);
      const active = all.filter(m => !m.resolved);

      // Count by description
      const counts = new Map<string, number>();
      all.forEach(m => {
        counts.set(m.description, (counts.get(m.description) || 0) + 1);
      });

      const mostCommon = Array.from(counts.entries())
        .map(([description, count]) => ({ description, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalDetected: all.length,
        totalResolved: resolved.length,
        activeCount: active.length,
        mostCommon,
      };
    } catch (error) {
      this.handleError(error, 'getMisconceptionStats');
    }
  }
}

// Singleton instance
export const misconceptionDetectorService = new MisconceptionDetectorService();
