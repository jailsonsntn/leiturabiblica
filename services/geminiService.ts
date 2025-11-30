import { GoogleGenAI } from "@google/genai";

// Função segura para obter a chave de API em diferentes ambientes (Vite, Vercel, Node)
const getApiKey = (): string | undefined => {
  try {
    // Tenta obter do Vite (Padrão moderno)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
    
    // Tenta obter do process.env (Node/Vercel build time)
    // Verificação de segurança para não quebrar no navegador se process não existir
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Erro ao ler variáveis de ambiente:", e);
  }
  return undefined;
};

export const generatePastoralReflection = async (
  verse: string,
  reference: string,
  userQuestion: string
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.warn("Gemini API Key missing.");
      return "O Assistente Pastoral está indisponível (Chave de API não encontrada. Verifique as configurações do Vercel/Vite).";
    }

    // Inicialização Preguiçosa (Lazy): O cliente só é criado AQUI, evitando tela branca no início
    const ai = new GoogleGenAI({ apiKey });

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
    return "O Assistente Pastoral está indisponível no momento. Tente novamente mais tarde.";
  }
};