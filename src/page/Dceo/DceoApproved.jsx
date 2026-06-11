// src/pages/verifier/DceoApproved.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Url } from "@/lib/Part";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, RefreshCw, CheckCircle2 } from "lucide-react";

const fmtMoney = (v) => (v ? Number(v).toLocaleString("lo-LA") : "-");
const fmtPct = (v) => (v ? `${Number(v).toFixed(2)} %` : "-");

const DceoApproved = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

  const fetchApproved = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("ກະລຸນາເຂົ້າລະບົບໃໝ່");
        navigate("/");
        return;
      }

      const res = await axios.get(`${Url.base_url}/loan-applications/by-status`, {
        params: {
          status: "APPROVED",  
          q: search || undefined,
          page,
          limit,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setApplications(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
      } else {
        toast.error("ດຶງຂໍ້ມູນບໍ່ສຳເລັດ");
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດດຶງຄຳຂໍກູ້ທີ່ອະນຸມັດໄດ້");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, [page, search]);

  const handleViewDetail = (id) => {
   navigate(`/dceo/approved/${id}/full-report`);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-green-700">ຄຳຂໍກູ້ທີ່ອະນຸມັດແລ້ວ</h1>
          <p className="text-muted-foreground mt-1">
            ລາຍການຄຳຂໍກູ້ທີ່ທ່ານກວດສອບແລະອະນຸມັດ (APPROVED)
          </p>
        </div>
        <Button onClick={fetchApproved} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          ໂຫຼດໃໝ່
        </Button>
      </div>

      {/* Search */}
      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ຄົ້ນຫາ: ຈຸດປະສົງກູ້, ຊື່ຜູ້ກູ້, ເບີໂທ..."
                value={search}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            ຄຳຂໍກູ້ທີ່ອະນຸມັດແລ້ວ
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              ບໍ່ພົບຄຳຂໍກູ້ທີ່ອະນຸມັດແລ້ວ
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>ວັນທີຍື່ນ</TableHead>
                      <TableHead>ຜູ້ກູ້</TableHead>
                      <TableHead>ຈຸດປະສົງ</TableHead>
                      <TableHead className="text-right">ວົງເງິນກູ້</TableHead>
                      <TableHead className="text-right">ໄລຍະເວລາ</TableHead>
                      <TableHead className="text-right">DTI</TableHead>
                      <TableHead>ຄວາມສ່ຽງທຸລະກິດ</TableHead>
                      <TableHead className="text-right">ປັບວົງເງິນ</TableHead>
                      <TableHead className="text-center">ດຳເນີນການ</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id} className="hover:bg-green-50/30 transition-colors">
                        <TableCell>
                          {app.submittedAt
                            ? new Date(app.submittedAt).toLocaleDateString("lo-LA")
                            : "-"}
                        </TableCell>

                        <TableCell>
                          {app.borrower?.laoFirstName || ""} {app.borrower?.laoLastName || ""}
                          <div className="text-xs text-muted-foreground">
                            {app.borrower?.phone || "-"}
                          </div>
                        </TableCell>

                        <TableCell>{app.loanPurpose || "-"}</TableCell>

                        <TableCell className="text-right font-medium">
                          {fmtMoney(app.loanAmountRequested)}
                        </TableCell>

                        <TableCell className="text-right">
                          {app.termMonths ? `${app.termMonths} ເດືອນ` : "-"}
                        </TableCell>

                        <TableCell className="text-right">
                          {app.assessment?.dtiRatio !== null && app.assessment?.dtiRatio !== undefined
                            ? fmtPct(app.assessment.dtiRatio)
                            : "-"}
                        </TableCell>

                        <TableCell>
                          {app.assessment?.sectorRiskLevel ? (
                            <Badge
                              variant={
                                app.assessment.sectorRiskLevel === "ຕ່ຳຫຼາຍ" ||
                                app.assessment.sectorRiskLevel === "ຕ່ຳ"
                                  ? "secondary"
                                  : app.assessment.sectorRiskLevel === "ສູງ" ||
                                    app.assessment.sectorRiskLevel === "ສູງຫຼາຍ"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {app.assessment.sectorRiskLevel}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {app.assessment?.riskAdjustmentFactor ? (
                            <span
                              className={
                                app.assessment.riskAdjustmentFactor > 1
                                  ? "text-green-600"
                                  : app.assessment.riskAdjustmentFactor < 1
                                  ? "text-red-600"
                                  : "text-gray-600"
                              }
                            >
                              {(app.assessment.riskAdjustmentFactor * 100 - 100).toFixed(0)}%
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(app.id)}
                            className="gap-1 text-green-600 hover:text-green-700"
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

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  ສະແດງ {applications.length} ຈາກ {total} ລາຍການ
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    ກ່ອນໜ້າ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.ceil(total / limit)}
                    onClick={() => setPage(page + 1)}
                  >
                    ຖັດໄປ
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DceoApproved;
