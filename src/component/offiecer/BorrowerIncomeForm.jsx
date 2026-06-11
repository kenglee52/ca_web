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
const MAX_ROWS = 6;

const BorrowerIncomeForm = ({
    open,
    onOpenChange,
    existingCount = 0,
    borrowerId,
    mode = "create", // "create" | "edit"
    initialData = null, // {id, monthYear, grossIncome, netIncome, source}
    onSaved, // callback() -> ให้ list reload
}) => {
    const token = useMemo(() => localStorage.getItem("token"), []);
    const headers = useMemo(
        () => ({ Authorization: `Bearer ${token}` }),
        [token]
    );

    const [saving, setSaving] = useState(false);
    const [monthYear, setMonthYear] = useState("");
    const [grossIncome, setGrossIncome] = useState("");
    const [netIncome, setNetIncome] = useState("");
    const [source, setSource] = useState("");

    useEffect(() => {
        if (!open) return;

        if (mode === "edit" && initialData) {
            setMonthYear(initialData.monthYear || "");
            setGrossIncome(
                initialData.grossIncome !== null && initialData.grossIncome !== undefined
                    ? String(initialData.grossIncome)
                    : ""
            );
            setNetIncome(
                initialData.netIncome !== null && initialData.netIncome !== undefined
                    ? String(initialData.netIncome)
                    : ""
            );
            setSource(initialData.source || "");
        } else {
            setMonthYear("");
            setGrossIncome("");
            setNetIncome("");
            setSource("");
        }
    }, [open, mode, initialData]);

    const validate = () => {
        if (!borrowerId) {
            toast.error("ບໍ່ພົບ borrowerId");
            return false;
        }
        if (!monthYearRegex.test(monthYear)) {
            toast.error("monthYear ຕ້ອງເປັນ YYYY-MM (ເຊັ່ນ 2026-01)");
            return false;
        }
        if (netIncome === "" || Number.isNaN(Number(netIncome))) {
            toast.error("netIncome ຈຳເປັນ ແລະ ຕ້ອງເປັນຕົວເລກ");
            return false;
        }
        if (grossIncome !== "" && Number.isNaN(Number(grossIncome))) {
            toast.error("grossIncome ຕ້ອງເປັນຕົວເລກ");
            return false;

        }
        if (mode === "create" && existingCount >= MAX_ROWS) {
            toast.error("ສາມາດເພີ່ມລາຍຮັບໄດ້ສູງສຸດ 6 ລາຍການ");
            return false;
        }

        return true;
    };

    const onSubmit = async () => {
        console.log("CLICK SUBMIT", { borrowerId, mode, initialData });

        if (!validate()) {
            console.log("VALIDATE FAIL", { borrowerId, monthYear, grossIncome, netIncome, source });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                monthYear,
                netIncome: Number(netIncome),
                ...(grossIncome !== "" ? { grossIncome: Number(grossIncome) } : {}),
                ...(source ? { source } : {}),
            };

            console.log("PAYLOAD", payload);

            if (mode === "edit" && initialData?.id) {
                console.log("PUT ->", `${Url.base_url}/borrower-incomes/${initialData.id}`);
                await axios.put(`${Url.base_url}/borrower-incomes/${initialData.id}`, payload, { headers });
            } else {
                console.log("POST ->", `${Url.base_url}/borrowers/${borrowerId}/incomes`);
                await axios.post(`${Url.base_url}/borrowers/${borrowerId}/incomes`, payload, { headers });
            }

            console.log("SUCCESS");
            onOpenChange(false);
            onSaved?.();
        } catch (err) {
            console.log("ERROR", err?.response?.status, err?.response?.data || err.message);
            toast.error(err.response?.data?.message || "ບັນທຶກລົ້ມເຫລວ");
        } finally {
            setSaving(false);
        }
    };

    const formatMoneyInput = (value) => {
        if (value === "" || value === null || value === undefined) return "";
        const n = Number(value);
        if (Number.isNaN(n)) return "";
        return n.toLocaleString("lo-LA");
    };

    const parseMoneyInput = (text) => {
        if (!text) return "";
        // เอา comma, space ออกให้หมด
        const cleaned = String(text).replace(/,/g, "").trim();
        // อนุญาตเฉพาะตัวเลข (ถ้าอยากให้มีทศนิยมค่อยปรับ)
        const n = Number(cleaned);
        if (Number.isNaN(n)) return "";
        return cleaned; // เก็บเป็น string ตัวเลขดิบ เช่น "10000"
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange} disableEscapeKeyDown>
            <DialogContent className="sm:max-w-[520px]"
                onInteractOutside={(e) => e.preventDefault()} // ❌ กันคลิกนอกปิด
                onPointerDownOutside={(e) => e.preventDefault()} // ❌ กัน pointer down ปิด
            >
                <DialogHeader>
                    <DialogTitle>
                        {mode === "edit" ? "ແກ້ໄຂລາຍຮັບ" : "ເພີ່ມລາຍຮັບ"}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Input
                            type="month"
                            value={monthYear}
                            onChange={(e) => setMonthYear(e.target.value)}
                        />

                    </div>

                    <div className="grid gap-2">
                        <Input
                            inputMode="numeric"
                            placeholder="0"
                            value={formatMoneyInput(grossIncome)}
                            onChange={(e) => setGrossIncome(parseMoneyInput(e.target.value))}
                        />

                        <p className="text-xs text-muted-foreground">
                            (ຖ້າບໍ່ກຳນົດ ລະບົບຈະໃຊ້ netIncome ແທນ)
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Input
                            inputMode="numeric"
                            placeholder="0"
                            value={formatMoneyInput(netIncome)}
                            onChange={(e) => setNetIncome(parseMoneyInput(e.target.value))}
                        />

                    </div>

                    <div className="grid gap-2">
                        <Label>ແຫຼ່ງລາຍຮັບ (source)</Label>
                        <Input
                            placeholder="salary / bank / other..."
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
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

export default BorrowerIncomeForm;
