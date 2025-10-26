import { SupabaseClient } from '@supabase/supabase-js';
import { KnowledgeState } from '../../config/supabase';

export interface KnowledgeUpdate {
  patternId: string;
  solved: boolean;
  hintsUsed: number;
  timeSpent?: number;
}

/**
 * Knowledge Tracker Service
 * Implements simplified Bayesian Knowledge Tracing
 * (Inspired by DeepAgents' state management patterns)
 */
export class KnowledgeTrackerService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Update knowledge state after problem attempt
   */
  async updateKnowledge(update: KnowledgeUpdate): Promise<KnowledgeState> {
    // Get current knowledge state
    const { data: current } = await this.supabase
      .from('knowledge_state')
      .select('*')
      .eq('pattern_id', update.patternId)
      .single();

    const currentMastery = current?.mastery_probability || 0.1; // P(L0) = 0.1

    // Calculate new mastery (Bayesian update)
    let newMastery = currentMastery;

    if (update.solved && update.hintsUsed === 0) {
      // Strong evidence of mastery
      newMastery += 0.2;
    } else if (update.solved && update.hintsUsed > 0) {
      // Weak evidence of mastery
      newMastery += 0.1;
    } else {
      // Evidence of forgetting or never learned
      newMastery -= 0.15;
    }

    // Cap between 0 and 1
    newMastery = Math.max(0, Math.min(1, newMastery));

    // Determine status
    const status = this.calculateStatus(newMastery);

    // Upsert knowledge state
    const { data, error } = await this.supabase
      .from('knowledge_state')
      .upsert({
        pattern_id: update.patternId,
        mastery_probability: newMastery,
        status,
        problems_attempted: (current?.problems_attempted || 0) + 1,
        problems_solved: (current?.problems_solved || 0) + (update.solved ? 1 : 0),
        last_practiced: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update knowledge state: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all knowledge states
   */
  async getAllKnowledgeStates(): Promise<KnowledgeState[]> {
    const { data, error } = await this.supabase
      .from('knowledge_state')
      .select('*')
      .order('mastery_probability', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch knowledge states: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get knowledge state for specific pattern
   */
  async getPatternKnowledge(patternId: string): Promise<KnowledgeState | null> {
    const { data, error } = await this.supabase
      .from('knowledge_state')
      .select('*')
      .eq('pattern_id', patternId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Failed to fetch knowledge state: ${error.message}`);
    }

    return data;
  }

  /**
   * Calculate pattern status based on mastery
   */
  private calculateStatus(
    mastery: number
  ): 'Locked' | 'Introduced' | 'Practicing' | 'Mastered' {
    if (mastery >= 0.8) return 'Mastered';
    if (mastery >= 0.5) return 'Practicing';
    if (mastery >= 0.2) return 'Introduced';
    return 'Locked';
  }

  /**
   * Check if pattern is mastered
   */
  async isPatternMastered(patternId: string): Promise<boolean> {
    const state = await this.getPatternKnowledge(patternId);
    return (state?.mastery_probability ?? 0) > 0.8;
  }
}
