import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

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
    const { workoutText, workoutDate, category, userId } = await req.json();
    
    if (!workoutText || !workoutDate || !userId) {
      throw new Error('Missing required parameters: workoutText, workoutDate, or userId');
    }

    console.log('Processing workout text for user:', userId);
    console.log('Workout date:', workoutDate);
    console.log('Workout text preview:', workoutText.substring(0, 100) + '...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use Gemini API to process the workout text
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    console.log('Sending workout text to Gemini for analysis...');
    console.log('Gemini API Key exists:', !!geminiApiKey);
    
    let geminiResponse;
    try {
      geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
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
                     "exercise_sets": [
                       {
                         "set_number": number,
                         "reps": number,
                         "weight_kg": number
                       }
                     ],
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
               - If user mentions different weights/reps per set (e.g., "10kg for 15 reps, then 15kg for 12 reps"), use exercise_sets array
               - For simple cases with same weight/reps across sets, use the basic sets/reps/weight_kg fields
               - exercise_sets should contain individual set data with set_number starting from 1
               - Estimate duration if not explicitly stated
               - Return ONLY valid JSON, no other text
              
              Parse this workout description: "${workoutText}"${category && category !== 'auto' ? ` Category hint: ${category}` : ''}`
            }]
          }],
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.1
          }
        }),
      });
    } catch (fetchError) {
      console.error('Network error calling Gemini API:', fetchError);
      throw new Error(`Network error: ${fetchError.message}`);
    }

    console.log('Gemini API response status:', geminiResponse.status);
    console.log('Gemini API response headers:', Object.fromEntries(geminiResponse.headers.entries()));

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error response:', errorText);
      console.error('Gemini API status:', geminiResponse.status, geminiResponse.statusText);
      throw new Error(`Gemini API error (${geminiResponse.status}): ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response received, parsing...');

    let workoutData;
    try {
      const extractedContent = geminiData.candidates[0].content.parts[0].text;
      console.log('Raw Gemini response:', extractedContent);
      
      // Multiple parsing strategies
      let parseSuccess = false;
      let parseMethod = '';
      
      // Strategy 1: Direct JSON parse
      if (!parseSuccess) {
        try {
          workoutData = JSON.parse(extractedContent);
          parseSuccess = true;
          parseMethod = 'direct';
          console.log('Parsed using direct method');
        } catch (e) {
          console.log('Direct parse failed:', e.message);
        }
      }
      
      // Strategy 2: Remove markdown code blocks
      if (!parseSuccess) {
        try {
          const codeBlockMatch = extractedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch) {
            workoutData = JSON.parse(codeBlockMatch[1].trim());
            parseSuccess = true;
            parseMethod = 'markdown';
            console.log('Parsed using markdown method');
          }
        } catch (e) {
          console.log('Markdown parse failed:', e.message);
        }
      }
      
      // Strategy 3: Find JSON object with greedy matching
      if (!parseSuccess) {
        try {
          const jsonMatch = extractedContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            workoutData = JSON.parse(jsonMatch[0]);
            parseSuccess = true;
            parseMethod = 'regex';
            console.log('Parsed using regex method');
          }
        } catch (e) {
          console.log('Regex parse failed:', e.message);
        }
      }
      
      // Strategy 4: Try to fix common JSON issues
      if (!parseSuccess) {
        try {
          let cleanedContent = extractedContent
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .replace(/^\s*[\w\s]*?(\{)/g, '$1')  // Remove text before first {
            .replace(/(\})\s*[\w\s]*$/g, '$1')   // Remove text after last }
            .trim();
            
          workoutData = JSON.parse(cleanedContent);
          parseSuccess = true;
          parseMethod = 'cleaned';
          console.log('Parsed using cleaned method');
        } catch (e) {
          console.log('Cleaned parse failed:', e.message);
        }
      }
      
      if (!parseSuccess) {
        throw new Error('All parsing strategies failed');
      }
      
      console.log('Parse method used:', parseMethod);
      console.log('Parsed workout data structure:', {
        hasWorkoutSession: !!workoutData.workout_session,
        hasExercises: Array.isArray(workoutData.exercises),
        exerciseCount: workoutData.exercises?.length || 0
      });
      
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      console.error('Raw content:', geminiData.candidates[0].content.parts[0].text);
      throw new Error(`Failed to parse workout data from AI response: ${parseError.message}`);
    }

    if (!workoutData.workout_session || !Array.isArray(workoutData.exercises)) {
      throw new Error('Invalid workout data structure received from AI');
    }

    console.log('Parsed workout data:', {
      category: workoutData.workout_session.category,
      exercisesCount: workoutData.exercises.length
    });

    // Create workout session
    const { data: sessionData, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        date: workoutDate,
        category: workoutData.workout_session.category,
        duration_minutes: workoutData.workout_session.duration_minutes || 60,
        notes: workoutData.workout_session.notes || null
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating workout session:', sessionError);
      throw new Error('Failed to create workout session');
    }

    console.log('Created workout session:', sessionData.id);

    // Create exercises for this session
    let createdExercises = 0;
    
    for (const exercise of workoutData.exercises) {
      try {
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercises')
          .insert({
            workout_session_id: sessionData.id,
            exercise_name: exercise.exercise_name,
            exercise_type: exercise.exercise_type || 'strength',
            sets: exercise.sets || null,
            reps: exercise.reps || null,
            weight_kg: exercise.weight_kg || null,
            distance_km: exercise.distance_km || null,
            time_minutes: exercise.time_minutes || null,
            laps: exercise.laps || null,
            notes: exercise.notes || null
          })
          .select()
          .single();

        if (exerciseError) {
          console.error('Error creating exercise:', exerciseError);
        } else {
          createdExercises++;
          
          // Create exercise sets if provided
          if (exercise.exercise_sets && Array.isArray(exercise.exercise_sets) && exercise.exercise_sets.length > 0) {
            const setsData = exercise.exercise_sets.map(set => ({
              exercise_id: exerciseData.id,
              set_number: set.set_number,
              reps: set.reps,
              weight_kg: exercise.exercise_type === 'strength' ? set.weight_kg : null
            }));

            const { error: setsError } = await supabase
              .from('exercise_sets')
              .insert(setsData);

            if (setsError) {
              console.error('Error creating exercise sets:', setsError);
            } else {
              console.log(`Created ${setsData.length} sets for exercise: ${exercise.exercise_name}`);
            }
          }
        }
      } catch (exerciseError) {
        console.error('Error processing exercise:', exerciseError);
      }
    }

    console.log(`Successfully created workout session with ${createdExercises} exercises`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created workout with ${createdExercises} exercises`,
        exercisesCreated: createdExercises,
        workoutSessionId: sessionData.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in process-workout-text function:', error);
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