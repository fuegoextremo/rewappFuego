import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, currentSpins } = await request.json()
    
    console.log('🛠️ Service Role: Testing spin for user:', userId)
    console.log('🛠️ Service Role: Current spins:', currentSpins)
    
    // Update with service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('user_spins')
      .update({
        available_spins: currentSpins - 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
    
    console.log('🛠️ Service Role: UPDATE result:', { data, error })
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data[0] || null,
      updated: data.length > 0
    })
    
  } catch (error) {
    console.error('🛠️ Service Role: Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
