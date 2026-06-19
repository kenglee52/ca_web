// src/pages/officer/Report.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Url } from "@/lib/Part";
import { toast } from "sonner";
import { Search, Loader2, ChevronLeft, ChevronRight, Eye, Pencil, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const fmtMoney = (v) => (v ? Number(v).toLocaleString("lo-LA") : "-");

const statusVariants = {
  PENDING: "bg-yellow-500 text-white",
  PENDING_VERIFIER: "bg-blue-500 text-white",
  RETURNED: "bg-red-500 text-white",
  APPROVED: "bg-green-500 text-white",
};

const statusLabels = {
  PENDING: "ລໍຖ້າອະນຸມັດ",
  PENDING_VERIFIER: "ລໍຖ້າກວດສອບ",
  RETURNED: "ສົ່ງກັບແກ້ໄຂ",
  APPROVED: "ອະນຸມັດແລ້ວ",
};

const Report = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [loanType, setLoanType] = useState("ALL");
  const [customerType, setCustomerType] = useState("ALL");

  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        q: q.trim() || undefined,
        status: status !== "ALL" ? status : undefined,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        loanType: loanType !== "ALL" ? loanType : undefined,
        customerType: customerType !== "ALL" ? customerType : undefined,
        page,
        limit,
      };

      const res = await axios.get(`${Url.base_url}/loan-applications/report`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        params,
      });

      setData(res.data.data || []);
      setStats(res.data.stats || {});
    } catch (err) {
      toast.error("ດຶງລາຍງານລົ້ມເຫລວ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [q, status, createdFrom, createdTo, loanType, customerType, page]);

  const totalPages = Math.ceil((stats.total || 0) / limit) || 1;
  const resetFilters = () => {
    setQ("");
    setStatus("ALL");
    setCreatedFrom("");
    setCreatedTo("");
    setLoanType("ALL");
    setCustomerType("ALL");
    setPage(1);
  };
  const EditLoanApplication = (id) => {
    navigate(`/creditofficer/returned/${id}`)
  }
  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">ລາຍງານຄຳຂໍກູ້ທັງໝົດ</h1>
            <p className="text-slate-600 mt-1">ຕິດຕາມແລະສະຫຼຸບສະຖານະຄຳຂໍກູ້ທັງໝົດ</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              ສົ່ງອອກ PDF
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700 gap-2" onClick={fetchReport}>
              <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              ໂຫຼດຂໍ້ມູນໃໝ່
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: "ທັງໝົດ", value: stats.total || 0, color: "text-orange-600" },
            { label: "PENDING", value: stats.pending || 0, color: "text-yellow-600" },
            { label: "REJECT", value: stats.reject || 0, color: "text-blue-600" },
            { label: "RETURNED", value: stats.returned || 0, color: "text-red-600" },
            { label: "APPROVED", value: stats.approved || 0, color: "text-green-600" },
          ].map((stat, i) => (
            <Card key={i} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6 text-center">
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                <p className={`text-3xl md:text-4xl font-bold ${stat.color} mt-2`}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <Card className="mb-8 shadow-md border-none">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* 1. ສະຖານະ */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ສະຖານະ</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-orange-500 focus:ring-orange-500"
                >
                  <option value="ALL">ທັງໝົດ</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PENDING_VERIFIER">ລໍຖ້າ Verifier</option>
                  <option value="RETURNED">RETURNED</option>
                  <option value="APPROVED">APPROVED</option>
                </select>
              </div>

              {/* 2. ຄົ້ນຫາ */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ຄົ້ນຫາ</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="ID / ຊື່ຜູ້ກູ້ / ຈຸດປະສົງ..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
              </div>

              {/* 3. ວັນທີສ້າງ */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ວັນທີສ້າງ</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={createdFrom}
                    onChange={(e) => setCreatedFrom(e.target.value)}
                    className="h-10 w-full"
                  />
                  <span className="text-slate-400">ຫາ</span>
                  <Input
                    type="date"
                    value={createdTo}
                    onChange={(e) => setCreatedTo(e.target.value)}
                    className="h-10 w-full"
                  />
                </div>
              </div>

              {/* 4. ປະເພດການກູ້ */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ປະເພດການກູ້</label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-orange-500 focus:ring-orange-500"
                >
                  <option value="ALL">ທັງໝົດ</option>
                  <option value="PERSONAL_SALARY_GUARANTEE">PERSONAL_SALARY_GUARANTEE</option>
                  <option value="PERSONAL_WITH_COLLATERAL">PERSONAL_WITH_COLLATERAL</option>
                  <option value="BUSINESS">BUSINESS</option>
                </select>
              </div>

              {/* 5. ປະເພດລູກຄ້າ */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ປະເພດລູກຄ້າ</label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-orange-500 focus:ring-orange-500"
                >
                  <option value="ALL">ທັງໝົດ</option>
                  <option value="NEW">ລູກຄ້າໃໝ່</option>
                  <option value="EXISTING">ລູກຄ້າເກົ່າ</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <Button variant="outline" onClick={resetFilters}>
                ລ້າງຕົວກອງ
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={fetchReport}>
                ຄົ້ນຫາ
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-xl overflow-hidden rounded-xl">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-medium">ບໍ່ພົບຂໍ້ມູນ</p>
                <p className="mt-2">ລອງປ່ຽນຕົວກອງ ຫຼື ຄົ້ນຫາໃໝ່</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-20">ID</TableHead>
                      <TableHead>ຜູ້ກູ້</TableHead>
                      <TableHead>ຈຸດປະສົງ</TableHead>
                      <TableHead className="text-right">ຈຳນວນກູ້</TableHead>
                      <TableHead className="text-right">ໄລຍະເວລາ</TableHead>
                      <TableHead>ສະຖານະ</TableHead>
                      <TableHead className="text-right w-32">ຈັດການ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => {
                      const canEdit = item.status === "PENDING" || item.status === "RETURNED";
                      return (
                        <TableRow
                          key={item.id}
                          className="hover:bg-orange-50/50 transition-colors border-b last:border-none"
                        >
                          <TableCell className="font-medium text-slate-800">#{item.id}</TableCell>
                          <TableCell className="font-medium">
                            {item.borrower?.firstName} {item.borrower?.lastName || "-"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.loanPurpose || "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-700">
                            {fmtMoney(item.loanAmountRequested)}
                          </TableCell>
                          <TableCell className="text-right">{item.termMonths} ເດືອນ</TableCell>
                          <TableCell>
                            <Badge
                              className={`${statusVariants[item.status] || "bg-gray-500 text-white"} text-sm px-3 py-1`}
                            >
                              {statusLabels[item.status] || item.status || "ບໍ່ລະບຸ"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-600 hover:text-orange-600"
                                onClick={() => navigate(`/creditofficer/report/${item.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${canEdit ? "text-orange-600 hover:text-orange-700" : "text-slate-400 cursor-not-allowed"}`}
                                onClick={() => {
                                  if (canEdit) {
                                    EditLoanApplication(item.id);
                                  } else {
                                    toast.info("ແກ້ໄຂໄດ້ເຉພາະສະຖານະ PENDING ຫຼື RETURNED");
                                  }
                                }}
                                disabled={!canEdit}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 px-4">
            <p className="text-sm text-slate-600">
              ສະແດງ {data.length} ຈາກ {stats.total || 0} ລາຍການ
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                ກ່ອນໜ້າ
              </Button>

              <span className="text-sm font-medium px-4">
                ໜ້າ {page} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="gap-1"
              >
                ຕໍ່ໄປ
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;