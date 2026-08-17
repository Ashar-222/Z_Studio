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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      content_items: {
        Row: {
          angle: string
          created_at: string
          format: string
          hook: string
          id: string
          metrics: Json | null
          pack: Json | null
          platform: string
          publish_date: string | null
          script: Json | null
          status: string
          thumbnail: Json | null
          title: string
          updated_at: string
          user_id: string
          why: string | null
        }
        Insert: {
          angle?: string
          created_at?: string
          format?: string
          hook?: string
          id?: string
          metrics?: Json | null
          pack?: Json | null
          platform?: string
          publish_date?: string | null
          script?: Json | null
          status?: string
          thumbnail?: Json | null
          title?: string
          updated_at?: string
          user_id: string
          why?: string | null
        }
        Update: {
          angle?: string
          created_at?: string
          format?: string
          hook?: string
          id?: string
          metrics?: Json | null
          pack?: Json | null
          platform?: string
          publish_date?: string | null
          script?: Json | null
          status?: string
          thumbnail?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
          why?: string | null
        }
        Relationships: []
      }
      creator_profiles: {
        Row: {
          audience: string
          content_type: string
          created_at: string
          frequency: string
          goal: string
          name: string
          niche: string
          platforms: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string
          content_type?: string
          created_at?: string
          frequency?: string
          goal?: string
          name?: string
          niche?: string
          platforms?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string
          content_type?: string
          created_at?: string
          frequency?: string
          goal?: string
          name?: string
          niche?: string
          platforms?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          display_name: string
          followers: number | null
          handle: string
          id: string
          last_synced_at: string
          platform: string
          posts_count: number | null
          profile_url: string | null
          raw: Json | null
          total_views: number | null
          user_id: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          followers?: number | null
          handle: string
          id?: string
          last_synced_at?: string
          platform: string
          posts_count?: number | null
          profile_url?: string | null
          raw?: Json | null
          total_views?: number | null
          user_id: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          followers?: number | null
          handle?: string
          id?: string
          last_synced_at?: string
          platform?: string
          posts_count?: number | null
          profile_url?: string | null
          raw?: Json | null
          total_views?: number | null
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          account_id: string
          comments: number | null
          created_at: string
          duration_seconds: number | null
          external_id: string
          id: string
          likes: number | null
          published_at: string | null
          raw: Json | null
          shares: number | null
          thumbnail_url: string | null
          title: string
          url: string | null
          user_id: string
          views: number | null
        }
        Insert: {
          account_id: string
          comments?: number | null
          created_at?: string
          duration_seconds?: number | null
          external_id: string
          id?: string
          likes?: number | null
          published_at?: string | null
          raw?: Json | null
          shares?: number | null
          thumbnail_url?: string | null
          title?: string
          url?: string | null
          user_id: string
          views?: number | null
        }
        Update: {
          account_id?: string
          comments?: number | null
          created_at?: string
          duration_seconds?: number | null
          external_id?: string
          id?: string
          likes?: number | null
          published_at?: string | null
          raw?: Json | null
          shares?: number | null
          thumbnail_url?: string | null
          title?: string
          url?: string | null
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
