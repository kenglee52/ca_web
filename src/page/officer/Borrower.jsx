// src/pages/officer/Borrower.jsx
// (quick edit to verify file is writable)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Url } from '@/lib/Part';
import { toast } from "sonner";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, Loader2, Wallet, Search, AlertCircle, Eye } from 'lucide-react';
import BorrowerForm from '@/component/offiecer/BorrowerForm'; // คง path ตามที่คุณเขียน ไม่แก้
import { useNavigate } from 'react-router-dom';
const Borrower = () => {
  const navigate = useNavigate();

  const goIncome = (borrowerId) => {
    navigate(`/creditofficer/borrower/${borrowerId}/incomes`);
  };

  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [borrowerToDelete, setBorrowerToDelete] = useState(null);

  const fetchBorrowers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${Url.base_url}/borrowers`, {
        params: { q: search.trim(), page, limit },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setBorrowers(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Fetch Borrowers Error:", err);
      toast.error('ບໍ່ສາມາດໂຫຼດຂໍ້ມູນຜູ້ກູ້ໄດ້');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowers();
  }, [page, search]);

  const handleCreate = () => {
    setSelectedBorrower(null);
    setOpenForm(true);
  };

  const handleEdit = (borrower) => {
    setSelectedBorrower(borrower);
    setOpenForm(true);
  };

  const handleDeleteClick = (borrower) => {
    setBorrowerToDelete(borrower);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!borrowerToDelete) return;

    try {
      await axios.delete(`${Url.base_url}/borrower/${borrowerToDelete.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('ລຶບຜູ້ກູ້ສຳເລັດ');
      fetchBorrowers();
    } catch (err) {
      toast.error('ບໍ່ສາມາດລຶບຜູ້ກູ້ໄດ້ ເນື່ອງຈາກສະຖານະບໍ່ແມ່ນ rejected');
    } finally {
      setDeleteDialogOpen(false);
      setBorrowerToDelete(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl font-bold">ຈັດການຜູ້ກູ້</CardTitle>
            <Badge variant="secondary" className="text-sm">
              {total} ຄົນ
            </Badge>
          </div>
          <Button
            onClick={handleCreate}
            className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="h-4 w-4" />
            ເພີ່ມຜູ້ກູ້ໃໝ່
          </Button>
        </CardHeader>

        <CardContent>
          {/* Search + Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ຄົ້ນຫາຊື່ ຫຼື ເບີໂທ..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ກ່ອນໜ້າ
              </Button>
              <span className="text-sm text-gray-600">
                ໜ້າ {page} ຈາກ {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ຕໍ່ໄປ
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>ຊື່-ນາມສະກຸນ</TableHead>
                    <TableHead>ອາຍຸ</TableHead>
                    <TableHead>ເບີໂທ</TableHead>
                    <TableHead>ອາຊີບ</TableHead>
                    <TableHead className="text-center">ເງິນເດືອນເດືອນ</TableHead>
                    <TableHead>ເລກບັດປະຈຳຕົວ</TableHead>
                    <TableHead className="text-right w-32">ຈັດການ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrowers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                        ບໍ່ພົບຂໍ້ມູນຜູ້ກູ້ ກະລຸນາເພີ່ມໃໝ່ ຫຼື ປັບການຄົ້ນຫາ
                      </TableCell>
                    </TableRow>
                  ) : (
                    borrowers.map((borrower) => (

                      <TableRow key={borrower.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {(() => {
                            let titleText = '';
                            if (borrower.title === 'THAO') {
                              titleText = 'ທ້າວ';
                            } else if (borrower.title === 'NANG') {
                              titleText = 'ນາງ';
                            }
                            return `${titleText} ${borrower.firstName || ''} ${borrower.lastName || ''}`.trim();
                          })()}
                        </TableCell>
                        <TableCell>{borrower.age}</TableCell>
                        <TableCell>{borrower.phone || '-'}</TableCell>
                        <TableCell>{borrower.occupation || '-'}</TableCell>
                        <TableCell className="text-center">
                          {borrower.monthlySalary ? `₭ ${Number(borrower.monthlySalary).toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>{borrower.certificateNo || '-'}</TableCell>
                        <TableCell className="text-right space-x-1 w-44">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/creditofficer/borrower/${borrower.id}`)}
                                  className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>ດູລາຍລະອຽດ</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => goIncome(borrower.id)}
                                    className="h-8 w-8 text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                                  >
                                    <Wallet className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>ຈັດການລາຍຮັບ (Income)</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(borrower)}
                                  className="h-8 w-8"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>ແກ້ໄຂຂໍ້ມູນຜູ້ກູ້</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(borrower)}
                                  className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>ລຶບຜູ້ກູ້ (Soft Delete)</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Footer */}
          {total > 0 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ກ່ອນໜ້າ
              </Button>
              <span className="text-sm text-gray-600">
                ໜ້າ {page} ຈາກ {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ຕໍ່ໄປ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Form Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm} disableEscapeKeyDown>
        <DialogContent
          className="sm:max-w-[1400px] max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()} // ❌ กันคลิกนอกปิด
          onPointerDownOutside={(e) => e.preventDefault()} // ❌ กัน pointer down ปิด

        >
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedBorrower ? 'ແກ້ໄຂຂໍ້ມູນຜູ້ກູ້' : 'ເພີ່ມຜູ້ກູ້ໃໝ່'}
            </DialogTitle>
          </DialogHeader>
          <BorrowerForm
            borrower={selectedBorrower}
            onSuccess={() => {
              setOpenForm(false);
              fetchBorrowers();
              toast.success(
                selectedBorrower ? 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ' : 'ເພີ່ມຜູ້ກູ້ສຳເລັດ'
              );
            }}
            onCancel={() => setOpenForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              ລຶບຜູ້ກູ້
            </DialogTitle>
            <DialogDescription className="pt-2">
              ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຜູ້ກູ້ຄົນນີ້? ການກະທຳນີ້ຈະເປັນ soft delete ແລະຈະບໍ່ສະແດງໃນລາຍການອີກ
              <div className="mt-3 font-medium text-gray-900">
                {borrowerToDelete?.firstName} {borrowerToDelete?.lastName} (ອາຍຸ: {borrowerToDelete?.age})
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start gap-3">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              ຍົກເລີກ
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              ລຶບຜູ້ກູ້
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Borrower;