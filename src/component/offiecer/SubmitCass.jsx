// src/pages/officer/Report.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Url } from "@/lib/Part";
import { toast } from "sonner";
import { FileText, Loader2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const fmtMoney = (v) => (v ? Number(v).toLocaleString("lo-LA") : "-");

const Report = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    const fetchAllApplications = async () => {
      try {
        // ดึงทุกคำขอ (หรือ filter ตาม CO ถ้ามี backend support)
        const res = await axios.get(`${Url.base_url}/loan-applications`, {
          headers,
          params: { status: statusFilter === "ALL" ? undefined : statusFilter },
        });
        setApplications(res.data.data || []);
      } catch (err) {
        toast.error("ດຶງຂໍ້ມູນລາຍງານລົ້ມເຫລວ");
      } finally {
        setLoading(false);
      }
    };

    fetchAllApplications();
  }, [statusFilter]);

  const filteredApps = applications.filter(app => {
    const searchLower = search.toLowerCase();
    return (
      app.id.toString().includes(searchLower) ||
      (app.borrower?.firstName + " " + app.borrower?.lastName).toLowerCase().includes(searchLower) ||
      app.loanPurpose?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "PENDING").length,
    pendingVerifier: applications.filter(a => a.status === "PENDING_VERIFIER").length,
    returned: applications.filter(a => a.status === "RETURNED").length,
    approved: applications.filter(a => a.status === "APPROVED").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-16 w-16 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-orange-600">ລາຍງານຄຳຂໍກູ້ທັງໝົດ</h1>

        <div className="flex flex-wrap gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ຄົ້ນຫາດ້ວຍ ID / ຊື່ / ຈຸດປະສົງ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-4 py-2 bg-white"
          >
            <option value="ALL">ທັງໝົດ</option>
            <option value="PENDING">ລໍຖ້າອະນຸມັດ</option>
            <option value="PENDING_VERIFIER">ລໍຖ້າ Verifier</option>
            <option value="RETURNED">ສົ່ງກັບແກ້ໄຂ</option>
            <option value="APPROVED">ອະນຸມັດແລ້ວ</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="bg-white shadow">
          <CardContent className="p-6 text-center">
            <p className="text-slate-500 text-sm">ຄຳຂໍທັງໝົດ</p>
            <p className="text-3xl font-bold text-orange-600">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow">
          <CardContent className="p-6 text-center">
            <p className="text-slate-500 text-sm">ລໍຖ້າອະນຸມັດ</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow">
          <CardContent className="p-6 text-center">
            <p className="text-slate-500 text-sm">ລໍຖ້າ Verifier</p>
            <p className="text-3xl font-bold text-blue-600">{stats.pendingVerifier}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow">
          <CardContent className="p-6 text-center">
            <p className="text-slate-500 text-sm">ສົ່ງກັບແກ້ໄຂ</p>
            <p className="text-3xl font-bold text-red-600">{stats.returned}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow">
          <CardContent className="p-6 text-center">
            <p className="text-slate-500 text-sm">ອະນຸມັດແລ້ວ</p>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table รายการทั้งหมด */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">ລາຍການຄຳຂໍກູ້ທັງໝົດ</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredApps.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              ບໍ່ມີຂໍ້ມູນຄຳຂໍກູ້
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>ຊື່ຜູ້ກູ້</TableHead>
                    <TableHead>ຈຸດປະສົງ</TableHead>
                    <TableHead className="text-right">ຈຳນວນກູ້</TableHead>
                    <TableHead className="text-right">ໄລຍະເວລາ</TableHead>
                    <TableHead>ສະຖານະ</TableHead>
                    <TableHead className="text-right">ການກະທຳ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => (
                    <TableRow key={app.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">#{app.id}</TableCell>
                      <TableCell>
                        {app.borrower?.firstName} {app.borrower?.lastName || "-"}
                      </TableCell>
                      <TableCell>{app.loanPurpose || "-"}</TableCell>
                      <TableCell className="text-right">{fmtMoney(app.loanAmountRequested)} ກີບ</TableCell>
                      <TableCell className="text-right">{app.termMonths} ເດືອນ</TableCell>
                      <TableCell>
                        <Badge variant={
                          app.status === "APPROVED" ? "success" :
                          app.status === "RETURNED" ? "destructive" :
                          app.status === "PENDING_VERIFIER" ? "default" : "secondary"
                        }>
                          {app.status || "ບໍ່ລະບຸ"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/creditofficer/report/${app.id}`)} // ไปหน้า detail ถ้าต้องการ
                        >
                          ເບິ່ງລາຍລະອຽດ
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Report;