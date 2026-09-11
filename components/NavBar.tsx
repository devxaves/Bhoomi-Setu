"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import {
  LayoutDashboard,
  Map,
  Upload,
  Shield,
  BarChart3,
  Archive,
  Landmark,
  Settings,
  LogOut,
  LogIn,
  User,
} from "lucide-react";

const ADMIN_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/atlas", label: "Atlas", icon: Map },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/workflow", label: "Workflow", icon: Shield },
  { href: "/risk", label: "Risk", icon: BarChart3 },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/admin", label: "Admin", icon: Settings },
];

const CITIZEN_LINKS = [
  { href: "/citizen", label: "Citizen Portal", icon: Landmark },
];

export default function NavBar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  // Don't show nav on login/register pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/") {
    return null;
  }

  const links = user?.role === "admin" ? ADMIN_LINKS : CITIZEN_LINKS;

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href={user?.role === "admin" ? "/dashboard" : "/citizen"}
          className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-green-600 text-white text-sm font-black">
            भ
          </span>
          <span>
            <span className="text-amber-600">Bhoomi</span>
            <span className="text-green-700">Setu</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-0.5">
          {!loading && links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                  isActive
                    ? "bg-amber-100 text-amber-700"
                    : "text-gray-600 hover:text-amber-700 hover:bg-amber-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}

          {/* Auth section */}
          <div className="ml-3 pl-3 border-l border-gray-200 flex items-center gap-2">
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <User className="h-3.5 w-3.5" />
                  <span className="max-w-[120px] truncate">{user.name || user.email}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    user.role === "admin" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                  }`}>
                    {user.role === "admin" ? "ADMIN" : "CITIZEN"}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-amber-700 px-2.5 py-1.5 rounded-md hover:bg-amber-50 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
