export type {
  ExecutionListItem as ExecutionRecord,
  ExecutionLogItem,
} from "./contracts";

export type ExecutionStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED";
