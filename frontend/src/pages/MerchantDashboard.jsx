import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const MerchantDashboard = () => {
    const { logout } = useContext(AuthContext);
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({});
    
    // For file inputs
    const [panDoc, setPanDoc] = useState(null);
    const [aadhaarDoc, setAadhaarDoc] = useState(null);
    const [bankStmt, setBankStmt] = useState(null);

    const fetchSubmission = async () => {
        try {
            const res = await api.get('kyc/merchant');
            setSubmission(res.data);
            setFormData(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmission();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(k => {
            if (formData[k] !== null && formData[k] !== undefined && !k.includes('_document') && k !== 'bank_statement') {
                data.append(k, formData[k]);
            }
        });
        
        if (panDoc) data.append('pan_document', panDoc);
        if (aadhaarDoc) data.append('aadhaar_document', aadhaarDoc);
        if (bankStmt) data.append('bank_statement', bankStmt);
        
        try {
            await api.put('kyc/merchant', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Progress saved!');
            fetchSubmission();
            setPanDoc(null); setAadhaarDoc(null); setBankStmt(null);
        } catch (error) {
            console.error(error);
            alert(JSON.stringify(error.response?.data || "Error saving"));
        }
    };

    const handleSubmitForReview = async () => {
        try {
            await api.post('kyc/merchant/submit');
            alert('Submitted for review!');
            fetchSubmission();
        } catch (error) {
            alert(error.response?.data?.error || "Error submitting");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your dashboard...</div>;

    if (!submission) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
            <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">Could not load dashboard</h2>
                <p className="text-gray-600 mb-4">Unable to connect to the server. Please try refreshing the page.</p>
                <button onClick={fetchSubmission} className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700">
                    Retry
                </button>
            </div>
        </div>
    );

    const isEditable = submission.status === 'draft' || submission.status === 'more_info_requested';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">Merchant Dashboard</h1>
                <button onClick={logout} className="text-sm font-semibold text-gray-600 hover:text-red-500">Logout</button>
            </header>
            
            <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
                <div className="bg-white p-6 rounded-lg shadow mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700">KYC Status</h2>
                        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 uppercase">
                            {submission.status.replace(/_/g, ' ')}
                        </div>
                    </div>
                    {isEditable && (
                        <button 
                            onClick={handleSubmitForReview} 
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow font-semibold"
                        >
                            Submit Application
                        </button>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium border-b pb-2 mb-4">Application Form</h3>
                    
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Personal Name</label>
                                <input type="text" name="personal_name" value={formData.personal_name || ''} onChange={handleChange} disabled={!isEditable} className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Personal Email</label>
                                <input type="email" name="personal_email" value={formData.personal_email || ''} onChange={handleChange} disabled={!isEditable} className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Personal Phone</label>
                                <input type="text" name="personal_phone" value={formData.personal_phone || ''} onChange={handleChange} disabled={!isEditable} className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border" />
                            </div>

                            <div className="md:col-span-2 mt-4"><h3 className="font-medium text-gray-700">Business Details</h3></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                                <input type="text" name="business_name" value={formData.business_name || ''} onChange={handleChange} disabled={!isEditable} className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Business Type</label>
                                <input type="text" name="business_type" value={formData.business_type || ''} onChange={handleChange} disabled={!isEditable} className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Expected Monthly Volume (USD)</label>
                                <input type="number" step="0.01" name="expected_monthly_volume" value={formData.expected_monthly_volume || ''} onChange={handleChange} disabled={!isEditable} className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border" />
                            </div>

                            <div className="md:col-span-2 mt-4"><h3 className="font-medium text-gray-700">Documents (Max 5MB, PDF/JPG/PNG)</h3></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Document</label>
                                {isEditable && <input type="file" onChange={e => setPanDoc(e.target.files[0])} accept=".pdf,.jpg,.png" className="block w-full text-sm" />}
                                {submission.pan_document && <a href={`${submission.pan_document}`} target="_blank" rel="noreferrer" className="text-blue-500 text-sm block mt-1">View Current PAN</a>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Document</label>
                                {isEditable && <input type="file" onChange={e => setAadhaarDoc(e.target.files[0])} accept=".pdf,.jpg,.png" className="block w-full text-sm" />}
                                {submission.aadhaar_document && <a href={`${submission.aadhaar_document}`} target="_blank" rel="noreferrer" className="text-blue-500 text-sm block mt-1">View Current Aadhaar</a>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Statement</label>
                                {isEditable && <input type="file" onChange={e => setBankStmt(e.target.files[0])} accept=".pdf,.jpg,.png" className="block w-full text-sm" />}
                                {submission.bank_statement && <a href={`${submission.bank_statement}`} target="_blank" rel="noreferrer" className="text-blue-500 text-sm block mt-1">View Current Bank Statement</a>}
                            </div>
                        </div>

                        {isEditable && (
                            <div className="pt-4 border-t">
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow font-semibold">
                                    Save Progress
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </main>
        </div>
    );
};

export default MerchantDashboard;
