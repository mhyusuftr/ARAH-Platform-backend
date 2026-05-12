import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

// Make sure to load environment variables
dotenv.config();

// Polyfill WebSocket globally for Supabase RealtimeClient in Node < 22
global.WebSocket = WebSocket;

// Usually backend uses SUPABASE_URL and SUPABASE_ANON_KEY (or SERVICE_ROLE_KEY)
// Since we are reading from the .env created by the user:
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  }
});

console.log('Supabase instance initialized in backend with URL:', supabaseUrl);
