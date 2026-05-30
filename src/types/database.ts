export type ProjectStatus = 'offen' | 'ausstehend' | 'escrow' | 'abgeliefert' | 'abgeschlossen'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          avatar_url: string | null
          created_at: string
        }
        Insert: { id: string; name?: string; email?: string; avatar_url?: string | null }
        Update: { name?: string; email?: string; avatar_url?: string | null }
      }
      projects: {
        Row: {
          id: string
          designer_id: string
          name: string
          amount: number | null
          delivery_date: string | null
          description: string | null
          code: string
          status: ProjectStatus
          file_url: string | null
          file_name: string | null
          client_name: string | null
          client_email: string | null
          client_phone: string | null
          client_company: string | null
          client_website: string | null
          created_at: string
          delivered_at: string | null
          client_user_id: string | null
          archived: boolean
          pitch_password: string | null
          pitch_password_changed: boolean
          delivery_note: string | null
          approved_at: string | null
          revision_round: number
        }
        Insert: {
          designer_id: string
          name: string
          code: string
          amount?: number | null
          delivery_date?: string | null
          description?: string | null
          status?: ProjectStatus
          file_url?: string | null
          file_name?: string | null
          client_name?: string | null
          client_email?: string | null
          client_phone?: string | null
          client_company?: string | null
          client_website?: string | null
        }
        Update: {
          name?: string
          amount?: number | null
          delivery_date?: string | null
          description?: string | null
          status?: ProjectStatus
          file_url?: string | null
          file_name?: string | null
          client_name?: string | null
          client_email?: string | null
          client_phone?: string | null
          client_company?: string | null
          client_website?: string | null
        }
      }
      project_pins: {
        Row: {
          id: string
          project_id: string
          x_pct: number
          y_pct: number
          comment: string
          author: string
          resolved: boolean
          created_at: string
        }
        Insert: {
          project_id: string
          x_pct: number
          y_pct: number
          comment: string
          author?: string
          resolved?: boolean
        }
        Update: { resolved?: boolean }
      }
      project_signatures: {
        Row: {
          id: string
          project_id: string
          signature_url: string
          client_name: string
          signed_at: string
        }
        Insert: {
          project_id: string
          signature_url: string
          client_name: string
        }
        Update: Record<string, never>
      }
      waitlist: {
        Row: { id: string; email: string; name: string; locale: string; created_at: string }
        Insert: { email: string; name: string; locale: string }
        Update: Record<string, never>
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          notify_comments: boolean
          notify_payments: boolean
          notify_weekly: boolean
          updated_at: string
        }
        Insert: {
          user_id: string
          notify_comments?: boolean
          notify_payments?: boolean
          notify_weekly?: boolean
        }
        Update: {
          notify_comments?: boolean
          notify_payments?: boolean
          notify_weekly?: boolean
        }
      }
      support_messages: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email: string
          subject: string
          message: string
          created_at: string
        }
        Insert: {
          user_id?: string | null
          name: string
          email: string
          subject: string
          message: string
        }
        Update: Record<string, never>
      }
      project_annotations: {
        Row: {
          id: string
          project_id: string
          author_id: string | null
          kind: 'pin' | 'box' | 'draw' | 'callout'
          visibility: 'private' | 'shared'
          x_pct: number
          y_pct: number
          w_pct: number | null
          h_pct: number | null
          path: { x: number; y: number }[] | null
          color: string
          text: string | null
          resolved: boolean
          created_at: string
        }
        Insert: {
          project_id: string
          author_id?: string | null
          kind?: 'pin' | 'box' | 'draw' | 'callout'
          visibility?: 'private' | 'shared'
          x_pct?: number
          y_pct?: number
          w_pct?: number | null
          h_pct?: number | null
          path?: { x: number; y: number }[] | null
          color?: string
          text?: string | null
          resolved?: boolean
        }
        Update: {
          visibility?: 'private' | 'shared'
          color?: string
          text?: string | null
          resolved?: boolean
          x_pct?: number
          y_pct?: number
          w_pct?: number | null
          h_pct?: number | null
        }
      }
      project_tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          done: boolean
          position: number
          created_at: string
        }
        Insert: {
          project_id: string
          title: string
          done?: boolean
          position?: number
        }
        Update: { title?: string; done?: boolean; position?: number }
      }
      project_versions: {
        Row: {
          id: string
          project_id: string
          version_number: number
          file_url: string
          file_name: string
          note: string | null
          created_at: string
        }
        Insert: {
          project_id: string
          version_number?: number
          file_url: string
          file_name: string
          note?: string | null
        }
        Update: Record<string, never>
      }
      project_revisions: {
        Row: {
          id: string
          project_id: string
          round_number: number
          note: string
          requested_by: string | null
          status: 'open' | 'resolved'
          created_at: string
        }
        Insert: {
          project_id: string
          round_number?: number
          note: string
          requested_by?: string | null
          status?: 'open' | 'resolved'
        }
        Update: { status?: 'open' | 'resolved' }
      }
    }
  }
}
