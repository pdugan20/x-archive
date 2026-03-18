export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4';
  };
  public: {
    Tables: {
      deletion_log: {
        Row: {
          api_error: string | null;
          api_response_code: number | null;
          deleted_at: string;
          deletion_reason: string;
          dry_run: boolean;
          id: string;
          tweet_created_at: string;
          tweet_id: string;
          tweet_text: string;
          tweet_type: string;
          was_retweet: boolean;
        };
        Insert: {
          api_error?: string | null;
          api_response_code?: number | null;
          deleted_at?: string;
          deletion_reason: string;
          dry_run?: boolean;
          id?: string;
          tweet_created_at: string;
          tweet_id: string;
          tweet_text: string;
          tweet_type: string;
          was_retweet?: boolean;
        };
        Update: {
          api_error?: string | null;
          api_response_code?: number | null;
          deleted_at?: string;
          deletion_reason?: string;
          dry_run?: boolean;
          id?: string;
          tweet_created_at?: string;
          tweet_id?: string;
          tweet_text?: string;
          tweet_type?: string;
          was_retweet?: boolean;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          auto_delete_enabled: boolean;
          dry_run_mode: boolean;
          id: number;
          last_deletion_run_at: string | null;
          last_sync_at: string | null;
          protected_keywords: string[] | null;
          retention_days: number;
          updated_at: string;
          viral_threshold: number;
          x_user_id: string | null;
          x_username: string | null;
        };
        Insert: {
          auto_delete_enabled?: boolean;
          dry_run_mode?: boolean;
          id?: number;
          last_deletion_run_at?: string | null;
          last_sync_at?: string | null;
          protected_keywords?: string[] | null;
          retention_days?: number;
          updated_at?: string;
          viral_threshold?: number;
          x_user_id?: string | null;
          x_username?: string | null;
        };
        Update: {
          auto_delete_enabled?: boolean;
          dry_run_mode?: boolean;
          id?: number;
          last_deletion_run_at?: string | null;
          last_sync_at?: string | null;
          protected_keywords?: string[] | null;
          retention_days?: number;
          updated_at?: string;
          viral_threshold?: number;
          x_user_id?: string | null;
          x_username?: string | null;
        };
        Relationships: [];
      };
      tweet_entities: {
        Row: {
          display_url: string | null;
          end_index: number | null;
          entity_type: string;
          expanded_url: string | null;
          id: string;
          start_index: number | null;
          title: string | null;
          tweet_id: string;
          value: string;
        };
        Insert: {
          display_url?: string | null;
          end_index?: number | null;
          entity_type: string;
          expanded_url?: string | null;
          id?: string;
          start_index?: number | null;
          title?: string | null;
          tweet_id: string;
          value: string;
        };
        Update: {
          display_url?: string | null;
          end_index?: number | null;
          entity_type?: string;
          expanded_url?: string | null;
          id?: string;
          start_index?: number | null;
          title?: string | null;
          tweet_id?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tweet_entities_tweet_id_fkey';
            columns: ['tweet_id'];
            isOneToOne: false;
            referencedRelation: 'tweets';
            referencedColumns: ['id'];
          },
        ];
      };
      tweet_media: {
        Row: {
          alt_text: string | null;
          duration_ms: number | null;
          file_size_bytes: number | null;
          height: number | null;
          id: string;
          media_type: string;
          original_url: string;
          storage_path: string | null;
          thumbnail_storage_path: string | null;
          tweet_id: string;
          video_url: string | null;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          duration_ms?: number | null;
          file_size_bytes?: number | null;
          height?: number | null;
          id: string;
          media_type: string;
          original_url: string;
          storage_path?: string | null;
          thumbnail_storage_path?: string | null;
          tweet_id: string;
          video_url?: string | null;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          duration_ms?: number | null;
          file_size_bytes?: number | null;
          height?: number | null;
          id?: string;
          media_type?: string;
          original_url?: string;
          storage_path?: string | null;
          thumbnail_storage_path?: string | null;
          tweet_id?: string;
          video_url?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tweet_media_tweet_id_fkey';
            columns: ['tweet_id'];
            isOneToOne: false;
            referencedRelation: 'tweets';
            referencedColumns: ['id'];
          },
        ];
      };
      tweets: {
        Row: {
          archived_at: string;
          bookmark_count: number;
          conversation_id: string | null;
          created_at: string;
          deleted_at: string | null;
          favorite_count: number;
          fts: unknown;
          full_text: string;
          id: string;
          import_source: string;
          in_reply_to_screen_name: string | null;
          in_reply_to_tweet_id: string | null;
          in_reply_to_user_id: string | null;
          is_deleted: boolean;
          is_protected: boolean;
          lang: string | null;
          quote_count: number;
          quoted_tweet_author: string | null;
          quoted_tweet_id: string | null;
          quoted_tweet_text: string | null;
          raw_json: Json | null;
          reply_count: number;
          retweet_count: number;
          retweeted_tweet_id: string | null;
          source: string | null;
          thread_position: number | null;
          tweet_type: string;
          view_count: number | null;
        };
        Insert: {
          archived_at?: string;
          bookmark_count?: number;
          conversation_id?: string | null;
          created_at: string;
          deleted_at?: string | null;
          favorite_count?: number;
          fts?: unknown;
          full_text: string;
          id: string;
          import_source?: string;
          in_reply_to_screen_name?: string | null;
          in_reply_to_tweet_id?: string | null;
          in_reply_to_user_id?: string | null;
          is_deleted?: boolean;
          is_protected?: boolean;
          lang?: string | null;
          quote_count?: number;
          quoted_tweet_author?: string | null;
          quoted_tweet_id?: string | null;
          quoted_tweet_text?: string | null;
          raw_json?: Json | null;
          reply_count?: number;
          retweet_count?: number;
          retweeted_tweet_id?: string | null;
          source?: string | null;
          thread_position?: number | null;
          tweet_type?: string;
          view_count?: number | null;
        };
        Update: {
          archived_at?: string;
          bookmark_count?: number;
          conversation_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          favorite_count?: number;
          fts?: unknown;
          full_text?: string;
          id?: string;
          import_source?: string;
          in_reply_to_screen_name?: string | null;
          in_reply_to_tweet_id?: string | null;
          in_reply_to_user_id?: string | null;
          is_deleted?: boolean;
          is_protected?: boolean;
          lang?: string | null;
          quote_count?: number;
          quoted_tweet_author?: string | null;
          quoted_tweet_id?: string | null;
          quoted_tweet_text?: string | null;
          raw_json?: Json | null;
          reply_count?: number;
          retweet_count?: number;
          retweeted_tweet_id?: string | null;
          source?: string | null;
          thread_position?: number | null;
          tweet_type?: string;
          view_count?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
