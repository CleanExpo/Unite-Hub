import type { ChatCompletionMessageParam } from "@azure/openai";
import { OpenAIClient } from "@azure/openai";
import type { AzureOpenAI } from "@azure/openai";
import { AzureOpenAI } from "@azure/openai";

export type CompletionMessage = ChatCompletionMessageParam;

export type Message = {
    role: string;
    content: string | null;
};

const logPrefix = "[NeuralInterfaceAdapter]";

export class NeuralInterfaceAdapter {

    private openAIClient: AzureOpenAI;
    private model: string;

    constructor(config: { endpoint?: string, apikey: string, model: string }) {

        if (!config.apikey) {
            throw new Error(`${logPrefix} config must have apikey`);
        }

        this.openAIClient = new OpenAIClient({
            endpoint: config.endpoint,
            apiKey: config.apikey,
            dangerouslyAllowAnyServerInfo: true
        });

        this.model = config.model;
    }

    public async getResponse(messages: Message[]): Promise<ChatCompletionMessageParam> {
        try {
            const response = await this.openAIClient.getChatMessageCompletions(
                process.env.NEURAL_INTERFACE_PROXY_PATH || "",
                {
                    model: this.model,
                    messages: messages.map(m => ({
                        role: m.role,
                        content: Array.isArray(m.content) ? m.content.join("\n") : `${m.content}`
                    }))
                }
            );

            return response;
        } catch (error) {
            console.error(`${logPrefix} error:`, error);
            throw error;
        }
    }
}