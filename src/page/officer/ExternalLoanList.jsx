import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Url } from "@/lib/Part";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Loader2, Pencil, Trash2, Plus } from "lucide-react";
import ExternalLoanForm from "@/component/offiecer/ExternalLoanForm";
const thLeft = {
  padding: "10px",
  textAlign: "left",
  borderBottom: "2px solid #d1d5db",
};

const thRight = {
  padding: "10px",
  textAlign: "right",
  borderBottom: "2px solid #d1d5db",
};

const tdLeft = {
  padding: "8px",
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
};

const tdRight = {
  padding: "8px",
  textAlign: "right",
  borderBottom: "1px solid #e5e7eb",
};

const formatMoney = (v) => {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("lo-LA");
};
const borrowerDisplayName = (b) => {
  if (!b) return "-";
  const titleText = b.title === "THAO" ? "ທ້າວ" : b.title === "NANG" ? "ນາງ" : "";
  return `${titleText} ${b.laoFirstName || ""} ${b.laoLastName || ""}`.trim();
};


const ExternalLoanList = ({ borrowerId, borrower }) => {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const exportRef = React.useRef(null);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [selected, setSelected] = useState(null);

  const fetchList = async () => {
    if (!borrowerId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${Url.base_url}/borrowers/${borrowerId}/external-loans`,
        { headers }
      );
      setItems(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "ດຶງຂໍ້ມູນ External Loans ລົ້ມເຫລວ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [borrowerId]);

  const onAdd = () => {
    setMode("create");
    setSelected(null);
    setOpen(true);
  };

  const onEdit = (row) => {
    setMode("edit");
    setSelected(row);
    setOpen(true);
  };

  const onDelete = async (row) => {
    const ok = window.confirm(`ຢືນຢັນລຶບ ExternalLoan (id=${row.id}) ?`);
    if (!ok) return;

    try {
      await axios.delete(`${Url.base_url}/external-loans/${row.id}`, { headers });
      toast.success("ລຶບສຳເລັດ (Soft delete)");
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || "ລຶບລົ້ມເຫລວ");
    }
  };
  const exportToPDF = async () => {
    try {
      if (!exportRef.current) {
        toast.error("No data to export");
        return;
      }

      const pdf = new jsPDF("l", "mm", "a4"); // landscape เพราะตารางกว้าง

      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

      pdf.save(`external-loans-${borrower.laoFirstName}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Export PDF success");
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    }
  };

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">External Loans</div>
          <div className="text-sm text-muted-foreground">
            ລາຍການສິນເຊື່ອນອກ (soft delete)
          </div>
        </div>
        <div
          className=" flex items-center gap-2">
          <Button type="button" onClick={onAdd} className="bg-orange-600 hover:bg-orange-700 gap-2">
            <Plus className="h-4 w-4" />
            ເພີ່ມ
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={exportToPDF}
            disabled={loading || items.length === 0}
          >
            Export PDF
          </Button>
        </div>


      </div>

      {/* Hidden Export Layout */}
      <div
        ref={exportRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            padding: 40,
            width: 1400,
            background: "#ffffff",
            color: "#111",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 30 }}>
            <div style={{ fontSize: 22, fontWeight: "bold" }}>
              External Loan Report
            </div>
            <div style={{ marginBottom: 20 }}>


              <div style={{ marginTop: 8, fontSize: 16 }}>
                Borrower:
                <span style={{ fontWeight: "bold", marginLeft: 8 }}>
                  {borrowerDisplayName(borrower)}
                </span>
              </div>

              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                Generated: {new Date().toLocaleString("en-GB")}
              </div>

              <hr style={{ marginTop: 15 }} />
            </div>


            <hr style={{ marginTop: 15, border: "1px solid #e5e7eb" }} />
          </div>

          {/* Table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={thLeft}>Source</th>
                <th style={thLeft}>Product</th>
                <th style={thLeft}>Institution</th>
                <th style={thRight}>Loan</th>
                <th style={thRight}>Outstanding</th>
                <th style={thRight}>Rate</th>
                <th style={thRight}>Term</th>
                <th style={thLeft}>Check Date</th>
              </tr>
            </thead>

            <tbody>
              {items.map((row, index) => (
                <tr
                  key={row.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                  }}
                >
                  <td style={tdLeft}>{row.source || "-"}</td>
                  <td style={tdLeft}>{row.product || "-"}</td>
                  <td style={tdLeft}>{row.institution || "-"}</td>
                  <td style={tdRight}>{formatMoney(row.loanAmount)}</td>
                  <td style={tdRight}>{formatMoney(row.outstanding)}</td>
                  <td style={tdRight}>
                    {row.interestRatePa != null ? `${row.interestRatePa}%` : "-"}
                  </td>
                  <td style={tdRight}>{row.termMonths ?? "-"}</td>
                  <td style={tdLeft}>
                    {row.checkDate ? String(row.checkDate).slice(0, 10) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading ? (
        <div className="h-28 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead className="text-right">Loan</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Term</TableHead>
              <TableHead>CheckDate</TableHead>
              <TableHead className="text-right">ຈັດການ</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.source || "-"}</TableCell>
                <TableCell className="font-medium">{row.product || "-"}</TableCell>
                <TableCell>{row.institution || "-"}</TableCell>
                <TableCell className="text-right">{formatMoney(row.loanAmount)}</TableCell>
                <TableCell className="text-right">{formatMoney(row.outstanding)}</TableCell>
                <TableCell className="text-right">
                  {row.interestRatePa != null ? `${row.interestRatePa}%` : "-"}
                </TableCell>
                <TableCell className="text-right">{row.termMonths ?? "-"}</TableCell>
                <TableCell>{row.checkDate ? String(row.checkDate).slice(0, 10) : "-"}</TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => onEdit(row)} className="gap-1">
                      <Pencil className="h-4 w-4" />
                      ແກ້ໄຂ
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(row)} className="gap-1">
                      <Trash2 className="h-4 w-4" />
                      ລຶບ
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                  ບໍ່ມີຂໍ້ມູນ
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <ExternalLoanForm
        open={open}
        onOpenChange={setOpen}
        borrowerId={borrowerId}
        mode={mode}
        initialData={selected}
        onSaved={fetchList}
      />
    </div>
  );
};

export default ExternalLoanList;
