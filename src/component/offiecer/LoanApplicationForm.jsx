// src/component/offiecer/LoanApplicationForm.jsx
import React,{useEffect,useMemo,useState} from "react";
import {useNavigate,useParams} from "react-router-dom";
import axios from "axios";
import {Url} from "@/lib/Part";
import {toast} from "sonner";


import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Checkbox} from "@/components/ui/checkbox";
import {Loader2,ArrowLeft,Send} from "lucide-react";
import BorrowerSelect from "@/page/officer/BorrowerSelect";

const formatMoneyInput=(value) => {
  if(value===""||value===null||value===undefined) return "";
  const n=Number(value);
  if(Number.isNaN(n)) return "";
  return n.toLocaleString("lo-LA");
};

const parseMoneyInput=(text) => {
  if(!text) return "";
  const cleaned=String(text).replace(/,/g,"").trim();
  const n=Number(cleaned);
  if(Number.isNaN(n)) return "";
  return cleaned;
};

const LoanApplicationForm=() => {
  const navigate=useNavigate();
  const {id}=useParams(); // ถ้ามี :id → edit mode, ถ้าไม่มี → create mode
  const mode=id? "edit":"create";
  const appId=id? Number(id):null;

  const token=useMemo(() => localStorage.getItem("token"),[]);
  const headers=useMemo(() => ({Authorization: `Bearer ${token}`}),[token]);

  const [saving,setSaving]=useState(false);
  // เพิ่มบรรทัดนี้ (หลัง setSaving)
  const [resubmitting,setResubmitting]=useState(false);
  // borrower select
  const [borrowerId,setBorrowerId]=useState(null);
  const [borrower,setBorrower]=useState(null);

  // required fields
  const [loanPurpose,setLoanPurpose]=useState("");
  const [loanAmountRequested,setLoanAmountRequested]=useState("");
  const [termMonths,setTermMonths]=useState("");
  const [interestRatePa,setInterestRatePa]=useState("");
  const [application,setApplication]=useState(null);
  // optional - LoanType (radio เดียวเลือกได้ตัวเดียว)
  const [loanType,setLoanType]=useState("");

  // optional - CustomerType (checkbox เลือกได้ตัวเดียว)
  const [customerType,setCustomerType]=useState(""); // "NEW" หรือ "EXISTING"

  // ลิงก์เอกสาร (แทนการอัพโหลดไฟล์)
  const [documentLinks,setDocumentLinks]=useState("");
  const [verifierComments,setVerifierComments]=useState("");
  // ความเห็นของผู้จัดทำ (preparerComments)
  const [preparerComments,setPreparerComments]=useState(
    mode==="create"? "Created by CREDIT_OFFICER - Pending further review":""
  );

  const onPickBorrower=(b) => {
    setBorrower(b||null);
    setBorrowerId(b?.id??null);
  };

  const fetchBorrowerById=async (borrowerId) => {
    try {
      const res=await axios.get(`${Url.base_url}/borrowers/${borrowerId}`,{headers});
      setBorrower(res.data.data||null);
    } catch(err) {
      setBorrower(null);
    }
  };

  // โหลดข้อมูลเมื่อ edit mode
  useEffect(() => {
    if(mode==="edit"&&appId) {
      const fetchApplication=async () => {
        try {
          const res=await axios.get(`${Url.base_url}/loan-applications/${appId}`,{headers});
          const data=res.data.data;

          const bId=Number(data.borrowerId);
          setBorrowerId(bId);
          fetchBorrowerById(bId);
          setApplication(data);
          setLoanPurpose(data.loanPurpose||"");
          setVerifierComments(data.assessment?.verifierComments||"");
          setLoanAmountRequested(data.loanAmountRequested!=null? String(data.loanAmountRequested):"");
          setTermMonths(data.termMonths!=null? String(data.termMonths):"");
          setInterestRatePa(data.interestRatePa!=null? String(data.interestRatePa):"");
          setLoanType(data.loanType||"");
          setCustomerType(data.customerType||"");
          setDocumentLinks(data.documentLinks||"");
          setPreparerComments(data.assessment?.preparerComments||
            "Created by CREDIT_OFFICER - Pending further review");
        } catch(err) {
          toast.error("ດຶງຂໍ້ມູນຄຳຂໍກູ້ລົ້ມເຫລວ");
        }
      };

      fetchApplication();
    } else {
      // create mode - reset all
      setBorrowerId(null);
      setBorrower(null);
      setLoanPurpose("");
      setLoanAmountRequested("");
      setTermMonths("");
      setInterestRatePa("");
      setLoanType("");
      setCustomerType("");
      setDocumentLinks("http://localhost:5173/creditofficer/applications");
      setPreparerComments("Created by CREDIT_OFFICER - Pending further review");
      setVerifierComments("");
    }
  },[mode,appId,headers,navigate]);

  const validate=() => {
    if(!borrowerId||Number.isNaN(Number(borrowerId))) {
      toast.error("ກະລຸນາເລືອກຜູ້ກູ້");
      return false;
    }

    if(!loanPurpose.trim()) {
      toast.error("ຈຸດປະສົງການກູ້ ຈຳເປັນ");
      return false;
    }

    const amt=Number(loanAmountRequested);
    if(!Number.isFinite(amt)||amt<=0) {
      toast.error("ຈຳນວນກູ້ທີ່ຮ້ອງຂໍ ຕ້ອງ > 0");
      return false;
    }

    const term=Number(termMonths);
    if(!Number.isInteger(term)||term<=0) {
      toast.error("ໄລຍະເວລາກູ້ (ເດືອນ) ຕ້ອງເປັນຈຳນວນເຕັມ > 0");
      return false;
    }

    const rate=Number(interestRatePa);
    if(!Number.isFinite(rate)||rate<0) {
      toast.error("ອັດຕາດອກເບ້ຍຕ້ອງເປັນຕົວເລກ >= 0");
      return false;
    }

    return true;
  };

  const onSubmit=async () => {
    if(!validate()) return;

    setSaving(true);

    try {
      const payload={
        borrowerId: Number(borrowerId),
        loanPurpose: loanPurpose.trim(),
        loanAmountRequested: Number(loanAmountRequested),
        termMonths: Number(termMonths),
        interestRatePa: Number(interestRatePa),
        loanType: loanType||null,
        customerType: customerType||null,
        documentLinks: documentLinks.trim()||null,
        preparerComments: preparerComments.trim()||null,

      };
      console.log("payload:",payload);


      let res;
      if(mode==="edit"&&appId) {
        res=await axios.put(`${Url.base_url}/loan-applications/${appId}`,payload,{headers});
        toast.success("ແກ້ໄຂຄຳຂໍກູ້ສຳເລັດ");
      } else {
        res=await axios.post(`${Url.base_url}/loan-applications`,payload,{headers});
        toast.success("ສ້າງຄຳຂໍກູ້ສຳເລັດ");
      }


      navigate("/creditofficer/applications");
    } catch(err) {
      const msg=err.response?.data?.message||"ບັນທຶກລົ້ມເຫລວ";
      toast.error(msg); // ตอนนี้ toast จะขึ้นข้อความจริงจาก backend
      console.error("Loan submission error:",err.response?.data||err);
    }
    finally {
      setSaving(false);
    }
  };

  const handleCancel=() => {
    navigate(-1);
  };
  const handleResubmit=async () => {
    if(!preparerComments.trim()) {
      toast.error("ກະລຸນາອະທິບາຍການແກ້ໄຂໃນຊ່ອງ Preparer Comments ก່ອນສົ່ງກັບ");
      return;
    }

    const confirmResubmit=window.confirm("ທ່ານແນ່ໃຈບໍ່ວ່າແກ້ໄຂສຳເລັດແລ້ວ ຕ້ອງການສົ່ງກັບ Verifier ກວດໃໝ່?");
    if(!confirmResubmit) return;

    setResubmitting(true);
    try {
      await axios.post(
        `${Url.base_url}/loan-applications/${appId}/resubmit-to-verifier`,
        {comments: preparerComments.trim()}, // ส่ง preparerComments เป็นเหตุผลด้วยก็ได้
        {headers}
      );
      toast.success("ສົ່ງກັບ Verifier ສຳເລັດ");
      navigate("/creditofficer/applications");
    } catch(err) {
      toast.error(err.response?.data?.message||"ສົ່ງກັບລົ້ມເຫລວ");
    } finally {
      setResubmitting(false);
    }
  };
  return (
    <div className="p-6 max-w-4xl mx-auto bg-slate-50 rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-orange-700">
            {mode==="edit"? "ແກ້ໄຂຄຳຂໍກູ້":"ສ້າງຄຳຂໍກູ້ໃໝ່"}
          </h1>
        </div>
      </div>

      <div className="grid gap-6">
        {verifierComments&&(
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <Label className="text-red-700 font-medium">ຄຳແນະນຳຈາກ Verifier:</Label>
            <p className="mt-2 text-red-800 whitespace-pre-wrap">
              {verifierComments}
            </p>
          </div>
        )}
        {/* Borrower & Repayment Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label>ຜູ້ກູ້ *</Label>
            <BorrowerSelect
              value={borrowerId}
              selectedBorrower={borrower}
              onChange={onPickBorrower}
              disabled={mode==="edit"}
            />
            {borrower&&(
              <div className="text-sm text-muted-foreground">
                {borrower.firstName} {borrower.lastName} • {borrower.phone||"-"}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>ຮູບແບບການຊຳລະ *</Label>
            <Input value="Flat rate" disabled className="bg-gray-100" />
          </div>
        </div>

        {/* Loan Purpose */}
        <div className="grid gap-2">
          <Label>ຈຸດປະສົງການກູ້ *</Label>
          <Input
            value={loanPurpose}
            onChange={(e) => setLoanPurpose(e.target.value)}
            placeholder="ເຊັ່ນ ທຶນຫມຸນວຽນ / ຊື້ລົດ / ຊ່ອມແປງບ້ານ..."
          />
        </div>

        {/* Amount, Term, Rate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="grid gap-2">
            <Label>ຈຳນວນກູ້ທີ່ຮ້ອງຂໍ *</Label>
            <Input
              inputMode="numeric"
              value={formatMoneyInput(loanAmountRequested)}
              onChange={(e) => setLoanAmountRequested(parseMoneyInput(e.target.value))}
              placeholder="0"
            />
          </div>

          <div className="grid gap-2">
            <Label>ໄລຍະເວລາກູ້ (ເດືອນ) *</Label>
            <Input
              inputMode="numeric"
              value={termMonths}
              onChange={(e) => setTermMonths(e.target.value.replace(/[^\d]/g,""))}
              placeholder="12"
            />
          </div>

          <div className="grid gap-2">
            <Label>ອັດຕາດອກເບ້ຍ (%/ປີ) *</Label>
            <Input
              inputMode="decimal"
              value={interestRatePa}
              onChange={(e) => setInterestRatePa(e.target.value)}
              placeholder="12"
            />
          </div>
        </div>

        {/* LoanType - Radio */}
        <div className="grid gap-2">
          <Label>ປະເພດການກູ້ (ເລືອກໄດ້ 1)</Label>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="loanType"
                value="PERSONAL_SALARY_GUARANTEE"
                checked={loanType==="PERSONAL_SALARY_GUARANTEE"}
                onChange={(e) => setLoanType(e.target.value)}
              />
              PERSONAL_SALARY_GUARANTEE (ກູ້ສ່ວນບຸກຄົນ ມີປະກັນເງິນເດືອນ)
            </label>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="loanType"
                value="PERSONAL_WITH_COLLATERAL"
                checked={loanType==="PERSONAL_WITH_COLLATERAL"}
                onChange={(e) => setLoanType(e.target.value)}
              />
              PERSONAL_WITH_COLLATERAL (ກູ້ສ່ວນບຸກຄົນ ມີຫຼັກປະກັນ)
            </label>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="loanType"
                value="BUSINESS"
                checked={loanType==="BUSINESS"}
                onChange={(e) => setLoanType(e.target.value)}
              />
              BUSINESS (ທຸລະກິດ)
            </label>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setLoanType("")}
              disabled={!loanType}
            >
              ລ້າງຄ່າ
            </Button>
          </div>
        </div>

        {/* CustomerType */}
        <div className="grid gap-2">
          <Label>ປະເພດລູກຄ້າ</Label>
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <Checkbox
                id="new-customer"
                checked={customerType==="NEW"}
                onCheckedChange={(checked) => {
                  if(checked) setCustomerType("NEW");
                  else setCustomerType("");
                }}
              />
              <Label htmlFor="new-customer" className="text-sm cursor-pointer">
                ລູກຄ້າໃໝ່
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="old-customer"
                checked={customerType==="EXISTING"}
                onCheckedChange={(checked) => {
                  if(checked) setCustomerType("EXISTING");
                  else setCustomerType("");
                }}
              />
              <Label htmlFor="old-customer" className="text-sm cursor-pointer">
                ລູກຄ້າເກົ່າ
              </Label>
            </div>
          </div>
        </div>

        {/* ลิงก์เอกสาร (แทนการอัพโหลดไฟล์) */}
        <div className="grid gap-2">
          <Label>ລິ້ງເອກະສານທັງໝົດ (ແຍກບັນທັດ)</Label>
          <textarea
            className="w-full h-32 rounded-md border px-3 py-2 text-sm resize-y"
            value={documentLinks}
            onChange={(e) => setDocumentLinks(e.target.value)}
            placeholder="ວາງລິ້ງຫຼາຍອັນແຍກບັນທັດ ຕົວຢ່າງ:
https://1drv.ms/... (CIB Report)
https://1drv.ms/... (Bank Statement 6 ເດືອນ)
https://1drv.ms/... (ບັດປະຊາຊົນ ທັງ 2 ໜ້າ)
https://1drv.ms/... (ສັນຍາ)"
          />
          <p className="text-xs text-muted-foreground">
            ວິທີແຊຣລິ້ງຈາກ OneDrive: ຄລິກຂວາທີ່ໄຟລ໌ → Share → Copy Link (ຕັ້ງໃຫ້ Anyone with the link can view)
          </p>
        </div>

        {/* ความเห็นของผู้จัดทำ */}
        <div className="grid gap-2">
          <Label>ຄຳເຫັນ / ຫມາຍເຫດຂອງຜູ້ຈັດການ (Preparer Comments)</Label>
          <Textarea
            value={preparerComments}
            onChange={(e) => setPreparerComments(e.target.value)}
            placeholder="ຂຽນຄຳເຫັນເພີ່ມເຕີມ ຫຼື ຫມາຍເຫດສຳລັບການປະເມີນ... (default: Created by CREDIT_OFFICER - Pending further review)"
            className="h-24 resize-y"
          />
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          * ລະບົບຈະຄຳນວນ Assessment (DTI, ຄ່າງວດ, ຈຳນວນທີ່ອະນຸມັດສູງສຸດ) ໃຫ້ອັດຕະໂນມັດ
          ຈາກລາຍໄດ້ 6 ເດືອນລ້າສຸດ + ໜີ້ເກົ່າ (ExternalLoan ACTIVE)
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={() => navigate(-1)} disabled={saving}>
            ຍົກເລີກ
          </Button>

          <Button
            onClick={onSubmit}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700 min-w-[140px]"
          >
            {saving? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ກຳລັງບັນທຶກ...
              </>
            ):mode==="edit"&&application?.status==="RETURNED"? (
              // ✅ ປ່ຽນ label ໃຫ້ user ຮູ້ວ່າກົດດຽວ save + resubmit
              <>
                <Send className="h-4 w-4 mr-2" />
                ບັນທຶກ ແລະ ສົ່ງກັບ Verifier
              </>
            ):mode==="edit"? (
              "ບັນທຶກການແກ້ໄຂ"
            ):(
              "ສ້າງຄຳຂໍກູ້"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoanApplicationForm;