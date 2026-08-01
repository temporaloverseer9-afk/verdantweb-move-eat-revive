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
      food_logs: {
        Row: {
          created_at: string
          id: string
          label: string
          note: string | null
          occurred_at: string
          points: number
          tier: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          note?: string | null
          occurred_at?: string
          points?: number
          tier: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          note?: string | null
          occurred_at?: string
          points?: number
          tier?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string
          created_at: string
          id: string
          total_points: number
          username: string
        }
        Insert: {
          avatar?: string
          created_at?: string
          id: string
          total_points?: number
          username: string
        }
        Update: {
          avatar?: string
          created_at?: string
          id?: string
          total_points?: number
          username?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          accuracy_m: number | null
          avg_speed_kmh: number
          created_at: string
          distance_km: number
          duration_s: number | null
          gps_path: Json | null
          id: string
          max_speed_kmh: number | null
          mode: Database["public"]["Enums"]["transit_mode"]
          occurred_at: string
          ping_count: number
          points: number
          user_id: string
          verified: boolean
        }
        Insert: {
          accuracy_m?: number | null
          avg_speed_kmh: number
          created_at?: string
          distance_km: number
          duration_s?: number | null
          gps_path?: Json | null
          id?: string
          max_speed_kmh?: number | null
          mode: Database["public"]["Enums"]["transit_mode"]
          occurred_at?: string
          ping_count?: number
          points?: number
          user_id: string
          verified?: boolean
        }
        Update: {
          accuracy_m?: number | null
          avg_speed_kmh?: number
          created_at?: string
          distance_km?: number
          duration_s?: number | null
          gps_path?: Json | null
          id?: string
          max_speed_kmh?: number | null
          mode?: Database["public"]["Enums"]["transit_mode"]
          occurred_at?: string
          ping_count?: number
          points?: number
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      public_profile_stats: {
        Args: { _user_id: string }
        Returns: {
          avatar: string
          food_points: number
          green_km: number
          joined_at: string
          meal_count: number
          total_points: number
          trip_count: number
          trip_points: number
          user_id: string
          username: string
          weekly_points: number
        }[]
      }
      weekly_leaderboard: {
        Args: never
        Returns: {
          avatar: string
          total_points: number
          user_id: string
          username: string
          weekly_points: number
        }[]
      }
    }
    Enums: {
      transit_mode: "walk" | "cycle" | "bus" | "train" | "car"
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
      transit_mode: ["walk", "cycle", "bus", "train", "car"],
    },
  },
} as const
