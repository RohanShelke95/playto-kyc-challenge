import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import MerchantDashboard from './pages/MerchantDashboard';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ReviewerSubmissionDetail from './pages/ReviewerSubmissionDetail';

const PrivateRoute = ({ children, requiredRole }) => {
    const { user, loading } = useContext(AuthContext);
    
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/" />; // fallback to main
    }

    return children;
};

const Root = () => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Loading...</div>;

    if (!user) return <Navigate to="/login" />;
    if (user.role === 'merchant') return <Navigate to="/merchant" />;
    if (user.role === 'reviewer') return <Navigate to="/reviewer" />;
    return <div>Invalid Role</div>;
};

function App() {
  return (
    <AuthProvider>
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Root />} />
                
                <Route path="/merchant" element={
                    <PrivateRoute requiredRole="merchant"><MerchantDashboard /></PrivateRoute>
                } />
                
                <Route path="/reviewer" element={
                    <PrivateRoute requiredRole="reviewer"><ReviewerDashboard /></PrivateRoute>
                } />
                
                <Route path="/reviewer/submission/:id" element={
                    <PrivateRoute requiredRole="reviewer"><ReviewerSubmissionDetail /></PrivateRoute>
                } />
            </Routes>
        </Router>
    </AuthProvider>
  );
}

export default App;
