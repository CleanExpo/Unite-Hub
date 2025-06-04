export abstract class RuntimeService {
  protected constructor() {}

  static async getInstance<T extends RuntimeService>(this: new() => T): Promise<T> {
    if (typeof window === 'undefined') {
      return new this();
    }
    throw new Error('Runtime services can only be instantiated on the server side');
  }

  abstract execute(): Promise<unknown>;
}
