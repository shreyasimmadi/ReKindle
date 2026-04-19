import { GoogleGenAI } from "@google/genai";

// Access your key from the .env file
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY || "";

// Initialize the client using the newer SDK configuration style
const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function analyzeDonation(base64Image: string) {
  try {
    // We use the direct 'models' access pattern required by the @google/genai types
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Flash is fastest for a live hackathon demo
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
                Act as a sustainability and donation expert. I am providing an image of an item that could be anything from a kitchen appliance to clothing. Please analyze the image and provide a 'Disposition Recommendation' based on the following logic:

                1. AMBIGUITY & CLARITY RULE:
                - If the image is too blurry, the brand/quality is hidden, or you cannot determine if an appliance works based on visual cues, set "decision" to "AskClarification".
                - If you need a specific detail (e.g., "Is this 14k gold?", "Does the cord have fraying?", or "What is the brand name?"), use this state.

                2. Item Identification & Condition Report:
                - Identify the item and its current state.
                - For Appliances: Look for cord integrity, rust, or missing parts.
                - For Clothing/Textiles: Look for pilling, stains, holes, or heavy fading.
                - For Furniture/Housewares: Look for structural cracks or surface damage.

                3. The 'Goodwill Test':
                - Determine if this is 'Sellable' or 'Unacceptable.'
                - Mention if this item belongs to a commonly restricted category (e.g., old car seats, halogen lamps, or hazardous electronics).

                4. The Specialized Recycling Path:
                - If the item is rejected for donation, specify the best recycling route (Textile rags, E-Waste circuit boards, or Bulk Scrap Metal).

                5. Preparation Step: 
                - Provide one specific action the user should take (e.g., 'sanitize the water reservoir' or 'remove personal labels').

                Return ONLY a JSON object:
                {
                "item": "string",
                "decision": "Resell | Recycle | AskClarification",
                "hazard": "string (if applicable, else 'None')",
                "reason": "string (If AskClarification, put the specific question here)",
                "category": "Clothing | Footwear | Accessories | Housewares | Linens & Domestics | Media & Entertainment | Electronics | Toys & Games | Sporting Goods | Furniture | Antiques & Collectibles | Other",
                "estimatedValue": number (if resellable, else 0),
                "tip": "string",
                "needsFollowUp": boolean
                }
              `
            },
            {
              inlineData: {
                data: base64Image,
                mimeType: "image/jpeg",
              },
            },
          ],
        },
      ],
    });

    // In the new SDK, 'text' is a property, not a function call
    const text = response.text;
    
    // Clean up any potential markdown formatting
    const cleanJson = text?.replace(/```json|```/g, "").trim();
    
    if (!cleanJson) {
      throw new Error("No response text received from Gemini API");
    }
    
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Gemini Sustainability Error:", error);
    return {
      item: "Analysis Error",
      decision: "Recycle",
      hazard: "Unknown",
      reason: "The AI was unable to process this image. Please check your connection or API key.",
      category: "N/A",
      estimatedValue: 0,
      tip: "Ensure the item is well-lit and clearly visible."
    };
  }
}