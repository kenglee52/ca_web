import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { Url } from "@/lib/Part";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import NOTO_LAO_BASE64 from "../../assets/fonts/NotoSansLaoLooped-Regular.base64.js";
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
import BorrowerIncomeForm from "@/component/offiecer/BorrowerIncomeForm";
const MAX_ROWS = 6;
const thStyleLeft = {
  padding: "10px 12px",
  textAlign: "left",
  borderBottom: "2px solid #d1d5db",
  fontWeight: 600,
};

const thStyleRight = {
  padding: "10px 12px",
  textAlign: "right",
  borderBottom: "2px solid #d1d5db",
  fontWeight: 600,
};

const tdStyleLeft = {
  padding: "8px 12px",
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
};

const tdStyleRight = {
  padding: "8px 12px",
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
const BorrowerIncomeList = ({ borrowerId, borrower }) => {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  // dialog state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [selected, setSelected] = useState(null);
  const count = items.length;
  const isFull = count >= MAX_ROWS;

  const fetchList = async () => {
    if (!borrowerId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${Url.base_url}/borrowers/${borrowerId}/incomes`,
        { headers }
      );
      setItems(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "ດຶງຂໍ້ມູນລາຍຮັບລົ້ມເຫລວ");
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
  const exportRef = useRef(null);
  const onDelete = async (row) => {
    const ok = window.confirm(`ຢືນຢັນລຶບຂໍ້ມູນເດືອນ ${row.monthYear} ?`);
    if (!ok) return;

    try {
      await axios.delete(`${Url.base_url}/borrower-incomes/${row.id}`, { headers });
      toast.success("ລຶບສຳເລັດ");
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || "ລຶບລົ້ມເຫລວ");
    }
  };
  const canAdd = items.length < MAX_ROWS;
  const exportToPDF = async () => {
    try {
      if (!exportRef.current) {
        toast.error("No content to export");
        return;
      }

      const pdf = new jsPDF("p", "mm", "a4");

      // โหลดฟอนต์ลาว (ถ้าต้องการ)
      pdf.addFileToVFS("NotoSansLaoLooped-Regular.ttf", NOTO_LAO_BASE64);
      pdf.addFont("NotoSansLaoLooped-Regular.ttf", "NotoLao", "normal");
      pdf.setFont("NotoLao");

      // ✅ capture เฉพาะ block นี้
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 28;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 14, 20, imgWidth, imgHeight);

      pdf.save(`borrower-income-${borrower.laoFirstName}-${new Date().toISOString().slice(0, 10)}.pdf`);
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
          <div className="flex items-center gap-2">
            <div className="font-semibold">ລາຍຮັບສ່ວນບຸກຄົນ</div>

            <Badge
              variant={isFull ? "destructive" : "secondary"}
              className="text-2xl"
            >
              {count}/{MAX_ROWS}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            ລາຍການລາຍຮັບຕາມເດືອນ
          </div>
        </div>


        <div className="flex flex-col items-end"  >
          <Button
            disabled={!canAdd}
            type="button"
            onClick={onAdd}
            className="bg-orange-600 hover:bg-orange-700 gap-2"
          >
            <Plus className="h-4 w-4" />
            ເພີ່ມ
          </Button>
          {!canAdd && (
            <p className="text-base text-orange-400 mt-1">
              ສາມາດເພີ່ມລາຍຮັບໄດ້ສູງສຸດ 6 ລາຍການ
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={exportToPDF}
            disabled={loading || items.length === 0}
            className="gap-2"
          >
            Export PDF
          </Button>



        </div>

      </div>
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
      padding: 50,
      width: 1000,
      background: "#ffffff",
      color: "#111",
    }}
  >
    {/* ===== Report Header ===== */}
    <div style={{ marginBottom: 30 }}>
      <div style={{ fontSize: 22, fontWeight: "bold", marginBottom: 5 }}>
        Borrower Income Report
      </div>

      <div style={{ fontSize: 16, fontWeight: 600 }}>
        {borrowerDisplayName(borrower)}
      </div>

      <div style={{ fontSize: 13, color: "#666", marginTop: 5 }}>
        Generated: {new Date().toLocaleString("en-GB")}
      </div>

      <hr style={{ marginTop: 15, border: "1px solid #e5e7eb" }} />
    </div>

    {/* ===== Table ===== */}
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 14,
      }}
    >
      <thead>
        <tr style={{ backgroundColor: "#f3f4f6" }}>
          <th style={thStyleLeft}>Month</th>
          <th style={thStyleRight}>Gross Income</th>
          <th style={thStyleRight}>Net Income</th>
          <th style={thStyleLeft}>Source</th>
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
            <td style={tdStyleLeft}>{row.monthYear}</td>
            <td style={tdStyleRight}>{formatMoney(row.grossIncome)}</td>
            <td style={tdStyleRight}>{formatMoney(row.netIncome)}</td>
            <td style={tdStyleLeft}>{row.source || "-"}</td>
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
              <TableHead>ເດືອນ</TableHead>
              <TableHead className="text-right">ລາຍຮັບລວມ</TableHead>
              <TableHead className="text-right">ລາຍຮັບສຸດທິ</TableHead>
              <TableHead>ແຫຼ່ງ</TableHead>
              <TableHead className="text-right">ຈັດການ</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.monthYear}</TableCell>
                <TableCell className="text-right">{formatMoney(row.grossIncome)}</TableCell>
                <TableCell className="text-right">{formatMoney(row.netIncome)}</TableCell>
                <TableCell>{row.source || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(row)} className="gap-1">
                      <Pencil className="h-4 w-4" />
                      ແກ້ໄຂ
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(row)} className="gap-1">
                      <Trash2 className="h-4 w-4" />
                      ລຶບ
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  ບໍ່ມີຂໍ້ມູນ
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <BorrowerIncomeForm
        open={open}
        onOpenChange={setOpen}
        borrowerId={borrowerId}
        mode={mode}
        initialData={selected}
        existingCount={items.length}
        onSaved={fetchList}
      />
    </div>
  );
};

export default BorrowerIncomeList;
