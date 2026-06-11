// src/components/admin/Borrower/BorrowerForm.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Url } from '@/lib/Part';
import { toast } from "sonner";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import SectorSelect from './SectorSelect';

const toDateInputValue = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

// --- ຂັ້ນຕອນທີ 1: ປັບປຸງ Zod Schema ໃຫ້ຮອງຮັບ Conditional Validation ---
const borrowerSchema = z.object({
  title: z.enum(["THAO", "NANG"], { message: "ຕ້ອງເລືອກ ທ້າວ ຫຼື ນາງ" }),
  laoFirstName: z.string().min(1, { message: "ຊື່ (ລາວ) ຕ້ອງການ" }),
  laoLastName: z.string().min(1, { message: "ນາມສະກຸນ (ລາວ) ຕ້ອງການ" }),
  firstName: z.string().min(1, { message: "First Name (English) ຕ້ອງການ" }),
  lastName: z.string().min(1, { message: "Last Name (English) ຕ້ອງການ" }),

  age: z.coerce
    .number({ invalid_type_error: "ອາຍຸຕ້ອງເປັນຕົວເລກ" })
    .min(18, { message: "ອາຍຸຕ້ອງບໍ່ນ້ອຍກວ່າ 18 ປີ" }),

  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional(),
  nationality: z.string().optional(),
  education: z.enum([
    "NONE", "KINDERGARTEN", "PRIMARY", "LOWER_SECONDARY",
    "UPPER_SECONDARY", "VOCATIONAL", "ASSOCIATE", "BACHELOR",
    "MASTER", "DOCTORATE"
  ]).optional(),
  sectorId: z.coerce.number().optional(),
  occupation: z.string().optional(),
  employerName: z.string().optional(),
  position: z.string().optional(),
  workingStartDate: z.string().optional(),
  phone: z.string().optional(),
  village: z.string().optional(),

  provinceId: z.coerce.number().optional(),
  districtId: z.coerce.number().optional(),

  certificateType: z.enum(["ID_CARD", "PASSPORT", "FAMILY_BOOK"]).optional(),
  certificateNo: z.string().optional(),
  idCardExpiryDate: z.string().optional(),
  noExpiryDate: z.boolean().optional(),
  dateOfBirth: z.string().optional(),
  currentAddressLink: z.string().url({ message: "ລິ້ງທີ່ຢູ່ຕ້ອງເປັນ URL ທີ່ຖືກຕ້ອງ" }).optional().or(z.literal('')),

  monthlySalary: z.coerce.number().min(0, { message: "ເງິນເດືອນເດືອນບໍ່ສາມາດຕິດລົບ" }).optional(),
  householdExpense: z.coerce.number().min(0, { message: "ຄ່າຄອບຄົວບໍ່ສາມາດຕິດລົບ" }).optional(),
  netIncome: z.coerce.number().min(0, { message: "ລາຍໄດ້ສຸດທິບໍ່ສາມາດຕິດລົບ" }).optional(),

  relationshipWithFina: z.string().optional(),

  companyProvinceId: z.coerce.number().optional(),
  companyDistrictId: z.coerce.number().optional(),
  companyVillage: z.string().optional(),
  companyAddressLink: z.string().url({ message: "ລິ້ງທີ່ຢູ່ບໍລິສັດຕ້ອງເປັນ URL" }).optional().or(z.literal('')),
  companyPhone: z.string().optional(),

  // ເພີ່ມ field ສໍາລັບ Checkbox
  hasBusinessInfo: z.boolean().optional(),

  // ຂັ້ນຕອນຂໍ້ມູນທຸລະກິດ
  businessRegistrationNumber: z.string().optional(),
  businessRegisterName: z.string().optional(),
  businessType: z.string().optional(),
  businessVillage: z.string().optional(),
  businessProvinceId: z.coerce.number().optional(),
  businessDistrictId: z.coerce.number().optional(),
  businessAddressLink: z.string().url({ message: "ລິ້ງທີ່ຢູ່ທຸລະກິດຕ້ອງເປັນ URL" }).optional().or(z.literal('')),
  businessPhone: z.string().optional(),
  employeeCount: z.coerce.number().min(0, { message: "ຈຳນວນພະນັກງານບໍ່ສາມາດຕິດລົບ" }).optional(),
}).superRefine((data, ctx) => {
  // ຖ້າຕິກ Checkbox ໃຫ້ກວດເຊັກ field ທີ່ຕິດເຄື່ອງໝາຍ *
  if (data.hasBusinessInfo) {
    if (!data.sectorId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ກະລຸນາເລືອກປະເພດທຸລະກິດ", path: ["sectorId"] });
    }
    if (!data.businessRegisterName || data.businessRegisterName.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ກະລຸນາໃສ່ຊື່ຕາມທະບຽນທຸລະກິດ", path: ["businessRegisterName"] });
    }
    if (!data.businessProvinceId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ກະລຸນາເລືອກແຂວງທຸລະກິດ", path: ["businessProvinceId"] });
    }
    if (!data.businessDistrictId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ກະລຸນາເລືອກເມືອງທຸລະກິດ", path: ["businessDistrictId"] });
    }
  }
});

