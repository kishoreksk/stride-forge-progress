import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const testWorkoutText = `Today I did:
- 3 sets of 12 push-ups
- 4 sets of 10 squats with 20kg
- 30 minutes cardio on treadmill
- 3 sets of 15 bicep curls with 15kg dumbbells
- Plank hold for 2 minutes`;

    console.log('Testing Gemini response format...');
    
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a fitness expert that analyzes workout descriptions. Extract workout information and return it as a JSON object with this structure:
            {
              "workout_session": {
                "category": "push|pull|legs|abs|cardio|treadmill",
                "duration_minutes": number,
                "notes": "string"
              },
              "exercises": [
                {
                  "exercise_name": "string",
                  "exercise_type": "strength|cardio",
                  "sets": number,
                  "reps": number,
                  "weight_kg": number,
                  "distance_km": number,
                  "time_minutes": number,
                  "laps": number,
                  "notes": "string"
                }
              ]
            }
            
            Rules:
            - Infer workout category from exercises if not provided
            - Extract sets, reps, weights, distances, times from the text
            - Use null for missing values
            - Be generous in parsing different formats (e.g., "3x12", "3 sets of 12", etc.)
            - Estimate duration if not explicitly stated
            - Return ONLY valid JSON, no other text
            
            Parse this workout description: "${testWorkoutText}"`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.1
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const rawContent = geminiData.candidates[0].content.parts[0].text;
    
    console.log('Raw Gemini response:', rawContent);
    
    // Test different parsing strategies
    let workoutData;
    let parseMethod = '';
    
    try {
      // Strategy 1: Direct JSON parse
      workoutData = JSON.parse(rawContent);
      parseMethod = 'direct';
    } catch (e1) {
      try {
        // Strategy 2: Remove markdown code blocks
        const codeBlockMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          workoutData = JSON.parse(codeBlockMatch[1]);
          parseMethod = 'markdown';
        } else {
          throw new Error('No markdown block found');
        }
      } catch (e2) {
        try {
          // Strategy 3: Find JSON object
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            workoutData = JSON.parse(jsonMatch[0]);
            parseMethod = 'regex';
          } else {
            throw new Error('No JSON object found');
          }
        } catch (e3) {
          throw new Error(`All parsing methods failed: ${e1.message}, ${e2.message}, ${e3.message}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        parseMethod,
        rawContent,
        parsedData: workoutData,
        validation: {
          hasWorkoutSession: !!workoutData.workout_session,
          hasExercises: Array.isArray(workoutData.exercises),
          exerciseCount: workoutData.exercises?.length || 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Test error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});