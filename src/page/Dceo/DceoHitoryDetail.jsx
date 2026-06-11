// src/pages/officer/LoanApplicationDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Url } from "@/lib/Part";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, RefreshCcw, LinkIcon, User, FileText, DollarSign, Banknote, Loader2 } from "lucide-react";
import CEOActions from "@/component/CEO/CEOActions";


const fmtMoney = (v) => {
    if (v === null || v === undefined) return "-";
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return n.toLocaleString("lo-LA");
};

const fmtPct = (v) => {
    if (v === null || v === undefined) return "-";
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return `${n.toLocaleString("lo-LA", { minimumFractionDigits: 2 })} %`;
};

const fmtDate = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString("lo-LA");
};

const borrowerDisplayName = (b) => {
    if (!b) return "-";
    const fullName = (b.fullName || "").trim();
    if (fullName) return fullName;

    const titleText = b.title === "THAO" ? "ທ້າວ" : b.title === "NANG" ? "ນາງ" : "";
    return `${titleText} ${b.firstName || ""} ${b.lastName || ""}`.trim() || "-";
};

const KV = ({ label, value, icon: Icon, highlight = false }) => (
    <div className={`rounded-md border p-4 bg-white shadow-sm hover:shadow ${highlight ? "border-orange-300 bg-orange-50" : ""}`}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            {Icon && <Icon className="h-4 w-4" />}
            {label}
        </div>
        <div className={`font-medium text-base ${highlight ? "text-orange-700" : ""}`}>{value}</div>
    </div>
);

const DceoHitoryDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const appId = Number(id);

    const token = useMemo(() => localStorage.getItem("token"), []);
    const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    const [loading, setLoading] = useState(true);
    const [app, setApp] = useState(null);
    const [externalLoans, setExternalLoans] = useState([]);
    const [externalLoading, setExternalLoading] = useState(false);

    const fetchDetail = async () => {
        if (!appId || Number.isNaN(appId)) return;
        setLoading(true);
        try {
            const res = await axios.get(`${Url.base_url}/loan-applications/${appId}`, { headers });
            setApp(res.data.data);

            // ดึง External Loan
            if (res.data.data.borrowerId) {
                setExternalLoading(true);
                try {
                    const extRes = await axios.get(
                        `${Url.base_url}/borrowers/${res.data.data.borrowerId}/external-loans`,
                        { headers }
                    );
                    setExternalLoans(extRes.data.data || []);
                } catch (extErr) {
                    console.error("Failed to load external loans:", extErr);
                    toast.error("ບໍ່ສາມາດດຶງຂໍ້ມູນຫນີ້ເກົ່າໄດ້");
                } finally {
                    setExternalLoading(false);
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "ໂຫຼດລາຍລະອຽດຄຳຂໍກູ້ລົ້ມເຫລວ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [appId]);

    if (!appId || Number.isNaN(appId)) {
        return <div className="p-6 text-red-600">ID ບໍ່ຖືກຕ້ອງ</div>;
    }

    // คำนวณค่าบางอย่างใน frontend (ถ้า backend ยังไม่บันทึกแยก)
    const processFee = useMemo(() => {
        if (!app?.loanAmountRequested) return 0;
        return Number(app.loanAmountRequested) * 0.01;
    }, [app]);

    const existingMonthlyInstallment = useMemo(() => {
        if (!app?.assessment) return 0;
        return (
            Number(app.assessment.exisInstallToFina || 0) +
            Number(app.assessment.payInstallToOther || 0)
        );
    }, [app?.assessment]);

    const totalMonthlyInstallment = useMemo(() => {
        if (!app?.assessment) return 0;
        return Number(app.assessment.totalMonthlyInstallment ||
            (Number(app.assessment.currInstallToFina || 0) +
                Number(app.assessment.exisInstallToFina || 0) +
                Number(app.assessment.payInstallToOther || 0)));
    }, [app?.assessment]);

    // ดอกเบี้ยต่อเดือน (ใช้ค่าจาก backend ถ้ามี ถ้าไม่มีคำนวณย้อนจาก totalInterest / termMonths)
    const monthlyInterestCalc = useMemo(() => {
        if (app?.assessment?.monthlyInterest) return app.assessment.monthlyInterest;
        if (app?.assessment?.totalInterest && app?.termMonths) {
            return Number(app.assessment.totalInterest) / Number(app.termMonths);
        }
        return 0;
    }, [app]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-2xl font-bold text-orange-700">ລາຍລະອຽດຄຳຂໍກູ້ ທີ່ຂ້ອຍຈັດການ </div>
                    <div className="text-sm text-muted-foreground">ເລກທີ່ຄຳຂໍ: {appId}</div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        ກັບຄືນ
                    </Button>
                    <Button variant="outline" onClick={fetchDetail} className="gap-2">
                        <RefreshCcw className="h-4 w-4" />
                        ໂຫຼດໃໝ່
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : !app ? (
                <div className="text-center py-12 text-muted-foreground">ບໍ່ພົບຂໍ້ມູນ</div>
            ) : (
                <>
                    {/* Borrower Information */}
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-orange-600" />
                                ຂໍ້ມູນຜູ້ກູ້
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <KV label="ຊື່-ນາມສະກຸນ" value={borrowerDisplayName(app.borrower)} />
                            <KV label="ເບີໂທລະສັບ" value={app.borrower?.phone || "-"} />
                            <KV label="ອາຍຸ" value={app.borrower?.age ? `${app.borrower.age} ປີ` : "-"} />
                            <KV label="ສະຖານະສົມລົດ" value={app.borrower?.maritalStatus || "-"} />
                            <KV label="ສັນຊາດ" value={app.borrower?.nationality || "-"} />
                            <KV label="ລະດັບການສຶກສາ" value={app.borrower?.education || "-"} />
                            <KV label="ອາຊີບ" value={app.borrower?.occupation || "-"} />
                            <KV label="ລາຍໄດ້ສຸດທິເດືອນ" value={fmtMoney(app.borrower?.netIncome)} />
                        </CardContent>
                    </Card>

                    {/* Loan Summary */}
                    <Card className="border-none shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">ຂໍ້ມູນຄຳຂໍກູ້</CardTitle>
                            <Badge variant={app.status === "PENDING" ? "secondary" : app.status === "APPROVED" ? "default" : "destructive"}>
                                {app.status === "PENDING" ? "ລໍຖ້າອະນຸມັດ" :
                                    app.status === "APPROVED" ? "ອະນຸມັດແລ້ວ" :
                                        app.status === "REJECTED" ? "ປະຕິເສດ" : app.status || "-"}
                            </Badge>
                        </CardHeader>

                        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <KV label="ຈຸດປະສົງການກູ້" value={app.loanPurpose || "-"} />
                            <KV label="ຈຳນວນກູ້ທີ່ຮ້ອງຂໍ" value={fmtMoney(app.loanAmountRequested)} />
                            <KV label="ໄລຍະເວລາ (ເດືອນ)" value={app.termMonths ?? "-"} />
                            <KV label="ອັດຕາດອກເບ້ຍ (ຕໍ່ປີ)" value={fmtPct(app.interestRatePa)} />
                            <KV label="ຮູບແບບການຊຳລະ" value={app.repaymentMode || "-"} />
                            <KV label="ວັນທີ່ຍື່ນ" value={fmtDate(app.submittedAt)} />
                            <KV label="ປະເພດການກູ້" value={app.loanType || "-"} />
                            <KV label="ປະເພດລູກຄ້າ" value={app.customerType || "-"} />
                            <KV label="ຄ່າທຳນຽມເງິນກູ້ (1%)" value={fmtMoney(app.assessment?.processingFeeAmount || processFee)} />
                        </CardContent>
                    </Card>

                    {/* External Loans */}
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Banknote className="h-5 w-5 text-red-600" />
                                ຫນີ້ເກົ່າ / External Loan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {externalLoading ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                                    <p className="text-sm text-muted-foreground mt-2">ກຳລັງດຶງຂໍ້ມູນຫນີ້ເກົ່າ...</p>
                                </div>
                            ) : externalLoans.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    ບໍ່ມີຫນີ້ເກົ່າ / External Loan
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow>
                                                <TableHead className="w-40">ແຫຼ່ງ</TableHead>
                                                <TableHead>ຜະລິດຕະພັນ</TableHead>
                                                <TableHead>ສະຖາບັນ</TableHead>
                                                <TableHead className="text-right">ຈຳນວນກູ້</TableHead>
                                                <TableHead className="text-right">ຍອດເຫຼືອ</TableHead>
                                                <TableHead className="text-right">ງວດເດືອນ</TableHead>
                                                <TableHead className="text-right">ດອກເບ້ຍ (%/ປີ)</TableHead>
                                                <TableHead>ສະຖານະ</TableHead>
                                                <TableHead>ເລີ່ມ-ສິ້ນສຸດ</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {externalLoans.map((loan) => (
                                                <TableRow key={loan.id} className="hover:bg-gray-50">
                                                    <TableCell className="font-medium">{loan.source || "-"}</TableCell>
                                                    <TableCell>{loan.product || "-"}</TableCell>
                                                    <TableCell>{loan.institution || "-"}</TableCell>
                                                    <TableCell className="text-right">{fmtMoney(loan.loanAmount)}</TableCell>
                                                    <TableCell className="text-right">{fmtMoney(loan.outstanding)}</TableCell>
                                                    <TableCell className="text-right">{fmtMoney(loan.monthlyInstallment)}</TableCell>
                                                    <TableCell className="text-right">{fmtPct(loan.interestRatePa)}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={loan.status === "ACTIVE" ? "default" : "secondary"}
                                                            className={loan.status === "ACTIVE" ? "bg-green-600 hover:bg-green-700" : ""}
                                                        >
                                                            {loan.status || "-"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {fmtDate(loan.startDate)} - {fmtDate(loan.endDate)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Assessment - สรุปการประเมิน */}
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                ການປະເມີນ (DTI / ງວດ / ຈຳນວນທີ່ອະນຸມັດສູງສຸດ)
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {!app.assessment ? (
                                <div className="text-muted-foreground">ບໍ່ມີຂໍ້ມູນການປະເມີນ</div>
                            ) : (
                                <>
                                    {/* สรุปงวดและภาระหลัก */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <KV
                                            label="ງວດປັດຈຸບັນ (ກູ້ FINA)"
                                            value={fmtMoney(app.assessment.currInstallToFina)}
                                            icon={DollarSign}
                                        />
                                        <KV
                                            label="ງວດພາລະຫນີ້ພາຍໃນ (ຕໍ່ເດືອນ)"
                                            value={fmtMoney(app.assessment.exisInstallToFina || 0)}
                                            icon={DollarSign}
                                        />
                                        <KV
                                            label="ງວດພາລະຫນີ້ພາຍນອກ (ຕໍ່ເດືອນ)"
                                            value={fmtMoney(app.assessment.payInstallToOther || 0)}
                                            icon={DollarSign}
                                        />
                                        <KV
                                            label="ງວດພາລະຫນີ້ທັງໝົດ (ຕໍ່ເດືອນ)"
                                            value={fmtMoney(app.assessment.existingMonthlyInstallment || existingMonthlyInstallment)}
                                            icon={Banknote}
                                        />
                                        <KV
                                            label="ງວດຕ້ອງຈ່າຍທັງໝົດ (ຕໍ່ເດືອນ)"
                                            value={fmtMoney(app.assessment.totalMonthlyInstallment || totalMonthlyInstallment)}
                                            icon={DollarSign}
                                            highlight={true}
                                        />
                                    </div>

                                    {/* DTI และวงเงิน */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <KV label="ອັດຕາ DTI" value={fmtPct(app.assessment.dtiRatio)} />
                                        <KV label="criterion DTI" value={fmtPct(app.assessment.dtiThreshold)} />
                                        <KV
                                            label="ຈຳນວນທີ່ອະນຸມັດສູງສຸດ"
                                            value={fmtMoney(app.assessment.maxApprovedAmount)}
                                            highlight={true}
                                        />
                                    </div>

                                    {/* รายได้และรายได้สุทธิ */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <KV label="ລາຍໄດ້ສຸດທິທັງໝົດ" value={fmtMoney(app.assessment.totalNetIncome)} />
                                        <KV label="ລາຍໄດ້ສຸດທິຫຼັງຫັກງວດ" value={fmtMoney(app.assessment.endingNetIncome)} />
                                        <KV label="ສະຖານະການອະນຸມັດ" value={app.assessment.approvalStatus || "-"} />
                                    </div>

                                    {/* ดอกเบี้ยและต้นทุน */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <KV label="ດອກເບ້ຍທັງໝົດ" value={fmtMoney(app.assessment.totalInterest)} />
                                        <KV label="ຕົ້ນ+ດອກ (PPI)" value={fmtMoney(app.assessment.totalPrincipalPlusInterest)} />
                                        <KV label="ດອກເບ້ຍຕໍ່ເດືອນ (Flat Rate)" value={fmtMoney(app.assessment.monthlyInterest || monthlyInterestCalc)} />
                                    </div>

                                    {/* ต้นเงินและดอกเบี้ยต่อเดือน */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <KV label="ຕົ້ນເງິນຕໍ່ເດືອນ" value={fmtMoney(app.assessment.monthlyPrincipal)} />

                                        <KV label="ງວດລວມຕໍ່ເດືອນ" value={fmtMoney(app.assessment.installmentAmount)} />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Document Links */}
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <LinkIcon className="h-5 w-5 text-blue-600" />
                                ລິ້ງເອກະສານປະກອບ
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!app.documentLinks ? (
                                <div className="text-muted-foreground">ຍັງບໍ່ມີລິ້ງເອກະສານ</div>
                            ) : (
                                <div className="space-y-3">
                                    {app.documentLinks.split('\n').map((link, index) => {
                                        const trimmed = link.trim();
                                        if (!trimmed) return null;
                                        return (
                                            <div key={index} className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                                <a
                                                    href={trimmed}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline break-all font-medium"
                                                >
                                                    {trimmed}
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>

                            )}
                        </CardContent>
                    </Card>
                    <div className="border-t pt-6 mt-6">
                        <h4 className="text-base font-semibold mb-4 text-orange-700">ການປະເມີນຄວາມເສຍງຈາກປະເພດທຸລະກິດ (ວັນທີ່ສ້າງຄຳຂໍ)</h4>

                        {/* กลุ่มข้อมูล Snapshot (จาก Assessment) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <KV
                                label="ປະເພດທຸລະກິດ (Sector)"
                                value={app.assessment?.sectorNameAtAssessment || app.borrower?.sector?.sector || "-"}
                            />
                            <KV
                                label="ຊື່ຍ່ອຍ (Sub-sector)"
                                value={app.assessment?.subSectorAtAssessment || app.borrower?.sector?.subSector || "-"}
                            />
                            <KV
                                label="ລະຫັດ BoL"
                                value={app.assessment?.bolCodeAtAssessment || app.borrower?.sector?.bolCode || "-"}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <KV
                                label="ຄະແນນຄວາມເສຍງ (SMF V3)"
                                value={app.assessment?.smfV3AtAssessment ? fmtPct(app.assessment.smfV3AtAssessment) : (app.borrower?.sector?.smfV3 ? fmtPct(app.borrower.sector.smfV3) : "-")}
                            />
                            <KV
                                label="ລະດັບຄວາມສ່ຽງຂອງວົງການ (Sector Risk Level)"
                                value={app.assessment?.sectorRiskLevel || "ບໍ່ມີຂໍ້ມູນ"}
                                highlight={app.assessment?.sectorRiskLevel === "ສູງ" || app.assessment?.sectorRiskLevel === "ສູງຫຼາຍ"}
                            />
                            <KV
                                label="ການປັບຕົວຄູນ (Risk Factor)"
                                value={
                                    app.assessment?.riskAdjustmentFactor
                                        ? `${(app.assessment.riskAdjustmentFactor * 100 - 100).toFixed(0)}%`
                                        : "-"
                                }
                            />
                        </div>

                        {/* ข้อความอธิบายเพื่อลดความสับสน */}
                        <div className="text-xs text-muted-foreground mt-3 italic">
                            * ຂໍ້ມູນໃນສ່ວນນີ້ແມ່ນຄ່າທີ່ລະບົບໃຊ້ໃນເວລາສ້າງຄຳຂໍກູ້ (snapshot) ເພື່ອການກວດສອບຍ້ອນຫຼັງ ບໍ່ປ່ຽນແປງແມ່ນເຖິງຈະອັບເດດຂໍ້ມູນປະເພດທຸລະກິດຂອງຜູ້ກູ້ຢືມພາຍຫຼັງກໍ່ຕາມ
                        </div>
                    </div>
                    {/* Preparer Comments */}
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg">ຄຳເຫັນຂອງຜູ້ຈັດການ (Preparer Comments)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 p-4 rounded-md border">
                                {app.assessment?.preparerComments || "ບໍ່ມີຄຳເຫັນ"}
                            </div>
                        </CardContent>
                    </Card>
                  
                               <Card className="border-none shadow-lg">
                                <CardHeader>
                                  <CardTitle className="text-lg">ຄຳເຫັນຂອງຜູ້ຈັດການ (Credit Manager Comments)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="bg-gray-50 p-4 rounded-md border">
                                    {app.assessment?.verifierComments || "ຍັງບໍ່ມີຄຳເຫັນ"}
                                  </div>
                                </CardContent>
                              </Card>
                               <Card className="border-none shadow-lg">
                                <CardHeader>
                                  <CardTitle className="text-lg">ຄຳເຫັນຂອງຜູ້ຈັດການ (DCEO Comments)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="bg-gray-50 p-4 rounded-md border">
                                    {app.assessment?.dcoComments || "ຍັງບໍ່ມີຄຳເຫັນ"}
                                  </div>
                                </CardContent>
                              </Card>
                               <Card className="border-none shadow-lg">
                                <CardHeader>
                                  <CardTitle className="text-lg">ຄຳເຫັນຂອງຜູ້ຈັດການ (CEO Comments)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="bg-gray-50 p-4 rounded-md border">
                                    {app.assessment?.ceoComments || "ຍັງບໍ່ມີຄຳເຫັນ"}
                                  </div>
                                </CardContent>
                              </Card>
               

                </>
            )}
        </div>
    );
};

export default DceoHitoryDetail;
