import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentTeam, setCurrentTeam] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const savedTeamId = localStorage.getItem('currentTeamId');
        if (storedToken) {
            setToken(storedToken);
            verifyTokenOnMount(storedToken, savedTeamId);
        } else {
            setIsLoading(false);
        }
    }, []);

    const verifyTokenOnMount = async (authToken, savedTeamId = null) => {
        try {
            const response = await fetch(`${API_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const teams = data.data.user.teams || [];
                
                // Try to restore saved team, or fall back to first team
                let selectedTeam = null;
                if (savedTeamId && teams.length > 0) {
                    selectedTeam = teams.find(t => t.teamId === savedTeamId);
                }
                if (!selectedTeam && teams.length > 0) {
                    selectedTeam = teams[0];
                }
                
                const userWithRole = {
                    ...data.data.user,
                    role: selectedTeam?.role || 'MEMBER'
                };
                setCurrentUser(userWithRole);
                setToken(authToken);

                if (selectedTeam) {
                    setCurrentTeam({
                        id: selectedTeam.teamId,
                        name: selectedTeam.teamName || 'Team',
                        role: selectedTeam.role
                    });
                }
            } else {
                localStorage.removeItem('authToken');
                setToken(null);
            }
        } catch (err) {
            console.error('Token verification failed:', err);
            localStorage.removeItem('authToken');
            setToken(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate isManager from currentTeam's role, not the user's global role
    const isManager = currentTeam && (currentTeam.role === 'MANAGER' || currentTeam.role === 'LEAD' || currentTeam.role === 'OWNER');
    const isMember = currentTeam && currentTeam.role === 'MEMBER';

    // Register user
    const register = useCallback(async (email, name, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, name, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Registration failed');
            }

            setCurrentUser(data.data.user);
            setToken(data.data.token);
            localStorage.setItem('authToken', data.data.token);

            return data.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Login user
    const login = useCallback(async (email, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Login failed');
            }

            const firstTeam = data.data.user.teams?.[0];
            const userWithRole = {
                ...data.data.user,
                role: firstTeam?.role || 'MEMBER'
            };

            setCurrentUser(userWithRole);
            setToken(data.data.token);
            localStorage.setItem('authToken', data.data.token);
            
            // Set current team
            if (firstTeam) {
                setCurrentTeam({
                    id: firstTeam.teamId,
                    name: firstTeam.team?.name || 'Team',
                    role: firstTeam.role
                });
            }

            return data.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Logout user
    const logout = useCallback(() => {
        setCurrentUser(null);
        setCurrentTeam(null);
        setToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentTeamId');
    }, []);

    // Save team ID whenever it changes
    useEffect(() => {
        if (currentTeam?.id) {
            localStorage.setItem('currentTeamId', currentTeam.id);
        }
    }, [currentTeam?.id]);

    const value = {
        user: currentUser,
        currentUser,
        setCurrentUser,
        currentTeam,
        setCurrentTeam,
        isLoading,
        isManager,
        isMember,
        isAuthenticated: !!currentUser,
        error,
        token,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
