// src/pages/FullLoanReport.jsx
import React,{useEffect,useState} from 'react';
import {useParams,useNavigate} from 'react-router-dom';
import axios from 'axios';
import {Url} from '@/lib/Part';
import {toast} from "sonner";
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import {Separator} from '@/components/ui/separator';
import {Printer,Download,ArrowLeft} from 'lucide-react';
import {exportToExcel,handlePrintPDF,fmtMoney,fmtDate} from '@/utils/loanReportUtils';

const FullLoanReport=() => {
  const {id}=useParams();
  const navigate=useNavigate();
  const [report,setReport]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(() => {
    const fetchReport=async () => {
      try {
        const token=localStorage.getItem('token');
        const res=await axios.get(`${Url.base_url}/loan-applications/${id}/full-report`,{
          headers: {Authorization: `Bearer ${token}`},
        });

        if(res.data.success) {
          setReport(res.data);
        } else {
          toast.error(res.data.message||'ດຶງຂໍ້ມູນລາຍງານລົ້ມເຫລວ');
        }
      } catch(err) {
        toast.error('ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນ');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  },[id]);

  if(loading) {
    return <div className="p-8 text-center">ກຳລັງໂຫຼດຂໍ້ມູນ Full Report...</div>;
  }

  if(!report||!report.data) {
    return <div className="p-8 text-center text-red-600">ບໍ່ພົບຂໍ້ມູນ Loan Application</div>;
  }

  const {data: loan,summary,financialSummary}=report;
  const assessment=loan.assessment||{};

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 print:bg-white print:p-4">
      {/* Header - พิมพ์ได้สวย */}
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 md:p-8 print:bg-blue-800 print:text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">ບົດລາຍງານເອກະສານກູ້ຢືມຢ່າງສົມບູນ</h1>
              <p className="mt-2 opacity-90">ເລກທີ່ຄຳຂໍ: #{loan.id} | ສະຖານະ: APPROVED</p>
            </div>
            <div className="flex gap-3 print:hidden">
              <Button variant="outline" onClick={() => navigate(-1)} className="gap-2  bg-white text-blue-800 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4" />
                ກັບຄືນ
              </Button>
              <Button onClick={handlePrintPDF} className="gap-2 bg-white text-blue-800 hover:bg-gray-100">
                <Printer className="h-4 w-4" />
                ພິມ
              </Button>
              <Button variant="secondary" className="gap-2" disabled>
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
              <Button
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={async () => {
                  try {
                    await exportToExcel(report,`loan-report`);
                    toast.success('Export Excel ສຳເລັດ');
                  } catch(err) {
                    toast.error('Export Excel ລົ້ມເຫລວ');
                    console.error(err);
                  }
                }}
              >
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8 print:p-4 print:space-y-6">
          {/* 1. ข้อมูลผู้กู้ */}
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-gray-50">
              <CardTitle>ຂໍ້ມູນຜູ້ກູ້</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              <div>
                <p className="text-sm text-gray-500">ຊື່-ນາມສະກຸນ</p>
                <p className="font-medium">{loan.borrower.laoFirstName} {loan.borrower.laoLastName}</p>
                <p className="text-sm text-gray-600">{loan.borrower.firstName} {loan.borrower.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ອາຍຸ / ສັນຊາດ</p>
                <p className="font-medium">{loan.borrower.age} ປີ | {loan.borrower.nationality}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ເບີໂທ / ວັນເດືອນປີເກີດ</p>
                <p className="font-medium">{loan.borrower.phone} | {new Date(loan.borrower.dateOfBirth).toLocaleDateString('lo-LA')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ອາຊີບ / ບໍລິສັດ</p>
                <p className="font-medium">{loan.borrower.occupation} | {loan.borrower.employerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ເງິນເດືອນເດືອນ</p>
                <p className="font-medium text-green-700">{fmtMoney(loan.borrower.monthlySalary)} ກີບ</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ຂະແໜງການ</p>
                <p className="font-medium">{loan.borrower.sector?.sector||'-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* 2. ข้อมูลคำขอสินเชื่อ */}
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-gray-50">
              <CardTitle>ຂໍ້ມູນຄຳຂໍກູ້</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div>
                <p className="text-sm text-gray-500">ຈຸດປະສົງການກູ້</p>
                <p className="font-medium">{loan.loanPurpose}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ຈຳນວນກູ້ຂໍ</p>
                <p className="font-bold text-blue-700">{fmtMoney(loan.loanAmountRequested)} ກີບ</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ໄລຍະເວລາ</p>
                <p className="font-medium">{loan.termMonths} ເດືອນ</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ອັດຕາດອກເບ້ຍຕໍ່ປີ</p>
                <p className="font-medium">{loan.interestRatePa}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ຮູບແບບຊຳລະ</p>
                <p className="font-medium">{loan.repaymentMode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ສະຖານະ</p>
                <Badge variant="success" className="text-lg px-4 py-1">APPROVED</Badge>
              </div>
            </CardContent>
          </Card>

          {/* 3. สรุปการประเมิน (Assessment Summary) */}
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-gray-50">
              <CardTitle>ສະຫຼຸບການປະເມີນ</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div>
                <p className="text-sm text-gray-500">DTI Ratio</p>
                <p className="text-2xl font-bold text-green-600">{assessment.dtiRatio}%</p>
                <p className="text-xs text-gray-500">ต่ำกว่าเกณฑ์ {assessment.dtiThreshold}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ຈຳນວນຜ່ອນຕໍ່ເດືອນ</p>
                <p className="text-xl font-medium">{fmtMoney(assessment.installmentAmount)} ກີບ</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ຈຳນວນສູງສຸດທີ່ອະນຸມັດໄດ້</p>
                <p className="text-xl font-bold text-blue-700">{fmtMoney(assessment.maxApprovedAmount)} ກີບ</p>
              </div>
            </CardContent>
          </Card>



          <Card className="border-none shadow-sm">
            <CardHeader className="bg-gray-50">
              <CardTitle>ປະຫວັດການປະເມີນການ</CardTitle>
            </CardHeader>
            <CardContent className="mt-4">
              <div className="space-y-8">

                {assessment.assessedBy&&(
                  <div className="flex items-start gap-4 border-l-4 border-blue-500 pl-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-800">
                          Assessed By (ຜູ້ກອກເອກະສານ)
                        </Badge>
                        <span className="font-medium">{assessment.assessedBy.fullName||assessment.assessedBy.username}</span>
                        <span className="text-sm text-gray-500 ml-auto">{fmtDate(assessment.createdAt||assessment.assessedAt)}</span>
                      </div>
                      <p className="mt-1 text-gray-700">{assessment.preparerComments||'ບໍ່ມີຄຳເຫັນ'}</p>
                      {assessment.assessedBy.signatureUrl&&(
                        <div className="bg-transparent inline-block">
                          <img
                            src={`${Url.base_url.replace(/\/api$/,'')}${assessment.assessedBy.signatureUrl}?t=${Date.now()}`}
                            alt="Assessed By Signature"
                            className="h-16 mt-2 object-contain border border-gray-300 rounded bg-transparent"
                            onError={(e) => {
                              console.error("AssessedBy Signature load failed:",e.target.src);
                              e.target.src="https://via.placeholder.com/150?text=Signature+Not+Found";
                            }}
                          />
                        </div>

                      )}
                    </div>
                  </div>
                )}

                {/* 2-4. Verifier, DCO, CEO จาก approvalHistory */}
                {assessment.approvalHistory?.map((hist,index) => (
                  <div key={hist.id} className="flex items-start gap-4 border-l-4 border-blue-500 pl-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {index+2}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          hist.level==='CEO'? 'default':
                            hist.level==='DCO'? 'secondary':
                              'outline'
                        }>
                          {hist.level}
                        </Badge>
                        <span className="font-medium">{hist.approver?.fullName||hist.approver?.username}</span>
                        <span className="text-sm text-gray-500 ml-auto">{fmtDate(hist.approvedAt)}</span>
                      </div>
                      <p className="mt-1 text-gray-700">{hist.comments||'ບໍ່ມີຄຳເຫັນ'}</p>
                      {hist.approver?.signatureUrl&&(
                        <div className="bg-transparent inline-block">
                          <img
                            src={`${Url.base_url.replace(/\/api$/,'')}${hist.approver.signatureUrl}?t=${Date.now()}`}
                            alt={`${hist.level} Signature`}
                            className="h-16 mt-2 object-contain border border-gray-300 rounded bg-transparent"
                            onError={(e) => {
                              console.error(`${hist.level} Signature load failed:`,e.target.src);
                              e.target.src="https://via.placeholder.com/150?text=Signature+Not+Found";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 5. สรุปทางการเงิน (Financial Summary) */}
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-gray-50">
              <CardTitle>ສະຫຼຸບທາງການເງິນ</CardTitle>
            </CardHeader>
            <CardContent className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ລາຍການ</TableHead>
                    <TableHead className="text-right">ຈຳນວນ (ກີບ)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">ຈຳນວນກູ້ຂໍ</TableCell>
                    <TableCell className="text-right font-bold">{fmtMoney(loan.loanAmountRequested)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>ຜ່ອນຕໍ່ເດືອນ</TableCell>
                    <TableCell className="text-right">{fmtMoney(assessment.installmentAmount)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>DTI Ratio</TableCell>
                    <TableCell className="text-right text-green-600 font-bold">{assessment.dtiRatio}%</TableCell>
                  </TableRow>
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-bold">ຍອດຄົງເຫຼືອ (ຖ້າມີ)</TableCell>
                    <TableCell className="text-right font-bold text-blue-700">{fmtMoney(loan.loanAmountRequested-(loan.payments?.reduce((s,p) => s+Number(p.amountPaid),0)||0))}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Footer - พิมพ์ได้ */}
          <div className="text-center text-sm text-gray-500 mt-12 print:mt-8">
            ສ້າງຂໍ້ມູນເມື່ອ: {fmtDate(new Date())} | ລາຍງານນີ້ເປັນເອກະສານທາງການເງິນ
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullLoanReport;