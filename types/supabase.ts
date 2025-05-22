export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          profile_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          profile_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          profile_id?: string
          role?: string
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          priority: string
          due_date: string | null
          project_id: string
          assigned_to: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          project_id: string
          assigned_to?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          project_id?: string
          assigned_to?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          content: string
          task_id: string
          profile_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          task_id: string
          profile_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          task_id?: string
          profile_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      task_attachments: {
        Row: {
          id: string
          name: string
          file_url: string
          file_type: string | null
          file_size: number | null
          task_id: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          file_url: string
          file_type?: string | null
          file_size?: number | null
          task_id: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          file_url?: string
          file_type?: string | null
          file_size?: number | null
          task_id?: string
          uploaded_by?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      exec_sql: {
        Args: {
          sql: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
