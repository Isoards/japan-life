export type LifeMode = "auto" | "preparation" | "living";

export interface UserSettings {
  residenceLabel: string;
  latitude: number;
  longitude: number;
  moveDate: string;
  lifeMode: LifeMode;
  payday: number;
  timezone: "Asia/Tokyo";
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  residenceLabel: "栃木県塩谷郡高根沢町宝石台",
  latitude: 36.618423,
  longitude: 139.993347,
  moveDate: "2026-03-18",
  lifeMode: "auto",
  payday: 25,
  timezone: "Asia/Tokyo",
};

export function isLivingMode(settings: UserSettings, now = new Date()): boolean {
  if (settings.lifeMode === "living") return true;
  if (settings.lifeMode === "preparation") return false;
  return now.getTime() >= new Date(`${settings.moveDate}T00:00:00+09:00`).getTime();
}
