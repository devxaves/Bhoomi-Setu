"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "./LanguageProvider";
import {
  MapPin,
  Upload,
  GitBranch,
  AlertTriangle,
  BarChart3,
  Archive,
  Landmark,
  Settings,
  LogOut,
  LogIn,
  User,
  PhoneCall,
  Home,
  Shield,
  Search,
  Menu,
  X,
  ChevronDown,
  Layers,
  Globe2,
  Check,
  BookOpen,
} from "lucide-react";

export default function NavBar() {
  const { user, loading, logout } = useAuth();
  const { language, setLanguage, availableLanguages, t } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile menu and dropdowns on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setToolsDropdownOpen(false);
    setLangDropdownOpen(false);
  }, [pathname]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setToolsDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't show nav on login/register pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  // Core Primary Quick Links (always visible on desktop)
  const primaryLinks = [
    { href: "/landing", label: t("nav.home", "Home"), icon: Home },
    { href: "/atlas", label: t("nav.atlas", "GIS Atlas"), icon: MapPin },
    { href: "/workflow", label: t("nav.workflow", "Workflow"), icon: GitBranch },
    { href: "/dashboard", label: t("nav.analytics", "Analytics"), icon: BarChart3 },
    { href: "/citizen", label: t("nav.citizen", "Citizen Corner"), icon: Landmark },
  ];

  // Secondary Tools & Governance Modules (in compact dropdown to prevent overflow)
  const secondaryTools = [
    {
      href: "/upload",
      label: t("nav.ocr", "Document OCR Extraction"),
      desc: "AI gazette & Section 11/19 parser",
      icon: Upload,
      color: "text-violet-600 bg-violet-50",
    },
    {
      href: "/risk",
      label: t("nav.risk", "Explainable Risk Engine"),
      desc: "Rule-based project & parcel risk scoring",
      icon: AlertTriangle,
      color: "text-rose-600 bg-rose-50",
    },
    {
      href: "/archive",
      label: t("nav.archive", "Digital Records Archive"),
      desc: "Searchable project & parcel registry",
      icon: Archive,
      color: "text-slate-600 bg-slate-50",
    },
    {
      href: "/docs",
      label: t("nav.docs", "Portal Documentation"),
      desc: "HTML architecture & RFCTLARR guide",
      icon: BookOpen,
      color: "text-amber-600 bg-amber-50",
    },
    ...(user?.role === "admin"
      ? [
          {
            href: "/admin",
            label: t("nav.admin", "CALA & Admin Console"),
            desc: "Operations, mock adapters & user management",
            icon: Settings,
            color: "text-amber-600 bg-amber-50",
          },
        ]
      : []),
  ];

  const isToolsActive =
    pathname.startsWith("/upload") ||
    pathname.startsWith("/risk") ||
    pathname.startsWith("/archive") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/admin");

  const currentLangObj = availableLanguages.find((l) => l.code === language) || availableLanguages[0];

  return (
    <div className="sticky top-0 z-50 shadow-xs">
      {/* ── 1. Top Government of India Institutional Strip ────────────────── */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 text-[11px] py-1 px-3 sm:px-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-2">
          {/* Left: National Identity */}
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
            <span className="font-semibold text-slate-200 truncate">
              {t("govt.india", "भारत सरकार | Government of India")}
            </span>
            <span className="hidden md:inline text-slate-600">·</span>
            <span className="hidden md:inline text-slate-400 truncate">
              {t("govt.mord", "Ministry of Rural Development")}
            </span>
            <span className="hidden lg:inline text-slate-600">·</span>
            <span className="hidden lg:inline text-amber-400 font-medium">
              {t("govt.dolr", "Department of Land Resources (DoLR)")}
            </span>
          </div>

          {/* Right: Helpline, Language Switcher & Accessibility */}
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-slate-400 flex-shrink-0">
            {/* Helpline */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/60 text-slate-300">
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              <span className="hidden xs:inline">{t("govt.helpline", "Helpline")}:</span>
              <strong className="text-white font-mono">1800-11-LAND</strong>
            </div>

            {/* 🌐 Multilingual Language Switcher Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-[11px] transition-colors cursor-pointer"
                aria-label="Select Language"
              >
                <Globe2 className="w-3 h-3 text-amber-400" />
                <span className="font-semibold">{currentLangObj.nativeLabel}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {langDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 animate-fade-in space-y-0.5">
                  <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    भाषा / Language
                  </div>
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                        language === lang.code
                          ? "bg-amber-500/20 text-amber-300 font-bold"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <span>{lang.nativeLabel}</span>
                      {language === lang.code && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Accessibility */}
            <div className="hidden sm:flex items-center gap-1 border-l border-slate-700 pl-2">
              <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">A-</span>
              <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">A</span>
              <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">A+</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Main Portal Navigation Bar ────────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-4 py-2 gap-2 sm:gap-4">
          {/* Brand Logo & Emblem */}
          <Link
            href="/landing"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <img
              src="/icon.svg"
              alt="BhoomiSetu Emblem"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-xs border border-slate-700/50 object-contain"
            />
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black tracking-tight">
                  <span className="text-amber-600">भूमि</span>
                  <span className="text-emerald-700">सेतु</span>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 hidden xs:inline-block">
                  {t("nav.brand", "BhoomiSetu")}
                </span>
              </div>
              <p className="text-[9px] font-medium text-slate-500 hidden md:block tracking-tight">
                {t("nav.tagline", "National Land Acquisition & Compliance Portal")}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {primaryLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/landing" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-amber-100 text-amber-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-amber-700 hover:bg-amber-50/80"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-amber-700" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* "Governance Tools" Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isToolsActive || toolsDropdownOpen
                    ? "bg-slate-100 text-slate-900 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Layers className={`h-3.5 w-3.5 ${isToolsActive ? "text-amber-600" : "text-slate-400"}`} />
                <span>{t("nav.tools", "Governance Tools")}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                    toolsDropdownOpen ? "rotate-180 text-slate-700" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {toolsDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-fade-in space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t("nav.tools", "Governance Tools")}
                  </div>
                  {secondaryTools.map((tool) => {
                    const ToolIcon = tool.icon;
                    const isToolActive = pathname === tool.href || pathname.startsWith(tool.href);
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        onClick={() => setToolsDropdownOpen(false)}
                        className={`flex items-start gap-2.5 p-2 rounded-xl transition-all ${
                          isToolActive
                            ? "bg-amber-50 border border-amber-200/80"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${tool.color} flex-shrink-0 mt-0.5`}>
                          <ToolIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                            <span>{tool.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5 font-normal">
                            {tool.desc}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Action & Auth Section */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Citizen ULPIN button */}
            <Link
              href="/citizen"
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-all shadow-2xs whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t("nav.ulpinSearch", "ULPIN Search")}</span>
            </Link>

            {/* Auth section */}
            <div className="border-l border-slate-200 pl-1.5 sm:pl-2.5 flex items-center gap-1.5">
              {loading ? (
                <div className="h-7 w-7 rounded-full bg-slate-100 animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-1.5">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span className="max-w-[90px] truncate font-medium">{user.name || user.email}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        user.role === "admin"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {user.role === "admin" ? "ADMIN" : "CITIZEN"}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    title={t("nav.signOut", "Sign Out")}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs whitespace-nowrap"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t("nav.login", "Official Login")}</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* ── 3. Mobile Navigation Drawer / Dropdown ──────────────────────── */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-xl animate-fade-in max-h-[85vh] overflow-y-auto">
            {/* Mobile Language Switcher */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-amber-600" />
                भाषा / Language:
              </span>
              <div className="flex items-center gap-1">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      language === lang.code
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {lang.nativeLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Citizen Search inside mobile nav */}
            <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200">
              <div className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-emerald-700" />
                {t("hero.searchLabel", "Citizen 14-Digit ULPIN Lookup")}
              </div>
              <p className="text-[11px] text-emerald-700 mb-2">
                Verify parcel acquisition status &amp; calculated compensation award
              </p>
              <Link
                href="/citizen"
                className="inline-flex items-center justify-center w-full py-1.5 px-3 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors"
              >
                {t("nav.citizen", "Open Citizen Portal")}
              </Link>
            </div>

            {/* Core Navigation Links */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5">
                {t("footer.modules", "Core Modules")}
              </div>
              {primaryLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-amber-100 text-amber-900 font-bold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-amber-700" : "text-slate-400"}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Tools & Governance Modules */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5">
                {t("nav.tools", "Statutory Tools & Governance")}
              </div>
              {secondaryTools.map((tool) => {
                const ToolIcon = tool.icon;
                const isActive = pathname === tool.href;
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-amber-100 text-amber-900 font-bold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <ToolIcon className="h-4 w-4 text-slate-400" />
                    <div className="flex-1">
                      <div>{tool.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{tool.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Auth & User status */}
            <div className="pt-2 border-t border-slate-100">
              {user ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">{user.name || user.email}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{user.role} Account</div>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <LogOut className="h-3 w-3" />
                    {t("nav.signOut", "Sign Out")}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs"
                >
                  <Shield className="h-4 w-4" />
                  {t("nav.login", "Official Department Login")}
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
