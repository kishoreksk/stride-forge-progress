import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Testing Gemini API connectivity...');
    
    // Test with your Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    console.log('API Key available:', !!geminiApiKey);
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Simple test request
    const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Say "API connection successful" in JSON format: {"status": "success", "message": "API connection successful"}'
          }]
        }],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.1
        }
      }),
    });

    console.log('Gemini API Response Status:', testResponse.status);
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('Gemini API Error:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Gemini API error: ${testResponse.status} - ${errorText}`,
          apiKeyPresent: !!geminiApiKey
        }),
        {
          status: 200, // Return 200 so we can see the error details
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const geminiData = await testResponse.json();
    console.log('Gemini Response received');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Gemini API connection successful',
        response: geminiData.candidates[0].content.parts[0].text,
        apiKeyPresent: !!geminiApiKey
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in test-aiml-connection function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        apiKeyPresent: !!Deno.env.get('GEMINI_API_KEY')
      }),
      {
        status: 200, // Return 200 so we can see the error details
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});