import { GoogleGenAI } from "@google/genai";

// Initialize lazily to prevent crash if process.env is accessed in browser without polyfill
let ai: GoogleGenAI | null = null;

const getAIClient = () => {
  if (ai) return ai;

  // Safe access to environment variable
  let apiKey = '';
  try {
    // Check if process is defined (Node/Webpack)
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      apiKey = process.env.API_KEY;
    } 
    // Check for Vite specific env if needed in future
    // else if (import.meta.env && import.meta.env.VITE_API_KEY) ...
  } catch (e) {
    console.warn("Could not access environment variables safely.");
  }

  ai = new GoogleGenAI({ apiKey: apiKey });
  return ai;
};

export const generatePastoralReflection = async (
  verse: string,
  reference: string,
  userQuestion: string
): Promise<string> => {
  try {
    // Check for key existence roughly before call
    // Note: We create the client anyway to avoid null errors, but the call will fail if key is empty
    const client = getAIClient();
    
    // Simple check to warn user if no key is present (client side)
    // In a real app, you might want to proxy this or require a key in settings
    let hasKey = false;
    try {
       if (typeof process !== 'undefined' && process.env?.API_KEY) hasKey = true;
    } catch(e) {}

    if (!hasKey) {
       // Return a graceful message instead of crashing or throwing 400
       return "O assistente pastoral precisa de uma chave de API configurada. (Erro: API_KEY missing)";
    }

    const model = 'gemini-2.5-flash';
    const prompt = `
      Você é um conselheiro cristão sábio, gentil e acolhedor.
      Baseado neste versículo: "${verse}" (${reference}).
      
      O usuário tem a seguinte dúvida ou reflexão: "${userQuestion}"
      
      Responda de forma breve (máximo 100 palavras), encorajadora e prática.
      Use uma linguagem simples e acessível.
    `;

    const response = await client.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Não foi possível gerar uma reflexão no momento.";
  } catch (error) {
    console.error("Error generating reflection:", error);
    return "Houve um erro ao conectar com o assistente pastoral. Tente novamente mais tarde.";
  }
};