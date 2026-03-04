/**
 * TypeScript types for the Supabase database schema.
 * Extend these as tables are added or modified.
 * For full type safety, use the Supabase CLI to auto-generate:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
                    current_streak: number
                    longest_streak: number
                    last_active_date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
                    current_streak?: number
                    longest_streak?: number
                    last_active_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['profiles']['Insert']>
            }
            lessons: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    topic: string
                    level: string
                    status: 'not_started' | 'in_progress' | 'completed'
                    generated_content: Json | null
                    scheduled_date: string
                    generation: number
                    completed_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    topic: string
                    level?: string
                    status?: 'not_started' | 'in_progress' | 'completed'
                    generated_content?: Json | null
                    scheduled_date?: string
                    generation?: number
                    completed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['lessons']['Insert']>
            }
            lesson_sections: {
                Row: {
                    id: string
                    lesson_id: string
                    user_id: string
                    section: 'vocabulary' | 'listening' | 'speaking' | 'reading' | 'writing'
                    status: 'not_started' | 'in_progress' | 'completed'
                    score: number | null
                    completed_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    lesson_id: string
                    user_id: string
                    section: 'vocabulary' | 'listening' | 'speaking' | 'reading' | 'writing'
                    status?: 'not_started' | 'in_progress' | 'completed'
                    score?: number | null
                    completed_at?: string | null
                }
                Update: Partial<Database['public']['Tables']['lesson_sections']['Insert']>
            }
            vocabulary: {
                Row: {
                    id: string
                    user_id: string
                    lesson_id: string | null
                    word_de: string
                    word_en: string
                    example_sentence: string | null
                    topic: string | null
                    mastery_level: number
                    interval_days: number
                    ease_factor: number
                    next_review_date: string
                    last_reviewed_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    lesson_id?: string | null
                    word_de: string
                    word_en: string
                    example_sentence?: string | null
                    topic?: string | null
                    mastery_level?: number
                    interval_days?: number
                    ease_factor?: number
                    next_review_date?: string
                    last_reviewed_at?: string | null
                }
                Update: Partial<Database['public']['Tables']['vocabulary']['Insert']>
            }
            vocabulary_reviews: {
                Row: {
                    id: string
                    word_id: string
                    user_id: string
                    rating: number
                    previous_interval: number
                    new_interval: number
                    previous_ease: number | null
                    new_ease: number | null
                    reviewed_at: string
                }
                Insert: {
                    id?: string
                    word_id: string
                    user_id: string
                    rating: number
                    previous_interval: number
                    new_interval: number
                    previous_ease?: number | null
                    new_ease?: number | null
                    reviewed_at?: string
                }
                Update: Partial<Database['public']['Tables']['vocabulary_reviews']['Insert']>
            }
            roleplay_sessions: {
                Row: {
                    id: string
                    user_id: string
                    lesson_id: string | null
                    scenario: 'discovery_call' | 'objection_handling' | 'demo_follow_up' | 'needs_analysis' | 'closing'
                    persona: string
                    language_mode: 'german' | 'english' | 'mixed'
                    status: 'active' | 'completed' | 'abandoned'
                    evaluation: Json | null
                    ai_feedback_summary: string | null
                    completed_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    lesson_id?: string | null
                    scenario: 'discovery_call' | 'objection_handling' | 'demo_follow_up' | 'needs_analysis' | 'closing'
                    persona?: string
                    language_mode?: 'german' | 'english' | 'mixed'
                    status?: 'active' | 'completed' | 'abandoned'
                    evaluation?: Json | null
                    ai_feedback_summary?: string | null
                    completed_at?: string | null
                }
                Update: Partial<Database['public']['Tables']['roleplay_sessions']['Insert']>
            }
            roleplay_messages: {
                Row: {
                    id: string
                    session_id: string
                    role: 'user' | 'assistant'
                    content: string
                    turn_index: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    role: 'user' | 'assistant'
                    content: string
                    turn_index: number
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['roleplay_messages']['Insert']>
            }
            writing_submissions: {
                Row: {
                    id: string
                    user_id: string
                    lesson_id: string | null
                    prompt: string
                    submission_text: string
                    corrected_text: string | null
                    ai_feedback: Json | null
                    word_count: number | null
                    submitted_at: string
                    feedback_generated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    lesson_id?: string | null
                    prompt: string
                    submission_text: string
                    corrected_text?: string | null
                    ai_feedback?: Json | null
                    submitted_at?: string
                    feedback_generated_at?: string | null
                }
                Update: Partial<Database['public']['Tables']['writing_submissions']['Insert']>
            }
            progress: {
                Row: {
                    id: string
                    user_id: string
                    lessons_completed: number
                    sections_completed: number
                    roleplay_sessions_completed: number
                    writing_submissions_count: number
                    vocabulary_words_total: number
                    vocabulary_mastered: number
                    vocabulary_mastery_score: number | null
                    current_streak: number
                    longest_streak: number
                    last_active_date: string | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    lessons_completed?: number
                    sections_completed?: number
                    roleplay_sessions_completed?: number
                    writing_submissions_count?: number
                    vocabulary_words_total?: number
                    vocabulary_mastered?: number
                    current_streak?: number
                    longest_streak?: number
                    last_active_date?: string | null
                }
                Update: Partial<Database['public']['Tables']['progress']['Insert']>
            }
            analytics: {
                Row: {
                    id: string
                    user_id: string
                    snapshot_date: string
                    current_streak: number
                    longest_streak: number
                    lessons_completed: number
                    lessons_total: number
                    vocabulary_total: number
                    vocabulary_mastered: number
                    vocabulary_by_topic: Json | null
                    roleplay_total: number
                    roleplay_avg_score: number | null
                    roleplay_score_trend: Json | null
                    writing_total: number
                    writing_avg_score: number | null
                    writing_score_trend: Json | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    snapshot_date?: string
                    current_streak?: number
                    longest_streak?: number
                    lessons_completed?: number
                    lessons_total?: number
                    vocabulary_total?: number
                    vocabulary_mastered?: number
                    vocabulary_by_topic?: Json | null
                    roleplay_total?: number
                    roleplay_avg_score?: number | null
                    roleplay_score_trend?: Json | null
                    writing_total?: number
                    writing_avg_score?: number | null
                    writing_score_trend?: Json | null
                }
                Update: Partial<Database['public']['Tables']['analytics']['Insert']>
            }
        }
        Views: {
            dashboard_summary: {
                Row: {
                    user_id: string
                    full_name: string | null
                    cefr_level: string
                    current_streak: number
                    longest_streak: number
                    lessons_completed: number
                    roleplay_sessions_completed: number
                    vocabulary_mastered: number
                    vocabulary_words_total: number
                    vocabulary_mastery_score: number | null
                    last_active_date: string | null
                }
            }
        }
        Functions: {
            cleanup_rate_limits: {
                Args: Record<string, never>
                Returns: void
            }
        }
    }
}
