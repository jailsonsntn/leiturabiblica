import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePastoralReflection = async (
  verse: string,
  reference: string,
  userQuestion: string
): Promise<string> => {
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
    return "O Assistente Pastoral está indisponível no momento. Verifique a configuração da chave de API.";
  }
};