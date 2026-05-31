import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewsqhvbbyvzhjamabsir.supabase.co';
const supabaseAnonKey = 'sb_publishable_fgw4q4UNWZGHbA8Ht4eZQQ_20okaz97';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});