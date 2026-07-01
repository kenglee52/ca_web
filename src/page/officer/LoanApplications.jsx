import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Url } from "@/lib/Part";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// import lucide-react แค่ชุดเดียว (ไม่ต้องซ้ำ FileText ถ้ามันมีอยู่แล้ว หรือเพิ่มเฉพาะที่ใช้จริง)
import { Plus, Search, Pencil, Eye, FileText } from "lucide-react"; // ถ้า FileText ยัง error → ลบออกก่อน แล้วค่อยเพิ่มทีหลัง

const fmtMoney = (v) => {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("lo-LA");
};
const statusColors = {
  PENDING: "bg-yellow-500 hover:bg-yellow-600 text-white",
  PENDING_VERIFIER: "bg-blue-500 hover:bg-blue-600 text-white",
  RETURNED: "bg-red-500 hover:bg-red-600 text-white",
  APPROVED: "bg-green-500 hover:bg-green-600 text-white",
  REJECTED: "bg-gray-500 hover:bg-gray-600 text-white",
  ACTIVE: "bg-indigo-500 hover:bg-indigo-600 text-white",
  CLOSED: "bg-slate-500 hover:bg-slate-600 text-white",
  DEFAULT: "bg-slate-400 hover:bg-slate-500 text-white",
};

const LoanApplications = () => {
  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem("token"), []);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${Url.base_url}/loan-applications`, {
        headers,
        params: {
          q: q?.trim() || undefined,
          status: status || undefined,
          page,
          limit,
        },
      });

      setItems(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || "ດຶງລາຍການຄຳຂໍກູ້ລົ້ມເຫລວ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, limit, status, q]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const onCreate = () => {
    navigate("/creditofficer/applications/create");
  };

  const onEdit = (row) => {
    if (row.status !== "PENDING" && row.status !== "RETURNED") {
      toast.error("ແກ້ໄຂໄດ້ເຉພາະສະຖານະ PENDING ຫຼື RETURNED ເທົ່ານັ້ນ");
      return;
    }
    navigate(`/creditofficer/applications/${row.id}`);
  };

  const onView = (row) => {
    navigate(`/creditofficer/applications-detail/${row.id}`);
  };

  const getStatusBadge = (status) => {
    const colorClass = statusColors[status] || statusColors.DEFAULT;
    return (
      <Badge className={`${colorClass} px-3 py-1 text-sm font-medium`}>
        {status || "ບໍ່ລະບຸ"}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <Card className="border-none shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl font-bold">ຈັດການຄຳຂໍກູ້</CardTitle>
                <p className="text-sm text-orange-100 mt-1">
                  {total} ລາຍການ • ສະຖານະປັດຈຸບັນ
                </p>
              </div>
            </div>

            <Button
              onClick={onCreate}
              className="bg-white text-orange-600 hover:bg-orange-50 gap-2 font-medium shadow"
            >
              <Plus className="h-4 w-4" />
              ສ້າງຄຳຂໍໃໝ່
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="ຄົ້ນຫາ ID / ຊື່ / ຈຸດປະສົງ..."
                className="pl-10 h-11 border-slate-300 focus:border-orange-500"
              />
            </div>

            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="h-11 rounded-md border border-slate-300 bg-white px-4 text-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="">ທັງໝົດສະຖານະ</option>
              <option value="PENDING_VERIFIER">PENDING_VERIFIER</option>
              <option value="PENDING_DCO">PENDING_DCO</option>
              <option value="PENDING_CEO">PENDING_CEO</option>
              <option value="RETURNED">RETURNED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Pagination Info */}
          <div className="flex justify-between items-center mb-4 text-sm text-slate-600">
            <span>ສະແດງ {items.length} ຈາກ {total} ລາຍການ</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ກ່ອນໜ້າ
              </Button>
              <span className="font-medium">
                ໜ້າ {page} / {Math.max(1, Math.ceil(total / limit))}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage((p) => p + 1)}
              >
                ຕໍ່ໄປ
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-slate-500 border border-dashed rounded-xl">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-xl font-medium">ບໍ່ພົບຄຳຂໍກູ້</p>
              <p className="text-sm mt-2">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ສະຖານະ</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>ຜູ້ກູ້</TableHead>
                    <TableHead>ຈຸດປະສົງ</TableHead>
                    <TableHead className="text-right">ຈຳນວນ</TableHead>
                    <TableHead className="text-right">ໄລຍະເວລາ</TableHead>
                    <TableHead className="text-right">ດອກເບ້ຍ</TableHead>
                    <TableHead>ສະຖານະ</TableHead>
                    <TableHead className="text-right w-32">ຈັດການ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => {
                    const canEdit = row.status === "PENDING" || row.status === "RETURNED";
                    return (
                      <TableRow key={row.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium">#{row.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {row.borrower?.fullName || `${row.borrower?.firstName || ""} ${row.borrower?.lastName || ""}`.trim() || "-"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {row.borrower?.phone || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">
                          {row.loanPurpose || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {fmtMoney(row.loanAmountRequested)}
                        </TableCell>
                        <TableCell className="text-right">{row.termMonths || "-"} ເດືອນ</TableCell>
                        <TableCell className="text-right">{row.interestRatePa || "-"} %</TableCell>
                        <TableCell>{getStatusBadge(row.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(row)}
                              className="h-8 w-8 p-0 text-slate-600 hover:text-orange-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(row)}
                              disabled={!canEdit}
                              className={`h-8 w-8 p-0 ${canEdit ? "text-orange-600 hover:text-orange-700" : "text-slate-400 cursor-not-allowed"}`}
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
    </div>
  );
};

export default LoanApplications;