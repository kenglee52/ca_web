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
  return d.toISOString().split('T')[0];
};

// --- ຂັ້ນຕອນທີ 1: Zod Schema ທີ່ປອດໄພ ແລະ ຍືດຫຍຸ່ນ ---
const borrowerSchema = z.object({
  title: z.enum(["THAO", "NANG"], { message: "ຕ້ອງເລືອກ ທ້າວ ຫຼື ນາງ" }),
  laoFirstName: z.string().min(1, { message: "ชື່ (ລາວ) ຕ້ອງການ" }),
  laoLastName: z.string().min(1, { message: "ນາມສະກຸນ (ລາວ) ຕ້ອງການ" }),
  firstName: z.string().min(1, { message: "First Name (English) ຕ້ອງການ" }),
  lastName: z.string().min(1, { message: "Last Name (English) ต้องการ" }),

  age: z.coerce
    .number({ invalid_type_error: "ອາຍຸຕ້ອງເປັນຕົວເລກ" })
    .min(18, { message: "ອາຍຸຕ້ອງບໍ່ນ້ອຍກວ່າ 18 ປີ" }),

  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional().or(z.literal('')),
  nationality: z.string().optional().or(z.literal('')),
  education: z.enum([
    "NONE", "KINDERGARTEN", "PRIMARY", "LOWER_SECONDARY",
    "UPPER_SECONDARY", "VOCATIONAL", "ASSOCIATE", "BACHELOR",
    "MASTER", "DOCTORATE"
  ]).optional().or(z.literal('')),
  
  sectorId: z.union([z.coerce.number(), z.string(), z.null()]).optional(),
  occupation: z.string().optional().or(z.literal('')),
  employerName: z.string().optional().or(z.literal('')),
  position: z.string().optional().or(z.literal('')),
  workingStartDate: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  village: z.string().optional().or(z.literal('')),

  provinceId: z.coerce.number().optional().or(z.literal('')),
  districtId: z.coerce.number().optional().or(z.literal('')),

  certificateType: z.enum(["ID_CARD", "PASSPORT", "FAMILY_BOOK"]).optional().or(z.literal('')),
  certificateNo: z.string().optional().or(z.literal('')),
  idCardExpiryDate: z.string().optional().or(z.literal('')),
  noExpiryDate: z.boolean().optional(),
  dateOfBirth: z.string().optional().or(z.literal('')),
  currentAddressLink: z.string().optional().or(z.literal('')),

  monthlySalary: z.coerce.number().min(0, { message: "ເງິນເດືອນເດືອນບໍ່ສາມາດຕິດລົບ" }).optional(),
  householdExpense: z.coerce.number().min(0, { message: "ຄ່າຄອບຄົວບໍ່ສາມາດຕິດລົບ" }).optional(),
  netIncome: z.coerce.number().min(0, { message: "ລາຍໄດ້ສຸດທິບໍ່ສາມາດຕິດລົບ" }).optional(),

  relationshipWithFina: z.string().optional().or(z.literal('')),

  companyProvinceId: z.coerce.number().optional().or(z.literal('')),
  companyDistrictId: z.coerce.number().optional().or(z.literal('')),
  companyVillage: z.string().optional().or(z.literal('')),
  companyAddressLink: z.string().optional().or(z.literal('')),
  companyPhone: z.string().optional().or(z.literal('')),

  hasBusinessInfo: z.boolean().optional(),

  businessRegistrationNumber: z.string().optional().or(z.literal('')),
  businessRegisterName: z.string().optional().or(z.literal('')),
  businessType: z.string().optional().or(z.literal('')),
  businessVillage: z.string().optional().or(z.literal('')),
  businessProvinceId: z.union([z.coerce.number(), z.string(), z.null()]).optional(),
  businessDistrictId: z.union([z.coerce.number(), z.string(), z.null()]).optional(),
  businessAddressLink: z.string().optional().or(z.literal('')),
  businessPhone: z.string().optional().or(z.literal('')),
  employeeCount: z.union([z.coerce.number(), z.string(), z.null()]).optional(),
}).superRefine((data, ctx) => {
  // 🟢 ຖ້າບໍ່ໄດ້ຕິກ Checkbox ຂໍ້ມູນທຸລະກິດ ໃຫ້ຂ້າມການກວດ Validation ຂອງສ່ວນທຸລະກິດທັງໝົດທັນທີ
  if (!data.hasBusinessInfo) {
    return;
  }

  if (!data.sectorId || data.sectorId === "" || data.sectorId === "null") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ກະລຸນາເລືອກປະເພດທຸລະກິດ", path: ["sectorId"] });
  }
  if (!data.businessRegisterName || data.businessRegisterName.trim() === "" || data.businessRegisterName === "null") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ກະລຸນາໃສ່ຊື່ຕາມທະບຽນທຸລະກິດ", path: ["businessRegisterName"] });
  }
  if (!data.businessProvinceId || data.businessProvinceId === "" || data.businessProvinceId === "null") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ກະລຸນາເລືອກແແຂວງທຸລະກິດ", path: ["businessProvinceId"] });
  }
  if (!data.businessDistrictId || data.businessDistrictId === "" || data.businessDistrictId === "null") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ກະລຸນາເລືອກເມືອງທຸລະກິດ", path: ["businessDistrictId"] });
  }
  
  if (data.businessAddressLink && data.businessAddressLink.trim() !== "" && data.businessAddressLink !== "null") {
    const urlSchema = z.string().url();
    if (!urlSchema.safeParse(data.businessAddressLink).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ລິ້ງທີ່ຢູ່ທຸລະກິດຕ້ອງເປັນ URL ທີ່ຖືກຕ້ອງ", path: ["businessAddressLink"] });
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

  // --- 🟢 ຂັ້ນຕອນທີ 2: ປັບປຸງການ Clean Data ຕອນ Edit Mode (ປ້ອງກັນ string "null") ---
  useEffect(() => {
    if (borrower) {
      const sanitized = Object.fromEntries(
        Object.entries(borrower).map(([k, v]) => {
          if (v === null || v === "null" || v === "undefined") return ["", ""];
          return [k, v];
        })
      );

      // ເຊັກໃຫ້ຊັດເຈນວ່າຂໍ້ມູນທຸລະກິດມີຢູ່ແທ້ໆ ບໍ່ແມ່ນຄ່າ null ທີ່ເປັນ string
      const isValid = (val) => val && val !== "" && val !== "null" && val !== null;
      
      const hasBiz = !!(
        isValid(borrower.businessRegisterName) || 
        isValid(borrower.sectorId) || 
        isValid(borrower.businessRegistrationNumber)
      );

      reset({
        title: borrower.title || "THAO",
        nationality: borrower.nationality || "Lao",
        ...sanitized,

        hasBusinessInfo: hasBiz, // 🟢 ຖ້າຂໍ້ມູນເປັນ null ຟອມທຸລະກິດຈະຖືກຊ່ອນໄວ້ຄືໃນຮູບທັນທີ
        idCardExpiryDate: toDateInputValue(borrower.idCardExpiryDate),
        dateOfBirth: toDateInputValue(borrower.dateOfBirth),
        workingStartDate: toDateInputValue(borrower.workingStartDate),

        provinceId: borrower.provinceId && borrower.provinceId !== "null" ? borrower.provinceId.toString() : "",
        districtId: borrower.districtId && borrower.districtId !== "null" ? borrower.districtId.toString() : "",
        companyProvinceId: borrower.companyProvinceId && borrower.companyProvinceId !== "null" ? borrower.companyProvinceId.toString() : "",
        companyDistrictId: borrower.companyDistrictId && borrower.companyDistrictId !== "null" ? borrower.companyDistrictId.toString() : "",

        businessProvinceId: borrower.businessProvinceId && borrower.businessProvinceId !== "null" ? borrower.businessProvinceId.toString() : "",
        businessDistrictId: borrower.businessDistrictId && borrower.businessDistrictId !== "null" ? borrower.businessDistrictId.toString() : "",

        monthlySalary: borrower.monthlySalary || 0,
        householdExpense: borrower.householdExpense || 0,
        netIncome: borrower.netIncome || 0,
        employeeCount: borrower.employeeCount && borrower.employeeCount !== "null" ? borrower.employeeCount : "",
      });
    }
  }, [borrower, reset]);

  const onSubmit = async (data) => {
    try {
      const isBiz = data.hasBusinessInfo;
      const submitData = {
        ...data,
        provinceId: data.provinceId ? Number(data.provinceId) : null,
        districtId: data.districtId ? Number(data.districtId) : null,
        companyProvinceId: data.companyProvinceId ? Number(data.companyProvinceId) : null,
        companyDistrictId: data.companyDistrictId ? Number(data.companyDistrictId) : null,

        businessProvinceId: isBiz && data.businessProvinceId ? Number(data.businessProvinceId) : null,
        businessDistrictId: isBiz && data.businessDistrictId ? Number(data.businessDistrictId) : null,
        sectorId: isBiz && data.sectorId ? Number(data.sectorId) : null,
        businessRegisterName: isBiz ? (data.businessRegisterName || null) : null,
        businessRegistrationNumber: isBiz ? (data.businessRegistrationNumber || null) : null,
        businessType: isBiz ? (data.businessType || null) : null,
        businessVillage: isBiz ? (data.businessVillage || null) : null,
        businessAddressLink: isBiz ? (data.businessAddressLink || null) : null,
        businessPhone: isBiz ? (data.businessPhone || null) : null,
        employeeCount: isBiz && data.employeeCount ? Number(data.employeeCount) : null,
        idCardExpiryDate: data.noExpiryDate ? null : (data.idCardExpiryDate || null),
      };

      delete submitData.hasBusinessInfo;
      delete submitData.noExpiryDate;

      const url = borrower
        ? `${Url.base_url}/borrowers/${borrower.id}`
        : `${Url.base_url}/borrowers`;
      const method = borrower ? 'put' : 'post';
      
      const res = await axios[method](url, submitData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
      if (res.data.success) {
        toast.success(borrower ? 'ແກ້ໄຂຂໍ້ມູນຜູ້ກູ້ສຳເລັດ' : 'ເພີ່ມຜູ້ກູ້ໃໝ່ສຳເລັດ');
        onSuccess();
      }
    } catch (err) {
      console.error('Submit error:', err);
      const errorMessage = err.response?.data?.message || 'ການບັນທຶກຂໍ້ມູນລົ້ມເຫລວ';
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
    <form onSubmit={handleSubmit(onSubmit, (formErrors) => {
      console.log("❌ Form Validation Errors:", formErrors);
      toast.error("ກະລຸນາກວດສອບຂໍ້ມູນໃຫ້ຄົບຖ້ວນ");
    })} className="space-y-8">
      
      {/* ຂໍ້ມູນສ່ວນຕົວ */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-orange-700"><b>ຂໍ້ມູນສ່ວນຕົວ</b></h3>
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
              <SelectItem value="WIDOWED">ໝ້າຍ</SelectItem>
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
                  setValue('idCardExpiryDate', '');
                }
              }}
            />
            <Label htmlFor="noExpiryDate" className="text-sm font-medium cursor-pointer">
              ເອກະສານນີ້ບໍ່ມີວັນທີ່ໝົດອາຍຸ (ບັນທຶກເປັນ null)
            </Label>
          </div>

          {!watch('noExpiryDate') && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="idCardExpiryDate">ວັນທີໝົດອາຍຸເອກະສານ</Label>
              <Input
                id="idCardExpiryDate"
                type="date"
                {...register('idCardExpiryDate')}
              />
            </div>
          )}
        </div>

        <div>
          <Label>ວັນເດືອນປີເກີດ</Label>
          <Input type="date" {...register('dateOfBirth')} />
        </div>

        <div>
          <Label>ລິ້ງທີ່ຢູ່ປັດຈຸບັນ (Google Maps)</Label>
          <Input {...register('currentAddressLink')} placeholder="http://..." />
          {errors.currentAddressLink && <p className="text-red-500 text-sm mt-1">{errors.currentAddressLink.message}</p>}
        </div>
      </div>

      {/* ຂໍ້ມູນການເງິນ */}
      <div className="border-b pb-4 mt-8">
        <h3 className="text-lg font-semibold text-orange-700"><b>¼ຂໍ້ມູນການເງິນ</b></h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label>ເງິນເດືອນເດືອນ (ກີບ)</Label>
          <Input
            type="text"
            value={formatCurrency(watch('monthlySalary'))}
            onChange={(e) => setValue('monthlySalary', parseCurrency(e.target.value), { shouldValidate: true })}
          />
        </div>

        <div>
          <Label>ຄ່າໃຊ້ຈ່າຍຄອບຄົວ (ກີບ)</Label>
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

      {/* ຂໍ້ມູນບໍລິສັດ / ບ່ອນເຮັດວຽກ */}
      <div className="border-b pb-4 mt-8">
        <h3 className="text-lg font-semibold text-orange-700"><b>ຂໍ້ມູນບໍລິສັດ / ບ່ອນເຮັດວຽກ</b></h3>
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
          <Input {...register('companyAddressLink')} placeholder="http://..." />
        </div>

        <div>
          <Label>ເບີໂທບໍລິສັດ</Label>
          <Input {...register('companyPhone')} />
        </div>
      </div>

      {/* Checkbox ຂໍ້ມູນທຸລະກິດ */}
      <div className="flex items-center gap-3 border-b pb-4 mt-8 mb-6">
        <input
          type="checkbox"
          id="hasBusinessInfo"
          className="w-5 h-5 cursor-pointer accent-orange-600"
          checked={watch('hasBusinessInfo') || false}
          onChange={(e) => {
            setValue('hasBusinessInfo', e.target.checked, { shouldValidate: true });
          }}
        />
        <label
          htmlFor="hasBusinessInfo"
          className="text-lg font-semibold text-orange-700 cursor-pointer select-none"
        >
          ຂໍ້ມູນທຸລະກິດ (ຖ້າມີ)
        </label>
      </div>

      {/* ສະແດງຟອມທຸລະກິດ ສະເພາະຕອນທີ່ຕິກ true ເທົ່ານັ້ນ */}
      {watch('hasBusinessInfo') === true && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <Label>ປະເພດທຸລະກິດ (Sector) <span className="text-red-500">*</span></Label>
            <SectorSelect
              value={watch('sectorId')}
              onChange={(value) => setValue('sectorId', value, { shouldValidate: true })}
            />
            {errors.sectorId && <p className="text-red-500 text-sm mt-1">{errors.sectorId.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label>ເລກທະບຽນວິສາຫະກິດ</Label>
              <Input {...register('businessRegistrationNumber')} />
            </div>

            <div>
              <Label>ຊື່ຕາມທະບຽນທຸລະກິດ <span className="text-red-500">*</span></Label>
              <Input {...register('businessRegisterName')} />
              {errors.businessRegisterName && <p className="text-red-500 text-sm mt-1">{errors.businessRegisterName.message}</p>}
            </div>

            <div>
              <Label>ປະເພດທຸລະກິດ</Label>
              <Input {...register('businessType')} />
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
              <Input {...register('businessAddressLink')} />
              {errors.businessAddressLink && <p className="text-red-500 text-sm mt-1">{errors.businessAddressLink.message}</p>}
            </div>

            <div>
              <Label>ເບີໂທທຸລະກິດ</Label>
              <Input {...register('businessPhone')} />
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

      {/* ປຸ່ມກົດ */}
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