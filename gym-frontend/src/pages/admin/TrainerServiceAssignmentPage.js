// src/pages/TrainerServiceAssignmentPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function TrainerServiceAssignmentPage() {
    const { trainerId } = useParams(); // Get trainer ID from URL
    const navigate = useNavigate();

    const [trainerInfo, setTrainerInfo] = useState(null);
    const [assignedServices, setAssignedServices] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [selectedServiceToAdd, setSelectedServiceToAdd] = useState(''); // State for the dropdown
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch trainer info, assigned services, and all services
    useEffect(() => {
        const fetchData = async () => {
            setError('');
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('Vui lòng đăng nhập lại.');
                setLoading(false);
                return;
            }

            try {
                // Use Promise.all for parallel fetching
                const [trainerRes, assignedRes, allServicesRes] = await Promise.all([
                    axios.get(`http://localhost:3000/api/trainers/${trainerId}`, { headers: { 'Authorization': `Bearer ${token}` } }), // Fetch trainer details
                    axios.get(`http://localhost:3000/api/trainers/${trainerId}/services`, { headers: { 'Authorization': `Bearer ${token}` } }), // Fetch assigned services
                    axios.get('http://localhost:3000/api/services') // Fetch all services (likely public)
                ]);

                setTrainerInfo(trainerRes.data);
                setAssignedServices(assignedRes.data);
                setAllServices(allServicesRes.data);

            } catch (err) {
                setError('Không thể tải dữ liệu cần thiết.');
                console.error("Fetch assignment data error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [trainerId]); // Re-fetch if trainerId changes

    // Handle removing a service assignment
    const handleRemoveService = async (serviceId) => {
        if (!window.confirm(`Xóa dịch vụ ID ${serviceId} khỏi HLV này?`)) return;

        const token = localStorage.getItem('accessToken');
        setError('');
        try {
            await axios.delete(`http://localhost:3000/api/trainers/${trainerId}/services/${serviceId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Refetch assigned services
            const assignedRes = await axios.get(`http://localhost:3000/api/trainers/${trainerId}/services`, { headers: { 'Authorization': `Bearer ${token}` } });
            setAssignedServices(assignedRes.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa liên kết.');
            console.error("Remove assignment error:", err.response || err);
        }
    };

    // Handle adding a service assignment
    const handleAddService = async () => {
        if (!selectedServiceToAdd) {
            setError('Vui lòng chọn một dịch vụ để thêm.');
            return;
        }

        const token = localStorage.getItem('accessToken');
        setError('');
        try {
            await axios.post(`http://localhost:3000/api/trainers/${trainerId}/services`,
                { dich_vu_id: selectedServiceToAdd }, // Send service ID in body
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            // Refetch assigned services
             const assignedRes = await axios.get(`http://localhost:3000/api/trainers/${trainerId}/services`, { headers: { 'Authorization': `Bearer ${token}` } });
            setAssignedServices(assignedRes.data);
            setSelectedServiceToAdd(''); // Reset dropdown
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi thêm liên kết.');
            console.error("Add assignment error:", err.response || err);
        }
    };

    if (loading) {
        return <p>Đang tải...</p>;
    }
    if (error) {
        return <p style={{ color: 'red' }}>Lỗi: {error}</p>;
    }
    if (!trainerInfo) {
        return <p>Không tìm thấy thông tin HLV.</p>
    }

    // Filter out already assigned services from the dropdown options
    const availableServicesToAdd = allServices.filter(service =>
        !assignedServices.some(assigned => assigned.dich_vu_id === service.dich_vu_id)
    );

    return (
        <div>
            <h2>Quản lý Dịch vụ cho HLV: {trainerInfo.ho_ten} (ID: {trainerId})</h2>

            {/* Section to Add Service */}
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <h3>Thêm Dịch vụ</h3>
                <select
                    value={selectedServiceToAdd}
                    onChange={(e) => setSelectedServiceToAdd(e.target.value)}
                    style={{ marginRight: '10px', padding: '8px' }}
                >
                    <option value="">-- Chọn dịch vụ --</option>
                    {availableServicesToAdd.map(service => (
                        <option key={service.dich_vu_id} value={service.dich_vu_id}>
                            {service.ten} (ID: {service.dich_vu_id})
                        </option>
                    ))}
                </select>
                <button onClick={handleAddService} className="add-button">
                    Thêm
                </button>
                 {/* Display error specifically for adding */}
                 {error.includes('thêm liên kết') && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </div>


            {/* Section to Display Assigned Services */}
            <h3>Các Dịch vụ Đã Gán</h3>
            {assignedServices.length === 0 ? (
                <p>HLV này chưa được gán dịch vụ nào.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>ID Dịch vụ</th>
                            <th>Tên Dịch vụ</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignedServices.map(service => (
                            <tr key={service.dich_vu_id}>
                                <td>{service.dich_vu_id}</td>
                                <td>{service.ten}</td>
                                <td>
                                    <button
                                        onClick={() => handleRemoveService(service.dich_vu_id)}
                                        className="delete-button"
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <button type="button" className="cancel-button" onClick={() => navigate('/admin/trainers')} style={{ marginTop: '20px' }}>
                Quay lại Danh sách HLV
            </button>
        </div>
    );
}

export default TrainerServiceAssignmentPage;