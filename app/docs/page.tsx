import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — BhoomiSetu Architecture & RFCTLARR Act 2013 Guide",
  description:
    "Official technical documentation, API specifications, database schema, and RFCTLARR 2013 statutory stage guide for BhoomiSetu platform.",
};

export default function DocsPage() {
  return (
    <div className="w-full h-[calc(100vh-57px)] bg-slate-950">
      <iframe
        src="/docs.html"
        className="w-full h-full border-0"
        title="BhoomiSetu Platform Documentation"
      />
    </div>
  );
}
