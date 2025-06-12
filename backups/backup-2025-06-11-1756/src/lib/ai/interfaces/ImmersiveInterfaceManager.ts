import { ErrorLogger } from '../../utils/ErrorLogger';

class ImmersiveInterfaceManager {
  // Other code

  handleImmersiveInterfaceError(err: any) {
    ErrorLogger.logError(err);
    // Additional error handling logic can be added here
  }

  // Other code
}

export { ImmersiveInterfaceManager };