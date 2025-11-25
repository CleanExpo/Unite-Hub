/**
 * Agent Command Builder
 *
 * Builds structured commands for desktop agent execution.
 * Type-safe command construction with validation.
 */

export interface ClickCommand {
  type: 'click';
  x: number;
  y: number;
  button?: 'left' | 'right' | 'middle';
}

export interface DoubleClickCommand {
  type: 'doubleClick';
  x: number;
  y: number;
}

export interface TypeTextCommand {
  type: 'typeText';
  text: string;
  delay?: number; // ms between characters
}

export interface PressKeyCommand {
  type: 'pressKey';
  key: string;
  modifier?: 'ctrl' | 'shift' | 'alt' | 'meta';
  repeat?: number;
}

export interface MoveMouseCommand {
  type: 'moveMouse';
  x: number;
  y: number;
  duration?: number; // animation duration in ms
}

export interface ScrollCommand {
  type: 'scroll';
  direction: 'up' | 'down' | 'left' | 'right';
  amount: number;
  element?: string; // CSS selector for specific element
}

export interface OpenAppCommand {
  type: 'openApp';
  appName: string;
  args?: string[];
  wait?: boolean; // wait for app to open
}

export interface FocusWindowCommand {
  type: 'focusWindow';
  windowName: string;
}

export interface CloseAppCommand {
  type: 'closeApp';
  appName: string;
  force?: boolean;
}

export interface NavigateUrlCommand {
  type: 'navigateUrl';
  url: string;
  browser?: string; // browser name (chrome, firefox, etc)
}

export interface GetScreenshotCommand {
  type: 'getScreenshot';
  format?: 'png' | 'jpg';
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface GetClipboardCommand {
  type: 'getClipboard';
}

export interface SetClipboardCommand {
  type: 'setClipboard';
  text: string;
}

export type AgentCommand =
  | ClickCommand
  | DoubleClickCommand
  | TypeTextCommand
  | PressKeyCommand
  | MoveMouseCommand
  | ScrollCommand
  | OpenAppCommand
  | FocusWindowCommand
  | CloseAppCommand
  | NavigateUrlCommand
  | GetScreenshotCommand
  | GetClipboardCommand
  | SetClipboardCommand;

/**
 * Command builder for type-safe command construction
 */
export class AgentCommandBuilder {
  static click(x: number, y: number, button: 'left' | 'right' | 'middle' = 'left'): ClickCommand {
    return { type: 'click', x, y, button };
  }

  static doubleClick(x: number, y: number): DoubleClickCommand {
    return { type: 'doubleClick', x, y };
  }

  static typeText(text: string, delay?: number): TypeTextCommand {
    return { type: 'typeText', text, delay };
  }

  static pressKey(
    key: string,
    modifier?: 'ctrl' | 'shift' | 'alt' | 'meta',
    repeat?: number
  ): PressKeyCommand {
    return { type: 'pressKey', key, modifier, repeat };
  }

  static moveMouse(x: number, y: number, duration?: number): MoveMouseCommand {
    return { type: 'moveMouse', x, y, duration };
  }

  static scroll(
    direction: 'up' | 'down' | 'left' | 'right',
    amount: number,
    element?: string
  ): ScrollCommand {
    return { type: 'scroll', direction, amount, element };
  }

  static openApp(appName: string, args?: string[], wait?: boolean): OpenAppCommand {
    return { type: 'openApp', appName, args, wait };
  }

  static focusWindow(windowName: string): FocusWindowCommand {
    return { type: 'focusWindow', windowName };
  }

  static closeApp(appName: string, force?: boolean): CloseAppCommand {
    return { type: 'closeApp', appName, force };
  }

  static navigateUrl(url: string, browser?: string): NavigateUrlCommand {
    return { type: 'navigateUrl', url, browser };
  }

  static getScreenshot(
    format?: 'png' | 'jpg',
    region?: { x: number; y: number; width: number; height: number }
  ): GetScreenshotCommand {
    return { type: 'getScreenshot', format, region };
  }

  static getClipboard(): GetClipboardCommand {
    return { type: 'getClipboard' };
  }

  static setClipboard(text: string): SetClipboardCommand {
    return { type: 'setClipboard', text };
  }
}

/**
 * Convert command object to parameters for API
 */
export function commandToParameters(command: AgentCommand): Record<string, any> {
  const { type, ...params } = command;
  return params;
}

/**
 * Build command from command name and parameters
 */
export function buildCommand(
  commandName: string,
  parameters: Record<string, any>
): AgentCommand | null {
  switch (commandName) {
    case 'click':
      return AgentCommandBuilder.click(parameters.x, parameters.y, parameters.button);

    case 'doubleClick':
      return AgentCommandBuilder.doubleClick(parameters.x, parameters.y);

    case 'typeText':
      return AgentCommandBuilder.typeText(parameters.text, parameters.delay);

    case 'pressKey':
      return AgentCommandBuilder.pressKey(parameters.key, parameters.modifier, parameters.repeat);

    case 'moveMouse':
      return AgentCommandBuilder.moveMouse(parameters.x, parameters.y, parameters.duration);

    case 'scroll':
      return AgentCommandBuilder.scroll(parameters.direction, parameters.amount, parameters.element);

    case 'openApp':
      return AgentCommandBuilder.openApp(parameters.appName, parameters.args, parameters.wait);

    case 'focusWindow':
      return AgentCommandBuilder.focusWindow(parameters.windowName);

    case 'closeApp':
      return AgentCommandBuilder.closeApp(parameters.appName, parameters.force);

    case 'navigateUrl':
      return AgentCommandBuilder.navigateUrl(parameters.url, parameters.browser);

    case 'getScreenshot':
      return AgentCommandBuilder.getScreenshot(parameters.format, parameters.region);

    case 'getClipboard':
      return AgentCommandBuilder.getClipboard();

    case 'setClipboard':
      return AgentCommandBuilder.setClipboard(parameters.text);

    default:
      return null;
  }
}

/**
 * Get command description for UI
 */
export function getCommandDescription(commandName: string): string {
  const descriptions: Record<string, string> = {
    click: 'Click at coordinates',
    doubleClick: 'Double-click at coordinates',
    typeText: 'Type text into focused input',
    pressKey: 'Press keyboard key',
    moveMouse: 'Move mouse to coordinates',
    scroll: 'Scroll in direction',
    openApp: 'Open an application',
    focusWindow: 'Focus a window',
    closeApp: 'Close an application',
    navigateUrl: 'Navigate browser to URL',
    getScreenshot: 'Take screenshot',
    getClipboard: 'Get clipboard contents',
    setClipboard: 'Set clipboard contents',
  };

  return descriptions[commandName] || 'Execute command';
}
