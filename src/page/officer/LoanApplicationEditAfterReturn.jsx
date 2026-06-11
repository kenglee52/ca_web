// src/pages/officer/LoanApplicationEditAfterReturn.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { Url } from "@/lib/Part";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Send ,Badge} from "lucide-react";

const LoanApplicationEditAfterReturn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { applicationData } = location.state || {};

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  // ฟอร์มข้อมูล
  const [loanPurpose, setLoanPurpose] = useState("");
  const [loanAmountRequested, setLoanAmountRequested] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [interestRatePa, setInterestRatePa] = useState("");
  const [loanType, setLoanType] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [documentLinks, setDocumentLinks] = useState("");
  const [preparerComments, setPreparerComments] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (applicationData) {
        // ใช้ข้อมูลจาก state (มาจากหน้า Returned)
        setLoanPurpose(applicationData.loanPurpose || "");
        setLoanAmountRequested(applicationData.loanAmountRequested?.toString() || "");
        setTermMonths(applicationData.termMonths?.toString() || "");
        setInterestRatePa(applicationData.interestRatePa?.toString() || "");
        setLoanType(applicationData.loanType || "");
        setCustomerType(applicationData.customerType || "");
        setDocumentLinks(applicationData.documentLinks || "");
        setPreparerComments(applicationData.assessment?.preparerComments || "");

        // แสดงคำแนะนำจาก Verifier
        if (applicationData.assessment?.verifierComments) {
          toast.info(`ຄຳແນະນຳຈາກ Verifier: ${applicationData.assessment.verifierComments}`);
        }

        setLoading(false);
      } else {
        // ถ้าไม่มี state → ดึงจาก API
        try {
          const res = await axios.get(`${Url.base_url}/loan-applications/${id}`, { headers });
          const data = res.data.data;

          if (data.status !== "RETURNED") {
            toast.error("ໜ້ານີ້ໃຊ້ໄດ້ເຉພາະຄຳຂໍທີ່ຖືກ RETURNED");
            navigate("/creditofficer/applications");
            return;
          }

          setLoanPurpose(data.loanPurpose || "");
          setLoanAmountRequested(data.loanAmountRequested?.toString() || "");
          setTermMonths(data.termMonths?.toString() || "");
          setInterestRatePa(data.interestRatePa?.toString() || "");
          setLoanType(data.loanType || "");
          setCustomerType(data.customerType || "");
          setDocumentLinks(data.documentLinks || "");
          setPreparerComments(data.assessment?.preparerComments || "");

          if (data.assessment?.verifierComments) {
            toast.info(`ຄຳແນະນຳຈາກ Verifier: ${data.assessment.verifierComments}`);
          }
        } catch (err) {
          toast.error("ດຶງຂໍ້ມູນລົ້ມເຫລວ");
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [id, applicationData, navigate]);

  // บันทึกการแก้ไข (PUT /returned)
  const handleSaveChanges = async () => {
    if (!preparerComments.trim()) {
      toast.error("ກະລຸນາອະທິບາຍການແກ້ໄຂໃນຊ່ອງ Preparer Comments");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        loanPurpose,
        loanAmountRequested: Number(loanAmountRequested),
        termMonths: Number(termMonths),
        interestRatePa: Number(interestRatePa),
        loanType: loanType || null,
        customerType: customerType || null,
        documentLinks: documentLinks.trim() || null,
        preparerComments: preparerComments.trim(),
      };

      await axios.put(`${Url.base_url}/loan-applications/${id}/returned`, payload, { headers });
      toast.success("ບັນທຶກການແກ້ໄຂສຳເລັດ");
    } catch (err) {
      toast.error(err.response?.data?.message || "ບັນທຶກລົ້ມເຫລວ");
    } finally {
      setSaving(false);
    }
  };

  // ส่งกลับให้ Verifier (POST /resubmit-to-verifier)
  const handleResubmit = async () => {
    const reason = prompt("ກະລຸນາອະທິບາຍເຫດຜົນທີ່ສົ່ງກັບ Verifier:");
    if (!reason || !reason.trim()) {
      toast.error("ຕ້ອງລະບຸເຫດຜົນການສົ່ງກັບ");
      return;
    }

    setResubmitting(true);
    try {
      await axios.post(
        `${Url.base_url}/loan-applications/${id}/resubmit-to-verifier`,
        { comments: reason.trim() },
        { headers }
      );
      toast.success("ສົ່ງກັບ Verifier ສຳເລັດ");
      navigate("/creditofficer/applications");
    } catch (err) {
      toast.error(err.response?.data?.message || "ສົ່ງກັບລົ້ມເຫລວ");
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-white flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p>ກຳລັງໂຫຼດຂໍ້ມູນ...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-slate-900 rounded-lg shadow-xl text-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-orange-500">
            ແກ້ໄຂຄຳຂໍກູ້ທີ່ຖືກ RETURNED (ID: {id})
          </h1>
        </div>
        <Badge variant="destructive" className="text-base px-4 py-2">
          ສະຖານະ: RETURNED - ລໍຖ້າແກ້ໄຂ ແລະ ສົ່ງກັບ Verifier
        </Badge>
      </div>

      {/* คำแนะนำจาก Verifier (ถ้ามี) */}
      {applicationData?.assessment?.verifierComments && (
        <div className="mb-8 p-6 bg-red-950/50 border border-red-700 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-red-400 mb-3">ຄຳແນະນຳຈາກ Verifier:</h3>
          <p className="whitespace-pre-wrap text-slate-200 leading-relaxed">
            {applicationData.assessment.verifierComments}
          </p>
        </div>
      )}

      {/* Form Fields */}
      <div className="grid gap-6">
        {/* จุดประสงค์การกู้ */}
        <div>
          <Label className="text-lg">ຈຸດປະສົງການກູ້ *</Label>
          <Input
            value={loanPurpose}
            onChange={(e) => setLoanPurpose(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white text-base"
            placeholder="ເຊັ່ນ: ທຶນຫມຸນວຽນ, ຊື້ລົດ, ສ້າງເຮືອນ..."
          />
        </div>

        {/* จำนวนเงิน, ระยะเวลา, ดอกเบี้ย */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label className="text-lg">ຈຳນວນກູ້ທີ່ຮ້ອງຂໍ *</Label>
            <Input
              value={loanAmountRequested}
              onChange={(e) => setLoanAmountRequested(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white text-base"
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-lg">ໄລຍະເວລາ (ເດືອນ) *</Label>
            <Input
              value={termMonths}
              onChange={(e) => setTermMonths(e.target.value.replace(/\D/g, ""))}
              className="bg-slate-800 border-slate-700 text-white text-base"
              placeholder="12"
            />
          </div>
          <div>
            <Label className="text-lg">ດອກເບ້ຍ (%/ປີ) *</Label>
            <Input
              value={interestRatePa}
              onChange={(e) => setInterestRatePa(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white text-base"
              placeholder="12.5"
            />
          </div>
        </div>

        {/* Preparer Comments - สำคัญ */}
        <div>
          <Label className="text-xl text-orange-400 font-semibold">
            ອະທິບາຍການແກ້ໄຂຕາມຄຳແນະນຳຂອງ Verifier *
          </Label>
          <Textarea
            value={preparerComments}
            onChange={(e) => setPreparerComments(e.target.value)}
            placeholder="ຂຽນລາຍລະອຽດວ່າໄດ້ແກ້ໄຂຫຍັງບ້າງ ຕາມຄຳແນະນຳ..."
            className="h-40 bg-slate-800 border-slate-700 text-white text-base resize-y"
          />
          <p className="text-sm text-slate-400 mt-2">
            * ຕ້ອງຂຽນກ່ອນບັນທຶກ ຫຼື ສົ່ງກັບ Verifier
          </p>
        </div>

        {/* ลิงก์เอกสาร */}
        <div>
          <Label className="text-lg">ລິ້ງເອກະສານເພີ່ມເຕີມ (ຖ້າມີ)</Label>
          <Textarea
            value={documentLinks}
            onChange={(e) => setDocumentLinks(e.target.value)}
            placeholder="ວາງລິ້ງເອກະສານໃໝ່ ຫຼື ທີ່ແກ້ໄຂ..."
            className="h-32 bg-slate-800 border-slate-700 text-white text-base resize-y"
          />
        </div>

        {/* ปุ่มการทำงาน */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-10">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={saving || resubmitting}
            className="min-w-[120px]"
          >
            ຍົກເລີກ
          </Button>

          <Button
            onClick={handleSaveChanges}
            disabled={saving || resubmitting || !preparerComments.trim()}
            className="bg-blue-600 hover:bg-blue-700 min-w-[180px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ກຳລັງບັນທຶກ...
              </>
            ) : (
              "ບັນທຶກການແກ້ໄຂ"
            )}
          </Button>

          <Button
            onClick={handleResubmit}
            disabled={resubmitting || saving}
            className="bg-green-600 hover:bg-green-700 min-w-[220px]"
          >
            {resubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ກຳລັງສົ່ງກັບ...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                ສົ່ງກັບ Verifier
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          ຫຼັງບັນທຶກການແກ້ໄຂແລ້ວ ຈຶ່ງກົດ "ສົ່ງກັບ Verifier" ເພື່ອເລີ່ມການກວດສອບໃໝ່
        </p>
      </div>
    </div>
  );
};

export default LoanApplicationEditAfterReturn;