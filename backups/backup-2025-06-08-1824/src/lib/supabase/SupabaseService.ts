import { RuntimeService } from '../base/RuntimeService';
import { createClient } from '@supabase/supabase-js';
import { create } from '@supabase/storage-js';

export class SupabaseService extends RuntimeService {
  private supabaseClient: any;
  private supabaseStorage: any;

  constructor() {
    super();
  }

  private async initialize(): Promise<void> {
    if (!this.supabaseClient && typeof window === 'undefined') {
      const SUPABASE_URL = process.env.SUPABASE_URL;
      const SUPABASE_KEY = process.env.SUPABASE_KEY;

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.warn('Supabase credentials not configured');
        return;
      }

      this.supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
      this.supabaseStorage = create(SUPABASE_URL, SUPABASE_KEY);
    }
  }

  async connect(): Promise<void> {
    await this.initialize();
    if (this.supabaseClient) {
      try {
        await this.supabaseClient.auth.getUser();
      } catch (error) {
        console.warn('Supabase connection error:', error);
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.supabaseClient) {
      // Close any ongoing connections
    }
  }

  async get(key: string): Promise<any> {
    await this.initialize();
    if (!this.supabaseClient) {
      console.warn('Supabase client not available');
      return null;
    }
    try {
      return await this.supabaseClient.from('data').select('*').eq('key', key).single();
    } catch (error) {
      console.warn('Supabase get error:', error);
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    await this.initialize();
    if (!this.supabaseClient) {
      console.warn('Supabase client not available');
      return;
    }
    try {
      const { data, error } = await this.supabaseClient.from('data').upsert({ key, value });
      if (error) {
        console.warn('Supabase upsert error:', error);
      }
    } catch (error) {
      console.warn('Supabase set error:', error);
    }
  }

  async execute(): Promise<unknown> {
    return 'Supabase service executed successfully';
  }

  static async getInstance(): Promise<SupabaseService> {
    if (typeof window === 'undefined') {
      return new SupabaseService();
    }
    throw new Error('Supabase service can only be instantiated on the server side');
  }
}
