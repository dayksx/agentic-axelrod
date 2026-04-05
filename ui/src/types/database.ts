export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: number;
          name: string;
          strategy_prompt: string;
          url: string;
          wallet_address: string | null;
          ens_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          strategy_prompt: string;
          url: string;
          wallet_address?: string | null;
          ens_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          strategy_prompt?: string;
          url?: string;
          wallet_address?: string | null;
          ens_name?: string | null;
          created_at?: string;
        };
      };
      tournaments: {
        Row: {
          id: number;
          status: "pending" | "running" | "completed";
          total_rounds: number;
          total_agents: number;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: number;
          status?: "pending" | "running" | "completed";
          total_rounds: number;
          total_agents: number;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: number;
          status?: "pending" | "running" | "completed";
          total_rounds?: number;
          total_agents?: number;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      tournament_agents: {
        Row: {
          id: number;
          tournament_id: number;
          agent_id: number;
          url: string;
        };
        Insert: {
          id?: number;
          tournament_id: number;
          agent_id: number;
          url: string;
        };
        Update: {
          id?: number;
          tournament_id?: number;
          agent_id?: number;
          url?: string;
        };
      };
      matches: {
        Row: {
          id: number;
          tournament_id: number;
          round_number: number;
          arena_id: number;
          agent_a: string;
          agent_b: string;
          first_speaker: string;
          decision_a: "C" | "D" | null;
          decision_b: "C" | "D" | null;
          delta_a: number | null;
          delta_b: number | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          tournament_id: number;
          round_number: number;
          arena_id: number;
          agent_a: string;
          agent_b: string;
          first_speaker: string;
          decision_a?: "C" | "D" | null;
          decision_b?: "C" | "D" | null;
          delta_a?: number | null;
          delta_b?: number | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          tournament_id?: number;
          round_number?: number;
          arena_id?: number;
          agent_a?: string;
          agent_b?: string;
          first_speaker?: string;
          decision_a?: "C" | "D" | null;
          decision_b?: "C" | "D" | null;
          delta_a?: number | null;
          delta_b?: number | null;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: number;
          match_id: number;
          turn_number: number;
          speaker: string;
          content: string;
        };
        Insert: {
          id?: number;
          match_id: number;
          turn_number: number;
          speaker: string;
          content: string;
        };
        Update: {
          id?: number;
          match_id?: number;
          turn_number?: number;
          speaker?: string;
          content?: string;
        };
      };
      graffiti_entries: {
        Row: {
          id: number;
          tournament_id: number;
          match_id: number;
          arena_id: number;
          author: string;
          round_number: number;
          message: string;
        };
        Insert: {
          id?: number;
          tournament_id: number;
          match_id: number;
          arena_id: number;
          author: string;
          round_number: number;
          message: string;
        };
        Update: {
          id?: number;
          tournament_id?: number;
          match_id?: number;
          arena_id?: number;
          author?: string;
          round_number?: number;
          message?: string;
        };
      };
      gossip_entries: {
        Row: {
          id: number;
          tournament_id: number;
          match_id: number;
          sender: string;
          recipient: string;
          message: string;
          round_number: number;
        };
        Insert: {
          id?: number;
          tournament_id: number;
          match_id: number;
          sender: string;
          recipient: string;
          message: string;
          round_number: number;
        };
        Update: {
          id?: number;
          tournament_id?: number;
          match_id?: number;
          sender?: string;
          recipient?: string;
          message?: string;
          round_number?: number;
        };
      };
      announcements: {
        Row: {
          id: number;
          tournament_id: number;
          round_number: number;
          agent_id: number;
          message: string;
        };
        Insert: {
          id?: number;
          tournament_id: number;
          round_number: number;
          agent_id: number;
          message: string;
        };
        Update: {
          id?: number;
          tournament_id?: number;
          round_number?: number;
          agent_id?: number;
          message?: string;
        };
      };
      memory_entries: {
        Row: {
          id: number;
          tournament_id: number;
          match_id: number;
          agent_name: string;
          round_number: number;
          content: string;
        };
        Insert: {
          id?: number;
          tournament_id: number;
          match_id: number;
          agent_name: string;
          round_number: number;
          content: string;
        };
        Update: {
          id?: number;
          tournament_id?: number;
          match_id?: number;
          agent_name?: string;
          round_number?: number;
          content?: string;
        };
      };
      scores: {
        Row: {
          id: number;
          tournament_id: number;
          agent_name: string;
          round_number: number;
          delta: number;
          cumulative: number;
        };
        Insert: {
          id?: number;
          tournament_id: number;
          agent_name: string;
          round_number: number;
          delta: number;
          cumulative: number;
        };
        Update: {
          id?: number;
          tournament_id?: number;
          agent_name?: string;
          round_number?: number;
          delta?: number;
          cumulative?: number;
        };
      };
      users: {
        Row: {
          id: number;
          agent_name: string;
          strategy_prompt: string;
          human_wallet: string;
          agent_wallet: string;
          tx_hash: string;
          reserved_date: string | null;
          tournament_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          agent_name: string;
          strategy_prompt: string;
          human_wallet: string;
          agent_wallet: string;
          tx_hash: string;
          reserved_date?: string | null;
          tournament_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          agent_name?: string;
          strategy_prompt?: string;
          human_wallet?: string;
          agent_wallet?: string;
          tx_hash?: string;
          reserved_date?: string | null;
          tournament_date?: string | null;
          created_at?: string;
        };
      };
      tournament_transactions: {
        Row: {
          id: number;
          tournament_id: number;
          agent_id: number;
          type: "entry_fee" | "collection" | "prize";
          tx_hash: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          tournament_id: number;
          agent_id: number;
          type: "entry_fee" | "collection" | "prize";
          tx_hash: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          tournament_id?: number;
          agent_id?: number;
          type?: "entry_fee" | "collection" | "prize";
          tx_hash?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
