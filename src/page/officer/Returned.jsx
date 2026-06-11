// src/pages/officer/Returned.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Url } from "@/lib/Part";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const fmtMoney = (v) => (v ? Number(v).toLocaleString("lo-LA") : "-");

const Returned = () => {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [openComment, setOpenComment] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const fetchReturned = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${Url.base_url}/loan-applications`, {
        headers,
        params: { status: "RETURNED" },
      });
      setItems(res.data.data || []);
    } catch (err) {
      toast.error("ດຶງຂໍ້ມູນ RETURNED ລົ້ມເຫລວ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturned();
  }, []);

  const onEdit = (row) => {
   navigate(`/creditofficer/returned/${row.id}`);
  };

  const onView = (row) => {
    navigate(`/creditofficer/applications-detail/${row.id}`);
  };

  const onViewComment = (row) => {
    setSelectedComment({
      borrower:
        row.borrower?.fullName ||
        `${row.borrower?.firstName || ""} ${row.borrower?.lastName || ""}`,
      comment: row.assessment?.verifierComments || null,
    });
    setOpenComment(true);
  };

  return (
    <div className="p-6">
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-orange-700">
            ລາຍການທີ່ຖືກສົ່ງກັບ (Returned)
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead> Status</TableHead>
                  <TableHead className="text-right">ຈັດການ</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      ບໍ່ມີລາຍການ RETURNED
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>
                        {row.borrower?.fullName ||
                          `${row.borrower?.firstName || ""} ${
                            row.borrower?.lastName || ""
                          }`}
                      </TableCell>
                      <TableCell>{row.loanPurpose}</TableCell>
                      <TableCell className="text-right">
                        {fmtMoney(row.loanAmountRequested)}
                      </TableCell>
                      <TableCell>
                        <Badge className="flex rounded-xl bg-red-400 text-white items-center justify-center">RETURNED</Badge>
                      </TableCell>

                      {/* แก้ไขตรงนี้: ย้าย div เข้าไปใน td */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onView(row)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onViewComment(row)}
                          >
                            ຄຳເຫັນ
                          </Button>

                          <Button size="sm" onClick={() => onEdit(row)}>
                            <Pencil className="h-4 w-4" />
                            ແກ້ໄຂ
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog แสดงคำเห็นจาก Verifier */}
      <Dialog open={openComment} onOpenChange={setOpenComment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ຄຳເຫັນຈາກ Verifier</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-sm">
            <div className="text-muted-foreground">
              Borrower:{" "}
              <span className="font-medium text-black">
                {selectedComment?.borrower || "-"}
              </span>
            </div>

            <div className="rounded-md border bg-gray-50 p-3 whitespace-pre-wrap">
              {selectedComment?.comment || "ບໍ່ມີຄຳເຫັນ"}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenComment(false)}>
              ປິດ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Returned;