// src/pages/admin/Manage_Users.jsx
import React,{useEffect,useMemo,useState} from "react";
import axios from "axios";
import {Url} from "@/lib/Part";
import {toast,ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";

import {Plus,Pencil,Trash2,RefreshCcw,Search,Upload} from "lucide-react";


const ROLES=[
  "CREDIT_OFFICER",
  "VERIFIER",
  "DCO_APPROVER",
  "CEO_APPROVER",
  "ADMIN",
];

const roleLabel=(role) => {
  switch(role) {
    case "CREDIT_OFFICER": return "Credit Officer (Preparer)";
    case "VERIFIER": return "Verifier (Credit Ops)";
    case "DCO_APPROVER": return "DCO Approver";
    case "CEO_APPROVER": return "CEO Approver";
    case "ADMIN": return "Admin";
    default: return role||"-";
  }
};

const roleBadgeVariant=(role) => {
  if(role==="ADMIN") return "destructive";
  if(role==="CEO_APPROVER") return "default";
  if(role==="DCO_APPROVER") return "secondary";
  if(role==="VERIFIER") return "outline";
  return "secondary";
};

const api=axios.create({
  baseURL: `${Url.base_url}`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token=localStorage.getItem("token");
  if(token) config.headers.Authorization=`Bearer ${token}`;
  return config;
});

const Manage_Users=() => {
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(false);
  const [q,setQ]=useState("");

  const [openCreate,setOpenCreate]=useState(false);
  const [openEdit,setOpenEdit]=useState(false);
  const [openDelete,setOpenDelete]=useState(false);

  const [createForm,setCreateForm]=useState({
    username: "",
    password: "",
    role: "CREDIT_OFFICER",
    email: "",
    fullName: "",
    signature: null, // file
  });

  const [editForm,setEditForm]=useState({
    id: null,
    username: "",
    fullName: "",
    password: "",
    role: "CREDIT_OFFICER",
    email: "",
    signature: null, // new file
    currentSignatureUrl: "", // preview old signature
  });

  const [deleteTarget,setDeleteTarget]=useState(null);

  const filteredUsers=useMemo(() => {
    const keyword=q.trim().toLowerCase();
    if(!keyword) return users;
    return users.filter((u) =>
      `${u.id} ${u.username} ${u.role} ${u.email||""}`.toLowerCase().includes(keyword)
    );
  },[users,q]);

  const fetchUsers=async () => {
    setLoading(true);
    try {
      const res=await api.get("/manage_user");
      setUsers(res.data?.users||[]);
    } catch(err) {
      toast.error(err.response?.data?.message||"Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  },[]);

  // CREATE
  const onCreate=async () => {
    if(!createForm.username.trim()||!createForm.password||!createForm.role) {
      toast.error("Please fill username, password, and role");
      return;
    }

    // check image is png or not
    if(createForm.signature) {
      const file=createForm.signature;
      const isPng=
        file.type==="image/png"||
        file.name.toLowerCase().endsWith(".png");

      if(!isPng) {
        toast.error("Signature must be a PNG image only");
        return;
      }
    }
    const formData=new FormData();
    formData.append("username",createForm.username.trim());
    formData.append("password",createForm.password);
    formData.append("role",createForm.role);

    if(createForm.email) formData.append("email",createForm.email);
    if(createForm.fullName) formData.append("fullName",createForm.fullName.trim());
    if(createForm.signature) formData.append("signature",createForm.signature);


    try {
      const response=await api.post("/manage_user",formData);
      if(response.status===405) {
        return alert("Only png image");
      }
      toast.success("User created successfully");
      setOpenCreate(false);
      setCreateForm({username: "",password: "",role: "CREDIT_OFFICER",email: "",signature: null});
      fetchUsers();
    } catch(err) {
      toast.error(err.response?.data?.messageError||"Failed to create user");
    }
  };


  // OPEN EDIT + LOAD OLD DATA
  const openEditDialog=(u) => {
    setEditForm({
      id: u.id,
      username: u.username,
      fullName: u.fullName||"",
      password: "",
      role: u.role,
      email: u.email||"",
      signature: null,
      currentSignatureUrl: u.signatureUrl||"",
    });
    setOpenEdit(true);
  };

  // UPDATE
  const onUpdate=async () => {
    if(!editForm?.id) return;

    const formData=new FormData();
    if(editForm.username?.trim()) formData.append("username",editForm.username.trim());
    if(editForm.role) formData.append("role",editForm.role);
    if(editForm.password) formData.append("password",editForm.password);
    if(editForm.email) formData.append("email",editForm.email);
    if(editForm.signature) formData.append("signature",editForm.signature);
    if(editForm.fullName) formData.append("fullName",editForm.fullName.trim());

    if(formData.entries().next().done) {
      toast.error("No changes detected");
      return;
    }

    try {
      const res=await api.put(`/manage_user/${editForm.id}`,formData);

      toast.success("User updated successfully");

      // สำคัญ! อัปเดต preview ทันทีจาก response
      if(res.data?.user?.signatureUrl) {
        setEditForm((prev) => ({
          ...prev,
          currentSignatureUrl: res.data.user.signatureUrl, // ใช้ URL ใหม่จาก backend
          signature: null, // ล้างไฟล์ที่เลือกไว้ (ป้องกันอัปโหลดซ้ำ)
        }));
      }

      setOpenEdit(false);
      fetchUsers(); // refresh list
    } catch(err) {
      toast.error(err.response?.data?.message||"Failed to update user");
    }
  };

  // DELETE
  const openDeleteDialog=(u) => {
    setDeleteTarget(u);
    setOpenDelete(true);
  };

  const onDelete=async () => {
    if(!deleteTarget?.id) return;
    try {
      const response=await api.delete(`/manage_user/${deleteTarget.id}`);
      if(response.status===405) {
        toast.error("Only png image");
        return;
      }
      toast.success("User deleted successfully");
      setOpenDelete(false);
      setDeleteTarget(null);
      fetchUsers();
    } catch(err) {
      toast.error(err.response?.data?.message||"Failed to delete user");
    }
  };

  return (
    <div className="p-6">
      <ToastContainer position="top-center" autoClose={3500} />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manage Users</h1>
          <p className="text-sm text-gray-500">
            Create, edit, delete, and view all user accounts.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchUsers} disabled={loading} className="gap-2">
            <RefreshCcw className={`h-4 w-4 ${loading? "animate-spin":""}`} />
            Refresh
          </Button>

          <Button onClick={() => setOpenCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <Separator className="my-5" />

      {/* Table */}
      <div className="mt-5 rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold">{users.length}</span> users
          </div>
          <div className="text-xs text-gray-500">
            Showing: <span className="font-medium">{filteredUsers.length}</span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="hidden md:table-cell">Updated</TableHead>
              <TableHead className="text-right w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.id}</TableCell>
                <TableCell className="font-medium">{u.username}</TableCell>
                <TableCell>{u.email||"-"}</TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariant(u.role)}>
                    {roleLabel(u.role)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-gray-600">
                  {u.createdAt? new Date(u.createdAt).toLocaleString():"-"}
                </TableCell>
                <TableCell className="hidden md:table-cell text-gray-600">
                  {u.updatedAt? new Date(u.updatedAt).toLocaleString():"-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditDialog(u)}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(u)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filteredUsers.length===0&&(
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account (role is required).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="c_username">Username</Label>
              <Input
                id="c_username"
                value={createForm.username}
                onChange={(e) => setCreateForm((p) => ({...p,username: e.target.value}))}
                placeholder="e.g. credit01"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c_fullName">Full Name</Label>
              <Input
                id="c_fullName"
                value={createForm.fullName||''}
                onChange={(e) => setCreateForm(p => ({...p,fullName: e.target.value}))}
                placeholder="e.g. ທະນາໄຊ ລາດຊະວົງ"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="c_password">Password</Label>
              <Input
                id="c_password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((p) => ({...p,password: e.target.value}))}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="c_email">Email (optional)</Label>
              <Input
                id="c_email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({...p,email: e.target.value}))}
                placeholder="e.g. user@example.com"
              />
            </div>

            <div className="grid gap-2">
              <Label>Role</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCreateForm((p) => ({...p,role: r}))}
                    className={`text-left px-3 py-2 rounded-lg border transition ${createForm.role===r
                      ? "border-gray-900 bg-gray-900 text-white"
                      :"border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                  >
                    <div className="text-sm font-medium">{roleLabel(r)}</div>
                    <div className="text-xs opacity-80">{r}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="c_signature">Signature (optional)</Label>
              <Input
                id="c_signature"
                type="file"
                accept="image/*"
                onChange={(e) => setCreateForm((p) => ({...p,signature: e.target.files[0]}))}
              />
              <p className="text-xs text-gray-500">Supported: .jpg, .jpeg, .png (max 5MB)</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setOpenCreate(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update username, role, email, or upload a new signature (old signature will be replaced automatically if a new one is uploaded).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>ID</Label>
              <Input value={editForm.id??""} disabled />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="e_username">Username</Label>
              <Input
                id="e_username"
                value={editForm.username}
                onChange={(e) => setEditForm((p) => ({...p,username: e.target.value}))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="e_fullName">Full Name</Label>
              <Input
                id="e_fullName"
                value={editForm.fullName||''}
                onChange={(e) => setEditForm(p => ({...p,fullName: e.target.value}))}
                placeholder="e.g. ທະນາໄຊ ລາດຊະວົງ"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="e_email">Email</Label>
              <Input
                id="e_email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({...p,email: e.target.value}))}
                placeholder="e.g. user@example.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="e_password">New Password (optional)</Label>
              <Input
                id="e_password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm((p) => ({...p,password: e.target.value}))}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div className="grid gap-2">
              <Label>Role</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setEditForm((p) => ({...p,role: r}))}
                    className={`text-left px-3 py-2 rounded-lg border transition ${editForm.role===r
                      ? "border-gray-900 bg-gray-900 text-white"
                      :"border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                  >
                    <div className="text-sm font-medium">{roleLabel(r)}</div>
                    <div className="text-xs opacity-80">{r}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={`${Url.base_url.replace(/\/api$/,'')}${editForm.currentSignatureUrl}`} // ลบ /api ท้ายถ้ามี
                alt="Current Signature"
                className="h-16 object-contain border border-gray-300 rounded"
                onError={(e) => {
                  console.error("Image failed to load:",e.target.src);
                  e.target.src="https://via.placeholder.com/150?text=Signature+Not+Found";
                  toast.error("Cannot load signature image");
                }}
              />
              <p className="text-sm text-gray-500">Current signature</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="e_signature">Upload New Signature (optional)</Label>
              <Input
                id="e_signature"
                type="file"
                accept="image/*"
                onChange={(e) => setEditForm((p) => ({...p,signature: e.target.files[0]}))}
              />
              <p className="text-xs text-gray-500">Supported: .jpg, .jpeg, .png (max 5MB) - will replace old signature</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <Button onClick={onUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action may fail if the user is linked to other data.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border p-3 bg-gray-50">
            <div className="text-sm">
              <span className="text-gray-500">Username:</span>{" "}
              <span className="font-semibold">{deleteTarget?.username}</span>
            </div>
            <div className="text-sm mt-1">
              <span className="text-gray-500">Role:</span>{" "}
              <Badge className="ml-2" variant={roleBadgeVariant(deleteTarget?.role)}>
                {roleLabel(deleteTarget?.role)}
              </Badge>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setOpenDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Manage_Users;