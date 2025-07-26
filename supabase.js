// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const db = {
  async query(table) {
    return supabase.from(table);
  },

  async get(table, filters) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .match(filters)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async all(table, filters = {}) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .match(filters);
    
    if (error) throw error;
    return data;
  },

  async insert(table, data) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
};
