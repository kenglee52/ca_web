// src/component/offiecer/BorrowerSelect.jsx
import React,{useEffect,useMemo,useState} from "react";
import axios from "axios";
import {Url} from "@/lib/Part";
import {toast} from "sonner";

import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Skeleton} from "@/components/ui/skeleton";
import {Search,X} from "lucide-react";

const borrowerName=(b) => {
  if(!b) return "-";
  const titleText=b.title==="THAO"? "ທ້າວ":b.title==="NANG"? "ນາງ":"";
  return `${titleText} ${b.firstName||""} ${b.lastName||""}`.trim()||"-";
};

const BorrowerSelect=({
  value, // borrowerId
  onChange, // (borrower) => void
  selectedBorrower, // borrower object (optional)
  disabled=false
}) => {
  const token=useMemo(() => localStorage.getItem("token"),[]);
  const headers=useMemo(() => ({Authorization: `Bearer ${token}`}),[token]);

  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(false);
  const [open,setOpen]=useState(false);
  const [items,setItems]=useState([]);

  const fetchBorrowers=async (q) => {
    setLoading(true);
    try {
      const res=await axios.get(`${Url.base_url}/borrowers`,{
        headers,
        params: {
          q: q?.trim()||undefined,
          page: 1,
          limit: 10,
        },
      });
      setItems(res.data.data||[]);
    } catch(err) {
      toast.error(err.response?.data?.message||"ໂຫຼດລາຍຊື່ຜູ້ກູ້ລົ້ມເຫລວ");
    } finally {
      setLoading(false);
    }
  };

  // debounce search
  useEffect(() => {
    if(!open) return;
    const t=setTimeout(() => fetchBorrowers(query),400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[query,open]);

  const pick=(b) => {
    onChange?.(b); // ส่ง borrower object กลับไป
    setOpen(false);
  };

  const clear=() => {
    onChange?.(null);
    setQuery("");
    setItems([]);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">ຜູ້ກູ້ (Borrower) *</div>

      {/* Selected display */}
      {selectedBorrower? (
        <div className="rounded-md border p-3 flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold">{borrowerName(selectedBorrower)}</div>
            <div className="text-xs text-muted-foreground">
              ID: {selectedBorrower.id} • {selectedBorrower.phone||"-"} • {selectedBorrower.occupation||"-"}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">
                Salary: {selectedBorrower.monthlySalary? Number(selectedBorrower.monthlySalary).toLocaleString("lo-LA"):"-"}
              </Badge>
              <Badge variant="outline">
                Net: {selectedBorrower.netIncome? Number(selectedBorrower.netIncome).toLocaleString("lo-LA"):"-"}
              </Badge>
              {!!selectedBorrower.businessName&&(
                <Badge variant="outline">Biz: {selectedBorrower.businessName}</Badge>
              )}
            </div>
          </div>

          {!disabled&&(
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clear}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              ເລືອກໃໝ່
            </Button>
          )}
        </div>
      ):(
        <>
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setOpen(true);
                // เปิดแล้วให้โหลดรอบแรกทันที
                if(items.length===0) fetchBorrowers("");
              }}
              placeholder="ຄົ້ນຫາ: ຊື່ / ເບີໂທ / ເລກບັດ..."
              className="pl-10"
            />
          </div>

          {/* Dropdown */}
          {open&&(
            <div className="rounded-md border bg-white overflow-hidden">
              <div className="max-h-72 overflow-auto">
                {loading? (
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ):items.length===0? (
                  <div className="p-4 text-sm text-muted-foreground">ບໍ່ພົບຂໍ້ມູນ</div>
                ):(
                  items.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => pick(b)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium">{borrowerName(b)}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {b.id} • {b.phone||"-"} • {b.occupation||"-"} • {b.certificateNo||"-"}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="p-2 flex justify-end gap-2 bg-gray-50">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  ປິດ
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* hidden value (optional) */}
      {value? <div className="text-xs text-muted-foreground">Selected borrowerId: {value}</div>:null}
    </div>
  );
};

export default BorrowerSelect;
