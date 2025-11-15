/**
 * WhatsApp Business API Service
 * Handles WhatsApp Cloud API and Twilio WhatsApp integration
 */

import crypto from 'crypto';

// WhatsApp Cloud API types
export interface WhatsAppTextMessage {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'text';
  text: {
    preview_url?: boolean;
    body: string;
  };
}

export interface WhatsAppTemplateMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text?: string;
        image?: { link: string };
        video?: { link: string };
        document?: { link: string; filename?: string };
      }>;
    }>;
  };
}

export interface WhatsAppMediaMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'image' | 'video' | 'document' | 'audio';
  image?: {
    link?: string;
    id?: string;
    caption?: string;
  };
  video?: {
    link?: string;
    id?: string;
    caption?: string;
  };
  document?: {
    link?: string;
    id?: string;
    caption?: string;
    filename?: string;
  };
  audio?: {
    link?: string;
    id?: string;
  };
}

export interface WhatsAppInteractiveMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'button' | 'list';
    header?: {
      type: 'text' | 'image' | 'video' | 'document';
      text?: string;
      image?: { link: string };
      video?: { link: string };
      document?: { link: string };
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: any; // Button or list actions
  };
}

export interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export class WhatsAppService {
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion: string = 'v18.0';
  private baseUrl: string = 'https://graph.facebook.com';

  constructor(phoneNumberId?: string, accessToken?: string) {
    this.phoneNumberId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = accessToken || process.env.WHATSAPP_ACCESS_TOKEN || '';

    if (!this.phoneNumberId || !this.accessToken) {
      console.warn('WhatsApp service initialized without credentials. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.');
    }
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to: string, message: string, previewUrl: boolean = false): Promise<WhatsAppMessageResponse> {
    const payload: WhatsAppTextMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        preview_url: previewUrl,
        body: message
      }
    };

    return this.sendMessage(payload);
  }

  /**
   * Send a template message (pre-approved)
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components?: any[]
  ): Promise<WhatsAppMessageResponse> {
    const payload: WhatsAppTemplateMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components
      }
    };

    return this.sendMessage(payload);
  }

  /**
   * Send an image message
   */
  async sendImageMessage(
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<WhatsAppMessageResponse> {
    const payload: WhatsAppMediaMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption
      }
    };

    return this.sendMessage(payload);
  }

  /**
   * Send a video message
   */
  async sendVideoMessage(
    to: string,
    videoUrl: string,
    caption?: string
  ): Promise<WhatsAppMessageResponse> {
    const payload: WhatsAppMediaMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'video',
      video: {
        link: videoUrl,
        caption
      }
    };

    return this.sendMessage(payload);
  }

  /**
   * Send a document message
   */
  async sendDocumentMessage(
    to: string,
    documentUrl: string,
    filename?: string,
    caption?: string
  ): Promise<WhatsAppMessageResponse> {
    const payload: WhatsAppMediaMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: {
        link: documentUrl,
        filename,
        caption
      }
    };

    return this.sendMessage(payload);
  }

  /**
   * Send an audio message
   */
  async sendAudioMessage(
    to: string,
    audioUrl: string
  ): Promise<WhatsAppMessageResponse> {
    const payload: WhatsAppMediaMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'audio',
      audio: {
        link: audioUrl
      }
    };

    return this.sendMessage(payload);
  }

  /**
   * Send an interactive button message
   */
  async sendButtonMessage(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
    headerText?: string,
    footerText?: string
  ): Promise<WhatsAppMessageResponse> {
    const payload: WhatsAppInteractiveMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText
        },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      }
    };

    if (headerText) {
      payload.interactive.header = {
        type: 'text',
        text: headerText
      };
    }

    if (footerText) {
      payload.interactive.footer = {
        text: footerText
      };
    }

    return this.sendMessage(payload);
  }

  /**
   * Send an interactive list message
   */
  async sendListMessage(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title?: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>,
    headerText?: string,
    footerText?: string
  ): Promise<WhatsAppMessageResponse> {
    const payload: WhatsAppInteractiveMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: {
          text: bodyText
        },
        action: {
          button: buttonText,
          sections
        }
      }
    };

    if (headerText) {
      payload.interactive.header = {
        type: 'text',
        text: headerText
      };
    }

    if (footerText) {
      payload.interactive.footer = {
        text: footerText
      };
    }

    return this.sendMessage(payload);
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId: string): Promise<any> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Core send message method
   */
  private async sendMessage(payload: any): Promise<WhatsAppMessageResponse> {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error('WhatsApp credentials not configured');
    }

    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string, appSecret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');

    return `sha256=${expectedSignature}` === signature;
  }

  /**
   * Get media URL by ID
   */
  async getMediaUrl(mediaId: string): Promise<string> {
    const url = `${this.baseUrl}/${this.apiVersion}/${mediaId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get media URL');
    }

    const data = await response.json();
    return data.url;
  }

  /**
   * Download media
   */
  async downloadMedia(mediaUrl: string): Promise<Buffer> {
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download media');
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Upload media
   */
  async uploadMedia(file: Buffer, mimeType: string): Promise<string> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/media`;

    const formData = new FormData();
    formData.append('file', new Blob([file], { type: mimeType }));
    formData.append('messaging_product', 'whatsapp');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload media');
    }

    const data = await response.json();
    return data.id; // Media ID
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
