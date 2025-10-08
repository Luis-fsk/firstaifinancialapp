import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// This file handles scheduled cron jobs for the application

export async function scheduleDailyNewsUpdate() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Running daily news update cron job...');

  try {
    // Call the fetch-news function
    const { data, error } = await supabase.functions.invoke('fetch-news');

    if (error) {
      console.error('Error calling fetch-news:', error);
      return { success: false, error };
    }

    console.log('Daily news update completed:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in daily news update:', error);
    return { success: false, error };
  }
}
