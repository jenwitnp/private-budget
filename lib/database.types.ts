// Database Types Generated from Schema
// Use with Supabase client for type safety

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string | null;
          email_verified: boolean;
          email_verified_at: string | null;
          first_name: string | null;
          last_name: string | null;
          phone_number: string | null;
          avatar_url: string | null;
          date_of_birth: string | null;
          id_card_number: string | null;
          role: "user" | "admin" | "moderator";
          status: "active" | "inactive" | "suspended" | "deleted";
          balance: number;
          two_factor_enabled: boolean;
          two_factor_secret: string | null;
          last_login_at: string | null;
          last_login_ip: string | null;
          failed_login_attempts: number;
          locked_until: string | null;
          notification_email: boolean;
          notification_sms: boolean;
          language: string;
          currency: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash?: string | null;
          email_verified?: boolean;
          email_verified_at?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone_number?: string | null;
          avatar_url?: string | null;
          date_of_birth?: string | null;
          id_card_number?: string | null;
          role?: "user" | "admin" | "moderator";
          status?: "active" | "inactive" | "suspended" | "deleted";
          balance?: number;
          two_factor_enabled?: boolean;
          two_factor_secret?: string | null;
          last_login_at?: string | null;
          last_login_ip?: string | null;
          failed_login_attempts?: number;
          locked_until?: string | null;
          notification_email?: boolean;
          notification_sms?: boolean;
          language?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string | null;
          email_verified?: boolean;
          email_verified_at?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone_number?: string | null;
          avatar_url?: string | null;
          date_of_birth?: string | null;
          id_card_number?: string | null;
          role?: "user" | "admin" | "moderator";
          status?: "active" | "inactive" | "suspended" | "deleted";
          balance?: number;
          two_factor_enabled?: boolean;
          two_factor_secret?: string | null;
          last_login_at?: string | null;
          last_login_ip?: string | null;
          failed_login_attempts?: number;
          locked_until?: string | null;
          notification_email?: boolean;
          notification_sms?: boolean;
          language?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      bank_accounts: {
        Row: {
          id: string;
          user_id: string;
          account_number: string;
          account_name: string | null;
          account_type:
            | "savings"
            | "current"
            | "fixed_deposit"
            | "money_market"
            | "other";
          bank:
            | "KBANK"
            | "SCB"
            | "BBL"
            | "BAY"
            | "CIMB"
            | "KASIKORN"
            | "TTB"
            | "KTB"
            | "UOB"
            | "HSBC"
            | "CITIBANK"
            | "OTHER";
          bank_name_custom: string | null;
          branch_name: string | null;
          account_holder_name: string | null;
          account_holder_id: string | null;
          is_primary: boolean;
          is_active: boolean;
          verified: boolean;
          verified_at: string | null;
          account_balance: number;
          last_sync_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_number: string;
          account_name?: string | null;
          account_type?:
            | "savings"
            | "current"
            | "fixed_deposit"
            | "money_market"
            | "other";
          bank:
            | "KBANK"
            | "SCB"
            | "BBL"
            | "BAY"
            | "CIMB"
            | "KASIKORN"
            | "TTB"
            | "KTB"
            | "UOB"
            | "HSBC"
            | "CITIBANK"
            | "OTHER";
          bank_name_custom?: string | null;
          branch_name?: string | null;
          account_holder_name?: string | null;
          account_holder_id?: string | null;
          is_primary?: boolean;
          is_active?: boolean;
          verified?: boolean;
          verified_at?: string | null;
          account_balance?: number;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_number?: string;
          account_name?: string | null;
          account_type?:
            | "savings"
            | "current"
            | "fixed_deposit"
            | "money_market"
            | "other";
          bank?:
            | "KBANK"
            | "SCB"
            | "BBL"
            | "BAY"
            | "CIMB"
            | "KASIKORN"
            | "TTB"
            | "KTB"
            | "UOB"
            | "HSBC"
            | "CITIBANK"
            | "OTHER";
          bank_name_custom?: string | null;
          branch_name?: string | null;
          account_holder_name?: string | null;
          account_holder_id?: string | null;
          is_primary?: boolean;
          is_active?: boolean;
          verified?: boolean;
          verified_at?: string | null;
          account_balance?: number;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bank_accounts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bank_accounts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          transaction_number: string;
          user_id: string;
          bank_account_id: string;
          amount: number;
          currency: string;
          description: string | null;
          notes: string | null;
          status: "pending" | "success" | "failed" | "cancelled" | "rejected";
          status_changed_at: string | null;
          status_changed_by: string | null;
          recipient_name: string | null;
          recipient_account_number: string | null;
          recipient_bank: string | null;
          transaction_date: string;
          processed_at: string | null;
          completed_at: string | null;
          failed_at: string | null;
          error_code: string | null;
          error_message: string | null;
          fee_amount: number;
          net_amount: number | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          transaction_number: string;
          user_id: string;
          bank_account_id: string;
          amount: number;
          currency?: string;
          description?: string | null;
          notes?: string | null;
          status?: "pending" | "success" | "failed" | "cancelled" | "rejected";
          status_changed_at?: string | null;
          status_changed_by?: string | null;
          recipient_name?: string | null;
          recipient_account_number?: string | null;
          recipient_bank?: string | null;
          transaction_date?: string;
          processed_at?: string | null;
          completed_at?: string | null;
          failed_at?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          fee_amount?: number;
          net_amount?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          transaction_number?: string;
          user_id?: string;
          bank_account_id?: string;
          amount?: number;
          currency?: string;
          description?: string | null;
          notes?: string | null;
          status?: "pending" | "success" | "failed" | "cancelled" | "rejected";
          status_changed_at?: string | null;
          status_changed_by?: string | null;
          recipient_name?: string | null;
          recipient_account_number?: string | null;
          recipient_bank?: string | null;
          transaction_date?: string;
          processed_at?: string | null;
          completed_at?: string | null;
          failed_at?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          fee_amount?: number;
          net_amount?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_bank_account_id_fkey";
            columns: ["bank_account_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_status_changed_by_fkey";
            columns: ["status_changed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      transaction_audit: {
        Row: {
          id: string;
          transaction_id: string;
          old_status:
            | "pending"
            | "success"
            | "failed"
            | "cancelled"
            | "rejected"
            | null;
          new_status:
            | "pending"
            | "success"
            | "failed"
            | "cancelled"
            | "rejected"
            | null;
          changed_by: string | null;
          change_reason: string | null;
          created_at: string;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          old_status?:
            | "pending"
            | "success"
            | "failed"
            | "cancelled"
            | "rejected"
            | null;
          new_status?:
            | "pending"
            | "success"
            | "failed"
            | "cancelled"
            | "rejected"
            | null;
          changed_by?: string | null;
          change_reason?: string | null;
          created_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          old_status?:
            | "pending"
            | "success"
            | "failed"
            | "cancelled"
            | "rejected"
            | null;
          new_status?:
            | "pending"
            | "success"
            | "failed"
            | "cancelled"
            | "rejected"
            | null;
          changed_by?: string | null;
          change_reason?: string | null;
          created_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_audit_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_audit_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          bio: string | null;
          title: string | null;
          department: string | null;
          company_name: string | null;
          street_address: string | null;
          city: string | null;
          province: string | null;
          postal_code: string | null;
          country: string;
          alternate_email: string | null;
          alternate_phone: string | null;
          facebook_url: string | null;
          twitter_url: string | null;
          linkedin_url: string | null;
          preferred_contact_method: string | null;
          timezone: string;
          phone_verified: boolean;
          phone_verified_at: string | null;
          government_id_number: string | null;
          government_id_type: string | null;
          government_id_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bio?: string | null;
          title?: string | null;
          department?: string | null;
          company_name?: string | null;
          street_address?: string | null;
          city?: string | null;
          province?: string | null;
          postal_code?: string | null;
          country?: string;
          alternate_email?: string | null;
          alternate_phone?: string | null;
          facebook_url?: string | null;
          twitter_url?: string | null;
          linkedin_url?: string | null;
          preferred_contact_method?: string | null;
          timezone?: string;
          phone_verified?: boolean;
          phone_verified_at?: string | null;
          government_id_number?: string | null;
          government_id_type?: string | null;
          government_id_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bio?: string | null;
          title?: string | null;
          department?: string | null;
          company_name?: string | null;
          street_address?: string | null;
          city?: string | null;
          province?: string | null;
          postal_code?: string | null;
          country?: string;
          alternate_email?: string | null;
          alternate_phone?: string | null;
          facebook_url?: string | null;
          twitter_url?: string | null;
          linkedin_url?: string | null;
          preferred_contact_method?: string | null;
          timezone?: string;
          phone_verified?: boolean;
          phone_verified_at?: string | null;
          government_id_number?: string | null;
          government_id_type?: string | null;
          government_id_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_logs: {
        Row: {
          id: string;
          admin_user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          created_at: string;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          admin_user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          created_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          admin_user_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          created_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_user_id_fkey";
            columns: ["admin_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          changes: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          changes?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          changes?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          message: string | null;
          type: string | null;
          related_transaction_id: string | null;
          is_read: boolean;
          read_at: string | null;
          sent_via: string | null;
          sent_at: string | null;
          delivery_status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          message?: string | null;
          type?: string | null;
          related_transaction_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          sent_via?: string | null;
          sent_at?: string | null;
          delivery_status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          message?: string | null;
          type?: string | null;
          related_transaction_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          sent_via?: string | null;
          sent_at?: string | null;
          delivery_status?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_related_transaction_id_fkey";
            columns: ["related_transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          session_token: string | null;
          access_token: string | null;
          refresh_token: string | null;
          ip_address: string | null;
          user_agent: string | null;
          device_name: string | null;
          is_active: boolean;
          last_activity: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_token?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          device_name?: string | null;
          is_active?: boolean;
          last_activity?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_token?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          device_name?: string | null;
          is_active?: boolean;
          last_activity?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          id: string;
          scope: string;
          user_id: string | null;
          setting_key: string;
          setting_value: string | null;
          description: string | null;
          value_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scope: string;
          user_id?: string | null;
          setting_key: string;
          setting_value?: string | null;
          description?: string | null;
          value_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scope?: string;
          user_id?: string | null;
          setting_key?: string;
          setting_value?: string | null;
          description?: string | null;
          value_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      withdrawal_limits: {
        Row: {
          id: string;
          user_id: string;
          daily_limit: number | null;
          monthly_limit: number | null;
          per_transaction_limit: number | null;
          daily_used: number;
          monthly_used: number;
          daily_reset_date: string | null;
          monthly_reset_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          daily_limit?: number | null;
          monthly_limit?: number | null;
          per_transaction_limit?: number | null;
          daily_used?: number;
          monthly_used?: number;
          daily_reset_date?: string | null;
          monthly_reset_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          daily_limit?: number | null;
          monthly_limit?: number | null;
          per_transaction_limit?: number | null;
          daily_used?: number;
          monthly_used?: number;
          daily_reset_date?: string | null;
          monthly_reset_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "withdrawal_limits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      verification_codes: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          code_type: string | null;
          purpose: string | null;
          is_used: boolean;
          used_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code: string;
          code_type?: string | null;
          purpose?: string | null;
          is_used?: boolean;
          used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code?: string;
          code_type?: string | null;
          purpose?: string | null;
          is_used?: boolean;
          used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "verification_codes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      user_summary: {
        Row: {
          id: string | null;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          phone_number: string | null;
          role: "user" | "admin" | "moderator" | null;
          status: "active" | "inactive" | "suspended" | "deleted" | null;
          balance: number | null;
          last_login_at: string | null;
          total_bank_accounts: number | null;
          total_transactions: number | null;
          total_withdrawn: number | null;
          last_transaction_date: string | null;
        };
        Relationships: [];
      };
      monthly_transaction_summary: {
        Row: {
          month: string | null;
          user_id: string | null;
          transaction_count: number | null;
          successful_amount: number | null;
          pending_amount: number | null;
          failed_amount: number | null;
        };
        Relationships: [];
      };
      daily_transaction_summary: {
        Row: {
          day: string | null;
          user_id: string | null;
          transaction_count: number | null;
          successful_amount: number | null;
          avg_transaction_amount: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {};
    Enums: {
      account_type:
        | "savings"
        | "current"
        | "fixed_deposit"
        | "money_market"
        | "other";
      bank_name:
        | "KBANK"
        | "SCB"
        | "BBL"
        | "BAY"
        | "CIMB"
        | "KASIKORN"
        | "TTB"
        | "KTB"
        | "UOB"
        | "HSBC"
        | "CITIBANK"
        | "OTHER";
      transaction_status:
        | "pending"
        | "success"
        | "failed"
        | "cancelled"
        | "rejected";
      user_role: "user" | "admin" | "moderator";
      user_status: "active" | "inactive" | "suspended" | "deleted";
    };
    CompositeTypes: {};
  };
};

// Helper type for common operations
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];
export type BankAccountInsert =
  Database["public"]["Tables"]["bank_accounts"]["Insert"];
export type BankAccountUpdate =
  Database["public"]["Tables"]["bank_accounts"]["Update"];

export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type TransactionInsert =
  Database["public"]["Tables"]["transactions"]["Insert"];
export type TransactionUpdate =
  Database["public"]["Tables"]["transactions"]["Update"];

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type UserProfileInsert =
  Database["public"]["Tables"]["user_profiles"]["Insert"];
export type UserProfileUpdate =
  Database["public"]["Tables"]["user_profiles"]["Update"];

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationInsert =
  Database["public"]["Tables"]["notifications"]["Insert"];
export type NotificationUpdate =
  Database["public"]["Tables"]["notifications"]["Update"];

export type AdminLog = Database["public"]["Tables"]["admin_logs"]["Row"];
export type AdminLogInsert =
  Database["public"]["Tables"]["admin_logs"]["Insert"];

export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type AuditLogInsert =
  Database["public"]["Tables"]["audit_logs"]["Insert"];

export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
export type SessionUpdate = Database["public"]["Tables"]["sessions"]["Update"];

export type Setting = Database["public"]["Tables"]["settings"]["Row"];
export type SettingInsert = Database["public"]["Tables"]["settings"]["Insert"];
export type SettingUpdate = Database["public"]["Tables"]["settings"]["Update"];

// Enums
export type TransactionStatus =
  Database["public"]["Enums"]["transaction_status"];
export type UserRole = Database["public"]["Enums"]["user_role"];
export type UserStatus = Database["public"]["Enums"]["user_status"];
export type AccountType = Database["public"]["Enums"]["account_type"];
export type BankName = Database["public"]["Enums"]["bank_name"];
