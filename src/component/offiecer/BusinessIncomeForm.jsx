import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Url } from "@/lib/Part";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Loader2 } from "lucide-react";

const monthYearRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

// เงิน: format/parse
const formatMoneyInput = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("lo-LA");
};

const parseMoneyInput = (text) => {
  if (!text) return "";
  const cleaned = String(text).replace(/,/g, "").trim();
  const n = Number(cleaned);
  if (Number.isNaN(n)) return "";
  return cleaned; // เก็บเป็น "12345"
};

const BusinessIncomeForm = ({
  open,
  onOpenChange,
  borrowerId,
  mode = "create", // create | edit
  initialData = null,
  onSaved,
}) => {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [saving, setSaving] = useState(false);

  const [monthYear, setMonthYear] = useState("");
  const [saleRevenue, setSaleRevenue] = useState("");
  const [costOfSale, setCostOfSale] = useState("");
  const [grossProfit, setGrossProfit] = useState("");
  const [operExpense, setOperExpense] = useState("");
  const [netProfit, setNetProfit] = useState("");
  const [source, setSource] = useState("");

  // auto-calc toggle
  const [autoCalc, setAutoCalc] = useState(true);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialData) {
      setMonthYear(initialData.monthYear || "");
      setSaleRevenue(initialData.saleRevenue != null ? String(initialData.saleRevenue) : "");
      setCostOfSale(initialData.costOfSale != null ? String(initialData.costOfSale) : "");
      setGrossProfit(initialData.grossProfit != null ? String(initialData.grossProfit) : "");
      setOperExpense(initialData.operExpense != null ? String(initialData.operExpense) : "");
      setNetProfit(initialData.netProfit != null ? String(initialData.netProfit) : "");
      setSource(initialData.source || "");
      setAutoCalc(false); // edit ปล่อยให้แก้เอง
    } else {
      setMonthYear("");
      setSaleRevenue("");
      setCostOfSale("");
      setGrossProfit("");
      setOperExpense("");
      setNetProfit("");
      setSource("");
      setAutoCalc(true);
    }
  }, [open, mode, initialData]);

  // auto calculate
  useEffect(() => {
    if (!autoCalc) return;

    const sr = Number(saleRevenue || 0);
    const cs = Number(costOfSale || 0);
    const oe = Number(operExpense || 0);

    const gp = sr - cs;
    const np = gp - oe;

    // set เป็น string
    setGrossProfit(String(gp >= 0 ? gp : 0));
    setNetProfit(String(np >= 0 ? np : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleRevenue, costOfSale, operExpense, autoCalc]);

  const validate = () => {
    if (!borrowerId) {
      toast.error("ບໍ່ພົບ borrowerId");
      return false;
    }
    if (!monthYearRegex.test(monthYear)) {
      toast.error("monthYear ຕ້ອງເປັນ YYYY-MM (ເຊັ່ນ 2026-01)");
      return false;
    }

    const needNumber = [
      ["saleRevenue", saleRevenue],
      ["costOfSale", costOfSale],
      ["grossProfit", grossProfit],
      ["operExpense", operExpense],
      ["netProfit", netProfit],
    ];

    for (const [label, val] of needNumber) {
      if (val === "" || Number.isNaN(Number(val))) {
        toast.error(`${label} ຈຳເປັນ ແລະ ຕ້ອງເປັນຕົວເລກ`);
        return false;
      }
      if (Number(val) < 0) {
        toast.error(`${label} ບໍ່ຄວນຕິດລົບ`);
        return false;
      }
    }
    return true;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        monthYear,
        saleRevenue: Number(saleRevenue),
        costOfSale: Number(costOfSale),
        grossProfit: Number(grossProfit),
        operExpense: Number(operExpense),
        netProfit: Number(netProfit),
        ...(source ? { source } : {}),
      };

      if (mode === "edit" && initialData?.id) {
        await axios.put(`${Url.base_url}/business-incomes/${initialData.id}`, payload, {
          headers,
        });
        toast.success("ແກ້ໄຂລາຍຮັບທຸລະກິດສຳເລັດ");
      } else {
        await axios.post(`${Url.base_url}/borrowers/${borrowerId}/business-incomes`, payload, {
          headers,
        });
        toast.success("ເພີ່ມລາຍຮັບທຸລະກິດສຳເລັດ");
      }

      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "ບັນທຶກລົ້ມເຫລວ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disableEscapeKeyDown>
      <DialogContent className="sm:max-w-[620px]"
        onInteractOutside={(e) => e.preventDefault()} // ❌ กันคลิกนอกปิด
        onPointerDownOutside={(e) => e.preventDefault()} // ❌ กัน pointer down ปิด
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "ແກ້ໄຂລາຍຮັບທຸລະກິດ" : "ເພີ່ມລາຍຮັບທຸລະກິດ"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>ເດືອນ *</Label>
            <Input type="month" value={monthYear} onChange={(e) => setMonthYear(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>ຍອດຂາຍ (saleRevenue) *</Label>
              <Input
                inputMode="numeric"
                value={formatMoneyInput(saleRevenue)}
                onChange={(e) => setSaleRevenue(parseMoneyInput(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="grid gap-2">
              <Label>ຕົ້ນທຶນ (costOfSale) *</Label>
              <Input
                inputMode="numeric"
                value={formatMoneyInput(costOfSale)}
                onChange={(e) => setCostOfSale(parseMoneyInput(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="grid gap-2">
              <Label>ກຳໄລຂັ້ນຕົ້ນ (grossProfit) *</Label>
              <Input
                inputMode="numeric"
                value={formatMoneyInput(grossProfit)}
                onChange={(e) => setGrossProfit(parseMoneyInput(e.target.value))}
                placeholder="0"
                disabled={autoCalc}
              />
              {autoCalc && (
                <p className="text-xs text-muted-foreground">
                  ຄຳນວນອັດຕະໂນມັດ: saleRevenue - costOfSale
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>ຄ່າໃຊ້ຈ່າຍ (operExpense) *</Label>
              <Input
                inputMode="numeric"
                value={formatMoneyInput(operExpense)}
                onChange={(e) => setOperExpense(parseMoneyInput(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label>ກຳໄລສຸດທິ (netProfit) *</Label>
              <Input
                inputMode="numeric"
                value={formatMoneyInput(netProfit)}
                onChange={(e) => setNetProfit(parseMoneyInput(e.target.value))}
                placeholder="0"
                disabled={autoCalc}
              />
              {autoCalc && (
                <p className="text-xs text-muted-foreground">
                  ຄຳນວນອັດຕະໂນມັດ: grossProfit - operExpense
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="autocalc"
              type="checkbox"
              checked={autoCalc}
              onChange={(e) => setAutoCalc(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="autocalc" className="cursor-pointer">
              ຄຳນວນກຳໄລອັດຕະໂນມັດ (GP/NP)
            </Label>
          </div>

          <div className="grid gap-2">
            <Label>ແຫຼ່ງ (source)</Label>
            <Input
              placeholder="bank statement / excel / interview ..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            ຍົກເລີກ
          </Button>

          <Button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                ກຳລັງບັນທຶກ...
              </>
            ) : mode === "edit" ? (
              "ບັນທຶກການແກ້ໄຂ"
            ) : (
              "ເພີ່ມ"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessIncomeForm;
