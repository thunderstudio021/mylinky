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
      creator_applications: {
        Row: {
          admin_notes: string | null
          created_at: string
          document_back_url: string | null
          document_front_url: string | null
          id: string
          reviewed_at: string | null
          selfie_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          document_back_url?: string | null
          document_front_url?: string | null
          id?: string
          reviewed_at?: string | null
          selfie_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          document_back_url?: string | null
          document_front_url?: string | null
          id?: string
          reviewed_at?: string | null
          selfie_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          creator_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      gifts: {
        Row: {
          amount: number
          created_at: string
          creator_id: string
          id: string
          payment_method: string
          post_id: string | null
          sender_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          creator_id: string
          id?: string
          payment_method?: string
          post_id?: string | null
          sender_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          id?: string
          payment_method?: string
          post_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gifts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          from_user_id: string | null
          id: string
          message: string
          post_id: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          message?: string
          post_id?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          message?: string
          post_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string
          id: string
          poll_id: string
          position: number
          text: string
          votes_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          poll_id: string
          position?: number
          text: string
          votes_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          poll_id?: string
          position?: number
          text?: string
          votes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string
          creator_id: string
          id: string
          likes_count: number | null
          media_type: string | null
          media_url: string | null
          post_visibility: string
          ppv_price: number | null
        }
        Insert: {
          comments_count?: number | null
          content?: string
          created_at?: string
          creator_id: string
          id?: string
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          post_visibility?: string
          ppv_price?: number | null
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string
          creator_id?: string
          id?: string
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          post_visibility?: string
          ppv_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ppv_purchases: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          id: string
          payment_method: string
          post_id: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          id?: string
          payment_method?: string
          post_id: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          id?: string
          payment_method?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppv_purchases_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          category: string | null
          commission_rate: number | null
          cover_url: string | null
          created_at: string
          email: string
          followers_count: number | null
          id: string
          is_creator: boolean | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
          subscribers_count: number | null
          updated_at: string
          username: string
          verified: boolean | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          commission_rate?: number | null
          cover_url?: string | null
          created_at?: string
          email: string
          followers_count?: number | null
          id: string
          is_creator?: boolean | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          subscribers_count?: number | null
          updated_at?: string
          username: string
          verified?: boolean | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          commission_rate?: number | null
          cover_url?: string | null
          created_at?: string
          email?: string
          followers_count?: number | null
          id?: string
          is_creator?: boolean | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          subscribers_count?: number | null
          updated_at?: string
          username?: string
          verified?: boolean | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          creator_id: string
          expires_at: string | null
          id: string
          payment_method: string
          plan: string
          status: string
          subscriber_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          creator_id: string
          expires_at?: string | null
          id?: string
          payment_method?: string
          plan?: string
          status?: string
          subscriber_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          expires_at?: string | null
          id?: string
          payment_method?: string
          plan?: string
          status?: string
          subscriber_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          bank_name: string
          created_at: string
          creator_id: string
          id: string
          pix_key: string
          pix_key_holder_name: string
          reviewed_at: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          bank_name: string
          created_at?: string
          creator_id: string
          id?: string
          pix_key: string
          pix_key_holder_name: string
          reviewed_at?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          bank_name?: string
          created_at?: string
          creator_id?: string
          id?: string
          pix_key?: string
          pix_key_holder_name?: string
          reviewed_at?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_creator: { Args: { _application_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_creator: { Args: { _application_id: string }; Returns: undefined }
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
