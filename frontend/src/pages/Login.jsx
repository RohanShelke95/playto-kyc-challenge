import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { login, register } = useContext(AuthContext);
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('merchant');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isLogin) {
                await login(username, password);
            } else {
                await register(username, password, role);
            }
            navigate('/');
        } catch (error) {
            console.error(error.response?.data);
            const errData = error.response?.data;
            if (errData && typeof errData === 'object') {
                const msgs = Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join('\n');
                alert(`Authentication failed:\n${msgs}`);
            } else {
                alert('Authentication failed');
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-900">
            <div className="p-8 bg-white shadow-xl rounded-lg w-96 border border-gray-100">
                <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">Playto Pay KYC</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="text" placeholder="Username" required 
                        value={username} onChange={e => setUsername(e.target.value)}
                        className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <input 
                        type="password" placeholder="Password" required 
                        value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    {!isLogin && (
                        <select 
                            value={role} onChange={e => setRole(e.target.value)}
                            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="merchant">Merchant</option>
                            <option value="reviewer">Reviewer</option>
                        </select>
                    )}
                    <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition">
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                    <p className="text-center text-sm cursor-pointer text-gray-500 hover:text-blue-600" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
