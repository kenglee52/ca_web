// src/pages/officer/BorrowerDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Url } from "@/lib/Part";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building, Briefcase, Home, MapPin } from "lucide-react";

const Field = ({ label, value, className = "" }) => (
  <div className={className}>
    <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    <div className="font-medium text-gray-900 mt-0.5 break-words">
      {value ?? <span className="text-gray-400 italic">-</span>}
    </div>
  </div>
);

const BorrowerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [borrower, setBorrower] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBorrower = async () => {
      try {
        const res = await axios.get(`${Url.base_url}/borrowers/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setBorrower(res.data.data);
      } catch (err) {
        console.error("Error fetching borrower:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBorrower();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">ກຳລັງໂຫຼດຂໍ້ມູນ...</div>;
  if (!borrower) return <div className="p-8 text-center text-red-600">ບໍ່ພົບຂໍ້ມູນຜູ້ກູ້</div>;

  const formatDate = (dateStr) => (dateStr ? dateStr.split("T")[0] : "-");
  const formatCurrency = (amount) => 
    amount ? `₭ ${Number(amount).toLocaleString()}` : "-";

  const latestApp = borrower.applications?.[0] || {};
  const hasBusiness = !!borrower.businessRegisterName;
  const hasCompanyAddress = borrower.companyVillage || borrower.companyProvinceId;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4" />
          ກັບຄືນ
        </Button>

        {latestApp.status && (
          <Badge
            variant={
              latestApp.status === "APPROVED" ? "success" :
              latestApp.status === "REJECTED" ? "destructive" :
              "secondary"
            }
            className="text-sm px-4 py-1 w-full sm:w-auto text-center"
          >
            ສະຖານະການສະໝັກ: {latestApp.status}
          </Badge>
        )}
      </div>

      {/* ข้อมูลส่วนตัว */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Home className="h-5 w-5" /> ຂໍ້ມູນສ່ວນຕົວ
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <Field label="ຊື່ (ລາວ)" value={borrower.laoFirstName} />
          <Field label="ນາມສະກຸນ (ລາວ)" value={borrower.laoLastName} />
          <Field label="First Name" value={borrower.firstName} />
          <Field label="Last Name" value={borrower.lastName} />
          <Field label="ຄຳນຳໜ້າຊື່" value={borrower.title} />
          <Field label="ອາຍຸ" value={borrower.age ? `${borrower.age} ປີ` : "-"} />
          <Field label="ສະຖານະສມົດ" value={borrower.maritalStatus} />
          <Field label="ສັນຊາດ" value={borrower.nationality} />
          <Field label="ເບີໂທຕິດຕໍ່" value={borrower.phone} />
          <Field label="ວັນເກີດ" value={formatDate(borrower.dateOfBirth)} />
          <Field label="ການສຶກສາສູງສຸດ" value={borrower.education} />
          <Field label="ປະເພດໃບຢັ້ງຢືນ" value={borrower.certificateType} />
          <Field label="ເລກທີໃບຢັ້ງຢືນ" value={borrower.certificateNo} />
          <Field label="ໝົດອາຍຸໃບຢັ້ງຢືນ" value={formatDate(borrower.idCardExpiryDate)} />
        </CardContent>
      </Card>

      {/* ที่อยู่ปัจจุบัน */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <MapPin className="h-5 w-5" /> ທີ່ຢູ່ປັດຈຸບັນ
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <Field label="ບ້ານ" value={borrower.village} />
          <Field label="ເມືອງ" value={borrower.district?.name} />
          <Field label="ແຂວງ" value={borrower.province?.name} />
          <Field
            label="Google Map"
            value={
              borrower.currentAddressLink ? (
                <a href={borrower.currentAddressLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  ເບິ່ງແຜນທີ່
                </a>
              ) : "-"
            }
          />
        </CardContent>
      </Card>

      {/* ข้อมูลการทำงาน / บริษัท */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> ຂໍ້ມູນການເຮັດວຽກ
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <Field label="ອາຊີບ / ປະເພດງານ" value={borrower.occupation} />
          <Field label="ບໍລິສັດ / ນາຍຈ້າງ" value={borrower.employerName} />
          <Field label="ຕຳແໜ່ງ" value={borrower.position} />
          <Field label="ເລີ່ມເຮັດວຽກ" value={formatDate(borrower.workingStartDate)} />
          <Field label="ເງິນເດືອນຕໍ່ເດືອນ" value={formatCurrency(borrower.monthlySalary)} />
          <Field label="ຄ່າໃຊ້ຈ່າຍຄົວເຮືອນ" value={formatCurrency(borrower.householdExpense)} />
          <Field label="ລາຍໄດ້ສຸດທິ (Net)" value={formatCurrency(borrower.netIncome)} />
          <Field label="ຄວາມສໍາພັນກັບ Fina" value={borrower.relationshipWithFina} />
        </CardContent>
      </Card>

      {/* ที่อยู่บริษัท / สถานที่ทำงาน */}
      {hasCompanyAddress && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Building className="h-5 w-5" /> ທີ່ຢູ່ບໍລິສັດ / ສະຖານທີ່ເຮັດວຽກ
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Field label="ບ້ານ" value={borrower.companyVillage} />
            <Field label="ເມືອງ" value={borrower.district?.name} /> {/* ໃຊ້ district ຂອງ borrower ຖ້າບໍ່ມີແຍກ */}
            <Field label="ແຂວງ" value={borrower.province?.name} />
            <Field label="ເບີໂທບໍລິສັດ" value={borrower.companyPhone} />
            <Field
              label="Google Map"
              value={
                borrower.companyAddressLink ? (
                  <a href={borrower.companyAddressLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    ເບິ່ງແຜນທີ່
                  </a>
                ) : "-"
              }
              className="col-span-2 md:col-span-1"
            />
          </CardContent>
        </Card>
      )}

      {/* ธุรกิจส่วนตัว (ถ้ามี) */}
      {hasBusiness && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Building className="h-5 w-5" /> ຂໍ້ມູນທຸລະກິດ
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Field label="ຊື່ທຸລະກິດ" value={borrower.businessRegisterName} />
            <Field label="ປະເພດທຸລະກິດ" value={borrower.businessType} />
            <Field label="ເລກທະບຽນການຄ້າ" value={borrower.businessRegistrationNumber} />
            <Field label="ບ້ານ" value={borrower.businessVillage} />
            <Field label="ເມືອງ" value={borrower.businessDistrict?.name} />
            <Field label="ແຂວງ" value={borrower.businessProvince?.name} />
            <Field label="ເບີໂທທຸລະກິດ" value={borrower.businessPhone} />
            <Field label="ຈຳນວນພະນັກງານ" value={borrower.employeeCount ? `${borrower.employeeCount} ຄົນ` : "-"} />
            <Field
              label="Google Map"
              value={
                borrower.businessAddressLink ? (
                  <a href={borrower.businessAddressLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    ເບິ່ງແຜນທີ່
                  </a>
                ) : "-"
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Application ล่าสุด - ຖ້າມີ */}
      {borrower.applications?.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">ຂໍ້ມູນການສະໝັກກູ້ລ້າສຸດ</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Field label="ປະເພດການກູ້" value={latestApp.loanType} />
            <Field label="ຈຸດປະສົງ" value={latestApp.loanPurpose} />
            <Field label="ຈຳນວນກູ້ທີ່ຂໍ" value={formatCurrency(latestApp.loanAmountRequested)} />
            <Field label="ໄລຍະເວລາ" value={latestApp.termMonths ? `${latestApp.termMonths} ເດືອນ` : "-"} />
            <Field label="ດອກເບ້ຍຕໍ່ປີ" value={latestApp.interestRatePa ? `${latestApp.interestRatePa}%` : "-"} />
            <Field label="ຮູບແບບຜ່ອນ" value={latestApp.repaymentMode} />
            <Field label="ອັດຕາເຟີ້" value={latestApp.processingFeesPercent ? `${latestApp.processingFeesPercent}%` : "-"} />
            <Field label="ຊັ້ນສິນເຊື່ອ" value={latestApp.creditHistoryGrade} />
            <Field label="ສະຖານະ" value={latestApp.status} className="font-semibold" />
          </CardContent>
        </Card>
      )}

      {/* ສ່ວນອື່ນໆທີ່ຍັງບໍ່ມີໃນ JSON ນີ້ (applications, incomes, externalLoans) ຈະບໍ່ສະແດງ */}
      {/* ຖ້າຕ້ອງການເພີ່ມ placeholder ຫຼື fetch ແຍກ → ບອກໄດ້ເລີຍ */}

    </div>
  );
};

export default BorrowerDetail;