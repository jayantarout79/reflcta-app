import OpenAI from "openai";

let client: OpenAI | null = null;

export const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
};
