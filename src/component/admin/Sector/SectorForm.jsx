// src/components/admin/Sector/SectorForm.jsx
import React from 'react';
import axios from 'axios';
import { Url } from '@/lib/Part';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

// Zod Schema (ใช้ .transform() สำหรับ trim)
const sectorSchema = z.object({
  number: z.coerce
    .number({ invalid_type_error: "Number must be a valid number" })
    .min(1, { message: "Number must be ≥ 1" }),

  sector: z
    .string()
    .min(1, { message: "Sector name is required" })
    .transform((val) => val.trim()),

  subSector: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : undefined)),

  smfV1: z.coerce
    .number({ invalid_type_error: "SMF v1 must be a valid number" })
    .min(0, { message: "SMF v1 must be ≥ 0" }),

  smfV2: z.coerce
    .number({ invalid_type_error: "SMF v2 must be a valid number" })
    .min(0, { message: "SMF v2 must be ≥ 0" }),

  smfV3: z.coerce
    .number({ invalid_type_error: "SMF v3 must be a valid number" })
    .min(0, { message: "SMF v3 must be ≥ 0" }),

  bolEconomic: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : undefined)),

  bolCode: z
    .string()
    .min(1, { message: "BOL Code is required" })
    .transform((val) => val.trim()),
});

const SectorForm = ({ sector, onSuccess, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(sectorSchema),
    defaultValues: sector || {
      number: '',
      sector: '',
      subSector: '',
      smfV1: '',
      smfV2: '',
      smfV3: '',
      bolEconomic: '',
      bolCode: '',
    },
  });

  React.useEffect(() => {
    if (sector) {
      reset(sector);
    }
  }, [sector, reset]);

  const onSubmit = async (data) => {
    try {
      const url = sector
        ? `${Url.base_url}/sector/${sector.id}`
        : `${Url.base_url}/sector`;
      const method = sector ? 'put' : 'post';

      const res = await axios[method](url, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.data.success) {
        toast.success(sector ? 'Sector updated successfully' : 'Sector created successfully');
        onSuccess();
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        (sector ? 'Failed to update sector' : 'Failed to create sector');
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Number *</Label>
          <Input
            type="number"
            step="1"
            {...register('number', { valueAsNumber: true })}
          />
          {errors.number && (
            <p className="text-red-500 text-sm mt-1">{errors.number.message}</p>
          )}
        </div>

        <div>
          <Label>Sector *</Label>
          <Input {...register('sector')} />
          {errors.sector && (
            <p className="text-red-500 text-sm mt-1">{errors.sector.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label>Sub-Sector (optional)</Label>
          <Input {...register('subSector')} />
        </div>

        <div>
          <Label>SMF v1 *</Label>
          <Input
            type="number"
            step="0.1"
            {...register('smfV1', { valueAsNumber: true })}
          />
          {errors.smfV1 && (
            <p className="text-red-500 text-sm mt-1">{errors.smfV1.message}</p>
          )}
        </div>

        <div>
          <Label>SMF v2 *</Label>
          <Input
            type="number"
            step="0.1"
            {...register('smfV2', { valueAsNumber: true })}
          />
          {errors.smfV2 && (
            <p className="text-red-500 text-sm mt-1">{errors.smfV2.message}</p>
          )}
        </div>

        <div>
          <Label>SMF v3 *</Label>
          <Input
            type="number"
            step="0.1"
            {...register('smfV3', { valueAsNumber: true })}
          />
          {errors.smfV3 && (
            <p className="text-red-500 text-sm mt-1">{errors.smfV3.message}</p>
          )}
        </div>

        <div>
          <Label>BOL Economic (optional)</Label>
          <Input {...register('bolEconomic')} />
        </div>

        <div>
          <Label>BOL Code *</Label>
          <Input {...register('bolCode')} />
          {errors.bolCode && (
            <p className="text-red-500 text-sm mt-1">{errors.bolCode.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="gap-2 bg-orange-500 hover:bg-orange-600"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : sector ? (
            'Update Sector'
          ) : (
            'Create Sector'
          )}
        </Button>
      </div>
    </form>
  );
};

export default SectorForm;