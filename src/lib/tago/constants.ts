import { SupportedCity } from "../trip-domain";

/**
 * 10대 주요 여행 도시 대표 기차역 노드 ID 매핑 (국토교통부 TrainInfo 공식 전산망)
 */
export const CITY_TRAIN_STATION_MAP: Partial<Record<SupportedCity, { id: string; name: string }[]>> = {
  SEOUL: [
    { id: "NAT010000", name: "서울" },
    { id: "NAT010032", name: "용산" },
    { id: "NAT130126", name: "청량리" },
  ],
  BUSAN: [
    { id: "NAT014445", name: "부산" },
    { id: "NAT014446", name: "구포" },
  ],
  JEONJU: [
    { id: "NAT011668", name: "전주" },
  ],
  GYEONGJU: [
    { id: "NAT013974", name: "신경주" },
    { id: "NATH13421", name: "경주" },
  ],
  GANGNEUNG: [
    { id: "NAT013624", name: "강릉" },
    { id: "NAT601936", name: "강릉" },
  ],
  SUWON: [
    { id: "NAT010166", name: "수원" },
  ],
  YEOSU: [
    { id: "NAT011832", name: "여수엑스포" },
    { id: "NAT011830", name: "여천" },
  ],
};

/**
 * 10대 주요 여행 도시 대표 고속버스 터미널 ID 매핑 (KOBUS / 국토교통부 ExpBusInfo 공식 전산망)
 */
export const CITY_BUS_TERMINAL_MAP: Partial<Record<SupportedCity, { id: string; name: string }[]>> = {
  SEOUL: [
    { id: "NAEK010", name: "서울경부" },
    { id: "NAEK021", name: "센트럴시티(서울)" },
    { id: "NAEK020", name: "센트럴시티(서울)" },
    { id: "NAEK030", name: "동서울" },
    { id: "NAEK031", name: "동서울" },
  ],
  BUSAN: [
    { id: "NAEK700", name: "부산(노포)" },
    { id: "NAEK703", name: "부산사상(서부)" },
    { id: "NAEK701", name: "부산시외" },
  ],
  JEONJU: [
    { id: "NAEK602", name: "전주고속" },
    { id: "NAEK600", name: "전주" },
    { id: "NAEK609", name: "전주시외" },
  ],
  GYEONGJU: [
    { id: "NAEK815", name: "경주고속" },
    { id: "NAEK894", name: "경주" },
  ],
  GANGNEUNG: [
    { id: "NAEK200", name: "강릉고속" },
  ],
  SUWON: [
    { id: "NAEK110", name: "수원종합" },
    { id: "NAEK109", name: "서수원" },
  ],
  YEOSU: [
    { id: "NAEK510", name: "여수종합" },
  ],
  SOKCHO: [
    { id: "NAEK230", name: "속초고속" },
  ],
};
