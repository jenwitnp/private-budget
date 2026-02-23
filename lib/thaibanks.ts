export interface ThaiBank {
  code: string;
  name: string;
  nameEn: string;
  shortName: string;
  color: string;
  logo: string;
}

export const THAI_BANKS: ThaiBank[] = [
  {
    code: "002",
    name: "ธนาคารกสิกรไทย",
    nameEn: "Kasikornbank",
    shortName: "KBANK",
    color: "#138F2D",
    logo: "https://raw.githubusercontent.com/thai-smart-card/thai-smart-card/master/images/banks/kbank.png",
  },
  {
    code: "004",
    name: "ธนาคารไทยพาณิชย์",
    nameEn: "Siam Commercial Bank",
    shortName: "SCB",
    color: "#4E2E7F",
    logo: "https://raw.githubusercontent.com/thai-smart-card/thai-smart-card/master/images/banks/scb.png",
  },
  {
    code: "006",
    name: "ธนาคารกรุงเทพ",
    nameEn: "Bangkok Bank",
    shortName: "BBL",
    color: "#1E366E",
    logo: "https://raw.githubusercontent.com/thai-smart-card/thai-smart-card/master/images/banks/bbl.png",
  },
  {
    code: "011",
    name: "ธนาคารกรุงไทย",
    nameEn: "Krung Thai Bank",
    shortName: "KTB",
    color: "#00AEEF",
    logo: "https://raw.githubusercontent.com/thai-smart-card/thai-smart-card/master/images/banks/ktb.png",
  },
  {
    code: "025",
    name: "ธนาคารกรุงศรีอยุธยา",
    nameEn: "Bank of Ayudhya",
    shortName: "BAY",
    color: "#FEC43B",
    logo: "https://raw.githubusercontent.com/thai-smart-card/thai-smart-card/master/images/banks/bay.png",
  },
  {
    code: "014",
    name: "ธนาคารทหารไทยธนชาต",
    nameEn: "TMBThanachart Bank",
    shortName: "TTB",
    color: "#004892",
    logo: "https://raw.githubusercontent.com/thai-smart-card/thai-smart-card/master/images/banks/ttb.png",
  },
  {
    code: "030",
    name: "ธนาคารออมสิน",
    nameEn: "Government Savings Bank",
    shortName: "GSB",
    color: "#EB198D",
    logo: "https://raw.githubusercontent.com/thai-smart-card/thai-smart-card/master/images/banks/gsb.png",
  },
  {
    code: "034",
    name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร",
    nameEn: "Bank for Agriculture and Agricultural Cooperatives",
    shortName: "BAAC",
    color: "#46A546",
    logo: "https://raw.githubusercontent.com/thai-smart-card/thai-smart-card/master/images/banks/baac.png",
  },
  {
    code: "033",
    name: "ธนาคารอาคารสงเคราะห์",
    nameEn: "Government Housing Bank",
    shortName: "GHB",
    color: "#F58220",
    logo: "https://raw.githubusercontent.com/thai-smart-card/thai-smart-card/master/images/banks/ghb.png",
  },
  {
    code: "024",
    name: "ธนาคารยูโอบี",
    nameEn: "United Overseas Bank (Thai)",
    shortName: "UOB",
    color: "#003876",
    logo: "https://raw.githubusercontent.com/thai-smart-card/thai-smart-card/master/images/banks/uob.png",
  },
];

/**
 * Get bank by code
 */
export function getBankByCode(code: string): ThaiBank | undefined {
  return THAI_BANKS.find((bank) => bank.code === code);
}

/**
 * Search banks by name (Thai or English)
 */
export function searchBanks(query: string): ThaiBank[] {
  if (!query.trim()) return THAI_BANKS;

  const lowerQuery = query.toLowerCase();
  return THAI_BANKS.filter(
    (bank) =>
      bank.name.includes(query) ||
      bank.nameEn.toLowerCase().includes(lowerQuery) ||
      bank.shortName.toLowerCase().includes(lowerQuery),
  );
}
