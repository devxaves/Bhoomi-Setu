import Link from "next/link"
import { AlertTriangle, Clock, ArrowRight } from "lucide-react"
import { redirect } from "next/navigation"

// DSS has been superseded by the Risk Engine in BhoomiSetu
export default function DssPage() {
  redirect("/risk")
}