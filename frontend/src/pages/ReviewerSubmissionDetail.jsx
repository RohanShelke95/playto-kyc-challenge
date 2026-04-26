import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const ReviewerSubmissionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sub, setSub] = useState(null);
    const [reason, setReason] = useState('');

    useEffect(() => {
        api.get(`kyc/reviewer/submissions/${id}/`).then(res => setSub(res.data)).catch(console.error);
    }, [id]);

    const handleTransition = async (action) => {
        if ((action === 'reject' || action === 'request_info') && !reason) {
            alert('Please provide a reason');
            return;
        }
        try {
            await api.post(`kyc/reviewer/submissions/${id}/transition/`, { action, reason });
            navigate('/reviewer');
        } catch (err) {
            alert(err.response?.data?.error || 'Error processing request');
        }
    };

    if (!sub) return <div className="p-8">Loading...</div>;

    const DocLink = ({ url, label }) => url ? (
        <a href={`${url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{label}</a>
    ) : <span className="text-gray-400">Not provided</span>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow border border-gray-100">
                <button onClick={() => navigate('/reviewer')} className="text-sm text-gray-500 mb-6 hover:text-gray-900">&larr; Back to Queue</button>
                
                <h1 className="text-2xl font-bold mb-6 pb-2 border-b">Review Submission #{sub.id}</h1>
                
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-700">Personal Data</h3>
                        <p className="text-sm mb-1"><span className="font-medium">Name:</span> {sub.personal_name}</p>
                        <p className="text-sm mb-1"><span className="font-medium">Email:</span> {sub.personal_email}</p>
                        <p className="text-sm mb-1"><span className="font-medium">Phone:</span> {sub.personal_phone}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-700">Business Data</h3>
                        <p className="text-sm mb-1"><span className="font-medium">Name:</span> {sub.business_name}</p>
                        <p className="text-sm mb-1"><span className="font-medium">Type:</span> {sub.business_type}</p>
                        <p className="text-sm mb-1"><span className="font-medium">Expected Vol:</span> ${sub.expected_monthly_volume}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Documents</h3>
                    <ul className="space-y-2">
                        <li><DocLink url={sub.pan_document} label="PAN Card file" /></li>
                        <li><DocLink url={sub.aadhaar_document} label="Aadhaar Card file" /></li>
                        <li><DocLink url={sub.bank_statement} label="Bank Statement file" /></li>
                    </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-semibold mb-3">Review Action</h3>
                    <textarea 
                        className="w-full border rounded p-2 mb-4 bg-white" rows="3" 
                        placeholder="Reason (required for Reject or More Info)..."
                        value={reason} onChange={e => setReason(e.target.value)}
                    ></textarea>
                    <div className="flex gap-4">
                        <button onClick={() => handleTransition('approve')} className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700">Approve</button>
                        <button onClick={() => handleTransition('reject')} className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700">Reject</button>
                        <button onClick={() => handleTransition('request_info')} className="bg-yellow-500 text-white px-4 py-2 rounded font-semibold hover:bg-yellow-600">Request Info</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewerSubmissionDetail;
