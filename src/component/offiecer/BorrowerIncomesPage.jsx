import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Url } from "@/lib/Part";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

import BusinessIncomeList from "@/page/officer/BusinessIncomeList";
import BorrowerIncomeList from "@/page/officer/BorrowerIncomeList";
import ExternalLoanList from "@/page/officer/ExternalLoanList";

const BorrowerIncomesPage = () => {
  const navigate = useNavigate();
  const { borrowerId } = useParams();
  const id = Number(borrowerId);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [loadingBorrower, setLoadingBorrower] = useState(false);
  const [borrower, setBorrower] = useState(null);

  useEffect(() => {
    if (Number.isNaN(id)) return;

    const fetchBorrower = async () => {
      setLoadingBorrower(true);
      try {

        const res = await axios.get(`${Url.base_url}/borrowers/${id}`, { headers });
        setBorrower(res.data.data || res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "ໂຫຼດຂໍ້ມູນ borrower ລົ້ມເຫລວ");
        setBorrower(null);
      } finally {
        setLoadingBorrower(false);
      }
    };

    fetchBorrower();
  }, [id, headers]);

  if (Number.isNaN(id)) {
    return <div className="p-6">borrowerId ບໍ່ຖືກຕ້ອງ</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-bold text-orange-700">ຈັດການລາຍຮັບ</div>
          <div className="text-sm text-muted-foreground">Borrower ID: {id}</div>

          {loadingBorrower ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              ກຳລັງໂຫຼດ borrower...
            </div>
          ) : borrower ? (
            <div className="text-2xl font-bold text-muted-foreground mt-1 text-black">

              {(() => {
                let titleText = '';
                if (borrower.title === 'THAO') {
                  titleText = 'ທ້າວ';
                } else if (borrower.title === 'NANG') {
                  titleText = 'ນາງ';
                }
                return `${titleText} ${borrower.laoFirstName || ''} ${borrower.laoLastName || ''}`.trim();
              })()}
            </div>
          ) : null}
          <hr className="border-slate-950" />
        </div>

        <Button variant="outline" onClick={() => navigate(-1)}>
          ກັບຄືນ
        </Button>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">BorrowerIncome</TabsTrigger>
          <TabsTrigger value="business">BusinessIncome</TabsTrigger>
          <TabsTrigger value="loans">ExternalLoans</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-4">
          <BorrowerIncomeList borrowerId={id} borrower={borrower}  />
        </TabsContent>

        <TabsContent value="business" className="mt-4">
          <BusinessIncomeList borrowerId={id} borrower={borrower} />
        </TabsContent>

        <TabsContent value="loans" className="mt-4">
          <ExternalLoanList borrowerId={id} borrower={borrower} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BorrowerIncomesPage;
