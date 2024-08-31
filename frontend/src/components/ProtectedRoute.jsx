import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute - Restricts access based on user role
 * @param {React.ReactNode} children - Child components to render
 * @param {boolean} requireManager - If true, only managers/leads can access
 */
function ProtectedRoute({ children, requireManager = false }) {
    const { isAuthenticated, isManager, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireManager && !isManager) {
        // Members trying to access analytics pages get redirected
        return <Navigate to="/my-channels" replace />;
    }

    return children;
}

export default ProtectedRoute;
