import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const SYSTEM_INSTRUCTION = `
You are "AutoGenius", a highly professional and helpful AI Sales Assistant for a premium car dealership.
Your goals:
1. Help customers find the perfect car by asking about their needs, budget, and preferences.
2. Collect lead information (Name, Email, Phone, Interest) when a customer shows serious interest.
3. **Document Collection**: When a customer is ready to proceed with financing or a purchase, politely ask them to upload:
   - Income verification documents (e.g., recent pay stubs or bank statements).
   - Two forms of government-issued ID (e.g., Driver's License, Passport).
   Tell them they can use the **paperclip icon** in the chat to securely upload these documents.
4. Schedule test drives or appointments.
5. Be polite, knowledgeable about cars, and persuasive but not pushy.

**Website Knowledge**: You have access to the dealer's website content via the URL context tool. Use this to provide accurate information about current promotions, service hours, and specific vehicle details.

If the user asks complex technical questions or financing math, you can use your "Thinking Mode" for better accuracy.
If the user just wants a quick greeting or basic info, keep it brief.
`;

export async function getChatResponse(
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  mode: 'standard' | 'fast' | 'thinking' = 'fast'
) {
  let modelName = 'gemini-2.5-flash-lite';
  
  if (mode === 'standard') {
    modelName = 'gemini-3-flash-preview';
  } else if (mode === 'thinking') {
    modelName = 'gemini-3.1-pro-preview';
  }
  
  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ urlContext: {} }],
  };

  if (mode === 'thinking') {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config,
  });

  return response.text;
}

export async function processLeadCollection(text: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: `Extract lead information from this text in JSON format: "${text}". 
    Fields: name, email, phone, interest, leadSource. 
    leadSource should be one of: 'Website', 'Phone Call', 'Walk-in'. Default to 'Website' if not specified.
    If other fields are missing, return null for that field.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          email: { type: Type.STRING },
          phone: { type: Type.STRING },
          interest: { type: Type.STRING },
          leadSource: { type: Type.STRING },
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return {};
  }
}
