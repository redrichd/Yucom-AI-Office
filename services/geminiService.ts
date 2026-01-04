
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Standard function to generate tool descriptions using Gemini
export const generateToolDescription = async (name: string, category: string): Promise<string> => {
  try {
    // Create a new GoogleGenAI instance right before making an API call to ensure up-to-date config
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    
    // Using gemini-3-flash-preview for basic text generation task
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, punchy, 2-sentence description for an AI tool named "${name}" in the "${category}" category. Focus on its key benefit.`,
      config: {
        temperature: 0.7,
        // Recommendation: Avoid setting maxOutputTokens if not strictly required to prevent truncation.
      }
    });

    // Access the text property directly (it is a property, not a method)
    return response.text?.trim() || "Failed to generate description.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate description due to an internal error.";
  }
};