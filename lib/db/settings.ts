import type { TablesUpdate } from '@/types/database';
import { getSupabaseAdmin } from './supabase';

export async function getSettings() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    throw new Error(`Failed to fetch settings: ${error.message}`);
  }

  return data;
}

export async function updateSettings(updates: TablesUpdate<'settings'>) {
  const supabase = getSupabaseAdmin();
  return supabase.from('settings').update(updates).eq('id', 1);
}
