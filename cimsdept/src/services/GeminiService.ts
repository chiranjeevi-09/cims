import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export type RedirectDepartment = "water" | "energy" | "pwd";

const fetchImageAsBase64 = async (url: string): Promise<{ data: string; mimeType: string }> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve({ data: base64, mimeType: blob.type });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error fetching image from URL:", error);
        throw error;
    }
};

export const analyzeRedirectDepartment = async (
    imageInput: string, // Can be URL or base64
    userDescription: string
): Promise<RedirectDepartment | null> => {
    let base64Data = "";
    let mimeType = "image/jpeg";

    try {
        if (imageInput.startsWith('http')) {
            const result = await fetchImageAsBase64(imageInput);
            base64Data = result.data;
            mimeType = result.mimeType;
        } else {
            const mimeMatch = imageInput.match(/data:([^;]+);/);
            mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
            base64Data = imageInput.includes(",") ? imageInput.split(",")[1] : imageInput;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are a civic issue classification assistant.

A user has reported the following issue:
"${userDescription}"

Analyze the IMAGE carefully and choose ONLY ONE department
based strictly on the issue visible in the image.

Allowed departments:
- PWD
- Water
- Energy

OUTPUT RULES:
- Return ONLY ONE word
- No explanation
- No JSON
- No extra text

Output must be exactly one of:
PWD
Water
Energy
`;

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
        const text = response.text().trim().toUpperCase();

        // Map AI output to department types
        if (text.includes("WATER")) return "water";
        if (text.includes("ENERGY") || text.includes("ELECTRICITY")) return "energy";
        if (text.includes("PWD")) return "pwd";

        return null;
    } catch (error: any) {
        console.error("Gemini Redirect Analysis Error Detail:", error);

        // If gemini-2.5-flash 404s, try fallback
        if (error.message && error.message.includes("404")) {
            console.warn("Model gemini-2.5-flash not found. Attempting fallback to gemini-1.5-flash...");
            try {
                const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const fallbackPrompt = `Choose one of: PWD, Water, Energy. Issue: ${userDescription}`;

                const result = await fallbackModel.generateContent([
                    { text: fallbackPrompt },
                    { inlineData: { data: base64Data, mimeType: mimeType } }
                ]);
                const response = await result.response;
                const text = response.text().trim().toUpperCase();
                if (text.includes("WATER")) return "water";
                if (text.includes("ENERGY") || text.includes("ELECTRICITY")) return "energy";
                if (text.includes("PWD")) return "pwd";
            } catch (fallbackError) {
                console.error("Fallback redirect analysis failed:", fallbackError);
            }
        }
        return null;
    }
};