const BorrowerForm = ({ borrower, onSuccess, onCancel }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [companyDistricts, setCompanyDistricts] = useState([]);
  const [businessDistricts, setBusinessDistricts] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(borrowerSchema),
    defaultValues: {
      title: "THAO",
      nationality: "Lao",
      hasBusinessInfo: false,
      ...borrower,
    },
  });

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await axios.get(`${Url.base_url}/province`);
        setProvinces(res.data.data || []);
      } catch (err) {
        toast.error('ບໍ່ສາມາດດຶງຂໍ້ມູນແຂວງໄດ້');
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  const selectedProvinceId = watch('provinceId');
  useEffect(() => {
    if (!selectedProvinceId) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const res = await axios.get(`${Url.base_url}/district`, {
          params: { provinceId: selectedProvinceId },
        });
        setDistricts(res.data.data || []);
      } catch (err) {
        toast.error('ບໍ່ສາມາດດຶງຂໍ້ມູນເມືອງໄດ້');
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedProvinceId]);

  const selectedCompanyProvinceId = watch('companyProvinceId');
  useEffect(() => {
    if (!selectedCompanyProvinceId) {
      setCompanyDistricts([]);
      return;
    }
    const fetch = async () => {
      try {
        const res = await axios.get(`${Url.base_url}/district`, {
          params: { provinceId: selectedCompanyProvinceId },
        });
        setCompanyDistricts(res.data.data || []);
      } catch (err) {
        toast.error('ບໍ່ສາມາດດຶງເມືອງບໍລິສັດໄດ້');
      }
    };
    fetch();
  }, [selectedCompanyProvinceId]);

  const selectedBusinessProvinceId = watch('businessProvinceId');
  useEffect(() => {
    if (!selectedBusinessProvinceId) {
      setBusinessDistricts([]);
      return;
    }
    const fetch = async () => {
      try {
        const res = await axios.get(`${Url.base_url}/district`, {
          params: { provinceId: selectedBusinessProvinceId },
        });
        setBusinessDistricts(res.data.data || []);
      } catch (err) {
        toast.error('ບໍ່ສາມາດດຶງເມືອງທຸລະກິດໄດ້');
      }
    };
    fetch();
  }, [selectedBusinessProvinceId]);

  // --- ຂັ້ນຕອນທີ 3: ຈັດການ Edit Mode (Auto-check ຖ້າມີຂໍ້ມູນທຸລະກິດ) ---
  useEffect(() => {
    if (borrower) {
      reset({
        ...borrower,
        hasBusinessInfo: !!borrower.businessRegisterName || !!borrower.sectorId, // ຖ້າມີຊື່ ຫຼື sector ໃຫ້ຕິກ checkbox ເລີຍ
        idCardExpiryDate: toDateInputValue(borrower.idCardExpiryDate),
        dateOfBirth: toDateInputValue(borrower.dateOfBirth),
        workingStartDate: toDateInputValue(borrower.workingStartDate),
        title: borrower.title || "THAO",
        laoFirstName: borrower.laoFirstName || "",
        laoLastName: borrower.laoLastName || "",
        firstName: borrower.firstName || "",
        lastName: borrower.lastName || "",
        provinceId: borrower.provinceId?.toString(),
        districtId: borrower.districtId?.toString(),
        companyProvinceId: borrower.companyProvinceId?.toString(),
        companyDistrictId: borrower.companyDistrictId?.toString(),
        businessProvinceId: borrower.businessProvinceId?.toString(),
        businessDistrictId: borrower.businessDistrictId?.toString(),
        monthlySalary: borrower.monthlySalary || 0,
        householdExpense: borrower.householdExpense || 0,
        netIncome: borrower.netIncome || 0,
      });
    }
  }, [borrower, reset]);

  // --- ຂັ້ນຕອນທີ 2: ການຈັດການຂໍ້ມູນກ່ອນສົ່ງໄປ Backend (Data Cleaning) ---
  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data);
    try {
      const isBiz = data.hasBusinessInfo;
      const submitData = {
        ...data,
        provinceId: data.provinceId ? Number(data.provinceId) : null,
        districtId: data.districtId ? Number(data.districtId) : null,
        companyProvinceId: data.companyProvinceId ? Number(data.companyProvinceId) : null,
        companyDistrictId: data.companyDistrictId ? Number(data.companyDistrictId) : null,

        // ຖ້າບໍ່ໄດ້ຕິກ Checkbox ໃຫ້ສົ່ງຄ່າເປັນ null ທັງໝົດ
        businessProvinceId: isBiz && data.businessProvinceId ? Number(data.businessProvinceId) : null,
        businessDistrictId: isBiz && data.businessDistrictId ? Number(data.businessDistrictId) : null,
        sectorId: isBiz && data.sectorId ? Number(data.sectorId) : null,
        businessRegisterName: isBiz ? data.businessRegisterName : null,
        businessRegistrationNumber: isBiz ? data.businessRegistrationNumber : null,
        businessType: isBiz ? data.businessType : null,
        businessVillage: isBiz ? data.businessVillage : null,
        businessAddressLink: isBiz ? data.businessAddressLink : null,
        businessPhone: isBiz ? data.businessPhone : null,
        employeeCount: isBiz ? Number(data.employeeCount) : null,
        idCardExpiryDate: data.noExpiryDate ? null : (data.idCardExpiryDate || null),
      };
      console.log('Submitting to backend:', submitData);

      const url = borrower
        ? `${Url.base_url}/borrowers/${borrower.id}`
        : `${Url.base_url}/borrowers`;
      const method = borrower ? 'put' : 'post';
      console.log(`Calling ${method.toUpperCase()} ${url}`);
      const res = await axios[method](url, submitData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Response from server:', res.data);
      if (res.data.success) {
        toast.success(borrower ? 'ແກ້ໄຂຂໍ້ມູນຜູ້ກູ້ສຳເລັດ' : 'ເພີ່ມຜູ້ກູ້ໃໝ່ສຳເລັດ');
        onSuccess();
      }
    } catch (err) {
      console.error('Submit error:', err);
      const errorMessage =
        err.response?.data?.message ||
        (borrower ? 'ການແກ້ໄຂລົ້ມເຫລວ' : 'ການເພີ່ມຂໍ້ມູນລົ້ມເຫລວ');
      toast.error(errorMessage);
    }
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '';
    return Number(value).toLocaleString('lo-LA');
  };

  const parseCurrency = (value) => {
    if (!value) return 0;
    const cleanValue = String(value).replace(/,/g, '');
    return Number(cleanValue) || 0;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* ຂໍ້ມູນສ່ວນຕົວ */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-orange-700">ຂໍ້ມູນສ່ວນຕົວ</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <Label>ຄຳນຳໜ້າ *</Label>
          <Select
            value={watch('title')}
            onValueChange={(value) => setValue('title', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="ເລືອກ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="THAO">ທ້າວ</SelectItem>
              <SelectItem value="NANG">ນາງ</SelectItem>
            </SelectContent>
          </Select>
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <Label>ຊື່ (ລາວ) *</Label>
          <Input {...register('laoFirstName')} />
          {errors.laoFirstName && <p className="text-red-500 text-sm mt-1">{errors.laoFirstName.message}</p>}
        </div>

        <div>
          <Label>ນາມສະກຸນ (ລາວ) *</Label>
          <Input {...register('laoLastName')} />
          {errors.laoLastName && <p className="text-red-500 text-sm mt-1">{errors.laoLastName.message}</p>}
        </div>

        <div>
          <Label>First Name (English) *</Label>
          <Input {...register('firstName')} />
          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
        </div>

        <div>
          <Label>Last Name (English) *</Label>
          <Input {...register('lastName')} />
          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
        </div>

        <div>
          <Label>ອາຍຸ *</Label>
          <Input type="number" {...register('age', { valueAsNumber: true })} />
          {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>}
        </div>

        <div>
          <Label>ສະຖານະສົມລົດ</Label>
          <Select
            value={watch('maritalStatus') || ''}
            onValueChange={(value) => setValue('maritalStatus', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="ເລືອກ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE">ໂສດ</SelectItem>
              <SelectItem value="MARRIED">ແຕ່ງງານ</SelectItem>
              <SelectItem value="DIVORCED">ຢ່າຮ້າງ</SelectItem>
              <SelectItem value="WIDOWED">ໝ້າ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>ສັນຊາດ</Label>
          <Input {...register('nationality')} />
        </div>

        <div>
          <Label>ລະດັບການສຶກສາ</Label>
          <Select
            value={watch('education') || ''}
            onValueChange={(value) => setValue('education', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="ເລືອກລະດັບການສຶກສາ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">ບໍ່ໄດ້ຮຽນ / ບໍ່ຈົບການສຶກສາ</SelectItem>
              <SelectItem value="KINDERGARTEN">ອະນຸບານ</SelectItem>
              <SelectItem value="PRIMARY">ປະຖົມສຶກສາ</SelectItem>
              <SelectItem value="LOWER_SECONDARY">ມັດທະຍົມຕອນຕົ້ນ</SelectItem>
              <SelectItem value="UPPER_SECONDARY">ມັດທະຍົມຕອນປາຍ</SelectItem>
              <SelectItem value="VOCATIONAL">ອາຊີວະສຶກສາ / ວິຊາຊີບ</SelectItem>
              <SelectItem value="ASSOCIATE">ອະນຸປະລິນຍາ</SelectItem>
              <SelectItem value="BACHELOR">ປະລິນຍາຕີ</SelectItem>
              <SelectItem value="MASTER">ປະລິນຍາໂທ</SelectItem>
              <SelectItem value="DOCTORATE">ປະລິນຍາເອກ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>ອາຊີບ</Label>
          <Input {...register('occupation')} />
        </div>

        <div>
          <Label>ຊື່ບໍລິສັດ / ເຈົ້າຂອງ</Label>
          <Input {...register('employerName')} />
        </div>

        <div>
          <Label>ຕຳແໜ່ງ</Label>
          <Input {...register('position')} />
        </div>

        <div>
          <Label>ວັນທີເລີ່ມເຮັດວຽກ</Label>
          <Input type="date" {...register('workingStartDate')} />
        </div>

        <div>
          <Label>ເບີໂທລະສັບ</Label>
          <Input {...register('phone')} />
        </div>

        <div>
          <Label>ບ້ານ</Label>
          <Input {...register('village')} />
        </div>

        <div>
          <Label>ແຂວງ</Label>
          {loadingProvinces ? (
            <div className="h-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <Select
              value={watch('provinceId')?.toString() || ''}
              onValueChange={(value) => setValue('provinceId', Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="ເລືອກແຂວງ" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((prov) => (
                  <SelectItem key={prov.id} value={prov.id.toString()}>
                    {prov.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <Label>ເມືອງ</Label>
          {loadingDistricts ? (
            <div className="h-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <Select
              value={watch('districtId')?.toString() || ''}
              onValueChange={(value) => setValue('districtId', Number(value))}
              disabled={!watch('provinceId')}
            >
              <SelectTrigger>
                <SelectValue placeholder="ເລືອກເມືອງ" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((dist) => (
                  <SelectItem key={dist.id} value={dist.id.toString()}>
                    {dist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <Label>ປະເພດເອກະສານ</Label>
          <Select
            value={watch('certificateType') || ''}
            onValueChange={(value) => setValue('certificateType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="ເລືອກປະເພດເອກະສານ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ID_CARD">ບັດປະຈຳຕົວ</SelectItem>
              <SelectItem value="PASSPORT">ພາສປອດ</SelectItem>
              <SelectItem value="FAMILY_BOOK">ສຳມະໂນຄົວ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>ເລກບັດປະຈຳຕົວ</Label>
          <Input {...register('certificateNo')} />
        </div>
        <div className="grid gap-4">
          {/* Checkbox หลัก */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="noExpiryDate"
              className="w-5 h-5 cursor-pointer accent-orange-600"
              checked={watch('noExpiryDate') || false}
              onChange={(e) => {
                const checked = e.target.checked;
                setValue('noExpiryDate', checked);
                if (checked) {
                  setValue('idCardExpiryDate', ''); // ล้างวันที่ให้ว่าง
                }
              }}
            />
            <Label
              htmlFor="noExpiryDate"
              className="text-sm font-medium cursor-pointer"
            >
              ເອກະສານນີ້ບໍ່ມີວັນທີ່ໝົດອາຍຸ (ບັນທຶກເປັນ null)
            </Label>
          </div>

          {/* Input วันที่ - แสดงเฉพาะเมื่อไม่ติ๊ก */}
          {!watch('noExpiryDate') && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="idCardExpiryDate">
                ວັນທີໝົດອາຍຸເອກະສານ <span className="text-xs text-gray-500">(optional)</span>
              </Label>
              <Input
                id="idCardExpiryDate"
                type="date"
                {...register('idCardExpiryDate')}
                placeholder="ວັນທີ່ໝົດອາຍຸ"
              />
              <p className="text-xs text-gray-500">
                ຖ້າເອກະສານໝົດອາຍຸບໍ່ມີ → ກະລຸນາຕິກ Checkbox ດ້ານເທິງ
              </p>
              {errors.idCardExpiryDate && (
                <p className="text-red-500 text-sm mt-1">{errors.idCardExpiryDate.message}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <Label>ວັນເດືອນປີເກີດ</Label>
          <Input type="date" {...register('dateOfBirth')} />
        </div>

        <div>
          <Label>ລິ້ງທີ່ຢູ່ປັດຈຸບັນ (Google Maps)</Label>
          <Input {...register('currentAddressLink')} placeholder="https://maps.google.com/..." />
          {errors.currentAddressLink && <p className="text-red-500 text-sm mt-1">{errors.currentAddressLink.message}</p>}
        </div>
      </div>

      <div className="border-b pb-4 mt-8">
        <h3 className="text-lg font-semibold text-orange-700">ຂໍ້ມູນການເງິນ</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label>ເງິນເດືອນເດືອນ (ກີບ)</Label>
          <Input
            type="text"
            value={formatCurrency(watch('monthlySalary'))}
            onChange={(e) => setValue('monthlySalary', parseCurrency(e.target.value), { shouldValidate: true })}
          />
          {errors.monthlySalary && <p className="text-red-500 text-sm mt-1">{errors.monthlySalary.message}</p>}
        </div>

        <div>
          <Label>ຄ່າຄອບຄົວ (ກີບ)</Label>
          <Input
            type="text"
            value={formatCurrency(watch('householdExpense'))}
            onChange={(e) => setValue('householdExpense', parseCurrency(e.target.value), { shouldValidate: true })}
          />
        </div>

        <div>
          <Label>ລາຍໄດ້ສຸດທິ (ກີບ)</Label>
          <Input
            type="text"
            value={formatCurrency(watch('netIncome'))}
            onChange={(e) => setValue('netIncome', parseCurrency(e.target.value), { shouldValidate: true })}
          />
        </div>
      </div>

      <div className="border-b pb-4 mt-8">
        <h3 className="text-lg font-semibold text-orange-700">ຂໍ້ມູນບໍລິສັດ / ບ່ອນເຮັດວຽກ</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <Label>ແຂວງບໍລິສັດ</Label>
          <Select
            value={watch('companyProvinceId')?.toString() || ''}
            onValueChange={(value) => setValue('companyProvinceId', Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="ເລືອກແຂວງ" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((prov) => (
                <SelectItem key={prov.id} value={prov.id.toString()}>
                  {prov.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>ເມືອງບໍລິສັດ</Label>
          <Select
            value={watch('companyDistrictId')?.toString() || ''}
            onValueChange={(value) => setValue('companyDistrictId', Number(value))}
            disabled={!watch('companyProvinceId')}
          >
            <SelectTrigger>
              <SelectValue placeholder="ເລືອກເມືອງ" />
            </SelectTrigger>
            <SelectContent>
              {companyDistricts.map((dist) => (
                <SelectItem key={dist.id} value={dist.id.toString()}>
                  {dist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>ບ້ານບໍລິສັດ</Label>
          <Input {...register('companyVillage')} />
        </div>

        <div>
          <Label>ລິ້ງທີ່ຢູ່ບໍລິສັດ (Google Maps)</Label>
          <Input {...register('companyAddressLink')} placeholder="https://maps.google.com/..." />
          {errors.companyAddressLink && <p className="text-red-500 text-sm mt-1">{errors.companyAddressLink.message}</p>}
        </div>

        <div>
          <Label>ເບີໂທບໍລິສັດ</Label>
          <Input {...register('companyPhone')} />
        </div>
      </div>

      {/* ຂັ້ນຕອນຂໍ້ມູນທຸລະກິດ */}
      <div className="flex items-center gap-2 border-b pb-4 mt-8 mb-6">
        <input
          type="checkbox"
          id="hasBusinessInfo"
          className="w-5 h-5 cursor-pointer accent-orange-600"
          {...register('hasBusinessInfo')}
        />
        <label
          htmlFor="hasBusinessInfo"
          className="text-lg font-semibold text-orange-700 cursor-pointer"
        >
          ຂໍ້ມູນທຸລະກິດ (ຖ້າມີ)
        </label>
      </div>

      {watch('hasBusinessInfo') && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <Label>ປະເພດທຸລະກິດ (Sector) <span className="text-red-500">*</span></Label>
            <SectorSelect
              value={watch('sectorId')}
              onChange={(value) => {
                setValue('sectorId', value, { shouldValidate: true });
              }}
            />
            {errors.sectorId && <p className="text-red-500 text-sm mt-1">{errors.sectorId.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label>ເລກທະບຽນວິສາຫະກິດ</Label>
              <Input {...register('businessRegistrationNumber')} placeholder="ຖ້າມີ" />
            </div>

            <div>
              <Label>ຊື່ຕາມທະບຽນທຸລະກິດ <span className="text-red-500">*</span></Label>
              <Input {...register('businessRegisterName')} placeholder="ໃສ່ຊື່ວິສາຫະກິດ ຫຼື ຊື່ຮ້ານ" />
              {errors.businessRegisterName && <p className="text-red-500 text-sm mt-1">{errors.businessRegisterName.message}</p>}
            </div>

            <div>
              <Label>ປະເພດທຸລະກິດ</Label>
              <Input {...register('businessType')} placeholder="ເຊັ່ນ ຮ້ານຂາຍເຄື່ອງ, ບໍລິການ" />
            </div>

            <div>
              <Label>ບ້ານທຸລະກິດ</Label>
              <Input {...register('businessVillage')} />
            </div>

            <div>
              <Label>ແຂວງທຸລະກິດ <span className="text-red-500">*</span></Label>
              <Select
                value={watch('businessProvinceId')?.toString() || ''}
                onValueChange={(value) => setValue('businessProvinceId', Number(value), { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ເລືອກແຂວງ" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((prov) => (
                    <SelectItem key={prov.id} value={prov.id.toString()}>
                      {prov.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.businessProvinceId && <p className="text-red-500 text-sm mt-1">{errors.businessProvinceId.message}</p>}
            </div>

            <div>
              <Label>ເມືອງທຸລະກິດ <span className="text-red-500">*</span></Label>
              <Select
                value={watch('businessDistrictId')?.toString() || ''}
                onValueChange={(value) => setValue('businessDistrictId', Number(value), { shouldValidate: true })}
                disabled={!watch('businessProvinceId')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ເລືອກເມືອງ" />
                </SelectTrigger>
                <SelectContent>
                  {businessDistricts.map((dist) => (
                    <SelectItem key={dist.id} value={dist.id.toString()}>
                      {dist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.businessDistrictId && <p className="text-red-500 text-sm mt-1">{errors.businessDistrictId.message}</p>}
            </div>

            <div>
              <Label>ລິ້ງທີ່ຢູ່ທຸລະກິດ (Google Maps)</Label>
              <Input {...register('businessAddressLink')} placeholder="http://..." />
              {errors.businessAddressLink && <p className="text-red-500 text-sm mt-1">{errors.businessAddressLink.message}</p>}
            </div>

            <div>
              <Label>ເບີໂທທຸລະກິດ</Label>
              <Input {...register('businessPhone')} placeholder="020..." />
            </div>

            <div>
              <Label>ຈຳນວນພະນັກງານ</Label>
              <Input type="number" {...register('employeeCount', { valueAsNumber: true })} min="0" />
            </div>

            <div>
              <Label>ສາຍພົວພັນກັບ FINA</Label>
              <Input {...register('relationshipWithFina')} />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-8 border-t mt-8">
        <Button type="button" variant="outline" onClick={onCancel} className="px-6">
          ຍົກເລີກ
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              ກຳລັງບັນທຶກ...
            </>
          ) : borrower ? (
            'ແກ້ໄຂຂໍ້ມູນ'
          ) : (
            'ເພີ່ມຜູ້ກູ້ໃໝ່'
          )}
        </Button>
      </div>
    </form>
  );
};

export default BorrowerForm;