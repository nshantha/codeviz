import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './index';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get Supabase client singleton
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      {
        auth: {
          persistSession: false, // No auth for MVP
        },
      }
    );
  }
  return supabaseInstance;
}

/**
 * Database types (to be generated from Supabase later)
 */
export interface Database {
  public: {
    Tables: {
      patterns: {
        Row: Pattern;
        Insert: Omit<Pattern, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Pattern, 'id'>>;
      };
      problems: {
        Row: Problem;
        Insert: Omit<Problem, 'id' | 'created_at'>;
        Update: Partial<Omit<Problem, 'id'>>;
      };
      submissions: {
        Row: Submission;
        Insert: Omit<Submission, 'id' | 'created_at'>;
        Update: Partial<Omit<Submission, 'id'>>;
      };
      knowledge_state: {
        Row: KnowledgeState;
        Insert: Omit<KnowledgeState, 'id' | 'last_practiced'>;
        Update: Partial<Omit<KnowledgeState, 'id'>>;
      };
    };
  };
}

export interface Pattern {
  id: string;
  name: string;
  type: 'coding' | 'system_design';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  time_complexity?: string;
  space_complexity?: string;
  use_cases?: string[];
  code_templates?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  test_cases: any;
  hints?: string[];
  optimal_solution?: any;
  created_at: string;
}

export interface Submission {
  id: string;
  problem_id: string;
  code: string;
  language: string;
  result: string;
  execution_time?: number;
  hints_used: number;
  created_at: string;
}

export interface KnowledgeState {
  id: string;
  pattern_id: string;
  mastery_probability: number;
  problems_solved: number;
  problems_attempted: number;
  status: 'Locked' | 'Introduced' | 'Practicing' | 'Mastered';
  last_practiced: string;
}
