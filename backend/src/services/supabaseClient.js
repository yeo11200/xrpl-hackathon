const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	autoRefreshToken: true,
	persistSession: false,
	headers: {
		'X-Client-Info': 'xrpl-hackathon-backend'
	}
});

module.exports = {
	supabase
};

