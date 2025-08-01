// Access Control and Subscription Management
class AccessControl {
    constructor(supabase) {
        this.supabase = supabase;
        this.currentUser = null;
        this.userProfile = null;
    }

    async checkAuth() {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) {
            window.location.href = 'auth.html';
            return false;
        }
        this.currentUser = user;
        return true;
    }

    async loadUserProfile() {
        if (!this.currentUser) return false;

        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('user_id', this.currentUser.id)
            .single();

        if (error) {
            console.error('Error loading profile:', error);
            return false;
        }

        this.userProfile = data;
        return true;
    }

    async checkAccess() {
        // First check if user is authenticated
        if (!await this.checkAuth()) return false;

        // Load user profile
        if (!await this.loadUserProfile()) {
            window.location.href = 'auth.html';
            return false;
        }

        // Check if user is pro
        if (this.userProfile.is_pro_user) {
            // Pro user - check subscription expiry
            if (this.userProfile.subscription_expiry_date && 
                new Date() > new Date(this.userProfile.subscription_expiry_date)) {
                // Subscription expired
                window.location.href = 'pay.html';
                return false;
            }
            // Pro user with active subscription
            return true;
        }

        // Free user - check trial period
        const trialEnd = new Date(this.userProfile.trial_start_date);
        trialEnd.setDate(trialEnd.getDate() + 7);
        
        if (new Date() > trialEnd) {
            // Trial expired
            window.location.href = 'pay.html';
            return false;
        }

        // Trial still active
        return true;
    }

    getTrialDaysLeft() {
        if (!this.userProfile) return 0;
        
        const trialEnd = new Date(this.userProfile.trial_start_date);
        trialEnd.setDate(trialEnd.getDate() + 7);
        
        const daysLeft = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));
        return Math.max(0, daysLeft);
    }

    isProUser() {
        return this.userProfile?.is_pro_user || false;
    }

    getSubscriptionExpiry() {
        return this.userProfile?.subscription_expiry_date || null;
    }
}

// Export for use in other files
window.AccessControl = AccessControl; 