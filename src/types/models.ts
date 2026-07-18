import type { Tables, TablesInsert, TablesUpdate } from "./database";

export type Profile = Tables<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export type Account = Tables<"accounts">;
export type AccountInsert = TablesInsert<"accounts">;

export type Broker = Tables<"brokers">;
export type MarketRow = Tables<"markets">;

export type Strategy = Tables<"strategies">;
export type StrategyInsert = TablesInsert<"strategies">;
export type StrategyUpdate = TablesUpdate<"strategies">;

export type Playbook = Tables<"playbooks">;
export type PlaybookInsert = TablesInsert<"playbooks">;

export type Tag = Tables<"tags">;
export type Mistake = Tables<"mistakes">;
export type SessionRow = Tables<"sessions">;

export type Trade = Tables<"trades">;
export type TradeInsert = TablesInsert<"trades">;
export type TradeUpdate = TablesUpdate<"trades">;

export type TradeImage = Tables<"trade_images">;

export type Note = Tables<"notes">;
export type NoteInsert = TablesInsert<"notes">;

export type Report = Tables<"reports">;
export type Notification = Tables<"notifications">;

/** A trade joined with its related entities, as used across the UI. */
export type TradeWithRelations = Trade & {
  strategy: Pick<Strategy, "id" | "name" | "color"> | null;
  account: Pick<Account, "id" | "name" | "currency"> | null;
  tags: Pick<Tag, "id" | "name" | "color">[];
  mistakes: Pick<Mistake, "id" | "label" | "color">[];
  images: TradeImage[];
};
