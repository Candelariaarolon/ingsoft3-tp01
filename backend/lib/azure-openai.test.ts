import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "./azure-openai";

const VARIABLES = [
  "AZURE_OPENAI_API_KEY",
  "AZURE_OPENAI_ENDPOINT",
  "AZURE_OPENAI_API_VERSION",
  "AZURE_OPENAI_DEPLOYMENT_NAME",
];

beforeEach(() => {
  vi.stubEnv("AZURE_OPENAI_API_KEY", "clave-de-prueba");
  vi.stubEnv("AZURE_OPENAI_ENDPOINT", "https://ejemplo.openai.azure.com");
  vi.stubEnv("AZURE_OPENAI_API_VERSION", "2024-06-01");
  vi.stubEnv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-prueba");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createClient", () => {
  it("con las cuatro variables de Azure configuradas, arma el cliente", () => {
    expect(createClient()).toBeDefined();
  });

  it.each(VARIABLES)("si falta %s, avisa con un error en vez de llamar a Azure", (variable) => {
    vi.stubEnv(variable, "");

    expect(() => createClient()).toThrow("Faltan variables de entorno de Azure OpenAI");
  });
});
