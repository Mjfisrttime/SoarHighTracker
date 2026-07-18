/* Authentication Functions */
const Auth = {
    async register(name, email, password) {
        try {
            // 1. Sign up the user in Supabase Auth
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // 2. Insert user into the 'users' table
                const { error: dbError } = await supabaseClient
                    .from('users')
                    .insert([
                        {
                            id: data.user.id,
                            name: name,
                            email: email,
                            role: 'Member'
                        }
                    ]);

                if (dbError) {
                    console.error("Database insert error:", dbError);
                    throw new Error("Account created but failed to save profile details.");
                }

                Utils.showToast("Registration successful!", "success");
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.error("Registration error:", error.message);
            Utils.showToast(error.message, "error");
            throw error; // Let the caller handle UI reset
        }
    },

    async login(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            
            Utils.showToast("Login successful!", "success");
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error("Login error:", error.message);
            Utils.showToast(error.message, "error");
            throw error;
        }
    },

    async logout() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Logout error:", error.message);
            Utils.showToast("Failed to log out.", "error");
        }
    },

    async checkSession(isProtected = false) {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (isProtected && !session) {
            // Protected route, no session -> redirect to login
            window.location.href = 'login.html';
            return null;
        } else if (!isProtected && session) {
            // Public route (like login/register), but session exists -> redirect to dashboard
            window.location.href = 'dashboard.html';
            return session;
        }
        
        return session;
    },

    async getCurrentUser() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return null;

        // Fetch additional profile data from 'users' table
        const { data: profile } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        return { ...user, ...profile };
    }
};
