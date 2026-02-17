import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum image size: 10MB in base64 (accounting for base64 encoding overhead)
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_SIZE_BYTES * 4 / 3);

// Allowed image formats
const ALLOWED_IMAGE_FORMATS = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      console.error('Auth validation failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.user.id;
    console.log(`Authenticated user: ${userId}`);

    const { imageBase64 } = await req.json();
    
    // Input validation: Check if image is provided
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation: Check image type
    if (typeof imageBase64 !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid image format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation: Check image size (prevent resource exhaustion)
    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'Image too large. Maximum size is 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation: Check image format
    if (imageBase64.startsWith('data:') && !ALLOWED_IMAGE_FORMATS.test(imageBase64)) {
      return new Response(
        JSON.stringify({ error: 'Invalid image format. Allowed: JPEG, PNG, WebP, GIF.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are a civic issue classification assistant.
Analyze the uploaded image and identify the civic issue shown.

Your task:
1. Provide a concise problem title based on the image (e.g., "Transformer issue", "Drainage issue", "Garbage accumulation", "Water leakage", "Road damage", "Streetlight not working").

2. Identify the most appropriate local governing body from ONLY these options:
   - municipal (for Municipality areas)
   - panchayat (for rural Panchayat areas)
   - town_panchayat (for Town Panchayat areas)
   - corporation (for Corporation areas)

3. Identify the category from ONLY these options:
   - road_damage
   - streetlight
   - drainage
   - garbage
   - water_supply
   - public_safety
   - other

4. Try to identify location details if visible in the image (street signs, landmarks, etc.), or provide a generic description.

5. Provide a detailed description explaining:
   - What the issue is
   - Why it is a public issue
   - Potential risks
   - Which authority should act

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "problem": "Brief problem title",
  "governing_body": "municipal|panchayat|town_panchayat|corporation",
  "category": "road_damage|streetlight|drainage|garbage|water_supply|public_safety|other",
  "location": "Location description if identifiable",
  "reason": "Detailed description of the issue, risks, and recommended action"
}`;

    console.log(`User ${userId} sending image to AI for analysis...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { 
                type: "image_url", 
                image_url: { 
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` 
                } 
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log(`AI response for user ${userId}:`, content);

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No analysis result from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response from AI
    let analysisResult;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in analyze-issue-image:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
