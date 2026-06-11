// src/pages/admin/AuditLog.jsx
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  // Filters (optional - คุณสามารถขยายได้)
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
      };

      const res = await axios.get(`${Url.base_url}/logs`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setLogs(res.data.data || []);
      setTotal(res.data.total || res.data.data?.length || 0);
      console.log("Fetched Audit Logs:", res.data);
    } catch (err) {
      console.error("Fetch Audit Logs Error:", err);
      toast.error('ບໍ່ສາມາດໂຫຼດປະຫວັດການກະທຳໄດ້');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search, actionFilter, entityFilter]);

  const totalPages = Math.ceil(total / limit);

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">ສ້າງ</Badge>;
      case 'UPDATE':
        return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">ແກ້ໄຂ</Badge>;
      case 'DELETE':
        return <Badge variant="destructive">ລຶບ</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('lo-LA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl font-bold">ປະຫວັດການກະທຳ (Audit Log)</CardTitle>
            <Badge variant="secondary" className="text-sm">
              {total} ລາຍການ
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            ໂຫຼດໃໝ່
          </Button>
        </CardHeader>

        <CardContent>
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ຄົ້ນຫາເລກທີ່, ປະເພດການກະທຳ, ຜູ້ໃຊ້..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Filter ง่าย ๆ (สามารถเพิ่ม dropdown ได้) */}
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              ບໍ່ພົບປະຫວັດການກະທຳ ຫຼື ບໍ່ມີສິດເຂົ້າເຖິງ
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-16">ເລກທີ່</TableHead>
                    <TableHead>ການກະທຳ</TableHead>
                    <TableHead>ປະເພດຂໍ້ມູນ</TableHead>
                    <TableHead>ເລກທີ່ຂໍ້ມູນ</TableHead>
                    <TableHead>ຜູ້ກະທຳ</TableHead>
                    <TableHead>ເວລາ</TableHead>
                    <TableHead className="text-right">ລາຍລະອຽດ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{log.id}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.entityType}</Badge>
                      </TableCell>
                      <TableCell>{log.entityId}</TableCell>
                      <TableCell>
                        {log.user.username} ({log.user.role})
                        {log.user && (
                          <span className="text-xs text-gray-500 block">
                            {log.user.firstName} {log.user.lastName}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(log.performedAt)}</TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm">
                                ເບິ່ງລາຍລະອຽດ
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(log.newValue || log.changes || {}, null, 2)}
                              </pre>
                              {log.oldValue && (
                                <>
                                  <div className="text-xs text-red-600 mt-2">ເກົ່າ:</div>
                                  <pre className="text-xs whitespace-pre-wrap text-gray-600">
                                    {JSON.stringify(log.oldValue, null, 2)}
                                  </pre>
                                </>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
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
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;