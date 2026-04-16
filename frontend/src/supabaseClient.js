import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dobgpjhgmenqysikaete.supabase.co'
const SUPABASE_KEY = 'sb_publishable_BYBJ4cH7fIziwNTAgF1kkA_PZc-sDfH'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)