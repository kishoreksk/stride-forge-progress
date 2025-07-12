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
    const { fileUrl, planName, userId } = await req.json();
    
    if (!fileUrl || !planName || !userId) {
      throw new Error('Missing required parameters: fileUrl, planName, or userId');
    }

    console.log('Starting PDF parsing for:', { fileUrl, planName, userId });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the PDF file
    console.log('Downloading PDF from:', fileUrl);
    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log('PDF downloaded, size:', pdfBuffer.byteLength);

    // Convert PDF to base64 for OpenAI
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // Use OpenAI to extract workout information
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Sending PDF to OpenAI for analysis...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a fitness expert that analyzes workout plans from PDFs. Extract workout information and return it as a JSON array. Each workout should include:
            - date (YYYY-MM-DD format, if specific dates aren't provided, suggest dates starting from next Monday)
            - category (one of: "push", "pull", "legs", "abs", "cardio", "treadmill")
            - duration_minutes (estimate if not specified)
            - notes (any additional workout notes)
            - exercises (array of exercise objects with: exercise_name, exercise_type ("strength" or "cardio"), sets, reps, weight_kg, distance_km, time_minutes, laps, notes)
            
            Analyze the content and create a realistic weekly schedule. Return ONLY valid JSON, no other text.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this workout plan PDF and extract all workout sessions and exercises. Create a structured workout schedule.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('OpenAI response received');

    let workoutData;
    try {
      const extractedContent = openAIData.choices[0].message.content;
      console.log('Extracted content:', extractedContent);
      workoutData = JSON.parse(extractedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Failed to parse workout data from PDF');
    }

    if (!Array.isArray(workoutData)) {
      throw new Error('Invalid workout data format received from AI');
    }

    console.log('Parsed workout data:', workoutData.length, 'workouts found');

    // Get the workout plan ID
    const { data: planData, error: planError } = await supabase
      .from('workout_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('name', planName)
      .single();

    if (planError) {
      console.error('Error finding workout plan:', planError);
      throw new Error('Failed to find workout plan in database');
    }

    const workoutPlanId = planData.id;

    // Create workout sessions and exercises
    let createdSessions = 0;
    let createdExercises = 0;

    for (const workout of workoutData) {
      try {
        // Create workout session
        const { data: sessionData, error: sessionError } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: userId,
            date: workout.date,
            category: workout.category,
            duration_minutes: workout.duration_minutes || 60,
            notes: workout.notes || null,
            workout_plan_id: workoutPlanId
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error creating workout session:', sessionError);
          continue;
        }

        createdSessions++;
        console.log('Created workout session:', sessionData.id);

        // Create exercises for this session
        if (workout.exercises && Array.isArray(workout.exercises)) {
          for (const exercise of workout.exercises) {
            const { error: exerciseError } = await supabase
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
              });

            if (exerciseError) {
              console.error('Error creating exercise:', exerciseError);
            } else {
              createdExercises++;
            }
          }
        }
      } catch (workoutError) {
        console.error('Error processing workout:', workoutError);
      }
    }

    console.log(`Successfully created ${createdSessions} workout sessions and ${createdExercises} exercises`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created ${createdSessions} workout sessions with ${createdExercises} exercises`,
        workoutsCreated: createdSessions,
        exercisesCreated: createdExercises
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in parse-workout-pdf function:', error);
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