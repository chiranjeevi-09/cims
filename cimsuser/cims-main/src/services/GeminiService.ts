import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export interface GeminiAnalysisResponse {
    problem: string;
    governing_body: string;
    location: string;
    reason: string;
}

export const analyzeIssueImage = async (
    imageBase64: string,
    userDescription: string = ""
): Promise<GeminiAnalysisResponse | null> => {
    // Extract base64 and mime type safely
    const mimeMatch = imageBase64.match(/data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    const prompt = `
You are a civic issue classification assistant.

A user has reported the following problem: "${userDescription}"

Analyze the uploaded image (if available) and decide:

1. Provide a concise problem label based on the image only.
   Examples: Transformer issue, Drainage issue, Garbage accumulation, Water leakage.

2. Identify the local governing body only from the following:
   Municipality, Corporation, Town Panchayat, Panchayat

3. Identify the location in geo-tag name format:
   Street name / Area / City or Town / District (if inferable)

4. Provide a reason explaining:
   - what the issue is,
   - why it is a public issue,
   - potential risks,
   - which authority should act.

Return strictly in JSON format:

{
  "problem": "",
  "governing_body": "",
  "location": "",
  "reason": ""
}
`;

    try {
        // Using the exact model name provided by the user
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent([
            {
                text: prompt,
            },
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text().trim();

        try {
            // Find JSON block more aggressively
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            const jsonStr = (jsonStart !== -1 && jsonEnd !== -1) ? text.substring(jsonStart, jsonEnd) : text;
            const parsed = JSON.parse(jsonStr);

            return parsed as GeminiAnalysisResponse;
        } catch (e) {
            console.error("Failed to parse Gemini response as JSON. Raw text:", text);
            return null;
        }
    } catch (error: any) {
        console.error("Gemini Analysis Error Detail:", error);

        // If gemini-2.5-flash 404s, try fallback
        if (error.message && error.message.includes("404")) {
            try {
                const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await fallbackModel.generateContent([
                    { text: prompt },
                    { inlineData: { data: base64Data, mimeType: mimeType } }
                ]);
                const response = await result.response;
                const text = response.text().trim();
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                return JSON.parse(jsonMatch ? jsonMatch[0] : text) as GeminiAnalysisResponse;
            } catch (fallbackError) {
                console.error("Gemini Fallback Analysis Error:", fallbackError);
            }
        }
        return null;
    }
};
