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
    const { photoFiles, weekStartDate, notes } = await req.json()
    
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

    const uploadedPhotos = []

    for (let i = 0; i < photoFiles.length; i++) {
      const photoFile = photoFiles[i]
      
      // Convert base64 to blob
      const base64Data = photoFile.data.split(',')[1]
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
      
      // Generate unique filename
      const timestamp = new Date().getTime()
      const fileName = `progress_${user.id}_${weekStartDate}_${i + 1}_${timestamp}.png`
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, binaryData, {
          contentType: 'image/png',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Failed to upload photo ${i + 1}: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName)

      // Save to progress_photos table
      const { data: progressPhoto, error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          photo_url: publicUrl,
          week_start_date: weekStartDate,
          notes: notes || `Progress photo ${i + 1}`
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        throw new Error(`Failed to save photo ${i + 1} to database: ${dbError.message}`)
      }

      uploadedPhotos.push(progressPhoto)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        photos: uploadedPhotos,
        message: `Successfully uploaded ${uploadedPhotos.length} progress photo(s)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})