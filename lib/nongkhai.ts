export const NONGKHAI_DATA = {
  province: "หนองคาย",
  constituency: 3,
  data: [
    {
      district: "อำเภอท่าบ่อ",
      sub_districts: [
        {
          name: "ตำบลท่าบ่อ",
          villages_count: 13,
          examples: ["หมู่ 1 บ้านท่าบ่อ", "หมู่ 2 บ้านหัวหาด"],
        },
        { name: "ตำบลน้ำโมง", villages_count: 13 },
        { name: "ตำบลโคกคอน", villages_count: 7 },
        { name: "ตำบลบ้านเดื่อ", villages_count: 9 },
        { name: "ตำบลบ้านถ่อน", villages_count: 8 },
        { name: "ตำบลบ้านลาน", villages_count: 10 },
        { name: "ตำบลนาข่า", villages_count: 8 },
        { name: "ตำบลโพนสา", villages_count: 10 },
        { name: "ตำบลหนองนาง", villages_count: 9 },
        { name: "ตำบลกองนาง", villages_count: 13 },
      ],
    },
    {
      district: "อำเภอศรีเชียงใหม่",
      sub_districts: [
        {
          name: "ตำบลพานพร้าว",
          villages_count: 15,
          examples: ["หมู่ 1 บ้านพานพร้าว"],
        },
        { name: "ตำบลบ้านหม้อ", villages_count: 8 },
        { name: "ตำบลพระพุทธบาท", villages_count: 10 },
        { name: "ตำบลหนองปลาปาก", villages_count: 10 },
      ],
    },
    {
      district: "อำเภอสังคม",
      sub_districts: [
        { name: "ตำบลสังคม", villages_count: 7 },
        { name: "ตำบลแก้งไก่", villages_count: 6 },
        { name: "ตำบลผาตั้ง", villages_count: 7 },
        { name: "ตำบลบ้านม่วง", villages_count: 7 },
        { name: "ตำบลนางิ้ว", villages_count: 9 },
      ],
    },
    {
      district: "อำเภอโพธิ์ตาก",
      sub_districts: [
        { name: "ตำบลโพธิ์ตาก", villages_count: 7 },
        { name: "ตำบลด่านศรีสุข", villages_count: 9 },
        { name: "ตำบลโพนทอง", villages_count: 11 },
      ],
    },
  ],
} as const;
