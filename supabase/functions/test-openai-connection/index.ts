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
    console.log('Testing OpenAI API connectivity...');
    
    // Test with your OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('API Key available:', !!openaiApiKey);
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Simple test request
    const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Say "API connection successful" in JSON format: {"status": "success", "message": "API connection successful"}'
          }
        ],
        max_tokens: 100,
        temperature: 0.1
      }),
    });

    console.log('OpenAI API Response Status:', testResponse.status);
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('OpenAI API Error:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `OpenAI API error: ${testResponse.status} - ${errorText}`,
          apiKeyPresent: !!openaiApiKey
        }),
        {
          status: 200, // Return 200 so we can see the error details
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openaiData = await testResponse.json();
    console.log('OpenAI Response received');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OpenAI API connection successful',
        response: openaiData.choices[0].message.content,
        apiKeyPresent: !!openaiApiKey
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in test-openai-connection function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        apiKeyPresent: !!Deno.env.get('OPENAI_API_KEY')
      }),
      {
        status: 200, // Return 200 so we can see the error details
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});