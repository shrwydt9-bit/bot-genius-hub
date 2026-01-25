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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_suggestions: {
        Row: {
          ai_analysis: Json | null
          bot_id: string | null
          brand_id: string | null
          created_at: string
          description: string
          id: string
          priority: string | null
          status: string | null
          suggestion_type: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: Json | null
          bot_id?: string | null
          brand_id?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: string | null
          status?: string | null
          suggestion_type: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: Json | null
          bot_id?: string | null
          brand_id?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: string | null
          status?: string | null
          suggestion_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          bot_id: string
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          bot_id: string
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          bot_id?: string
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      bots: {
        Row: {
          bot_type: Database["public"]["Enums"]["bot_type"]
          brand_id: string | null
          configuration: Json | null
          created_at: string
          description: string | null
          greeting_message: string | null
          id: string
          is_active: boolean | null
          name: string
          personality: string | null
          platform: Database["public"]["Enums"]["bot_platform"]
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_type: Database["public"]["Enums"]["bot_type"]
          brand_id?: string | null
          configuration?: Json | null
          created_at?: string
          description?: string | null
          greeting_message?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          personality?: string | null
          platform: Database["public"]["Enums"]["bot_platform"]
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_type?: Database["public"]["Enums"]["bot_type"]
          brand_id?: string | null
          configuration?: Json | null
          created_at?: string
          description?: string | null
          greeting_message?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          personality?: string | null
          platform?: Database["public"]["Enums"]["bot_platform"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bots_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          color_scheme: Json | null
          created_at: string
          description: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          color_scheme?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          color_scheme?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      conversation_insights: {
        Row: {
          bot_id: string
          created_at: string | null
          data: Json | null
          description: string
          frequency: number | null
          id: string
          insight_type: string
          priority: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          bot_id: string
          created_at?: string | null
          data?: Json | null
          description: string
          frequency?: number | null
          id?: string
          insight_type: string
          priority?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          bot_id?: string
          created_at?: string | null
          data?: Json | null
          description?: string
          frequency?: number | null
          id?: string
          insight_type?: string
          priority?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_insights_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          bot_id: string
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          session_id: string
        }
        Insert: {
          bot_id: string
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
        }
        Update: {
          bot_id?: string
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          bot_id: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          message_count: number | null
          metadata: Json | null
          platform: string
          session_id: string
          started_at: string | null
          user_satisfaction: number | null
        }
        Insert: {
          bot_id: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          message_count?: number | null
          metadata?: Json | null
          platform: string
          session_id: string
          started_at?: string | null
          user_satisfaction?: number | null
        }
        Update: {
          bot_id?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          message_count?: number | null
          metadata?: Json | null
          platform?: string
          session_id?: string
          started_at?: string | null
          user_satisfaction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_sessions_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      customization_chats: {
        Row: {
          bot_id: string
          content: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          bot_id: string
          content: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          bot_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "customization_chats_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      deployments: {
        Row: {
          bot_id: string
          config: Json | null
          created_at: string
          id: string
          is_active: boolean
          platform: string
          updated_at: string
          webhook_secret: string
          webhook_url: string
        }
        Insert: {
          bot_id: string
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          platform: string
          updated_at?: string
          webhook_secret?: string
          webhook_url: string
        }
        Update: {
          bot_id?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: string
          updated_at?: string
          webhook_secret?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_integrations: {
        Row: {
          created_at: string | null
          credentials: Json
          id: string
          is_active: boolean | null
          platform: Database["public"]["Enums"]["bot_platform"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credentials: Json
          id?: string
          is_active?: boolean | null
          platform: Database["public"]["Enums"]["bot_platform"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credentials?: Json
          id?: string
          is_active?: boolean | null
          platform?: Database["public"]["Enums"]["bot_platform"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      response_templates: {
        Row: {
          bot_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          platform: Database["public"]["Enums"]["bot_platform"]
          template_content: string
          updated_at: string | null
          usage_count: number | null
          user_id: string
          variables: Json | null
        }
        Insert: {
          bot_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          platform: Database["public"]["Enums"]["bot_platform"]
          template_content: string
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
          variables?: Json | null
        }
        Update: {
          bot_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          platform?: Database["public"]["Enums"]["bot_platform"]
          template_content?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "response_templates_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          deployment_id: string
          error: string | null
          id: string
          request_body: Json
          response_status: number | null
        }
        Insert: {
          created_at?: string
          deployment_id: string
          error?: string | null
          id?: string
          request_body: Json
          response_status?: number | null
        }
        Update: {
          created_at?: string
          deployment_id?: string
          error?: string | null
          id?: string
          request_body?: Json
          response_status?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "deployments"
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
      bot_platform:
        | "whatsapp"
        | "telegram"
        | "instagram"
        | "facebook"
        | "shopify"
        | "slack"
        | "discord"
        | "email"
        | "sms"
        | "linkedin"
        | "tiktok"
        | "microsoft_teams"
        | "twitter"
        | "snapchat"
        | "wechat"
        | "line"
        | "viber"
        | "pinterest"
        | "reddit"
        | "youtube"
        | "google_business"
        | "apple_messages"
        | "rcs"
        | "kik"
        | "signal"
        | "matrix"
      bot_type:
        | "customer_service"
        | "lead_generation"
        | "content_automation"
        | "ecommerce"
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
      bot_platform: [
        "whatsapp",
        "telegram",
        "instagram",
        "facebook",
        "shopify",
        "slack",
        "discord",
        "email",
        "sms",
        "linkedin",
        "tiktok",
        "microsoft_teams",
        "twitter",
        "snapchat",
        "wechat",
        "line",
        "viber",
        "pinterest",
        "reddit",
        "youtube",
        "google_business",
        "apple_messages",
        "rcs",
        "kik",
        "signal",
        "matrix",
      ],
      bot_type: [
        "customer_service",
        "lead_generation",
        "content_automation",
        "ecommerce",
      ],
    },
  },
} as const
