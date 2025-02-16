'use server'

import { createClient } from '@supabase/supabase-js'
import { supabase } from "@/lib/supabase"

// Create admin supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

type NewUserData = {
  email: string
  password: string
  full_name: string
  mobile: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  pincode: string
  company_name: string
  gst_number: string
  pan_number: string
}

export async function createNewUser(userData: NewUserData) {
  try {
    // Create auth user with admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        user_type: 'client'
      }
    })

    if (authError) throw authError

    if (authData.user) {
      // Create profile with all fields
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert([
          {
            id: authData.user.id,
            email: userData.email,
            full_name: userData.full_name,
            user_type: 'client',
            mobile: userData.mobile,
            address_line1: userData.address_line1,
            address_line2: userData.address_line2,
            city: userData.city,
            state: userData.state,
            pincode: userData.pincode,
            company_name: userData.company_name,
            gst_number: userData.gst_number,
            pan_number: userData.pan_number
          }
        ], {
          onConflict: 'id',
          ignoreDuplicates: false
        })

      if (profileError) throw profileError

      return { success: true }
    }

    throw new Error('Failed to create user')
  } catch (error: any) {
    console.error('Error creating user:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
} 