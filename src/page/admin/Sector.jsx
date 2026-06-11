// src/pages/admin/Sector.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Url } from '@/lib/Part';
import { toast } from 'react-toastify';

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
import { Plus, Edit, Trash2, Loader2, Search, AlertCircle } from 'lucide-react';
import SectorForm from '@/component/admin/Sector/SectorForm';



const Sector = () => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selectedSector, setSelectedSector] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectorToDelete, setSectorToDelete] = useState(null);

  const fetchSectors = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${Url.base_url}/sectors`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSectors(res.data.data || []);
    } catch (err) {
      toast.error('Unable to load Sector data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectors();
  }, []);

  const handleCreate = () => {
    setSelectedSector(null);
    setOpenForm(true);
  };

  const handleEdit = (sector) => {
    if (sector.isDeleted) {
      toast.warning('This sector is already deleted and cannot be edited');
      return;
    }
    setSelectedSector(sector);
    setOpenForm(true);
  };

  const handleDeleteClick = (sector) => {
    if (sector.isDeleted) {
      toast.info('This sector is already deleted');
      return;
    }
    setSectorToDelete(sector);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!sectorToDelete) return;

    try {
      await axios.delete(`${Url.base_url}/sector/${sectorToDelete.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Sector deleted successfully (soft delete)');
      fetchSectors();
    } catch (err) {
      toast.error('Failed to delete Sector');
    } finally {
      setDeleteDialogOpen(false);
      setSectorToDelete(null);
    }
  };

  const filteredSectors = sectors.filter(
    (s) =>
      s.sector?.toLowerCase().includes(search.toLowerCase()) ||
      s.bolCode?.toLowerCase().includes(search.toLowerCase()) ||
      s.subSector?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl font-bold">Sector Management</CardTitle>
            <Badge variant="secondary" className="text-sm">
              {sectors.filter(s => !s.isDeleted).length} active sectors
            </Badge>
            {sectors.some(s => s.isDeleted) && (
              <Badge variant="outline" className="text-sm text-gray-500">
                {sectors.filter(s => s.isDeleted).length} deleted
              </Badge>
            )}
          </div>
          <Button
            onClick={handleCreate}
            className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Add New Sector
          </Button>
        </CardHeader>

        <CardContent>
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by Sector, Sub-Sector, or BOL Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
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
                    <TableHead className="w-16">No.</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Sub-Sector</TableHead>
                    <TableHead className="text-center">SMF v1</TableHead>
                    <TableHead className="text-center">SMF v2</TableHead>
                    <TableHead className="text-center">SMF v3</TableHead>
                    <TableHead>BOL Economic</TableHead>
                    <TableHead>BOL Code</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSectors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                        No sectors found. Try adjusting your search or add a new one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSectors.map((sector) => (
                      <TableRow
                        key={sector.id}
                        className={`hover:bg-gray-50 ${sector.isDeleted ? 'opacity-60 bg-gray-100' : ''}`}
                      >
                        <TableCell className="font-medium">{sector.number}</TableCell>
                        <TableCell className="font-semibold">
                          {sector.sector}
                          {sector.isDeleted && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Deleted
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{sector.subSector || '-'}</TableCell>
                        <TableCell className="text-center">{sector.smfV1 || '-'}</TableCell>
                        <TableCell className="text-center">{sector.smfV2 || '-'}</TableCell>
                        <TableCell className="text-center">{sector.smfV3 || '-'}</TableCell>
                        <TableCell>{sector.bolEconomic || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sector.bolCode || '-'}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(sector)}
                                  disabled={sector.isDeleted}
                                  className={`h-8 w-8 ${sector.isDeleted ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {sector.isDeleted ? 'Cannot edit deleted sector' : 'Edit Sector'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(sector)}
                                  disabled={sector.isDeleted}
                                  className={`h-8 w-8 ${sector.isDeleted ? 'opacity-40 cursor-not-allowed' : 'text-red-600 hover:text-red-800 hover:bg-red-50'}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {sector.isDeleted ? 'Already deleted' : 'Delete Sector (Soft Delete)'}
                              </TooltipContent>
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
        </CardContent>
      </Card>

      {/* Add/Edit Form Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedSector ? 'Edit Sector' : 'Add New Sector'}
            </DialogTitle>
          </DialogHeader>
          <SectorForm
            sector={selectedSector}
            onSuccess={() => {
              setOpenForm(false);
              fetchSectors();
              toast.success(
                selectedSector ? 'Sector updated successfully' : 'Sector created successfully'
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
              Delete Sector
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this sector? This action will mark it as deleted (soft delete) and it will no longer appear in the list.
              <div className="mt-3 font-medium text-gray-900">
                {sectorToDelete?.sector} (BOL Code: {sectorToDelete?.bolCode})
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Sector
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sector;