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

  useEffect(() => {
    setMobileMenuOpen(false);
    setToolsDropdownOpen(false);
    setLangDropdownOpen(false);
  }, [pathname]);

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

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const primaryLinks = [
    { href: "/landing", label: t("nav.home", "Home"), icon: Home },
    { href: "/atlas", label: t("nav.atlas", "GIS Atlas"), icon: MapPin },
    { href: "/workflow", label: t("nav.workflow", "Workflow"), icon: GitBranch },
    { href: "/dashboard", label: t("nav.analytics", "Analytics"), icon: BarChart3 },
    { href: "/citizen", label: t("nav.citizen", "Citizen Corner"), icon: Landmark },
  ];

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
      color: "text-slate-600 bg-slate-100",
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
            color: "text-orange-600 bg-orange-50",
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
    <div className="sticky top-0 z-50">
      {/* ── 1. Government of India Strip ──────────────────────────────── */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-3 sm:px-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
            <span className="font-medium text-slate-200 truncate font-label">
              {t("govt.india", "भारत सरकार | Government of India")}
            </span>
            <span className="hidden md:inline text-slate-700">·</span>
            <span className="hidden md:inline text-slate-400 truncate">
              {t("govt.mord", "Ministry of Rural Development")}
            </span>
            <span className="hidden lg:inline text-slate-700">·</span>
            <span className="hidden lg:inline text-orange-400/80 font-medium">
              {t("govt.dolr", "Department of Land Resources (DoLR)")}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-slate-400 flex-shrink-0">
            {/* Helpline */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/40 text-slate-300">
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              <span className="hidden xs:inline">{t("govt.helpline", "Helpline")}:</span>
              <strong className="text-white font-label">1800-11-LAND</strong>
            </div>

            {/* Language Switcher */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/40 text-slate-200 font-medium text-[11px] transition-all cursor-pointer"
                aria-label="Select Language"
              >
                <Globe2 className="w-3 h-3 text-orange-400" />
                <span className="font-semibold font-label">{currentLangObj.nativeLabel}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${langDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {langDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in-scale space-y-0.5">
                  <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-500 font-label">
                    भाषा / Language
                  </div>
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all cursor-pointer ${
                        language === lang.code
                          ? "bg-orange-500/20 text-orange-300 font-bold"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <span>{lang.nativeLabel}</span>
                      {language === lang.code && <Check className="w-3.5 h-3.5 text-orange-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Accessibility */}
            <div className="hidden sm:flex items-center gap-0.5 border-l border-slate-700/50 pl-2">
              {["A-", "A", "A+"].map((s) => (
                <span key={s} className="px-1 py-0.5 rounded bg-slate-800/80 text-slate-400 font-label text-[10px] font-bold hover:text-white hover:bg-slate-700 transition-colors cursor-pointer">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Main Navigation Bar ──────────────────────────────────── */}
      <header className="glass border-b border-border/60 shadow-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-4 py-2.5 gap-2 sm:gap-4">
          {/* Brand */}
          <Link
            href="/landing"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity flex-shrink-0 group"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-md flex items-center justify-center group-hover:shadow-lg group-hover:scale-105 transition-all">
                <span className="text-sm font-black text-white drop-shadow-sm">भ</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-heading font-extrabold tracking-tight">
                  <span className="text-orange-600">भूमि</span>
                  <span className="text-emerald-700">सेतु</span>
                </span>
                <span className="text-[9px] font-bold font-label px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hidden xs:inline-block">
                  {t("nav.brand", "BhoomiSetu")}
                </span>
              </div>
              <p className="text-[9px] font-medium text-muted-foreground hidden md:block tracking-wide font-label">
                {t("nav.tagline", "National Land Acquisition & Compliance Portal")}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {primaryLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/landing" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all whitespace-nowrap group ${
                    isActive
                      ? "bg-orange-50 text-orange-800 font-bold"
                      : "text-foreground/60 hover:text-orange-700 hover:bg-orange-50/60"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 transition-colors ${isActive ? "text-orange-600" : "text-foreground/40 group-hover:text-orange-500"}`} />
                  <span>{link.label}</span>
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-400" />
                  )}
                </Link>
              );
            })}

            {/* Governance Tools Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  isToolsActive || toolsDropdownOpen
                    ? "bg-slate-100 text-foreground font-bold"
                    : "text-foreground/60 hover:text-foreground hover:bg-slate-50"
                }`}
              >
                <Layers className={`h-3.5 w-3.5 transition-colors ${isToolsActive ? "text-orange-600" : "text-foreground/40"}`} />
                <span>{t("nav.tools", "Governance Tools")}</span>
                <ChevronDown
                  className={`h-3 w-3 text-foreground/40 transition-transform duration-200 ${
                    toolsDropdownOpen ? "rotate-180 text-foreground" : ""
                  }`}
                />
              </button>

              {toolsDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 glass rounded-2xl border border-border shadow-xl p-2 z-50 animate-fade-in-scale space-y-0.5">
                  <div className="px-3 py-1.5 section-label">
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
                        className={`flex items-start gap-3 p-2.5 rounded-xl transition-all group ${
                          isToolActive
                            ? "bg-orange-50 border border-orange-200/60"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${tool.color} flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110`}>
                          <ToolIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-foreground">{tool.label}</div>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{tool.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* ULPIN Search CTA */}
            <Link
              href="/citizen"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-sm whitespace-nowrap group"
            >
              <Search className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>{t("nav.ulpinSearch", "ULPIN Search")}</span>
            </Link>

            {/* Auth */}
            <div className="border-l border-border/60 pl-2 sm:pl-3 flex items-center gap-1.5">
              {loading ? (
                <div className="h-7 w-7 rounded-xl skeleton" />
              ) : user ? (
                <div className="flex items-center gap-1.5">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs bg-muted/60 px-2.5 py-1.5 rounded-xl border border-border/50">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="max-w-[90px] truncate font-medium text-foreground/80">{user.name || user.email}</span>
                    <span
                      className={`text-[9px] font-bold font-label px-1.5 py-0.5 rounded-full ${
                        user.role === "admin"
                          ? "bg-orange-100 text-orange-800 border border-orange-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {user.role === "admin" ? "ADMIN" : "CITIZEN"}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    title={t("nav.signOut", "Sign Out")}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t("nav.login", "Official Login")}</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-foreground/60 hover:text-foreground hover:bg-muted border border-border/50 transition-all cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* ── 3. Mobile Navigation Drawer ──────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/60 bg-white/98 backdrop-blur-xl px-4 py-4 space-y-4 shadow-xl animate-fade-in max-h-[85vh] overflow-y-auto">
            {/* Mobile Language Switcher */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border/50">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 font-heading">
                <Globe2 className="w-3.5 h-3.5 text-orange-500" />
                भाषा / Language:
              </span>
              <div className="flex items-center gap-1">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      language === lang.code
                        ? "bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-sm"
                        : "bg-white text-foreground/70 border border-border hover:bg-muted"
                    }`}
                  >
                    {lang.nativeLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Citizen Search */}
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
              <div className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5 font-heading">
                <Search className="w-3.5 h-3.5 text-emerald-600" />
                {t("hero.searchLabel", "Citizen 14-Digit ULPIN Lookup")}
              </div>
              <p className="text-[11px] text-emerald-700 mb-2">
                Verify parcel acquisition status & calculated compensation award
              </p>
              <Link
                href="/citizen"
                className="inline-flex items-center justify-center w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                {t("nav.citizen", "Open Citizen Portal")}
              </Link>
            </div>

            {/* Core Navigation Links */}
            <div className="space-y-1">
              <div className="section-label px-2 py-1">
                {t("footer.modules", "Core Modules")}
              </div>
              {primaryLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-orange-50 text-orange-800 font-bold"
                        : "text-foreground/70 hover:bg-muted/50"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-orange-600" : "text-foreground/40"}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Tools & Governance */}
            <div className="space-y-1 pt-2 border-t border-border/40">
              <div className="section-label px-2 py-1">
                {t("nav.tools", "Statutory Tools & Governance")}
              </div>
              {secondaryTools.map((tool) => {
                const ToolIcon = tool.icon;
                const isActive = pathname === tool.href;
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-orange-50 text-orange-800 font-bold"
                        : "text-foreground/70 hover:bg-muted/50"
                    }`}
                  >
                    <ToolIcon className="h-4 w-4 text-foreground/40" />
                    <div className="flex-1">
                      <div>{tool.label}</div>
                      <div className="text-[10px] text-muted-foreground font-normal">{tool.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Auth */}
            <div className="pt-2 border-t border-border/40">
              {user ? (
                <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{user.name || user.email}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-label">{user.role} Account</div>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <LogOut className="h-3 w-3" />
                    {t("nav.signOut", "Sign Out")}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl btn-primary text-sm"
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
