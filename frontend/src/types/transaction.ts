export interface Transaction {
  hash: string;
  type: string;
  account: string;
  destination?: string;
  amount: string | object;
  fee: string;
  sequence: number;
  date: string;
  ledgerIndex: number;
  validated: boolean;
  meta?: Record<string, unknown>;
  status: "success" | "failed" | "pending";
}
