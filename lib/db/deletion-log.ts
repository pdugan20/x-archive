import type { TablesInsert } from '@/types/database';
import { getSupabaseAdmin } from './supabase';

export async function logDeletion(entry: TablesInsert<'deletion_log'>) {
  const supabase = getSupabaseAdmin();
  return supabase.from('deletion_log').insert(entry);
}

export async function logDeletions(entries: TablesInsert<'deletion_log'>[]) {
  const supabase = getSupabaseAdmin();
  return supabase.from('deletion_log').insert(entries);
}

export async function getDeletionLogs(page = 0, pageSize = 50) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from('deletion_log')
    .select('*')
    .order('deleted_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
}

export async function getDeletionLogCount() {
  const supabase = getSupabaseAdmin();
  return supabase
    .from('deletion_log')
    .select('*', { count: 'exact', head: true });
}
