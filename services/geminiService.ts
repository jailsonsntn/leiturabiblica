import { GoogleGenAI } from "@google/genai";

// Initialize the API client
// Note: In a real production environment, we should handle the missing key more gracefully 
// or proxy requests through a backend.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generatePastoralReflection = async (
  verse: string,
  reference: string,
  userQuestion: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "A chave de API não foi configurada. Por favor, verifique a configuração.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Você é um conselheiro cristão sábio, gentil e acolhedor.
      Baseado neste versículo: "${verse}" (${reference}).
      
      O usuário tem a seguinte dúvida ou reflexão: "${userQuestion}"
      
      Responda de forma breve (máximo 100 palavras), encorajadora e prática.
      Use uma linguagem simples e acessível.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Não foi possível gerar uma reflexão no momento.";
  } catch (error) {
    console.error("Error generating reflection:", error);
    return "Houve um erro ao conectar com o assistente pastoral. Tente novamente mais tarde.";
  }
};