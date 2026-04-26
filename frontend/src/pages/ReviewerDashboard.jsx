import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ReviewerDashboard = () => {
    const { logout } = useContext(AuthContext);
    const [queue, setQueue] = useState([]);
    const [metrics, setMetrics] = useState({ queue_count: 0, avg_time_seconds: 0, approval_rate_7d: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const mRes = await api.get('kyc/reviewer/metrics');
            setMetrics(mRes.data);
            
            const qRes = await api.get('kyc/reviewer/queue');
            setQueue(qRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds) return '0 hrs';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">Reviewer Dashboard</h1>
                <button onClick={logout} className="text-sm font-semibold text-gray-600 hover:text-red-500">Logout</button>
            </header>

            <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-sm font-medium text-gray-500">Submissions in Queue</div>
                        <div className="mt-2 text-3xl font-bold text-gray-900">{metrics.queue_count}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-sm font-medium text-gray-500">Avg Time in Queue</div>
                        <div className="mt-2 text-3xl font-bold text-gray-900">{formatTime(metrics.avg_time_seconds)}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-sm font-medium text-gray-500">Approval Rate (7 days)</div>
                        <div className="mt-2 text-3xl font-bold inline-flex items-baseline text-green-600">
                            {metrics.approval_rate_7d.toFixed(1)}<span className="text-lg ml-1">%</span>
                        </div>
                    </div>
                </div>

                {/* Queue */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {queue.map((item) => (
                                <tr key={item.id} className={item.is_at_risk ? 'bg-red-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{item.personal_name || 'N/A'}</div>
                                        <div className="text-sm text-gray-500">{item.merchant_email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.business_name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                                            {item.status.replace(/_/g, ' ')}
                                        </span>
                                        {item.is_at_risk && <span className="ml-2 px-2 text-xs font-bold text-red-600">at_risk</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(item.submitted_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link to={`/reviewer/submission/${item.id}`} className="text-indigo-600 hover:text-indigo-900">Review Data</Link>
                                    </td>
                                </tr>
                            ))}
                            {queue.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No submissions in queue.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default ReviewerDashboard;
