export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
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
          stock_recovered: boolean | null
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
          stock_recovered?: boolean | null
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
          stock_recovered?: boolean | null
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
        Relationships: []
      }
      user_profiles: {
        Row: {
          birth_date: string | null
          branch_id: string | null
          created_at: string | null
          email: string | null
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
          email?: string | null
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
          email?: string | null
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
      app_configurations: {
        Row: {
          key: string | null
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          key?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          key?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_streak_completion: {
        Args: { p_current_count: number; p_user_id: string }
        Returns: boolean
      }
      current_branch: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      execute_stock_recovery_with_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_type: string
          message: string
          new_stock: number
          prize_id: string
          prize_name: string
          recovered_count: number
        }[]
      }
      generate_coupon_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_streak_coupon: {
        Args: { p_streak_threshold: number; p_user_id: string }
        Returns: undefined
      }
      generate_unique_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_inventory_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_stock: number
          expired_coupons: number
          pending_coupons: number
          prize_id: string
          prize_name: string
          prize_type: string
          redeemed_coupons: number
          stock_status: string
        }[]
      }
      get_recoverable_coupons: {
        Args: Record<PropertyKey, never>
        Returns: {
          expired_count: number
          newest_expiration: string
          oldest_expiration: string
          potential_recovery: number
          prize_id: string
          prize_name: string
          prize_type: string
        }[]
      }
      get_stock_recovery_preview: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_stock: number
          expired_coupons: number
          prize_id: string
          prize_name: string
          stock_after_recovery: number
        }[]
      }
      get_system_setting: {
        Args:
          | { default_value?: string; setting_key: string }
          | { setting_key: string }
        Returns: string
      }
      grant_coupon_to_user: {
        Args: {
          p_prize_id: string
          p_user_id: string
          p_validity_days?: number
        }
        Returns: Json
      }
      grant_manual_coupon: {
        Args: {
          p_prize_id: string
          p_user_id: string
          p_validity_days?: number
        }
        Returns: Json
      }
      grant_streak_coupon: {
        Args: {
          p_prize_id: string
          p_user_id: string
          p_validity_days?: number
        }
        Returns: Json
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
      recover_expired_stock: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      spin_roulette: {
        Args: { p_user: string }
        Returns: Json
      }
      uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_prize_limits: {
        Args: {
          p_max_roulette: number
          p_max_streak: number
          p_user_id: string
        }
        Returns: Json
      }
      update_system_setting: {
        Args: { new_value: string; setting_key: string; user_id: string }
        Returns: boolean
      }
      validate_inventory_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_type: string
          issue_description: string
          prize_id: string
          prize_name: string
          suggested_action: string
        }[]
      }
      validate_prize_limits: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

