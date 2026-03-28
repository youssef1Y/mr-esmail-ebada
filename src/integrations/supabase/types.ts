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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      chat_memory: {
        Row: {
          created_at: string
          id: string
          memory: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          memory: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          memory?: string
          user_id?: string
        }
        Relationships: []
      }
      competition_entries: {
        Row: {
          competition_id: string
          correct_answer: string | null
          created_at: string
          entry_date: string
          id: string
          is_correct: boolean
          options: Json | null
          question_text: string
          selected_answer: string | null
          user_id: string
        }
        Insert: {
          competition_id: string
          correct_answer?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          is_correct?: boolean
          options?: Json | null
          question_text: string
          selected_answer?: string | null
          user_id: string
        }
        Update: {
          competition_id?: string
          correct_answer?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          is_correct?: boolean
          options?: Json | null
          question_text?: string
          selected_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_entries_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "weekly_competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_answers: {
        Row: {
          answer: string | null
          attempt_id: string
          id: string
          image_urls: string[] | null
          is_correct: boolean | null
          question_id: string
        }
        Insert: {
          answer?: string | null
          attempt_id: string
          id?: string
          image_urls?: string[] | null
          is_correct?: boolean | null
          question_id: string
        }
        Update: {
          answer?: string | null
          attempt_id?: string
          id?: string
          image_urls?: string[] | null
          is_correct?: boolean | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          ai_feedback: string | null
          exam_id: string
          id: string
          score: number | null
          submitted_at: string
          total: number | null
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          exam_id: string
          id?: string
          score?: number | null
          submitted_at?: string
          total?: number | null
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          exam_id?: string
          id?: string
          score?: number | null
          submitted_at?: string
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          correct_answer: string | null
          exam_id: string
          id: string
          options: Json | null
          question_text: string
          question_type: string
          sort_order: number | null
        }
        Insert: {
          correct_answer?: string | null
          exam_id: string
          id?: string
          options?: Json | null
          question_text: string
          question_type?: string
          sort_order?: number | null
        }
        Update: {
          correct_answer?: string | null
          exam_id?: string
          id?: string
          options?: Json | null
          question_text?: string
          question_type?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          access_type: string
          answer_key_url: string | null
          created_at: string
          grade: string
          id: string
          pdf_url: string | null
          subject: string
          term: number
          title: string
          video_id: string | null
        }
        Insert: {
          access_type?: string
          answer_key_url?: string | null
          created_at?: string
          grade: string
          id?: string
          pdf_url?: string | null
          subject: string
          term?: number
          title: string
          video_id?: string | null
        }
        Update: {
          access_type?: string
          answer_key_url?: string | null
          created_at?: string
          grade?: string
          id?: string
          pdf_url?: string | null
          subject?: string
          term?: number
          title?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          answer_key_url: string | null
          book_name: string | null
          created_at: string
          description: string | null
          due_date: string | null
          grade: string
          homework_type: string
          id: string
          lesson_number: string | null
          page_from: number | null
          page_to: number | null
          pdf_url: string | null
          subject: string
          term: number
          title: string
        }
        Insert: {
          answer_key_url?: string | null
          book_name?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          grade: string
          homework_type?: string
          id?: string
          lesson_number?: string | null
          page_from?: number | null
          page_to?: number | null
          pdf_url?: string | null
          subject: string
          term?: number
          title: string
        }
        Update: {
          answer_key_url?: string | null
          book_name?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          grade?: string
          homework_type?: string
          id?: string
          lesson_number?: string | null
          page_from?: number | null
          page_to?: number | null
          pdf_url?: string | null
          subject?: string
          term?: number
          title?: string
        }
        Relationships: []
      }
      homework_submissions: {
        Row: {
          ai_feedback: string | null
          ai_score: number | null
          content: string | null
          feedback: string | null
          homework_id: string
          id: string
          image_urls: string[] | null
          score: number | null
          submitted_at: string
          total: number | null
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          ai_score?: number | null
          content?: string | null
          feedback?: string | null
          homework_id: string
          id?: string
          image_urls?: string[] | null
          score?: number | null
          submitted_at?: string
          total?: number | null
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          ai_score?: number | null
          content?: string | null
          feedback?: string | null
          homework_id?: string
          id?: string
          image_urls?: string[] | null
          score?: number | null
          submitted_at?: string
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_admin_reply: boolean
          is_read: boolean
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          is_read?: boolean
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          is_read?: boolean
          user_id?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          body: string
          created_at: string
          icon: string
          id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          icon?: string
          id?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          icon?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          target_audience: string
          target_grades: string[] | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          target_audience?: string
          target_grades?: string[] | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          target_audience?: string
          target_grades?: string[] | null
          title?: string
        }
        Relationships: []
      }
      otp_ip_tracking: {
        Row: {
          created_at: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      parent_accounts: {
        Row: {
          created_at: string
          full_name: string
          hash_version: number
          id: string
          password_hash: string
          phone: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          hash_version?: number
          id?: string
          password_hash: string
          phone: string
        }
        Update: {
          created_at?: string
          full_name?: string
          hash_version?: number
          id?: string
          password_hash?: string
          phone?: string
        }
        Relationships: []
      }
      parent_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          parent_phone: string
          student_user_id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          parent_phone: string
          student_user_id: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          parent_phone?: string
          student_user_id?: string
          title?: string
        }
        Relationships: []
      }
      parent_push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          parent_phone: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          parent_phone: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          parent_phone?: string
        }
        Relationships: []
      }
      parent_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          parent_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          parent_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          parent_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_sessions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_otps: {
        Row: {
          attempt_count: number
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          used: boolean
        }
        Insert: {
          attempt_count?: number
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          used?: boolean
        }
        Update: {
          attempt_count?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          used?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          governorate: string | null
          grade: string
          id: string
          is_subscribed: boolean
          madhab: string | null
          parent_phone: string | null
          school: string | null
          student_phone: string
          subscription_expires_at: string | null
          subscription_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          governorate?: string | null
          grade: string
          id?: string
          is_subscribed?: boolean
          madhab?: string | null
          parent_phone?: string | null
          school?: string | null
          student_phone: string
          subscription_expires_at?: string | null
          subscription_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          governorate?: string | null
          grade?: string
          id?: string
          is_subscribed?: boolean
          madhab?: string | null
          parent_phone?: string | null
          school?: string | null
          student_phone?: string
          subscription_expires_at?: string | null
          subscription_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      question_bank: {
        Row: {
          correct_answer: string | null
          created_at: string
          grade: string
          id: string
          lesson: string | null
          options: Json | null
          question_text: string
          question_type: string
          subject: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          grade: string
          id?: string
          lesson?: string | null
          options?: Json | null
          question_text: string
          question_type?: string
          subject: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          grade?: string
          id?: string
          lesson?: string | null
          options?: Json | null
          question_text?: string
          question_type?: string
          subject?: string
        }
        Relationships: []
      }
      question_bank_files: {
        Row: {
          answer_key_url: string | null
          created_at: string
          description: string | null
          grade: string
          id: string
          pdf_url: string | null
          subject: string
          title: string
        }
        Insert: {
          answer_key_url?: string | null
          created_at?: string
          description?: string | null
          grade: string
          id?: string
          pdf_url?: string | null
          subject: string
          title: string
        }
        Update: {
          answer_key_url?: string | null
          created_at?: string
          description?: string | null
          grade?: string
          id?: string
          pdf_url?: string | null
          subject?: string
          title?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_completions: {
        Row: {
          created_at: string
          id: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      schedule_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string
          grade: string
          id: string
          subject: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string
          grade: string
          id?: string
          subject?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          grade?: string
          id?: string
          subject?: string | null
          title?: string
        }
        Relationships: []
      }
      share_rewards: {
        Row: {
          id: string
          key_earned: boolean
          platform: string
          points_earned: number
          share_date: string
          shared_at: string
          user_id: string
        }
        Insert: {
          id?: string
          key_earned?: boolean
          platform?: string
          points_earned?: number
          share_date?: string
          shared_at?: string
          user_id: string
        }
        Update: {
          id?: string
          key_earned?: boolean
          platform?: string
          points_earned?: number
          share_date?: string
          shared_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_keys: {
        Row: {
          created_at: string
          first_key_given: boolean
          id: string
          keys_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          first_key_given?: boolean
          id?: string
          keys_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          first_key_given?: boolean
          id?: string
          keys_count?: number
          user_id?: string
        }
        Relationships: []
      }
      student_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      student_points: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          reason: string
          source_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          receipt_url: string | null
          sender_phone: string
          status: string
          transfer_number: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          receipt_url?: string | null
          sender_phone: string
          status?: string
          transfer_number: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          receipt_url?: string | null
          sender_phone?: string
          status?: string
          transfer_number?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_reply: boolean | null
          parent_id: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_reply?: boolean | null
          parent_id?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_reply?: boolean | null
          parent_id?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "video_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_homework: {
        Row: {
          created_at: string
          description: string | null
          id: string
          questions: Json | null
          video_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          questions?: Json | null
          video_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          questions?: Json | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_homework_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: true
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_homework_submissions: {
        Row: {
          answers: Json | null
          homework_id: string
          id: string
          image_urls: string[] | null
          score: number | null
          submitted_at: string
          total: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          homework_id: string
          id?: string
          image_urls?: string[] | null
          score?: number | null
          submitted_at?: string
          total?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          homework_id?: string
          id?: string
          image_urls?: string[] | null
          score?: number | null
          submitted_at?: string
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "video_homework"
            referencedColumns: ["id"]
          },
        ]
      }
      video_summaries: {
        Row: {
          created_at: string
          id: string
          summary: string
          updated_at: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          summary: string
          updated_at?: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          summary?: string
          updated_at?: string
          video_id?: string
        }
        Relationships: []
      }
      video_views: {
        Row: {
          id: string
          user_id: string
          video_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          access_type: string
          created_at: string
          description: string | null
          grade: string
          id: string
          madhab: string | null
          publish_at: string | null
          sort_order: number | null
          subject: string
          term: number
          title: string
          video_url: string
        }
        Insert: {
          access_type?: string
          created_at?: string
          description?: string | null
          grade: string
          id?: string
          madhab?: string | null
          publish_at?: string | null
          sort_order?: number | null
          subject: string
          term?: number
          title: string
          video_url: string
        }
        Update: {
          access_type?: string
          created_at?: string
          description?: string | null
          grade?: string
          id?: string
          madhab?: string | null
          publish_at?: string | null
          sort_order?: number | null
          subject?: string
          term?: number
          title?: string
          video_url?: string
        }
        Relationships: []
      }
      weekly_competitions: {
        Row: {
          created_at: string
          draw_date: string | null
          draw_time: string | null
          draw_type: string
          id: string
          prize_description: string | null
          status: string
          title: string
          week_end: string
          week_start: string
          winner_id: string | null
          winner_name: string | null
        }
        Insert: {
          created_at?: string
          draw_date?: string | null
          draw_time?: string | null
          draw_type?: string
          id?: string
          prize_description?: string | null
          status?: string
          title: string
          week_end: string
          week_start: string
          winner_id?: string | null
          winner_name?: string | null
        }
        Update: {
          created_at?: string
          draw_date?: string | null
          draw_time?: string | null
          draw_type?: string
          id?: string
          prize_description?: string | null
          status?: string
          title?: string
          week_end?: string
          week_start?: string
          winner_id?: string | null
          winner_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_share_reward: {
        Args: { p_platform: string; p_user_id: string }
        Returns: Json
      }
      complete_referral: {
        Args: { p_new_user_id: string; p_referral_code: string }
        Returns: undefined
      }
      expire_subscriptions: { Args: never; Returns: undefined }
      get_competition_exam_questions: {
        Args: { p_grade: string; p_subject: string }
        Returns: {
          correct_answer: string
          options: Json
          question_text: string
        }[]
      }
      get_competition_question: {
        Args: { p_grade: string; p_subject: string }
        Returns: {
          correct_answer: string
          options: Json
          question_text: string
        }[]
      }
      get_exam_questions: {
        Args: { p_exam_id: string }
        Returns: {
          id: string
          options: Json
          question_text: string
          question_type: string
          sort_order: number
        }[]
      }
      get_or_create_referral_code: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_practice_questions: {
        Args: { p_grade: string; p_subject: string }
        Returns: {
          correct_answer: string
          grade: string
          id: string
          lesson: string
          options: Json
          question_text: string
          question_type: string
          subject: string
        }[]
      }
      get_student_rank: {
        Args: { p_user_id: string }
        Returns: {
          rank: number
          total_points: number
          total_students: number
        }[]
      }
      get_today_competition_entry: {
        Args: { p_competition_id: string; p_user_id: string }
        Returns: number
      }
      get_video_homework_for_student: {
        Args: { p_video_id: string }
        Returns: Json
      }
      give_first_key: { Args: { p_user_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_video_homework: {
        Args: {
          p_answers: Json
          p_homework_id: string
          p_image_urls: string[]
          p_user_id: string
        }
        Returns: Json
      }
      use_key: { Args: { p_user_id: string }; Returns: boolean }
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
