import { AzureOpenAI } from "openai";

export const TIPOS = [
  "blazer",
  "vestido",
  "vestido camisero",
  "vestido cruzado",
  "pantalon",
  "pantalon cargo",
  "pantalon palazzo",
  "jean",
  "jogger",
  "camisa",
  "top",
  "falda",
  "sweater",
  "cardigan",
  "abrigo",
  "zapatos",
] as const;

export function createClient(): AzureOpenAI {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

  if (!apiKey || !endpoint || !apiVersion || !deployment) {
    throw new Error(
      "Faltan variables de entorno de Azure OpenAI. Revisá tu .env.local."
    );
  }

  return new AzureOpenAI({ apiKey, endpoint, apiVersion, deployment });
}
