// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Url } from '@/lib/Part';
import { toast } from 'sonner';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B'];

const COLORS_STATUS = [
  '#F59E0B', // PENDING     -> ເຫຼືອງ (ລໍຖ້າດຳເນີນ)
  '#10B981', // APPROVED    -> ຂຽວ (ສຳເລັດ/ອະນຸມັດ)
  '#06B6D4', // DISBURSED   -> ຟ້າ (ເບີກຈ່າຍແລ້ວ)
  '#6B7280', // CLOSED      -> ເທົາ (ປິດສັນຍາ)
  '#F97316', // OVERDUE     -> ສົ້ມ (ຄ້າງຊຳລະ)
  '#8B5CF6', // RETURNED    -> ມ່ວງ (ສົ່ງກັບແກ້ໄຂ)
  '#EF4444', // REJECTED    -> ແດງ (ປະຕິເສດ)
];

const Dashboard = () => {
    const [loanTypes, setLoanTypes] = useState([]);
    const [approvalStatus, setApprovalStatus] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [monthlyApprovalData, setMonthlyApprovalData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approvedLoanTypes, setApprovedLoanTypes] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                // 5. สัดส่วนประเภทคำขอ (เฉพาะ APPROVED)
                const approvedTypeRes = await axios.get(
                    `${Url.base_url}/dashboard/approved-loan-types-summary`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (approvedTypeRes.data.success) setApprovedLoanTypes(approvedTypeRes.data.data || []);

                // 1. สัดส่วนประเภทสินเชื่อ (Donut 1)
                const typeRes = await axios.get(`${Url.base_url}/dashboard/loan-types-summary`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (typeRes.data.success) setLoanTypes(typeRes.data.data || []);

                // 2. สัดส่วนสถานะอนุมัติ (Donut 2)
                const statusRes = await axios.get(`${Url.base_url}/dashboard/approval-status-summary`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (statusRes.data.success) setApprovalStatus(statusRes.data.data || []);

                // 3. แนวโน้มรายเดือนตามประเภทสินเชื่อ
                const monthlyRes = await axios.get(`${Url.base_url}/dashboard/monthly-applications`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (monthlyRes.data.success) setMonthlyData(monthlyRes.data.data || []);

                // 4. แนวโน้มรายเดือนตามสถานะอนุมัติ
                const monthlyStatusRes = await axios.get(`${Url.base_url}/dashboard/approval-status-monthly`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (monthlyStatusRes.data.success) setMonthlyApprovalData(monthlyStatusRes.data.data || []);

            } catch (err) {
                console.error('Dashboard fetch error:', err);
                toast.error('ไม่สามารถดึงข้อมูลแดชบอร์ดได้');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-600">ກຳລັງໂຫຼດຂໍ້ມູນ Dashboard...</div>;
    }

    const totalLoan = loanTypes.reduce((sum, item) => sum + item.count, 0);
    const totalApproved = approvalStatus.find(s => s.status === 'APPROVED')?.count || 0;

    return (
        <div className="p-6 space-y-10 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard ລະບົບກູ້ຢືມ</h1>
            {/* Row 1.5: Donut 3 (Approved by Loan Type) */}


            {/* Row 1: สอง Donut Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center justify-center">
                {/* Donut 1: สัดส่วนประเภทคำขอ */}
                <div className="bg-white p-6 rounded-xl shadow-lg  items-center justify-center">
                    <h2 className="text-xl font-semibold mb-6 text-center">ສັດສ່ວນປະເພດຄຳຂໍກູ້</h2>
                    <div className="flex  h-96  ">
                        <ResponsiveContainer >
                            <PieChart >
                                <Pie data={loanTypes} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={110} innerRadius={60} label>
                                    {loanTypes.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut 2: สัดส่วนสถานะอนุมัติ */}
                <div className="bg-white p-6 rounded-xl shadow-lg items-center justify-center">
                    <h2 className="text-xl font-semibold mb-6 text-center">ສັດສ່ວນສະຖານະການອະນຸມັດ</h2>
                    <div className="flex  h-96  ">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={approvalStatus} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={110} innerRadius={60} label>
                                    {approvalStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg items-center justify-center ">
                    <h2 className="text-xl font-semibold mb-6 text-center">
                        ສັດສ່ວນປະເພດຄຳຂໍກູ້ (ສະເພາະອະນຸມັດແລ້ວ)
                    </h2>
                    <div className="flex  h-96  ">
                        <ResponsiveContainer>
                            <PieChart >
                                <Pie
                                    data={approvedLoanTypes}
                                    dataKey="count"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={110}
                                    innerRadius={60}
                                    label
                                >
                                    {approvedLoanTypes.map((entry, index) => (
                                        <Cell key={`cell-approved-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 2: สอง Composed Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Composed 1: แนวโน้มตามประเภทสินเชื่อ */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-6 text-center">ແນວໂນ້ມຄຳຂໍກູ້ລາຍເດືອນ (ແຍກປະເພດ)</h2>
                    <div className="h-80">
                        <ResponsiveContainer>
                            <ComposedChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="total" fill="#8884d8" stroke="#8884d8" fillOpacity={0.3} name="ທັງໝົດ" />
                                <Bar dataKey="PERSONAL_SALARY_GUARANTEE" fill="#FF6B6B" name="ສິນເຊື່ອບຸກຄົນທີ່ມີເງີນເດືອນຄໍ້າປະກັນ" />
                                <Bar dataKey="PERSONAL_WITH_COLLATERAL" fill="#4ECDC4" name="ສິນເຊື່ອບຸກຄົນທີ່ມີຫຼັກຊັບຄໍ້າປະກັນ" />
                                <Bar dataKey="BUSINESS" fill="#45B7D1" name="ສິນເຊື່ອທຸລະກິດ" />
                                <Line type="monotone" dataKey="total" stroke="#ff7300" strokeWidth={2} name="ແນວໂນ້ມທັງໝົດ" dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Composed 2: แนวโน้มตามสถานะอนุมัติ */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-6 text-center">ແນວໂນ້ມຄຳຂໍກູ້ລາຍເດືອນ (ແຍກສະຖານະ)</h2>
                    <div className="h-80">
                        <ResponsiveContainer>
                            <ComposedChart data={monthlyApprovalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="total" fill="#8884d8" stroke="#8884d8" fillOpacity={0.3} name="ທັງໝົດ" />
                                <Bar dataKey="APPROVED" fill="#10B981" name="ອະນຸມັດແລ້ວ" />
                                <Bar dataKey="PENDING" fill="#F59E0B" name="ລໍຖ້າອະນຸມັດ" />
                                <Bar dataKey="REJECTED" fill="#EF4444" name="ປະຕິເສດ" />
                                <Bar dataKey="RETURNED" fill="#8B5CF6" name="ສົ່ງກັບໄປແກ້ໄຂ" />
                                <Line type="monotone" dataKey="total" stroke="#ff7300" strokeWidth={2} name="ແນວໂນ້ມທັງໝົດ" dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow text-center">
                    <h3 className="text-lg font-medium text-gray-600">ຄຳຂໍທັງໝົດ</h3>
                    <p className="text-4xl font-bold text-orange-600">{totalLoan}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow text-center">
                    <h3 className="text-lg font-medium text-gray-600">ອະນຸມັດແລ້ວ</h3>
                    <p className="text-4xl font-bold text-green-600">
                        {approvalStatus.find(s => s.status === 'APPROVED')?.count || 0}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow text-center">
                    <h3 className="text-lg font-medium text-gray-600">ລໍຖ້າປະມວນຜົນ</h3>
                    <p className="text-4xl font-bold text-yellow-600">
                        {approvalStatus.find(s => s.status === 'PENDING')?.count || 0}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow text-center">
                    <h3 className="text-lg font-medium text-gray-600">ປະຕິເສດ/ສົ່ງກັບ</h3>
                    <p className="text-4xl font-bold text-red-600">
                        {(approvalStatus.find(s => s.status === 'REJECTED')?.count || 0) +
                            (approvalStatus.find(s => s.status === 'RETURNED')?.count || 0)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;