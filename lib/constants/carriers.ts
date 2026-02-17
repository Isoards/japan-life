import type { PackageCarrier } from "../types";

export interface CarrierInfo {
  id: PackageCarrier;
  name: string;
  nameJa: string;
  trackingUrl: (num: string) => string;
  icon: string;
}

export const CARRIERS: CarrierInfo[] = [
  {
    id: "yamato",
    name: "야마토 운수",
    nameJa: "ヤマト運輸",
    trackingUrl: (n) => `https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number=${n}`,
    icon: "🐈‍⬛",
  },
  {
    id: "sagawa",
    name: "사가와 급편",
    nameJa: "佐川急便",
    trackingUrl: (n) => `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${n}`,
    icon: "📦",
  },
  {
    id: "japan-post",
    name: "일본우편",
    nameJa: "日本郵便",
    trackingUrl: (n) => `https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=${n}`,
    icon: "📮",
  },
  {
    id: "ems",
    name: "EMS",
    nameJa: "EMS",
    trackingUrl: (n) => `https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=${n}`,
    icon: "✈️",
  },
  {
    id: "dhl",
    name: "DHL",
    nameJa: "DHL",
    trackingUrl: (n) => `https://www.dhl.com/jp-ja/home/tracking/tracking-express.html?submit=1&tracking-id=${n}`,
    icon: "🟡",
  },
  {
    id: "fedex",
    name: "FedEx",
    nameJa: "FedEx",
    trackingUrl: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
    icon: "🟣",
  },
  {
    id: "other",
    name: "기타",
    nameJa: "その他",
    trackingUrl: () => "#",
    icon: "📋",
  },
];

export function getCarrier(id: PackageCarrier) {
  return CARRIERS.find((c) => c.id === id);
}
