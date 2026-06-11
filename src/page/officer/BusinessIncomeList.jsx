import React, { useEffect, useMemo, useState, useRef } from "react";

import axios from "axios";
import { Url } from "@/lib/Part";
import { toast } from "sonner";
import autoTable from "jspdf-autotable";

import NOTO_LAO_BASE64 from "../../assets/fonts/NotoSansLaoLooped-Regular.base64.js";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
import BusinessIncomeForm from "@/component/offiecer/BusinessIncomeForm";


const formatMoney = (v) => {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("lo-LA");
};

const hasBusinessInfo = (borrower) => {
  const nameOk = (borrower?.businessName || "").trim() !== "";
  const regOk = (borrower?.businessRegistrationNumber || "").trim() !== "";
  return nameOk || regOk;
};
const borrowerDisplayName = (b) => {
  if (!b) return "-";
  const titleText = b.title === "THAO" ? "ທ້າວ" : b.title === "NANG" ? "ນາງ" : "";
  const first = b.laoFirstName || b.firstName || "";
  const last = b.laoLastName || b.lastName || "";
  return `${titleText} ${first} ${last}`.trim();
};


const BusinessIncomeList = ({ borrowerId, borrower }) => {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  // dialog state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [selected, setSelected] = useState(null);


  // ✅ ກວດສອບວ່າຂໍ້ມູນຄົບ 6 ເດືອນແລ້ວຫຼືຍັງ
  const isFull = items.length >= 6;

  const fetchList = async () => {
    if (!borrowerId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${Url.base_url}/borrowers/${borrowerId}/business-incomes`,
        { headers }
      );
      setItems(res.data.data || []);
      console.log("Fetched business incomes:", res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "ດຶງຂໍ້ມູນທຸລະກິດລົ້ມເຫລວ");
    } finally {
      setLoading(false);
    }
  };
  const NetProfitTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const v = payload[0]?.value ?? 0;

    return (
      <div className="rounded-lg border bg-white p-3 shadow-md">
        <p className="text-sm font-medium text-gray-700">ເດືອນ: {label}</p>
        <p className="text-lg font-bold text-blue-600">
          ກຳໄລສຸດທິ: {Number(v).toLocaleString("lo-LA")} ກີບ
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Net Profit = Gross Profit − Operating Expense
        </p>
      </div>
    );
  };

  const chartData = useMemo(() => {
    // เรียงตามเดือนเก่า -> ใหม่
    const sorted = [...items].sort((a, b) => (a.monthYear || "").localeCompare(b.monthYear || ""));
    return sorted.map((r) => ({
      month: r.monthYear,        // แกน X
      netProfit: Number(r.netProfit || 0), // กราฟ netProfit
    }));
  }, [items]);

  useEffect(() => {
    fetchList();
  }, [borrowerId]);

  const onAdd = () => {
    if (!hasBusinessInfo(borrower)) {
      toast.info("ກະລຸນາກອກ businessName ຫຼື businessRegistrationNumber ກ່ອນ");
      return;
    }
    if (isFull) {
      toast.warning("ສາມາດເພີ່ມໄດ້ສູງສຸດ 6 ເດືອນເທົັ້ນນັ້ນ");
      return;
    }
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
    const ok = window.confirm(`ຢືນຢັນລຶບຂໍ້ມູນເດືອນ ${row.monthYear} ?`);
    if (!ok) return;

    try {
      await axios.delete(`${Url.base_url}/business-incomes/${row.id}`, { headers });
      toast.success("ລຶບສຳເລັດ");
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || "ລຶບລົ້ມເຫລວ");
    }
  };

  const disabledAdd = !hasBusinessInfo(borrower) || isFull;
  const exportRef = useRef(null);
  const chartRef = useRef(null);

  const exportToPDF = async () => {
    try {
      if (!items?.length) {
        toast.error("No data to export");
        return;
      }

      toast.message("Generating PDF...");

      // Create PDF
      const pdf = new jsPDF("l", "mm", "a4");

      // (Optional) keep font loading (not required for English, but ok to keep)
      pdf.addFileToVFS("NotoSansLaoLooped-Regular.ttf", NOTO_LAO_BASE64);
      pdf.addFont("NotoSansLaoLooped-Regular.ttf", "NotoLao", "normal");
      pdf.setFont("NotoLao");

      const pageWidth = pdf.internal.pageSize.getWidth();

      // ===== Header =====
      pdf.setFontSize(14);
      pdf.text("Business Income Report", 14, 14);

      pdf.setFontSize(10);

      pdf.text(`Date: ${new Date().toLocaleString("en-US")}`, 14, 25);

      let cursorY = 32;

      // ===== Chart as image =====
      if (chartRef.current) {
        await new Promise((r) => setTimeout(r, 200));

        const chartCanvas = await html2canvas(chartRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });

        const chartImg = chartCanvas.toDataURL("image/png");

        const imgWidth = pageWidth - 28; // left/right margin 14
        const imgHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;

        pdf.addImage(chartImg, "PNG", 14, cursorY, imgWidth, imgHeight);
        cursorY += imgHeight + 8;
      }

      // ===== Prepare table data =====
      const sorted = [...items].sort((a, b) =>
        (a.monthYear || "").localeCompare(b.monthYear || "")
      );

      const num = (v) => Number(v || 0);
      const avg = (arr) =>
        arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;

      const months = sorted.map((r) => r.monthYear?.replace("-", "/") || "-");

      const sales = sorted.map((r) => num(r.saleRevenue));
      const otherIncome = sorted.map(() => 0);
      const cogs = sorted.map((r) => num(r.costOfSale));
      const gp = sorted.map((r) => num(r.grossProfit));
      const profitBeforeTax = sorted.map((r) => num(r.grossProfit)); // adjust if needed
      const tax = sorted.map((r) => Math.round(num(r.netProfit) * 0.1)); // example 10%
      const np = sorted.map((r) => num(r.netProfit));

      const head = [["Item", ...months, "Avg."]];

      const body = [
        ["Sales Revenue", ...sales.map(formatMoney), formatMoney(avg(sales))],
        ["Other Income", ...otherIncome.map(formatMoney), formatMoney(avg(otherIncome))],
        ["Cost of Goods Sold", ...cogs.map(formatMoney), formatMoney(avg(cogs))],
        ["Gross Profit", ...gp.map(formatMoney), formatMoney(avg(gp))],
        ["Profit Before Tax", ...profitBeforeTax.map(formatMoney), formatMoney(avg(profitBeforeTax))],
        ["Tax", ...tax.map(formatMoney), formatMoney(avg(tax))],
        ["Net Profit", ...np.map(formatMoney), formatMoney(avg(np))],
      ];

      autoTable(pdf, {
        startY: cursorY,
        head,
        body,
        styles: {
          font: "helvetica", // ✅ English-friendly
          fontSize: 10,
          cellPadding: 3,
          lineHeight: 1.4,
          valign: "middle",
          halign: "right",
        },
        headStyles: {
          font: "helvetica",
          fontSize: 11,
          halign: "center",
          fillColor: [220, 230, 241],
          textColor: 20,
        },
        columnStyles: {
          0: { halign: "left", cellWidth: 60 },
        },
        margin: { left: 14, right: 14 },
      });

      const fileName = `business-income-${borrower.laoFirstName || "borrower"}-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;

      pdf.save(fileName);
      toast.success("PDF exported successfully");
    } catch (e) {
      console.error(e);
      toast.error("Export PDF failed");
    }
  };



  return (
    <div ref={exportRef} className="rounded-lg border p-4 space-y-4 bg-white">
      {/* --- ສ່ວນ Header ທີ່ປັບປຸງໃໝ່ --- */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base">ລາຍຮັບທຸລະກິດ</span>



            {/* Badge ສີແດງຄືຮູບຕົວຢ່າງ */}
            <span className="bg-[#EE4D2D] text-white text-[25px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
              {items.length}/6
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            ບັນທຶກຍອດຂາຍ / ຄ່າໃຊ້ຈ່າຍ / ກຳໄລ ຕາມເດືອນ
          </div>

          {!hasBusinessInfo(borrower) && (
            <div className="text-[10px] text-amber-600 font-medium">
              * ຕ້ອງມີ businessName ຫຼື businessRegistrationNumber ກ່ອນ
            </div>
          )}
        </div>

        {/* ຈັດວາງປຸ່ມ ແລະ ຂໍ້ຄວາມເຕືອນໄວ້ເບື້ອງຂວາ */}
        <div className="flex flex-col items-end gap-2">
          <Button
            type="button"
            onClick={onAdd}
            disabled={disabledAdd}
            className={`${isFull
              ? "bg-[#F5A696] text-white cursor-not-allowed" // ສີສົ້ມອ່ອນໆຄືໃນຮູບ 1 ເວລາປຸ່ມຖືກປິດ
              : "bg-[#EE4D2D] hover:bg-[#d74326] text-white"
              } gap-2 px-6 h-10`}
          >
            <Plus className="h-4 w-4" />
            ເພີ່ມ
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={exportToPDF}
            className="gap-2 px-6 h-10"
            disabled={loading || items.length === 0}
          >
            Export PDF
          </Button>

          {/* ສະແດງຂໍ້ຄວາມເຕືອນສີສົ້ມເມື່ອຄົບ 6 ລາຍການ */}
          {isFull && (
            <div className="text-base text-orange-400 mt-1">
              ສາມາດເພີ່ມລາຍຮັບໄດ້ສູງສຸດ 6 ລາຍການ
            </div>

          )}
        </div>

      </div>
      {items.length > 0 && (
        <div ref={chartRef} className="rounded-lg border bg-white p-4">
         <div className="text-sm text-muted-foreground">
  <span className="font-semibold text-black text-2xl">
    {borrowerDisplayName(borrower)}
  </span>
</div>

          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold"> ກຳໄລສຸດທິ (Net Profit)</div>
            <div className="text-xs text-muted-foreground">ຂໍ້ມູນ {items.length} ເດືອນ</div>
          </div>

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%" className="rounded-md border">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 56, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  tickFormatter={(value) =>
                    Number(value).toLocaleString("de-DE")
                  }
                />

                <Tooltip content={<NetProfitTooltip />} />

                {/* จะใช้ Bar หรือ Line ก็ได้ — ตอนนี้ใส่ทั้งคู่ให้ดูชัด */}
                <Bar dataKey="netProfit" name="ກຳໄລສຸດທິ" fill="#3B82F6" />
                <Line type="monotone" dataKey="netProfit" stroke="#1D4ED8" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {loading ? (
        <div className="h-28 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-[12px]">ເດືອນ</TableHead>
                <TableHead className="text-right text-[12px]">ຍອດຂາຍ</TableHead>
                <TableHead className="text-right text-[12px]">ຕົ້ນທຶນ</TableHead>
                <TableHead className="text-right text-[12px]">ກຳໄລຂັ້ນຕົ້ນ</TableHead>
                <TableHead className="text-right text-[12px]">ຄ່າໃຊ້ຈ່າຍ</TableHead>
                <TableHead className="text-right text-[12px]">ກຳໄລສຸດທິ</TableHead>
                <TableHead className="text-[12px]">ແຫຼ່ງ</TableHead>
                <TableHead className="text-right text-[12px]">ຈັດການ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50/50">
                  <TableCell className="py-2 text-[13px]">{row.monthYear}</TableCell>
                  <TableCell className="py-2 text-right text-[13px]">{formatMoney(row.saleRevenue)}</TableCell>
                  <TableCell className="py-2 text-right text-[13px]">{formatMoney(row.costOfSale)}</TableCell>
                  <TableCell className="py-2 text-right text-[13px] font-medium">{formatMoney(row.grossProfit)}</TableCell>
                  <TableCell className="py-2 text-right text-[13px]">{formatMoney(row.operExpense)}</TableCell>
                  <TableCell className="py-2 text-right text-[13px] font-semibold text-blue-600">{formatMoney(row.netProfit)}</TableCell>
                  <TableCell className="py-2 text-[12px]">{row.source || "-"}</TableCell>
                  <TableCell className="py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => onEdit(row)} className="h-7 px-2 text-[11px] gap-1">
                        <Pencil className="h-3 w-3" /> ແກ້ໄຂ
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onDelete(row)} className="h-7 px-2 text-[11px] gap-1 bg-red-500 hover:bg-red-600">
                        <Trash2 className="h-3 w-3" /> ລຶບ
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-10 text-sm">
                    ບໍ່ມີຂໍ້ມູນ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <BusinessIncomeForm
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

export default BusinessIncomeList;