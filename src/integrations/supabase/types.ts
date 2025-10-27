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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_sessions: {
        Row: {
          created_at: string
          id: string
          last_activity: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_activity?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          connected_user_id: string
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          connected_user_id: string
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          connected_user_id?: string
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          location: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          location?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          location?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          category: string
          created_at: string
          current_amount: number
          deadline: string | null
          description: string | null
          id: string
          target_amount: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          current_amount?: number
          deadline?: string | null
          description?: string | null
          id?: string
          target_amount: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          current_amount?: number
          deadline?: string | null
          description?: string | null
          id?: string
          target_amount?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_quiz_answers: {
        Row: {
          created_at: string
          fixed_expenses: number
          investments: number
          updated_at: string
          user_id: string
          variable_expenses: number
        }
        Insert: {
          created_at?: string
          fixed_expenses: number
          investments: number
          updated_at?: string
          user_id: string
          variable_expenses: number
        }
        Update: {
          created_at?: string
          fixed_expenses?: number
          investments?: number
          updated_at?: string
          user_id?: string
          variable_expenses?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          ai_analysis: string | null
          category: string
          content: string | null
          created_at: string
          id: string
          published_at: string
          source: string
          source_url: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: string | null
          category: string
          content?: string | null
          created_at?: string
          id?: string
          published_at: string
          source: string
          source_url: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: string | null
          category?: string
          content?: string | null
          created_at?: string
          id?: string
          published_at?: string
          source?: string
          source_url?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_initials: string
          author_name: string
          category: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          author_initials: string
          author_name: string
          category?: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          author_initials?: string
          author_name?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          connections_count: number | null
          created_at: string
          display_name: string | null
          id: string
          plan_type: string
          posts_count: number | null
          subscription_expires_at: string | null
          subscription_id: string | null
          subscription_status: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          connections_count?: number | null
          created_at?: string
          display_name?: string | null
          id?: string
          plan_type?: string
          posts_count?: number | null
          subscription_expires_at?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          connections_count?: number | null
          created_at?: string
          display_name?: string | null
          id?: string
          plan_type?: string
          posts_count?: number | null
          subscription_expires_at?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          updated_at: string
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      replies: {
        Row: {
          author_initials: string
          author_name: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          post_id: string
          user_id: string
        }
        Insert: {
          author_initials: string
          author_name: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          post_id: string
          user_id: string
        }
        Update: {
          author_initials?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      reply_likes: {
        Row: {
          created_at: string
          id: string
          reply_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reply_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reply_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reply_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "replies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_audit_log: {
        Row: {
          created_at: string
          event_type: string
          external_reference: string | null
          id: string
          metadata: Json | null
          payment_id: string | null
          source: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          external_reference?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          source: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          external_reference?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      are_users_connected: {
        Args: { _user_id1: string; _user_id2: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          _endpoint: string
          _max_requests?: number
          _user_id: string
          _window_minutes?: number
        }
        Returns: Json
      }
      delete_user: { Args: never; Returns: undefined }
      get_public_posts: {
        Args: never
        Returns: {
          author_initials: string
          author_name: string
          category: string
          content: string
          created_at: string
          id: string
          image_url: string
          likes_count: number
          updated_at: string
        }[]
      }
      get_public_replies: {
        Args: never
        Returns: {
          author_initials: string
          author_name: string
          content: string
          created_at: string
          id: string
          image_url: string
          likes_count: number
          post_id: string
        }[]
      }
      get_safe_connection_profile: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          connections_count: number
          created_at: string
          display_name: string
          id: string
          posts_count: number
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_premium_user: { Args: { _user_id: string }; Returns: boolean }
      user_liked_post: { Args: { post_id_param: string }; Returns: boolean }
      user_liked_reply: { Args: { reply_id_param: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
