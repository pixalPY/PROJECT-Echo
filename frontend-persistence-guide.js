/**
 * FRONTEND PERSISTENCE INTEGRATION GUIDE
 * =====================================
 * 
 * This file shows how to integrate the persistence features
 * in your React/JavaScript frontend
 */

class ProjectEchoPersistence {
    constructor(apiBaseUrl = 'http://localhost:3001') {
        this.apiBaseUrl = apiBaseUrl;
        this.authToken = null;
        this.userId = null;
        this.progressSaveInterval = null;
    }

    // 1. LOGIN WITH PROGRESS RESTORATION
    async loginWithPersistence(email, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/custom-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    loadProgress: true // Request full progress restoration
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store user info
                this.userId = data.user.uid;
                
                // Restore complete user state
                const userState = {
                    user: data.user,
                    tasks: data.progress?.tasks || [],
                    plants: data.progress?.plants || [],
                    inventory: data.progress?.inventory || [],
                    activeTheme: data.progress?.activeTheme || { id: 'default' },
                    coins: data.user.userCoins,
                    progressRestored: data.user.progressRestored
                };

                console.log('✅ Login successful - progress restored:', userState);

                // Apply restored theme immediately
                this.applyTheme(userState.activeTheme.id);

                // Start automatic progress saving
                this.startProgressSync();

                return userState;
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login with persistence failed:', error);
            throw error;
        }
    }

    // 2. PURCHASE THEME WITH PERSISTENCE
    async purchaseTheme(themeId, price, autoActivate = true) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/users/inventory/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}` // Firebase ID token
                },
                body: JSON.stringify({
                    itemId: themeId,
                    itemType: 'theme',
                    itemName: this.getThemeName(themeId),
                    price: price,
                    autoActivate: autoActivate
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Theme purchased and persisted:', data);

                // Update local state
                const purchaseResult = {
                    success: true,
                    themeId: data.itemId,
                    remainingCoins: data.remainingCoins,
                    themeActivated: data.themeActivated
                };

                // Apply theme if auto-activated
                if (data.themeActivated) {
                    this.applyTheme(themeId);
                }

                // Save progress snapshot
                await this.saveProgressSnapshot({
                    userCoins: data.remainingCoins,
                    userTheme: data.themeActivated ? themeId : null,
                    lastPurchase: {
                        itemId: themeId,
                        itemType: 'theme',
                        price: price,
                        timestamp: new Date().toISOString()
                    }
                });

                return purchaseResult;
            } else {
                throw new Error(data.error || 'Purchase failed');
            }
        } catch (error) {
            console.error('Theme purchase failed:', error);
            throw error;
        }
    }

    // 3. ACTIVATE THEME WITH PERSISTENCE
    async activateTheme(themeId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/users/theme/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ themeId })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Theme activated and persisted:', data);

                // Apply theme immediately
                this.applyTheme(data.activeTheme);

                // Save progress
                await this.saveProgressSnapshot({
                    userTheme: data.activeTheme,
                    themeChangedAt: new Date().toISOString()
                });

                return { success: true, activeTheme: data.activeTheme };
            } else {
                throw new Error(data.error || 'Theme activation failed');
            }
        } catch (error) {
            console.error('Theme activation failed:', error);
            throw error;
        }
    }

    // 4. AUTOMATIC PROGRESS SYNCHRONIZATION
    startProgressSync(intervalMs = 30000) { // Save every 30 seconds
        if (this.progressSaveInterval) {
            clearInterval(this.progressSaveInterval);
        }

        this.progressSaveInterval = setInterval(async () => {
            try {
                await this.saveCurrentProgress();
            } catch (error) {
                console.warn('Auto-save failed:', error.message);
            }
        }, intervalMs);

        console.log(`✅ Progress auto-sync started (${intervalMs}ms interval)`);
    }

    stopProgressSync() {
        if (this.progressSaveInterval) {
            clearInterval(this.progressSaveInterval);
            this.progressSaveInterval = null;
            console.log('✅ Progress auto-sync stopped');
        }
    }

    // 5. SAVE PROGRESS SNAPSHOT
    async saveProgressSnapshot(progressData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/users/progress/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(progressData)
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Progress saved:', data);
                return data;
            } else {
                throw new Error(data.error || 'Progress save failed');
            }
        } catch (error) {
            console.error('Progress save failed:', error);
            throw error;
        }
    }

    // 6. SAVE CURRENT PROGRESS (AUTO-SYNC)
    async saveCurrentProgress() {
        // Get current state from your app
        const currentState = this.getCurrentAppState();

        return await this.saveProgressSnapshot({
            userCoins: currentState.coins,
            userTheme: currentState.activeTheme,
            currentLevel: currentState.level,
            tasksCompleted: currentState.completedTasksCount,
            plantsGrown: currentState.plants.length,
            sessionData: {
                lastActivity: new Date().toISOString(),
                currentPage: window.location.pathname,
                actionsThisSession: currentState.sessionActions
            }
        });
    }

    // 7. LOGOUT WITH PERSISTENCE
    async logoutWithPersistence() {
        try {
            // Stop auto-sync
            this.stopProgressSync();

            // Save final progress
            await this.saveCurrentProgress();

            // End session on server
            const response = await fetch(`${this.apiBaseUrl}/api/users/session/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Logout with persistence successful:', data);

                // Clear local state
                this.authToken = null;
                this.userId = null;

                return { success: true, message: 'Progress saved and logged out' };
            } else {
                throw new Error(data.error || 'Logout failed');
            }
        } catch (error) {
            console.error('Logout with persistence failed:', error);
            throw error;
        }
    }

    // 8. LOAD COMPLETE PROGRESS
    async loadCompleteProgress() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/users/progress/load`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Complete progress loaded:', data);
                return data.progress;
            } else {
                throw new Error(data.error || 'Progress load failed');
            }
        } catch (error) {
            console.error('Progress load failed:', error);
            throw error;
        }
    }

    // HELPER METHODS
    applyTheme(themeId) {
        // Apply theme to your UI
        document.body.className = `theme-${themeId}`;
        
        // Store in localStorage as backup
        localStorage.setItem('activeTheme', themeId);
        
        console.log(`🎨 Theme applied: ${themeId}`);
    }

    getThemeName(themeId) {
        const themeNames = {
            'default': 'Default Theme',
            'dark-theme': 'Dark Theme',
            'nature-theme': 'Nature Theme',
            'ocean-theme': 'Ocean Theme',
            'sunset-theme': 'Sunset Theme'
        };
        return themeNames[themeId] || themeId;
    }

    getCurrentAppState() {
        // This should return your current app state
        // Implement this based on your state management (Redux, Context, etc.)
        return {
            coins: 100, // Get from your state
            activeTheme: 'default', // Get from your state
            level: 1, // Get from your state
            completedTasksCount: 5, // Get from your state
            plants: [], // Get from your state
            sessionActions: ['login', 'task_completed'] // Track user actions
        };
    }
}

// REACT HOOK EXAMPLE
function usePersistence() {
    const [persistence] = React.useState(() => new ProjectEchoPersistence());
    const [isLoading, setIsLoading] = React.useState(false);
    const [userState, setUserState] = React.useState(null);

    const loginWithPersistence = async (email, password) => {
        setIsLoading(true);
        try {
            const state = await persistence.loginWithPersistence(email, password);
            setUserState(state);
            return state;
        } finally {
            setIsLoading(false);
        }
    };

    const purchaseTheme = async (themeId, price) => {
        setIsLoading(true);
        try {
            const result = await persistence.purchaseTheme(themeId, price);
            
            // Update local state
            setUserState(prev => ({
                ...prev,
                coins: result.remainingCoins,
                activeTheme: result.themeActivated ? { id: themeId } : prev.activeTheme
            }));
            
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    const logoutWithPersistence = async () => {
        setIsLoading(true);
        try {
            await persistence.logoutWithPersistence();
            setUserState(null);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        loginWithPersistence,
        purchaseTheme,
        logoutWithPersistence,
        isLoading,
        userState
    };
}

// USAGE EXAMPLE IN REACT COMPONENT
function App() {
    const { loginWithPersistence, purchaseTheme, logoutWithPersistence, isLoading, userState } = usePersistence();

    const handleLogin = async (email, password) => {
        try {
            const state = await loginWithPersistence(email, password);
            console.log('User state restored:', state);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const handlePurchaseTheme = async (themeId) => {
        try {
            const result = await purchaseTheme(themeId, 50);
            console.log('Theme purchased:', result);
        } catch (error) {
            console.error('Purchase failed:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await logoutWithPersistence();
            console.log('Logged out with progress saved');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div>
            {userState ? (
                <div>
                    <h1>Welcome back, {userState.user.name}!</h1>
                    <p>Coins: {userState.coins}</p>
                    <p>Theme: {userState.activeTheme.id}</p>
                    <p>Progress Restored: {userState.progressRestored ? 'Yes' : 'No'}</p>
                    
                    <button onClick={() => handlePurchaseTheme('dark-theme')} disabled={isLoading}>
                        Purchase Dark Theme (50 coins)
                    </button>
                    
                    <button onClick={handleLogout} disabled={isLoading}>
                        Logout (Save Progress)
                    </button>
                </div>
            ) : (
                <LoginForm onLogin={handleLogin} isLoading={isLoading} />
            )}
        </div>
    );
}

export { ProjectEchoPersistence, usePersistence };
