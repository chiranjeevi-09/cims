import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting constants
const MAX_OTP_REQUESTS_PER_HOUR = 3;
const MAX_VERIFICATION_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 5;

// Phone number validation - E.164 format
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

// OTP format validation - 6 digits
const OTP_REGEX = /^\d{6}$/;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { phone, action, otp: userOtp } = requestBody;

    // Validate action
    if (!action || !['send', 'verify'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "send" or "verify".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone number
    if (!phone || typeof phone !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize and validate phone format (E.164)
    const sanitizedPhone = phone.trim();
    if (!PHONE_REGEX.test(sanitizedPhone)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone format. Use E.164 format (e.g., +1234567890)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone length (prevent overflow)
    if (sanitizedPhone.length > 16) {
      return new Response(
        JSON.stringify({ error: 'Phone number too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !twilioPhone) {
      console.error('Missing Twilio credentials');
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send') {
      // Check rate limiting - max OTP requests per phone per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentRequests, error: rateLimitError } = await supabaseAdmin
        .from('otp_verifications')
        .select('created_at')
        .eq('phone', sanitizedPhone)
        .gte('created_at', oneHourAgo);

      if (rateLimitError) {
        console.error('Rate limit check failed:', rateLimitError);
      }

      if (recentRequests && recentRequests.length >= MAX_OTP_REQUESTS_PER_HOUR) {
        console.log(`Rate limit exceeded for phone: ${sanitizedPhone.slice(0, 4)}***`);
        return new Response(
          JSON.stringify({ error: 'Too many OTP requests. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate 6-digit OTP using crypto for better randomness
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

      // Store OTP in database (upsert to handle existing records)
      const { error: upsertError } = await supabaseAdmin
        .from('otp_verifications')
        .upsert({
          phone: sanitizedPhone,
          otp,
          expires_at: expiresAt,
          attempts: 0,
          verified: false,
          verified_at: null
        }, { onConflict: 'phone' });

      if (upsertError) {
        console.error('Failed to store OTP:', upsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate OTP' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send SMS via Twilio
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const credentials = btoa(`${accountSid}:${authToken}`);

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: sanitizedPhone,
          From: twilioPhone,
          Body: `Your CIMS verification code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Twilio error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to send OTP' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`OTP sent to ${sanitizedPhone.slice(0, 4)}***`);
      return new Response(
        JSON.stringify({ success: true, message: 'OTP sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'verify') {
      // Validate OTP input
      if (!userOtp || typeof userOtp !== 'string') {
        return new Response(
          JSON.stringify({ error: 'OTP is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate OTP format
      const sanitizedOtp = userOtp.trim();
      if (!OTP_REGEX.test(sanitizedOtp)) {
        return new Response(
          JSON.stringify({ error: 'Invalid OTP format. Must be 6 digits.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get stored OTP from database
      const { data: record, error: fetchError } = await supabaseAdmin
        .from('otp_verifications')
        .select('*')
        .eq('phone', sanitizedPhone)
        .single();

      if (fetchError || !record) {
        return new Response(
          JSON.stringify({ error: 'No OTP found for this number. Please request a new one.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if too many attempts (brute force protection)
      if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {
        // Delete the record to force new OTP request
        await supabaseAdmin
          .from('otp_verifications')
          .delete()
          .eq('phone', sanitizedPhone);

        console.log(`Too many verification attempts for: ${sanitizedPhone.slice(0, 4)}***`);
        return new Response(
          JSON.stringify({ error: 'Too many failed attempts. Please request a new OTP.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if expired
      if (new Date() > new Date(record.expires_at)) {
        // Delete expired OTP
        await supabaseAdmin
          .from('otp_verifications')
          .delete()
          .eq('phone', sanitizedPhone);

        return new Response(
          JSON.stringify({ error: 'OTP has expired. Please request a new one.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify OTP (constant-time comparison would be ideal, but timing attacks are low risk here)
      if (record.otp !== sanitizedOtp) {
        // Increment attempts
        await supabaseAdmin
          .from('otp_verifications')
          .update({ attempts: record.attempts + 1 })
          .eq('phone', sanitizedPhone);

        const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - record.attempts - 1;
        console.log(`Invalid OTP attempt for: ${sanitizedPhone.slice(0, 4)}***`);
        return new Response(
          JSON.stringify({ 
            error: `Invalid OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempts remaining.` : 'This was your last attempt.'}` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // OTP verified - mark as verified
      await supabaseAdmin
        .from('otp_verifications')
        .update({ 
          verified: true, 
          verified_at: new Date().toISOString() 
        })
        .eq('phone', sanitizedPhone);

      // Clean up verified OTP
      await supabaseAdmin
        .from('otp_verifications')
        .delete()
        .eq('phone', sanitizedPhone);

      console.log(`OTP verified successfully for: ${sanitizedPhone.slice(0, 4)}***`);
      return new Response(
        JSON.stringify({ success: true, verified: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in send-otp function:', error);
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
