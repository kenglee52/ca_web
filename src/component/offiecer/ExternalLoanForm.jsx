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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Loader2 } from "lucide-react";

// YYYY-MM
const monthYearRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

// money format/parse
const formatMoneyInput = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("lo-LA");
};

const parseMoneyInput = (text) => {
  if (!text) return "";
  const cleaned = String(text).replace(/,/g, "").trim();
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return "";
  return cleaned; // keep numeric string
};

const SOURCE_OPTIONS = [
  { value: "EXTERNAL_BANK", label: "ທະນາຄານອື່ນ (EXTERNAL_BANK)" },
  { value: "CIB", label: "CIB" },
  { value: "FINA_INTERNAL", label: "FINA Internal" },
];

const ExternalLoanForm = ({
  open,
  onOpenChange,
  borrowerId,         // required for create
  mode = "create",    // create | edit
  initialData = null, // row object when edit
  onSaved,
}) => {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [saving, setSaving] = useState(false);

  const [source, setSource] = useState("EXTERNAL_BANK");
  const [product, setProduct] = useState("");
  const [institution, setInstitution] = useState("");

  const [loanAmount, setLoanAmount] = useState("");
  const [outstanding, setOutstanding] = useState("");

  const [interestRatePa, setInterestRatePa] = useState("");
  const [termMonths, setTermMonths] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [monthlyInstallment, setMonthlyInstallment] = useState("");
  const [overdueDays, setOverdueDays] = useState("");

  const [creditClass, setCreditClass] = useState("");
  const [checkDate, setCheckDate] = useState(""); // date
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialData) {
      setSource(initialData.source || "EXTERNAL_BANK");
      setProduct(initialData.product || "");
      setInstitution(initialData.institution || "");

      setLoanAmount(initialData.loanAmount != null ? String(initialData.loanAmount) : "");
      setOutstanding(initialData.outstanding != null ? String(initialData.outstanding) : "");

      setInterestRatePa(initialData.interestRatePa != null ? String(initialData.interestRatePa) : "");
      setTermMonths(initialData.termMonths != null ? String(initialData.termMonths) : "");

      setStartDate(initialData.startDate ? String(initialData.startDate).slice(0, 10) : "");
      setEndDate(initialData.endDate ? String(initialData.endDate).slice(0, 10) : "");

      setMonthlyInstallment(initialData.monthlyInstallment != null ? String(initialData.monthlyInstallment) : "");
      setOverdueDays(initialData.overdueDays != null ? String(initialData.overdueDays) : "");

      setCreditClass(initialData.creditClass || "");
      setCheckDate(initialData.checkDate ? String(initialData.checkDate).slice(0, 10) : "");
      setStatus(initialData.status || "");
    } else {
      setSource("EXTERNAL_BANK");
      setProduct("");
      setInstitution("");

      setLoanAmount("");
      setOutstanding("");

      setInterestRatePa("");
      setTermMonths("");

      setStartDate("");
      setEndDate("");

      setMonthlyInstallment("");
      setOverdueDays("");

      setCreditClass("");
      setCheckDate("");
      setStatus("ACTIVE");
    }
  }, [open, mode, initialData]);

  const validate = () => {
    const bid = mode === "edit" ? initialData?.borrowerId : borrowerId;
    if (!bid) {
      toast.error("ບໍ່ພົບ borrowerId");
      return false;
    }

    if (!product.trim()) {
      toast.error("product ຈຳເປັນ");
      return false;
    }

    if (loanAmount === "" || !Number.isFinite(Number(loanAmount))) {
      toast.error("loanAmount ຈຳເປັນ ແລະ ຕ້ອງເປັນຕົວເລກ");
      return false;
    }
    if (outstanding === "" || !Number.isFinite(Number(outstanding))) {
      toast.error("outstanding ຈຳເປັນ ແລະ ຕ້ອງເປັນຕົວເລກ");
      return false;
    }

    // optional validations
    if (interestRatePa !== "" && !Number.isFinite(Number(interestRatePa))) {
      toast.error("interestRatePa ຕ້ອງເປັນຕົວເລກ");
      return false;
    }
    if (termMonths !== "" && (!Number.isFinite(Number(termMonths)) || Number(termMonths) < 0)) {
      toast.error("termMonths ຕ້ອງເປັນຕົວເລກ >= 0");
      return false;
    }
    if (monthlyInstallment !== "" && !Number.isFinite(Number(monthlyInstallment))) {
      toast.error("monthlyInstallment ຕ້ອງເປັນຕົວເລກ");
      return false;
    }
    if (overdueDays !== "" && (!Number.isFinite(Number(overdueDays)) || Number(overdueDays) < 0)) {
      toast.error("overdueDays ຕ້ອງເປັນຕົວເລກ >= 0");
      return false;
    }

    return true;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const bid = mode === "edit" ? Number(initialData.borrowerId) : Number(borrowerId);

      const payload = {
        borrowerId: bid,
        source,
        product: product.trim(),
        institution: institution.trim() || null,

        loanAmount: Number(loanAmount),
        outstanding: Number(outstanding),

        ...(interestRatePa !== "" ? { interestRatePa: Number(interestRatePa) } : {}),
        ...(termMonths !== "" ? { termMonths: Number(termMonths) } : {}),

        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),

        ...(monthlyInstallment !== "" ? { monthlyInstallment: Number(monthlyInstallment) } : {}),
        ...(overdueDays !== "" ? { overdueDays: Number(overdueDays) } : {}),

        ...(creditClass ? { creditClass } : {}),
        ...(checkDate ? { checkDate } : {}),
        ...(status ? { status } : {}),
      };

      if (mode === "edit" && initialData?.id) {
        await axios.put(`${Url.base_url}/external-loans/${initialData.id}`, payload, { headers });
        toast.success("ແກ້ໄຂ External Loan ສຳເລັດ");
      } else {
        await axios.post(`${Url.base_url}/external-loans`, payload, { headers });
        toast.success("ເພີ່ມ External Loan ສຳເລັດ");
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
      <DialogContent className="sm:max-w-[720px]"
        onInteractOutside={(e) => e.preventDefault()} // ❌ กันคลิกนอกปิด
        onPointerDownOutside={(e) => e.preventDefault()} // ❌ กัน pointer down ปิด
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "ແກ້ໄຂ External Loan" : "ເພີ່ມ External Loan"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="ເລືອກ source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Institution</Label>
              <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="BCEL / LDB / ..." />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Product *</Label>
            <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="ສິນເຊື່ອ / credit card / ..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Loan Amount *</Label>
              <Input
                inputMode="numeric"
                value={formatMoneyInput(loanAmount)}
                onChange={(e) => setLoanAmount(parseMoneyInput(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label>Outstanding *</Label>
              <Input
                inputMode="numeric"
                value={formatMoneyInput(outstanding)}
                onChange={(e) => setOutstanding(parseMoneyInput(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Interest Rate (%/ปี)</Label>
              <Input value={interestRatePa} onChange={(e) => setInterestRatePa(e.target.value)} placeholder="12.5" />
            </div>
            <div className="grid gap-2">
              <Label>Term (months)</Label>
              <Input value={termMonths} onChange={(e) => setTermMonths(e.target.value)} placeholder="36" />
            </div>
            <div className="grid gap-2">
              <Label>Overdue Days</Label>
              <Input value={overdueDays} onChange={(e) => setOverdueDays(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Monthly Installment</Label>
              <Input
                inputMode="numeric"
                value={formatMoneyInput(monthlyInstallment)}
                onChange={(e) => setMonthlyInstallment(parseMoneyInput(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label>Check Date</Label>
              <Input type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Credit Class</Label>
              <Input value={creditClass} onChange={(e) => setCreditClass(e.target.value)} placeholder="A / B / C ..." />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Input value={status} onChange={(e) => setStatus(e.target.value)} disabled placeholder="ACTIVE  / ..." />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            ຍົກເລີກ
          </Button>
          <Button type="button" onClick={onSubmit} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
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

export default ExternalLoanForm;
