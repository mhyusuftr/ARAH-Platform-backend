import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import WebSocket from 'ws';

global.WebSocket = WebSocket;
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase URL or Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function createAdmin() {
    try {
        const username = 'admin';
        const password = 'adminpassword'; // Change this to a secure password later
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Check if admin already exists
        const { data: existingAdmin } = await supabase
            .from('admins')
            .select('*')
            .eq('username', username)
            .single();
            
        if (existingAdmin) {
            console.log("Admin user already exists");
            return;
        }

        const { data, error } = await supabase
            .from('admins')
            .insert([
                { username, password: hashedPassword, nama: 'Administrator', role: 'admin', email: 'admin@arah.com' }
            ]);

        if (error) {
            console.error("Error creating admin:", error);
        } else {
            console.log("Successfully created admin user: admin / adminpassword");
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

createAdmin();
