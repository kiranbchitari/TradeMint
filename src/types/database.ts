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
      accounts: {
        Row: {
          broker_id: string | null
          created_at: string
          currency: string
          id: string
          is_archived: boolean
          is_default: boolean
          name: string
          starting_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_archived?: boolean
          is_default?: boolean
          name: string
          starting_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_archived?: boolean
          is_default?: boolean
          name?: string
          starting_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      brokers: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      markets: {
        Row: {
          key: string
          label: string
          sort: number
        }
        Insert: {
          key: string
          label: string
          sort?: number
        }
        Update: {
          key?: string
          label?: string
          sort?: number
        }
        Relationships: []
      }
      mistakes: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          label: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          label: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          is_read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      playbooks: {
        Row: {
          checklist: Json
          created_at: string
          description: string | null
          example_images: string[]
          expected_rr: number | null
          id: string
          is_archived: boolean
          rules: string[]
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checklist?: Json
          created_at?: string
          description?: string | null
          example_images?: string[]
          expected_rr?: number | null
          id?: string
          is_archived?: boolean
          rules?: string[]
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checklist?: Json
          created_at?: string
          description?: string | null
          example_images?: string[]
          expected_rr?: number | null
          id?: string
          is_archived?: boolean
          rules?: string[]
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          currency: string
          email: string | null
          full_name: string | null
          id: string
          preferences: Json
          risk_settings: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          full_name?: string | null
          id: string
          preferences?: Json
          risk_settings?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          full_name?: string | null
          id?: string
          preferences?: Json
          risk_settings?: Json
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          data: Json
          id: string
          period_end: string
          period_start: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          period_end: string
          period_start: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          period_end?: string
          period_start?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          id: string
          market_session: string | null
          mood: string | null
          notes: string | null
          session_date: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          market_session?: string | null
          mood?: string | null
          notes?: string | null
          session_date: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          market_session?: string | null
          mood?: string | null
          notes?: string | null
          session_date?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategies: {
        Row: {
          checklist: Json
          color: string | null
          created_at: string
          description: string | null
          example_images: string[]
          expected_rr: number | null
          id: string
          is_archived: boolean
          name: string
          rules: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          checklist?: Json
          color?: string | null
          created_at?: string
          description?: string | null
          example_images?: string[]
          expected_rr?: number | null
          id?: string
          is_archived?: boolean
          name: string
          rules?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          checklist?: Json
          color?: string | null
          created_at?: string
          description?: string | null
          example_images?: string[]
          expected_rr?: number | null
          id?: string
          is_archived?: boolean
          name?: string
          rules?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          sort: number
          storage_path: string
          trade_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          sort?: number
          storage_path: string
          trade_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          sort?: number
          storage_path?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_images_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_mistakes: {
        Row: {
          mistake_id: string
          trade_id: string
          user_id: string
        }
        Insert: {
          mistake_id: string
          trade_id: string
          user_id: string
        }
        Update: {
          mistake_id?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_mistakes_mistake_id_fkey"
            columns: ["mistake_id"]
            isOneToOne: false
            referencedRelation: "mistakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_mistakes_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_tags: {
        Row: {
          tag_id: string
          trade_id: string
          user_id: string
        }
        Insert: {
          tag_id: string
          trade_id: string
          user_id: string
        }
        Update: {
          tag_id?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_tags_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          account_id: string | null
          broker_id: string | null
          confidence: number | null
          created_at: string
          direction: string
          discipline_rating: number | null
          emotion: string | null
          entry_at: string
          entry_price: number
          execution_rating: number | null
          exit_at: string | null
          exit_price: number | null
          fees: number
          grade: string | null
          id: string
          initial_risk: number | null
          lessons: string | null
          market: string
          multiplier: number
          net_pnl: number | null
          notes: string | null
          quantity: number
          r_multiple: number | null
          reward_amount: number | null
          risk_amount: number | null
          session_id: string | null
          setup: string | null
          status: string
          stop_loss: number | null
          strategy_id: string | null
          symbol: string
          target_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          broker_id?: string | null
          confidence?: number | null
          created_at?: string
          direction: string
          discipline_rating?: number | null
          emotion?: string | null
          entry_at?: string
          entry_price: number
          execution_rating?: number | null
          exit_at?: string | null
          exit_price?: number | null
          fees?: number
          grade?: string | null
          id?: string
          initial_risk?: number | null
          lessons?: string | null
          market?: string
          multiplier?: number
          net_pnl?: number | null
          notes?: string | null
          quantity: number
          r_multiple?: number | null
          reward_amount?: number | null
          risk_amount?: number | null
          session_id?: string | null
          setup?: string | null
          status?: string
          stop_loss?: number | null
          strategy_id?: string | null
          symbol: string
          target_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          broker_id?: string | null
          confidence?: number | null
          created_at?: string
          direction?: string
          discipline_rating?: number | null
          emotion?: string | null
          entry_at?: string
          entry_price?: number
          execution_rating?: number | null
          exit_at?: string | null
          exit_price?: number | null
          fees?: number
          grade?: string | null
          id?: string
          initial_risk?: number | null
          lessons?: string | null
          market?: string
          multiplier?: number
          net_pnl?: number | null
          notes?: string | null
          quantity?: number
          r_multiple?: number | null
          reward_amount?: number | null
          risk_amount?: number | null
          session_id?: string | null
          setup?: string | null
          status?: string
          stop_loss?: number | null
          strategy_id?: string | null
          symbol?: string
          target_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_market_fkey"
            columns: ["market"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "trades_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
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
