import { DashboardShell } from "@/components/dashboard-shell";
import { ReportForm } from "@/components/report-form";

export default function ReportFoundPage() {
  return (
    <DashboardShell>
      <ReportForm kind="found" />
    </DashboardShell>
  );
}
