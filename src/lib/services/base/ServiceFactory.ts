export abstract class ServiceFactory {
  abstract createService(): Promise<unknown>;

  static getServices(): { [key: string]: any } {
    return {
      redis: RedisService,
      supabase: SupabaseService
    };
  }
}
