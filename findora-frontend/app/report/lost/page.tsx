import { DashboardShell } from "@/components/dashboard-shell";
import { ReportForm } from "@/components/report-form";

export default function ReportLostPage() {
  return (
    <DashboardShell>
      <ReportForm kind="lost" />
    </DashboardShell>
  );
}
