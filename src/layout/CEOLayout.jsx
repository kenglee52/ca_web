import React, { useMemo, useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  FileCheck2,
  FileSearch,
  History,
  Settings,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";
import axios from "axios";
import { Url } from "@/lib/Part";
import { useCounts } from "@/contexts/CountsContext";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const BASE = "/ceo";

const CEOLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ ใช้ context เดียวกันทั้งระบบ (Verifier/CEO/CEO ได้)
  const { counts, setCounts } = useCounts();

  // ✅ refreshCounts: นับเคสที่รอ CEO
  const refreshCounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${Url.base_url}/loan-applications/by-status`, {
        params: { status: "PENDING_CEO", page: 1, limit: 1 },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setCounts((prev) => ({
          ...prev,
          pendingCEO: res.data.pagination?.total || 0,
        }));
      }
    } catch (e) {
      console.error("refreshCounts (CEO) error:", e);
    }
  };

  useEffect(() => {
    refreshCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navItems = useMemo(
    () => [
      { to: `${BASE}`, icon: LayoutDashboard, label: "Dashboard", group: "Overview" },

      {
        to: `${BASE}/inbox`,
        icon: Inbox,
        label: "Inbox (To Review)",
        group: "CEO Review",
        badge: counts?.pendingCEO > 0 ? counts.pendingCEO : null,
      },

      { to: `${BASE}/all-cases`, icon: FileSearch, label: "All Cases", group: "CEO Review" },
      { to: `${BASE}/approved`, icon: FileCheck2, label: "Approved", group: "Status" },
      { to: `${BASE}/history`, icon: History, label: "My Activity", group: "Audit" },

    ],
    [counts?.pendingCEO]
  );

  const grouped = useMemo(() => {
    const groups = {};
    for (const item of navItems) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    }
    return groups;
  }, [navItems]);

  const pageTitle = useMemo(() => {
    const exact = navItems.find((n) => location.pathname === n.to);
    if (exact) return exact.label;

    const starts = [...navItems]
      .sort((a, b) => b.to.length - a.to.length)
      .find((n) => location.pathname.startsWith(n.to));
    return starts?.label || "CEO";
  }, [location.pathname, navItems]);

  const doLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const Sidebar = () => (
    <aside className="w-72 h-full bg-slate-950 text-slate-200 flex flex-col p-4 shadow-2xl">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 py-3 mb-2">
        <div className="p-2 rounded-xl bg-emerald-500/15 w-24 h-24 flex items-center justify-center">
          <img src="/fina.png" alt="fina" className="w-full h-full object-contain" />
        </div>
        <div className="leading-tight">
          <div className="text-lg font-extrabold tracking-wide text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            CEO Approver
          </div>
          <div className="text-xs text-slate-400">Credit Approval Portal</div>
        </div>
      </div>

      <Separator className="my-3 bg-slate-800" />

      <nav className="flex-1 overflow-y-auto pr-1">
        {Object.entries(grouped).map(([groupName, items]) => (
          <div key={groupName} className="mb-5">
            <div className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {groupName}
            </div>

            <div className="space-y-1">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === BASE}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    [
                      "flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-all",
                      isActive
                        ? "bg-emerald-600 text-white shadow"
                        : "text-slate-300 hover:bg-slate-800 hover:text-emerald-200",
                    ].join(" ")
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>

                  {item.badge ? (
                    <Badge className="bg-red-500 text-white font-semibold">{item.badge}</Badge>
                  ) : null}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <Separator className="my-3 bg-slate-800" />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-red-300 bg-slate-900 hover:bg-red-900/40 transition w-full">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to log out now?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doLogout}>Log Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div
        className={[
          "fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div
        className={[
          "fixed top-0 left-0 h-full z-50 lg:hidden transition-transform duration-300",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="shrink-0 sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
            <Button variant="outline" className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex-1 min-w-0">
              <div className="text-lg font-semibold text-slate-900 truncate">{pageTitle}</div>
              <div className="text-xs text-slate-500 truncate">
                Review cases, approve/reject, and track audit history
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 w-[360px]">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search (case id / borrower)…"
                  className="pl-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && q.trim()) {
                      navigate(`${BASE}/search?q=${encodeURIComponent(q.trim())}`);
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => navigate(`${BASE}/search?q=${encodeURIComponent(q.trim())}`)}
                disabled={!q.trim()}
              >
                Go
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">CEO</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate(`${BASE}/profile`)}>
                  Profile & Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={doLogout}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <main className="p-4 sm:p-6">
            <div className="max-w-[1400px] mx-auto">
              {/* ✅ ส่ง refreshCounts ลงไปให้ทุกหน้า */}
              <Outlet context={{ refreshCounts }} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CEOLayout;

