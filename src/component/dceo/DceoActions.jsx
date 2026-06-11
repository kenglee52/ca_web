import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Url } from "@/lib/Part";
import { useOutletContext } from "react-router-dom";



import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox"; 

export default function DceoActions({
  appId,
  headers,
  onDone,
  disabled = false,
  endpoints,
  appStatus,
  navigateBackOnDone = false,
}) {
  const navigate = useNavigate();


  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null); // "APPROVE" | "RETURN" | "REJECT"
  const [comment, setComment] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
const { refreshCounts } = useOutletContext();
  // ✅ preset comments (แก้ข้อความตามที่คุณใช้จริงได้เลย)
  const presetMap = useMemo(() => {
    return {
      APPROVE: [
        { key: "ok-doc", label: "ເອກະສານຄົບຖ້ວນ", text: "ເອກະສານຄົບຖ້ວນ ແລະຂໍ້ມູນຖືກຕ້ອງ" },
        { key: "ok-income", label: "ລາຍຮັບພຽງພໍ", text: "ກວດສອບລາຍຮັບແລ້ວ ພຽງພໍສໍາລັບການຜ່ອນຊໍາລະ" },
        { key: "send-dco", label: "ສົ່ງຕໍ່ DCO", text: "ສົ່ງຕໍ່ໃຫ້ DCO ພິຈາລະນາ" },
      ],
      REJECT: [
        { key: "bad-doc", label: "ເອກະສານບໍ່ຄົບ/ບໍ່ຖືກ", text: "ເອກະສານບໍ່ຄົບຖ້ວນ ຫຼື ບໍ່ຖືກຕ້ອງ" },
        { key: "risk-high", label: "ຄວາມສ່ຽງສູງ", text: "ພົບຄວາມສ່ຽງສູງ ບໍ່ສາມາດອະນຸມັດໄດ້" },
        { key: "policy", label: "ບໍ່ຜ່ານນະໂຍບາຍ", text: "ບໍ່ຜ່ານເງື່ອນໄຂນະໂຍບາຍ/ຫຼັກເກณฑ์ສິນເຊື່ອ" },
      ],
     
    };
  }, []);

  // ✅ state เก็บ checkbox ที่เลือก
  const [selectedPresetKeys, setSelectedPresetKeys] = useState([]);

  const meta = useMemo(() => {
    if (action === "APPROVE") {
      return {
        title: "ຢືນຢັນອະນຸມັດ (Approve)",
        desc: "ຈະສົ່ງຄຳຂໍນີ້ໄປຂັ້ນຕອນ DCEO",
        confirmText: "ອະນຸມັດ",
        requireComment: false,
        variant: "default",
        endpoint: endpoints?.approve,
      };
    }
    
    
    if (action === "REJECT") {
      return {
        title: "ປະຕິເສດຂັ້ນສຸດ (Reject - Final)",
        desc: "ຈະປິດເຄສນີ້ (Final Rejected) ແລະບໍ່ສາມາດດຳເນີນຕໍ່",
        confirmText: "ປະຕິເສດ",
        requireComment: true,
        variant: "destructive",
        endpoint: endpoints?.reject,
      };
    }
    return null;
  }, [action, endpoints]);

  const openDialog = (nextAction) => {
    setAction(nextAction);
    setComment("");
    setSelectedPresetKeys([]); // ✅ reset checkbox
    setOpen(true);
  };

  const closeDialog = () => {
    if (submitting) return;
    setOpen(false);
    setAction(null);
    setComment("");
    setSelectedPresetKeys([]);
  };

  const resolveEndpoint = (tpl) => {
    if (!tpl) return null;
    return tpl.replace(":id", String(appId));
  };

  
  const presetsForAction = action ? presetMap[action] || [] : [];

  useEffect(() => {
    if (!action) return;

    const selectedTexts = presetsForAction
      .filter((p) => selectedPresetKeys.includes(p.key))
      .map((p) => `- ${p.text}`);

    const autoText = selectedTexts.length ? selectedTexts.join("\n") : "";

    setComment((prev) => {
      // ถ้า user ล้างเอง ให้เราไม่ฝืนมาก
      const prevTrim = (prev || "").trim();
      const autoTrim = (autoText || "").trim();

      if (!prevTrim) return autoText;
      if (prevTrim === autoTrim) return autoText;

      
      if (autoTrim && prev.includes(autoText)) return prev;

      return autoText ? `${autoText}\n\n${prev}` : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPresetKeys, action]);

  const togglePreset = (key) => {
    setSelectedPresetKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const submit = async () => {
    if (!meta) return;

    const trimmed = comment.trim();

    if (!meta.endpoint) {
      toast.error("Endpoint ບໍ່ຖືກກຳນົດ (approve/return/reject)");
      return;
    }

    if (meta.requireComment && !trimmed) {
      toast.error("ກະລຸນາໃສ່ຄຳເຫັນກ່ອນ");
      return;
    }

    const endpoint = resolveEndpoint(meta.endpoint);
    if (!endpoint) {
      toast.error("Endpoint ບໍ່ຖືກຕ້ອງ");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${Url.base_url}${endpoint}`,
        { comments: trimmed || null },
        { headers }
      );

      if (res.data?.success) {
        toast.success(res.data?.message || "ດຳເນີນການສຳເລັດ");
        refreshCounts?.();
        closeDialog();
        if (navigateBackOnDone) {
          navigate(-1);
          return;
        }
        onDone?.();
      } else {
        toast.error(res.data?.message || "ດຳເນີນການບໍ່ສຳເລັດ");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "ເກີດຂໍ້ຜິດພາດ");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-3">
     

        <Button
          variant="destructive"
         
          onClick={() => openDialog("REJECT")}
        >
          ປະຕິເສດ (Final)
        </Button>

        <Button
          variant="default"
        
          onClick={() => openDialog("APPROVE")}
          className="md:ml-auto"
        >
          ອະນຸມັດ
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => (v ? null : closeDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{meta?.title}</DialogTitle>
            <DialogDescription>{meta?.desc}</DialogDescription>
          </DialogHeader>

          {/* ✅ Preset checkbox */}
          {presetsForAction.length > 0 && (
            <div className="space-y-2 rounded-md border p-3">
              <div className="text-sm font-medium">
                ເລືອກຂໍ້ຄວາມສຳເລັດຮູບ (optional)
              </div>

              <div className="space-y-2">
                {presetsForAction.map((p) => (
                  <label key={p.key} className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedPresetKeys.includes(p.key)}
                      onCheckedChange={() => togglePreset(p.key)}
                      disabled={submitting}
                    />
                    <div className="leading-tight">
                      <div className="text-sm">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.text}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={submitting || selectedPresetKeys.length === 0}
                  onClick={() => setSelectedPresetKeys([])}
                >
                  ລ້າງການເລືອກ
                </Button>
              </div>
            </div>
          )}

          {/* Comment box */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              ຄຳເຫັນ {meta?.requireComment ? "(ຈຳເປັນ)" : "(ບໍ່ຈຳເປັນ)"}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ພິມຄຳເຫັນຂອງທ່ານ..."
              rows={5}
              disabled={submitting}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={submitting}>
              ຍົກເລີກ
            </Button>
            <Button
              variant={meta?.variant || "default"}
              onClick={submit}
              disabled={submitting}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {meta?.confirmText || "ຢືນຢັນ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
