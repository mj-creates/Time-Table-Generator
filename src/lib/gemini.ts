import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getDailyAffirmation() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a short, calming, and poetic daily affirmation for mindfulness. Keep it under 20 words.",
      config: {
        systemInstruction: "You are a peaceful mindfulness guide. Your tone is soft, poetic, and encouraging.",
      }
    });

    return response.text?.trim() || "Breathe in peace, breathe out gratitude.";
  } catch (error) {
    console.error("Error fetching affirmation:", error);
    return "The path to peace starts with a single breath.";
  }
}
