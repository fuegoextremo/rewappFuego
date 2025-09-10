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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      app_configurations: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          branch_id: string | null
          check_in_date: string | null
          created_at: string | null
          id: string
          spins_earned: number | null
          updated_at: string | null
          user_id: string | null
          verified_by: string | null
        }
        Insert: {
          branch_id?: string | null
          check_in_date?: string | null
          created_at?: string | null
          id?: string
          spins_earned?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified_by?: string | null
        }
        Update: {
          branch_id?: string | null
          check_in_date?: string | null
          created_at?: string | null
          id?: string
          spins_earned?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          branch_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_redeemed: boolean | null
          prize_id: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          source: string | null
          unique_code: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_redeemed?: boolean | null
          prize_id?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          source?: string | null
          unique_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_redeemed?: boolean | null
          prize_id?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          source?: string | null
          unique_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "prizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prizes: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          inventory_count: number | null
          is_active: boolean | null
          name: string
          streak_threshold: number | null
          type: string
          updated_at: string | null
          validity_days: number | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          inventory_count?: number | null
          is_active?: boolean | null
          name: string
          streak_threshold?: number | null
          type: string
          updated_at?: string | null
          validity_days?: number | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          inventory_count?: number | null
          is_active?: boolean | null
          name?: string
          streak_threshold?: number | null
          type?: string
          updated_at?: string | null
          validity_days?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      roulette_spins: {
        Row: {
          coupon_id: string | null
          created_at: string | null
          id: string
          prize_id: string | null
          spin_result: string | null
          user_id: string | null
          won_prize: boolean | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string | null
          id?: string
          prize_id?: string | null
          spin_result?: string | null
          user_id?: string | null
          won_prize?: boolean | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string | null
          id?: string
          prize_id?: string | null
          spin_result?: string | null
          user_id?: string | null
          won_prize?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "roulette_spins_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roulette_spins_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "prizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roulette_spins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          completed_count: number | null
          created_at: string | null
          current_count: number | null
          expires_at: string | null
          id: string
          is_completed: boolean | null
          is_just_completed: boolean | null
          last_check_in: string | null
          max_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_count?: number | null
          created_at?: string | null
          current_count?: number | null
          expires_at?: string | null
          id?: string
          is_completed?: boolean | null
          is_just_completed?: boolean | null
          last_check_in?: string | null
          max_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_count?: number | null
          created_at?: string | null
          current_count?: number | null
          expires_at?: string | null
          id?: string
          is_completed?: boolean | null
          is_just_completed?: boolean | null
          last_check_in?: string | null
          max_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          key: string
          setting_type: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          setting_type?: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          setting_type?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          birth_date: string | null
          branch_id: string | null
          created_at: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          role: string | null
          unique_code: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          branch_id?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          unique_code?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          branch_id?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          unique_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_spins: {
        Row: {
          available_spins: number | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          available_spins?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          available_spins?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_spins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_branch: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_coupon_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_unique_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      grant_coupon_to_user: {
        Args:
          | { p_prize_id: string; p_user_id: string }
          | { p_prize_id: string; p_user_id: string; p_validity_days?: number }
        Returns: undefined
      }
      increment_user_spins: {
        Args: { p_spin_amount: number; p_user_id: string }
        Returns: undefined
      }
      is_admin_any: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_verifier: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      process_checkin: {
        Args: { p_branch: string; p_spins?: number; p_user: string }
        Returns: undefined
      }
      spin_roulette: {
        Args: { p_user: string }
        Returns: Json
      }
      uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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

// 🎯 TIPOS ÚTILES PARA LA APLICACIÓN
export type UserProfile = Tables<'user_profiles'>
export type CheckIn = Tables<'check_ins'>
export type Streak = Tables<'streaks'>
export type Coupon = Tables<'coupons'>
export type Prize = Tables<'prizes'>
export type RouletteSpins = Tables<'roulette_spins'>
export type UserSpins = Tables<'user_spins'>
export type Branch = Tables<'branches'>
export type SystemSetting = Tables<'system_settings'>

// 📊 TIPOS COMPUESTOS PARA LA APP
export type CheckinData = {
  id: string
  created_at: string
  branch_name?: string
  current_streak?: number
  streak_count?: number
  spins_earned?: number
}

export type UserWithStats = UserProfile & {
  total_checkins: number
  current_streak: number
  available_spins: number
}
