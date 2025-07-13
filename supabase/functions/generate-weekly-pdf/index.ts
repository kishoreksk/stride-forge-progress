import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// PDF generation dependencies  
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1'

// Helper function to fetch image as base64
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error('Failed to fetch image:', response.status, response.statusText)
      return null
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    
    const base64 = btoa(binary)
    const mimeType = response.headers.get('content-type') || 'image/jpeg'
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error('Error fetching image:', error)
    return null
  }
}

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
    const { weekStartDate } = await req.json()
    
    console.log('Generating PDF report for week:', weekStartDate)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    // Calculate week end date
    const weekStart = new Date(weekStartDate)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    console.log('Fetching workouts from', weekStart.toISOString().split('T')[0], 'to', weekEnd.toISOString().split('T')[0])

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
      .eq('user_id', user.id)
      .gte('date', weekStart.toISOString().split('T')[0])
      .lte('date', weekEnd.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (workoutsError) {
      console.error('Workouts error:', workoutsError)
      throw workoutsError
    }

    // Fetch progress photos for the week
    const { data: progressPhotos, error: photoError } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStart.toISOString().split('T')[0])
      .order('created_at', { ascending: true })

    if (photoError) {
      console.error('Photo error:', photoError)
    }

    console.log('Found', workouts?.length || 0, 'workouts and', progressPhotos?.length || 0, 'photos')

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

    // Create PDF
    const doc = new jsPDF()
    let yPosition = 20

    // Title
    doc.setFontSize(20)
    doc.text('Weekly Fitness Report', 105, yPosition, { align: 'center' })
    yPosition += 10

    // Date range
    doc.setFontSize(12)
    const dateRange = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`
    doc.text(dateRange, 105, yPosition, { align: 'center' })
    yPosition += 20

    // Statistics
    doc.setFontSize(14)
    doc.text('Weekly Statistics', 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.text(`Total Workouts: ${totalWorkouts}`, 20, yPosition)
    doc.text(`Total Exercises: ${totalExercises}`, 120, yPosition)
    yPosition += 7
    doc.text(`Total Sets: ${totalSets}`, 20, yPosition)
    doc.text(`Categories: ${categoriesWorked.join(', ')}`, 120, yPosition)
    yPosition += 15

    // Workouts details
    if (workouts && workouts.length > 0) {
      doc.setFontSize(14)
      doc.text('Workout Details', 20, yPosition)
      yPosition += 10

      for (const workout of workouts) {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(12)
        const workoutDate = new Date(workout.date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
        doc.text(`${workoutDate} - ${workout.category.toUpperCase()}`, 20, yPosition)
        yPosition += 5

        if (workout.duration_minutes) {
          doc.setFontSize(10)
          doc.text(`Duration: ${workout.duration_minutes} minutes`, 20, yPosition)
          yPosition += 5
        }

        if (workout.notes) {
          doc.setFontSize(10)
          doc.text(`Notes: ${workout.notes}`, 20, yPosition)
          yPosition += 5
        }

        yPosition += 3
        doc.setFontSize(10)
        doc.text('Exercises:', 20, yPosition)
        yPosition += 5

        for (const exercise of workout.exercises || []) {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }

          doc.text(`• ${exercise.exercise_name} (${exercise.exercise_type})`, 25, yPosition)
          yPosition += 4

          // Display sets details
          if (exercise.exercise_sets && exercise.exercise_sets.length > 0) {
            const sortedSets = exercise.exercise_sets.sort((a, b) => a.set_number - b.set_number)
            for (const set of sortedSets) {
              const setInfo = `  Set ${set.set_number}: ${set.reps} reps${set.weight_kg ? ` @ ${set.weight_kg}kg` : ''}`
              doc.text(setInfo, 30, yPosition)
              yPosition += 3
            }
          } else {
            // Fallback to summary data
            const summaryInfo = []
            if (exercise.sets) summaryInfo.push(`${exercise.sets} sets`)
            if (exercise.reps) summaryInfo.push(`${exercise.reps} reps`)
            if (exercise.weight_kg) summaryInfo.push(`${exercise.weight_kg}kg`)
            if (exercise.distance_km) summaryInfo.push(`${exercise.distance_km}km`)
            if (exercise.time_minutes) summaryInfo.push(`${exercise.time_minutes} min`)
            if (exercise.laps) summaryInfo.push(`${exercise.laps} laps`)
            
            if (summaryInfo.length > 0) {
              doc.text(`  ${summaryInfo.join(' • ')}`, 30, yPosition)
              yPosition += 3
            }
          }

          if (exercise.notes) {
            doc.text(`  Notes: ${exercise.notes}`, 30, yPosition)
            yPosition += 3
          }

          yPosition += 2
        }
        yPosition += 5
      }
    }

    // Progress photos section
    if (progressPhotos && progressPhotos.length > 0) {
      // Add new page for photos
      doc.addPage()
      yPosition = 20

      doc.setFontSize(14)
      doc.text('Progress Photos', 20, yPosition)
      yPosition += 15

      // Embed actual photos
      for (let i = 0; i < progressPhotos.length; i++) {
        const photo = progressPhotos[i]
        
        // Check if we need a new page
        if (yPosition > 200) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(12)
        doc.text(`Photo ${i + 1}`, 20, yPosition)
        yPosition += 5
        
        doc.setFontSize(10)
        doc.text(`Uploaded: ${new Date(photo.created_at).toLocaleDateString()}`, 20, yPosition)
        yPosition += 5
        
        if (photo.notes) {
          doc.text(`Notes: ${photo.notes}`, 20, yPosition)
          yPosition += 5
        }
        
        yPosition += 5

        try {
          // Fetch and embed the actual image
          console.log('Fetching image from:', photo.photo_url)
          const imageBase64 = await fetchImageAsBase64(photo.photo_url)
          
          if (imageBase64) {
            // Calculate image dimensions (max width 150, maintain aspect ratio)
            const maxWidth = 150
            const maxHeight = 100
            
            // Add the image to PDF
            doc.addImage(imageBase64, 'JPEG', 20, yPosition, maxWidth, maxHeight)
            yPosition += maxHeight + 10
            
            console.log('Successfully added image to PDF')
          } else {
            // Fallback if image can't be loaded
            doc.setFontSize(8)
            doc.text('Image could not be loaded', 20, yPosition)
            yPosition += 10
          }
        } catch (error) {
          console.error('Error adding image to PDF:', error)
          doc.setFontSize(8)
          doc.text('Error loading image', 20, yPosition)
          yPosition += 10
        }
        
        yPosition += 10
      }
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer')

    console.log('PDF generated successfully, size:', pdfBuffer.byteLength)

    return new Response(
      pdfBuffer,
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="fitness-report-${weekStartDate}.pdf"`
        } 
      }
    )
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate PDF report', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})