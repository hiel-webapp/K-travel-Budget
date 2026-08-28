export interface TagoTrainItem {
  trainno: string;
  traingradename: string; // KTX, ITX-새마을, 무궁화호 등
  depplacename: string;
  arrplacename: string;
  depplandtime: string; // YYYYMMDDHHmmss
  arrplandtime: string; // YYYYMMDDHHmmss
  adultcharge: string | number; // 59800
}

export interface TagoExpBusItem {
  routeId: string;
  depPlaceNm: string;
  arrPlaceNm: string;
  depPlandTime: string | number; // YYYYMMDDHHmm
  arrPlandTime: string | number; // YYYYMMDDHHmm
  charge: string | number; // 16600
  gradeNm: string; // 우등, 프리미엄, 일반
}

export interface TagoStationItem {
  nodeid: string; // NAT010000
  nodename: string; // 서울
}

export interface TagoTerminalItem {
  terminalId: string; // NAEK010
  terminalNm: string; // 서울경부
}
