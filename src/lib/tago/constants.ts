import { SupportedCity } from "../trip-domain";

/**
 * 10대 주요 여행 도시 대표 기차역 노드 ID 매핑 (국토교통부 TrainInfo 규격)
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
    { id: "NAT013970", name: "경주" },
  ],
  GANGNEUNG: [
    { id: "NAT013624", name: "강릉" },
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
 * 10대 주요 여행 도시 대표 고속/시외버스 터미널 ID 매핑 (국토교통부 ExpBusInfo 규격)
 */
export const CITY_BUS_TERMINAL_MAP: Partial<Record<SupportedCity, { id: string; name: string }[]>> = {
  SEOUL: [
    { id: "NAEK010", name: "서울경부" },
    { id: "NAEK020", name: "센트럴시티(서울)" },
    { id: "NAEK030", name: "동서울" },
  ],
  BUSAN: [
    { id: "NAEK700", name: "부산종합(노포)" },
    { id: "NAEK703", name: "부산서부(사상)" },
    { id: "NAEK705", name: "해운대" },
  ],
  JEONJU: [
    { id: "NAEK602", name: "전주고속" },
  ],
  GYEONGJU: [
    { id: "NAEK815", name: "경주고속" },
    { id: "NAEK816", name: "경주시외" },
  ],
  GANGNEUNG: [
    { id: "NAEK200", name: "강릉고속" },
    { id: "NAEK201", name: "강릉시외" },
  ],
  SUWON: [
    { id: "NAEK110", name: "수원종합" },
  ],
  YEOSU: [
    { id: "NAEK610", name: "여수종합" },
    { id: "NAEK611", name: "여천" },
  ],
  SOKCHO: [
    { id: "NAEK230", name: "속초고속" },
    { id: "NAEK231", name: "속초시외" },
  ],
};
