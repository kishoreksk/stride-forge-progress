export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      exercise_sets: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          reps: number
          set_number: number
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          reps: number
          set_number: number
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          reps?: number
          set_number?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          distance_km: number | null
          exercise_name: string
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          id: string
          is_progressive: boolean | null
          laps: number | null
          notes: string | null
          previous_weight_kg: number | null
          reps: number | null
          sets: number | null
          time_minutes: number | null
          weight_improvement_kg: number | null
          weight_kg: number | null
          workout_session_id: string
        }
        Insert: {
          created_at?: string
          distance_km?: number | null
          exercise_name: string
          exercise_type?: Database["public"]["Enums"]["exercise_type"]
          id?: string
          is_progressive?: boolean | null
          laps?: number | null
          notes?: string | null
          previous_weight_kg?: number | null
          reps?: number | null
          sets?: number | null
          time_minutes?: number | null
          weight_improvement_kg?: number | null
          weight_kg?: number | null
          workout_session_id: string
        }
        Update: {
          created_at?: string
          distance_km?: number | null
          exercise_name?: string
          exercise_type?: Database["public"]["Enums"]["exercise_type"]
          id?: string
          is_progressive?: boolean | null
          laps?: number | null
          notes?: string | null
          previous_weight_kg?: number | null
          reps?: number | null
          sets?: number | null
          time_minutes?: number | null
          weight_improvement_kg?: number | null
          weight_kg?: number | null
          workout_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          photo_url: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          photo_url: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      report_comments: {
        Row: {
          comment_text: string
          commenter_name: string
          created_at: string
          id: string
          shared_report_id: string
        }
        Insert: {
          comment_text: string
          commenter_name: string
          created_at?: string
          id?: string
          shared_report_id: string
        }
        Update: {
          comment_text?: string
          commenter_name?: string
          created_at?: string
          id?: string
          shared_report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_comments_shared_report_id_fkey"
            columns: ["shared_report_id"]
            isOneToOne: false
            referencedRelation: "shared_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_reports: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          share_token: string
          title: string | null
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          share_token: string
          title?: string | null
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          share_token?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          category: Database["public"]["Enums"]["workout_category"]
          created_at: string
          date: string
          duration_minutes: number | null
          id: string
          notes: string | null
          updated_at: string
          user_id: string
          workout_plan_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["workout_category"]
          created_at?: string
          date: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
          workout_plan_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["workout_category"]
          created_at?: string
          date?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          workout_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      exercise_type: "strength" | "cardio"
      workout_category:
        | "push"
        | "pull"
        | "legs"
        | "abs"
        | "cardio"
        | "treadmill"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      exercise_type: ["strength", "cardio"],
      workout_category: ["push", "pull", "legs", "abs", "cardio", "treadmill"],
    },
  },
} as const
