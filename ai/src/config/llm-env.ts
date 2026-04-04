/**
 * OpenAI-compatible chat LLM from env. Pick a profile for base URL + model; override with LLM_BASE_URL / LLM_MODEL if needed.
 */
import { ChatOpenAI } from "@langchain/openai";

const PROFILES = {
  openai: { baseURL: undefined as string | undefined, model: "gpt-4o-mini" },
  deepseek: { baseURL: "https://api.deepseek.com", model: "deepseek-chat" },
  groq: { baseURL: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
} as const;

type Profile = keyof typeof PROFILES;

function activeProfile(): Profile {
  const raw = (process.env.LLM_PROFILE ?? "openai").trim().toLowerCase();
  return raw in PROFILES ? (raw as Profile) : "openai";
}

export function createOpenAiCompatibleChatLlm(): ChatOpenAI {
  const preset = PROFILES[activeProfile()];
  const baseURL = process.env.LLM_BASE_URL?.trim() || preset.baseURL;
  const model = process.env.LLM_MODEL?.trim() || preset.model;
  const apiKey =
    process.env.LLM_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();

  return new ChatOpenAI({
    model,
    temperature: 0,
    apiKey,
    ...(baseURL ? { configuration: { baseURL } } : {}),
  });
}
