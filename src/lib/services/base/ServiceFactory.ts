export abstract class ServiceFactory {
  abstract createService(): Promise<unknown>;
}
