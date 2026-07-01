// src/pages/verifier/VerifierHistory.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Url } from "@/lib/Part";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight, Eye, History, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const fmtMoney = (v) => (v !== null && v !== undefined ? Number(v).toLocaleString("lo-LA") : "-");
const fmtDate = (date) =>
  date ? new Date(date).toLocaleString("lo-LA", { dateStyle: "medium", timeStyle: "short" }) : "-";

const VerifierHistory = () => {
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const limit = 15;

  // ✅ derived values (must be AFTER stats state)
  const totalItems = stats?.total || 0;
  const totalPages = stats?.totalPages || Math.ceil(totalItems / limit) || 1;

  // ✅ memo params (avoid re-fetch loops)
  const params = useMemo(() => {
    return {
      q: search.trim() || undefined,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      limit,
    };
  }, [search, statusFilter, startDate, endDate, page]);

  const fetchMyHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("ກະລຸນາເຂົ້າລະບົບໃໝ່");
        navigate("/verifier/login");
        return;
      }

      const res = await axios.get(`${Url.base_url}/loan-applications/my-history`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setActivities(res.data.data || []);
        setStats(res.data.pagination || { total: 0, page, limit, totalPages: 1 });
      } else {
        toast.error("ດຶງປະຫວັດການກະທຳບໍ່ສຳເລັດ");
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດດຶງປະຫວັດການກະທຳໄດ້");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-orange-700">ປະຫວັດການກວດສອບຂອງຂ້ອຍ</h1>
            <p className="text-slate-600 mt-1">
              ລາຍການຄຳຂໍກູ້ທີ່ຂ້ອຍເຄີຍກວດສອບ, ອະນຸມັດ, ສົ່ງກັບ, ຫຼື ປະຕິເສດ
            </p>
          </div>
          <Button onClick={fetchMyHistory} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            ໂຫຼດໃໝ່
          </Button>
        </div>

        {/* Stats Cards (NOTE: backend currently only returns total/page/limit/totalPages) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-slate-500 font-medium">ທັງໝົດ</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{totalItems}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow opacity-70">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-blue-600 font-medium">ລໍຖ້າກວດສອບ</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.pending || 0}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow opacity-70">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-orange-600 font-medium">ສົ່ງກັບແກ້ໄຂ</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.returned || 0}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow opacity-70">
  <CardContent className="p-4 text-center">
    <p className="text-sm text-red-600 font-medium">ປະຕິເສດ</p>
    <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected || 0}</p>
  </CardContent>
</Card>


          <Card className="shadow-sm hover:shadow-md transition-shadow opacity-70">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-green-600 font-medium">ອະນຸມັດແລ້ວ</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="border-none shadow-md mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ຄົ້ນຫາ</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="ID / ຊື່ຜູ້ກູ້ / ຈຸດປະສົງ..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ສະຖານະ</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-orange-500 focus:ring-orange-500"
                >
                  <option value="ALL">ທັງໝົດ</option>
                  <option value="PENDING_VERIFIER">ລໍຖ້າກວດສອບ</option>
                  <option value="RETURNED">ສົ່ງກັບແກ້ໄຂ</option>
                  <option value="APPROVED">ອະນຸມັດແລ້ວ</option>
                  <option value="REJECTED">ປະຕິເສດ</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">ວັນທີ</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="h-10"
                  />
                  <span className="text-slate-400">ຫາ</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={resetFilters}>
                ລ້າງຕົວກອງ
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="text-xl flex items-center gap-2">
              <History className="h-5 w-5" />
              ປະຫວັດການກວດສອບຂອງຂ້ອຍ
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-medium">ບໍ່ມີປະຫວັດການກະທຳ</p>
                <p className="mt-2">ທ່ານຍັງບໍ່ໄດ້ກະທຳກັບຄຳຂໍກູ້ໃດໆເທື່ອ</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-100">
                    <TableRow>
                      <TableHead className="w-24">ID</TableHead>
                      <TableHead>ຜູ້ກູ້</TableHead>
                      <TableHead>ຈຸດປະສົງ</TableHead>
                      <TableHead className="text-right">ຈຳນວນກູ້</TableHead>
                      <TableHead>ສະຖານະ</TableHead>
                      <TableHead>ການກະທຳລ້າສຸດ</TableHead>
                      <TableHead>ວັນທີ</TableHead>
                      <TableHead className="text-center">ລາຍລະອຽດ</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {activities.map((app) => (
                      <TableRow key={app.id} className="hover:bg-slate-50 transition-colors border-b last:border-none">
                        <TableCell className="font-medium text-slate-800">#{app.id}</TableCell>

                        <TableCell className="font-medium">
                          {app.borrower?.laoFirstName || ""} {app.borrower?.laoLastName || "-"}
                        </TableCell>

                        <TableCell className="max-w-xs truncate">{app.loanPurpose || "-"}</TableCell>

                        <TableCell className="text-right font-medium text-green-700">
                          {fmtMoney(app.loanAmountRequested)}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              app.status === "APPROVED"
                                ? "success"
                                : app.status === "RETURNED"
                                ? "destructive"
                                : app.status === "PENDING_VERIFIER"
                                ? "default"
                                : "outline"
                            }
                          >
                            {app.status || "ບໍ່ລະບຸ"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {app.myLastAction ? (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {app.myLastAction.level}: {app.myLastAction.status}
                              </span>
                              {app.myLastAction.comments && (
                                <span className="text-xs text-slate-500 truncate max-w-xs">
                                  {app.myLastAction.comments}
                                </span>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        <TableCell>
                          {app.myLastAction ? fmtDate(app.myLastAction.approvedAt) : fmtDate(app.updatedAt)}
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/verifier/history/${app.id}`)}
                            className="gap-1 text-orange-600 hover:text-orange-700"
                          >
                            <Eye className="h-4 w-4" />
                            ເບິ່ງລາຍລະອຽດ
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalItems > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 px-6 pb-6">
                <p className="text-sm text-slate-600">
                  ສະແດງ {activities.length} ຈາກ {totalItems} ລາຍການ
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                    onClick={() => setPage((p) => p + 1)}
                    className="gap-1"
                  >
                    ຕໍ່ໄປ
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifierHistory;
