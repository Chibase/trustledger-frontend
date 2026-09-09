import type {
  ExecutiveRiskRow,
  FunderSnapshot,
  LensChartGroup,
  ReportLens,
} from "@/lib/reportLenses";
import type { ReportFormatId } from "@/types/activityReport";

export type ClientReportPdfPayload = {
  title: string;
  projectName: string;
  periodLabel: string;
  kindLabel: string;
  audienceLabel: string;
  format: ReportFormatId;
  narrativeMarkdown: string;
  lens: ReportLens;
  chartGroups: LensChartGroup[];
  riskRows: ExecutiveRiskRow[];
  funderSnapshot?: FunderSnapshot;
  trustIndex: number;
  trustLabel?: string;
};
