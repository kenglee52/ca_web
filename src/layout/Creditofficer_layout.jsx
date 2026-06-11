// src/layouts/Creditofficer_layout.jsx
import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Search,
  Menu,
  LogOut,
  Settings,
} from "lucide-react";

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

const BASE = "/creditofficer";

const Creditofficer_layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = useMemo(
    () => [
      // Overview
      { to: `${BASE}`, icon: LayoutDashboard, label: "Dashboard", group: "Overview" },

      // Loan workflow
      {
        to: `${BASE}/applications`,
        icon: ClipboardList,
        label: "Loan Applications",
        group: "Loan Workflow",
        // badge: "12", // optional example
      },
      {
        to: `${BASE}/borrower`,
        icon: ClipboardList,
        label: "Borrower Info",
        group: "Create / Edit Application (Form Wizard)",
      },

      // Status / tracking
      {
        to: `${BASE}/report`,
        icon: CheckCircle2,
        label: "Reported Cases",
        group: "Status / Tracking",
        
      },
      {
        to: `${BASE}/returned`,
        icon: AlertTriangle,
        label: "Returned / Need Fix",
        group: "Status / Tracking",
      },
         {
        to: `${BASE}/approved`,
        icon: CheckCircle2,
        label: "Approved Cases",
        group: "Status / Tracking",
      },


    ],
    []
  );

  const grouped = useMemo(() => {
    /** @type {Record<string, any[]>} */
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

    // pick the longest matching prefix so nested routes match the correct parent
    const starts = [...navItems]
      .sort((a, b) => b.to.length - a.to.length)
      .find((n) => location.pathname.startsWith(n.to));
    return starts?.label || "Credit Officer";
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
        <div className="p-2 rounded-xl bg-orange-500/15 w-24 h-24 flex items-center justify-center">
          <img src="/fina.png" alt="fina" className="w-full h-full object-contain" />
        </div>
        <div className="leading-tight">
          <div className="text-lg font-extrabold tracking-wide text-white">Credit Officer</div>
          <div className="text-xs text-slate-400">Loan Assessment Portal</div>
        </div>
      </div>

      <Separator className="my-3 bg-slate-800" />

      {/* Nav groups */}
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
                        ? "bg-orange-600 text-white shadow"
                        : "text-slate-300 hover:bg-slate-800 hover:text-orange-200",
                    ].join(" ")
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>

                  {item.badge ? (
                    <Badge variant="secondary" className="bg-slate-800 text-slate-200">
                      {item.badge}
                    </Badge>
                  ) : null}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <Separator className="my-3 bg-slate-800" />

      {/* Logout */}
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
    {/* Desktop sidebar */}
    <div className="hidden lg:block">
      <Sidebar />
    </div>

    {/* Mobile overlay */}
    <div
      className={[
        "fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity",
        isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
      onClick={() => setIsSidebarOpen(false)}
    />

    {/* Mobile sidebar */}
    <div
      className={[
        "fixed top-0 left-0 h-full z-50 lg:hidden transition-transform duration-300",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
    >
      <Sidebar />
    </div>

    {/* Main */}
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Topbar */}
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
            <Button variant="outline" className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex-1 min-w-0">
              <div className="text-lg font-semibold text-slate-900 truncate">{pageTitle}</div>
              <div className="text-xs text-slate-500 truncate">
                Create applications, upload documents, and submit for verification
              </div>
            </div>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 w-[360px]">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search (borrower / case id)…"
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

            {/* Profile menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Credit Officer</Button>
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
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  </div>
);
}


export default Creditofficer_layout;
