export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attempts: {
        Row: {
          created_at: string
          exam_session_id: string | null
          exercise_id: string
          id: string
          is_correct: boolean
          selected_choice: number
          time_spent_ms: number
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_session_id?: string | null
          exercise_id: string
          id?: string
          is_correct: boolean
          selected_choice: number
          time_spent_ms?: number
          user_id: string
        }
        Update: {
          created_at?: string
          exam_session_id?: string | null
          exercise_id?: string
          id?: string
          is_correct?: boolean
          selected_choice?: number
          time_spent_ms?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          exam_id: string
          exercise_id: string
          id: string
          points: number
          position: number
        }
        Insert: {
          exam_id: string
          exercise_id: string
          id?: string
          points?: number
          position?: number
        }
        Update: {
          exam_id?: string
          exercise_id?: string
          id?: string
          points?: number
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_questions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sessions: {
        Row: {
          answers: Json
          exam_id: string | null
          finished_at: string | null
          flagged: Json
          id: string
          question_ids: string[]
          score: number | null
          started_at: string
          status: string
          time_limit_min: number | null
          total: number | null
          university_id: string | null
          user_id: string
        }
        Insert: {
          answers?: Json
          exam_id?: string | null
          finished_at?: string | null
          flagged?: Json
          id?: string
          question_ids?: string[]
          score?: number | null
          started_at?: string
          status?: string
          time_limit_min?: number | null
          total?: number | null
          university_id?: string | null
          user_id: string
        }
        Update: {
          answers?: Json
          exam_id?: string | null
          finished_at?: string | null
          flagged?: Json
          id?: string
          question_ids?: string[]
          score?: number | null
          started_at?: string
          status?: string
          time_limit_min?: number | null
          total?: number | null
          university_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_sessions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_sessions_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_template_rules: {
        Row: {
          created_at: string
          difficulty_filter: Database["public"]["Enums"]["difficulty"] | null
          exam_id: string
          id: string
          position: number
          question_count: number
          topic_id: string
        }
        Insert: {
          created_at?: string
          difficulty_filter?: Database["public"]["Enums"]["difficulty"] | null
          exam_id: string
          id?: string
          position?: number
          question_count: number
          topic_id: string
        }
        Update: {
          created_at?: string
          difficulty_filter?: Database["public"]["Enums"]["difficulty"] | null
          exam_id?: string
          id?: string
          position?: number
          question_count?: number
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_template_rules_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_template_rules_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          allow_multiple_attempts: boolean
          created_at: string
          created_by: string | null
          description: string | null
          exam_type: string
          id: string
          max_attempts: number | null
          passing_score: number
          question_order: string
          status: string
          time_limit_min: number
          title: string
          university_id: string | null
          updated_at: string
        }
        Insert: {
          allow_multiple_attempts?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          exam_type?: string
          id?: string
          max_attempts?: number | null
          passing_score?: number
          question_order?: string
          status?: string
          time_limit_min?: number
          title: string
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          allow_multiple_attempts?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          exam_type?: string
          id?: string
          max_attempts?: number | null
          passing_score?: number
          question_order?: string
          status?: string
          time_limit_min?: number
          title?: string
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          choices: Json
          correct_choice: number
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          exam_year: number | null
          expected_time_ms: number | null
          id: string
          solution_image_path: string | null
          solution_md: string
          statement_image_path: string | null
          statement_md: string
          subtopic_id: string | null
          tags: string[]
          topic_id: string
          university_id: string | null
        }
        Insert: {
          choices: Json
          correct_choice: number
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          exam_year?: number | null
          expected_time_ms?: number | null
          id?: string
          solution_image_path?: string | null
          solution_md: string
          statement_image_path?: string | null
          statement_md: string
          subtopic_id?: string | null
          tags?: string[]
          topic_id: string
          university_id?: string | null
        }
        Update: {
          choices?: Json
          correct_choice?: number
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          exam_year?: number | null
          expected_time_ms?: number | null
          id?: string
          solution_image_path?: string | null
          solution_md?: string
          statement_image_path?: string | null
          statement_md?: string
          subtopic_id?: string | null
          tags?: string[]
          topic_id?: string
          university_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "subtopics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          career: string | null
          created_at: string
          full_name: string | null
          id: string
          leaderboard_opt_in: boolean
          pseudonym: string | null
          target_university: string | null
          weekly_goal_exams: number
          weekly_goal_questions: number
        }
        Insert: {
          career?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          leaderboard_opt_in?: boolean
          pseudonym?: string | null
          target_university?: string | null
          weekly_goal_exams?: number
          weekly_goal_questions?: number
        }
        Update: {
          career?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          leaderboard_opt_in?: boolean
          pseudonym?: string | null
          target_university?: string | null
          weekly_goal_exams?: number
          weekly_goal_questions?: number
        }
        Relationships: []
      }
      student_universities: {
        Row: {
          created_at: string
          exam_date: string | null
          id: string
          university_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_date?: string | null
          id?: string
          university_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_date?: string | null
          id?: string
          university_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_universities_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      subtopics: {
        Row: {
          id: string
          name: string
          order: number
          slug: string
          topic_id: string
        }
        Insert: {
          id?: string
          name: string
          order?: number
          slug: string
          topic_id: string
        }
        Update: {
          id?: string
          name?: string
          order?: number
          slug?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtopics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          active: boolean
          color: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          order: number
          slug: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          order?: number
          slug: string
        }
        Update: {
          active?: boolean
          color?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          order?: number
          slug?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          description: string | null
          id: string
          name: string
          short_name: string
          slug: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          short_name: string
          slug: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          short_name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_exam_leaderboard: {
        Args: { _exam_id: string; _limit?: number }
        Returns: {
          attempts_count: number
          best_score: number
          is_me: boolean
          pseudonym: string
          user_id: string
        }[]
      }
      get_exam_stats: {
        Args: { _exam_id: string; _my_score_pct?: number }
        Returns: {
          avg_score: number
          my_percentile: number
          sessions_count: number
        }[]
      }
      get_exercise_avg_times: {
        Args: { _exercise_ids: string[] }
        Returns: {
          avg_time_ms: number
          exercise_id: string
          samples: number
        }[]
      }
      get_university_leaderboard: {
        Args: { _limit?: number; _university_id: string }
        Returns: {
          avg_score: number
          is_me: boolean
          pseudonym: string
          sessions_count: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "admin"
      difficulty: "facil" | "medio" | "dificil"
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
      app_role: ["student", "admin"],
      difficulty: ["facil", "medio", "dificil"],
    },
  },
} as const
