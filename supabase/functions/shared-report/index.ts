import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const shareToken = url.searchParams.get('token')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create shared report
    if (req.method === 'POST' && action === 'create') {
      const { weekStartDate, title } = await req.json()
      
      // Get the user from the authorization header
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        throw new Error('No authorization header')
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      )

      if (userError || !user) {
        throw new Error('Invalid user')
      }

      // Generate unique share token
      const shareToken = crypto.randomUUID()

      // Create shared report record
      const { data: sharedReport, error: createError } = await supabase
        .from('shared_reports')
        .insert({
          user_id: user.id,
          week_start_date: weekStartDate,
          share_token: shareToken,
          title: title || `Weekly Progress - ${weekStartDate}`
        })
        .select()
        .single()

      if (createError) throw createError

      return new Response(
        JSON.stringify({ 
          success: true, 
          shareToken,
          shareUrl: `${req.url.split('/functions')[0]}/share/${shareToken}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get shared report data
    if (req.method === 'GET' && shareToken) {
      console.log('Fetching shared report for token:', shareToken)

      // Get shared report
      const { data: sharedReport, error: reportError } = await supabase
        .from('shared_reports')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .single()

      if (reportError || !sharedReport) {
        return new Response(
          JSON.stringify({ error: 'Shared report not found or inactive' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      // Calculate week end date
      const weekStart = new Date(sharedReport.week_start_date)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      // Fetch workouts for the week with detailed exercise sets
      const { data: workouts, error: workoutsError } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          exercises (
            *,
            exercise_sets (
              set_number,
              reps,
              weight_kg
            )
          )
        `)
        .eq('user_id', sharedReport.user_id)
        .gte('date', weekStart.toISOString().split('T')[0])
        .lte('date', weekEnd.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (workoutsError) throw workoutsError

      // Fetch progress photos for the week
      const { data: progressPhotos, error: photoError } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', sharedReport.user_id)
        .eq('week_start_date', weekStart.toISOString().split('T')[0])
        .order('created_at', { ascending: true })

      // Fetch comments for this shared report
      const { data: comments, error: commentsError } = await supabase
        .from('report_comments')
        .select('*')
        .eq('shared_report_id', sharedReport.id)
        .order('created_at', { ascending: true })

      // Calculate statistics
      const totalWorkouts = workouts?.length || 0
      const totalExercises = workouts?.reduce((sum, workout) => sum + (workout.exercises?.length || 0), 0) || 0
      const totalSets = workouts?.reduce((sum, workout) => 
        sum + (workout.exercises?.reduce((setSum, exercise) => {
          if (exercise.exercise_sets && exercise.exercise_sets.length > 0) {
            return setSum + exercise.exercise_sets.length
          }
          return setSum + (exercise.sets || 0)
        }, 0) || 0), 0) || 0

      const categoriesWorked = [...new Set(workouts?.map(w => w.category) || [])]

      return new Response(
        JSON.stringify({
          success: true,
          report: sharedReport,
          workouts: workouts || [],
          progressPhotos: progressPhotos || [],
          comments: comments || [],
          stats: {
            totalWorkouts,
            totalExercises,
            totalSets,
            categoriesWorked
          },
          weekRange: {
            start: weekStart.toISOString().split('T')[0],
            end: weekEnd.toISOString().split('T')[0]
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add comment
    if (req.method === 'POST' && action === 'comment') {
      const { shareToken, commenterName, commentText } = await req.json()

      // Get shared report
      const { data: sharedReport, error: reportError } = await supabase
        .from('shared_reports')
        .select('id')
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .single()

      if (reportError || !sharedReport) {
        throw new Error('Shared report not found')
      }

      // Add comment
      const { data: comment, error: commentError } = await supabase
        .from('report_comments')
        .insert({
          shared_report_id: sharedReport.id,
          commenter_name: commenterName,
          comment_text: commentText
        })
        .select()
        .single()

      if (commentError) throw commentError

      return new Response(
        JSON.stringify({ success: true, comment }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Error in shared-report function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})