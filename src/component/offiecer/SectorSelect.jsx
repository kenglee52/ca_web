// src/component/offiecer/SectorSelect.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Url } from '@/lib/Part';
import { toast } from 'sonner';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const SectorSelect = ({ value, onChange, disabled = false, placeholder = "ເລືອກປະເພດທຸລະກິດ" }) => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSectors = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${Url.base_url}/sectors`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSectors(res.data.data || []);
      } catch (err) {
        toast.error('ບໍ່ສາມາດດຶງລາຍການປະເພດທຸລະກິດໄດ້');
      } finally {
        setLoading(false);
      }
    };

    fetchSectors();
  }, []);

  return (
    <div>
      <Select
        value={value?.toString() || ''}
        onValueChange={(val) => onChange(Number(val))}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "ກຳລັງໂຫຼດ..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {sectors.map((sector) => (
            <SelectItem key={sector.id} value={sector.id.toString()}>
              {sector.sector} {sector.subSector ? `(${sector.subSector})` : ''} - {sector.bolCode}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {loading && <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" /> ກຳລັງໂຫຼດປະເພດທຸລະກິດ...
      </div>}
    </div>
  );
};

export default SectorSelect;