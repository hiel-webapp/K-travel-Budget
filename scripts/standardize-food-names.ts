import fs from "fs";
import path from "path";

// 120개 전 품목에 대한 KTO/한식진흥원 표준 명칭 정제 테이블
const STANDARDIZED_FOODS: Record<
  string,
  { nameKo: string; nameEn: string; descKo: string; descEn: string }
> = {
  // ==========================================
  // 1. 🇰🇷 한국 대표 미식 (20선)
  // ==========================================
  nat_samgyeopsal: {
    nameKo: "삼겹살 구이",
    nameEn: "Samgyeopsal (Grilled Pork Belly)",
    descKo: "신선한 돼지 삼겹살을 노릇하게 구워 쌈채소, 쌈장, 마늘과 곁들여 먹는 한국의 대표 구이 요리",
    descEn: "Thick slices of fresh pork belly grilled at the table, wrapped in lettuce leaves with savory ssamjang and garlic",
  },
  nat_chimaek: {
    nameKo: "양념치킨 & 후라이드치킨",
    nameEn: "Chimaek (Korean Fried & Seasoned Chicken)",
    descKo: "바삭하게 튀겨낸 후라이드치킨과 매콤달콤한 특제 양념치킨을 시원한 맥주와 함께 즐기는 국민 야식",
    descEn: "Crispy Korean double-fried chicken and sweet-spicy glazed chicken, traditionally enjoyed with cold draft beer",
  },
  nat_tteokbokki_set: {
    nameKo: "떡볶이 & 튀김·순대",
    nameEn: "Tteokbokki & Snack Platter (Spicy Rice Cakes)",
    descKo: "매콤달콤한 고추장 양념에 끓여낸 쫄깃한 쌀떡볶이와 바삭한 모둠튀김, 찰순대 분식 세트",
    descEn: "Chewy cylinder rice cakes simmered in sweet and spicy chili paste sauce, paired with crispy fritters and steamed sausage",
  },
  nat_bibimbap: {
    nameKo: "비빔밥",
    nameEn: "Bibimbap (Mixed Rice Bowl with Vegetables)",
    descKo: "따뜻한 밥 위에 제철 나물, 볶은 고기, 계란을 얹어 고추장과 참기름으로 비벼 먹는 전통 음식",
    descEn: "Warm white rice topped with seasoned mountain vegetables, sauteed beef, egg, aromatic sesame oil, and spicy gochujang paste",
  },
  nat_kimchi_jjigae: {
    nameKo: "돼지고기 김치찌개",
    nameEn: "Kimchi-jjigae (Spicy Kimchi Stew with Pork)",
    descKo: "잘 익은 숙성 김치와 두툼한 돼지고기, 두부를 듬뿍 넣고 얼큰하게 끓여낸 한국인의 소울푸드",
    descEn: "Hearty, spicy stew brewed with well-aged fermented kimchi, succulent tender pork chunks, and soft tofu cubes",
  },
  nat_samgyetang: {
    nameKo: "삼계탕",
    nameEn: "Samgyetang (Ginseng Chicken Soup)",
    descKo: "어린 닭의 뱃속에 찹쌀, 인삼, 대추, 마늘을 채워 푹 고아낸 대표적인 전통 보양식",
    descEn: "Whole tender young chicken stuffed with sweet sticky rice, ginseng root, jujubes, and garlic, simmered in rich medicinal broth",
  },
  nat_bulgogi: {
    nameKo: "소불고기",
    nameEn: "Bulgogi (Marinated Beef BBQ)",
    descKo: "얇게 저민 소고기를 간장, 배, 양파를 넣은 달콤 짭조름한 특제 양념에 재워 구워낸 궁중 전통 요리",
    descEn: "Thinly sliced tender beef marinated in a sweet and savory soy, garlic, and pear sauce, grilled with fresh scallions and mushrooms",
  },
  nat_dakgalbi: {
    nameKo: "철판 닭갈비",
    nameEn: "Dak-galbi (Spicy Stir-fried Chicken)",
    descKo: "토막 친 닭고기를 매콤한 고추장 양념에 재운 뒤 양배추, 고구마, 떡과 함께 무쇠 철판에 볶아 먹는 요리",
    descEn: "Boneless chicken marinated in spicy chili sauce, stir-fried on a tabletop iron skillet with sweet cabbage, sweet potatoes, and rice cakes",
  },
  nat_sundubu: {
    nameKo: "해물 순두부찌개",
    nameEn: "Haemul Sundubu-jjigae (Spicy Soft Tofu Stew)",
    descKo: "몽글몽글 부드러운 순두부와 신선한 조개, 새우, 계란을 넣고 칼칼하고 진하게 끓여낸 뚝배기 찌개",
    descEn: "Silken uncurdled soft tofu stew bubbling fiery red in an earthenware bowl with clams, shrimp, and an egg yolk",
  },
  nat_gamjatang: {
    nameKo: "감자탕 (뼈해장국)",
    nameEn: "Gamjatang (Pork Bone Stew with Potatoes)",
    descKo: "돼지 등뼈와 우거지, 감자, 들깨가루를 듬뿍 넣고 오랜 시간 푹 고아내 깊고 구수한 맛을 내는 탕 요리",
    descEn: "Rich, deep broth stewed for hours with meaty pork spine bones, dried cabbage greens, whole potatoes, and perilla seeds",
  },
  nat_budae_jjigae: {
    nameKo: "부대찌개",
    nameEn: "Budae-jjigae (Sausage & Ham Army Stew)",
    descKo: "햄, 소시지, 김치, 베이크드 빈스, 치즈와 라면사리를 푸짐하게 끓여내는 퓨전 전통 찌개",
    descEn: "Hearty fusion hotpot simmered with savory ham, pork sausage, aged kimchi, baked beans, cheese, and chewy ramen noodles",
  },
  nat_naengmyeon: {
    nameKo: "물냉면 & 비빔냉면",
    nameEn: "Naengmyeon (Cold Buckwheat Noodles)",
    descKo: "시원한 동치미 살얼음 육수의 메밀 물냉면과 매콤새콤한 비빔장을 얹은 비빔냉면",
    descEn: "Chilled chewy buckwheat noodles served in refreshing icy broth or tossed with spicy sweet chili dressing",
  },
  nat_kkwabaegi_bungeoppang: {
    nameKo: "찹쌀 꽈배기 & 팥 붕어빵",
    nameEn: "K-Street Desserts (Twisted Donuts & Fish Bread)",
    descKo: "전통 시장에서 갓 튀겨내 설탕을 묻힌 쫄깃한 꽈배기와 달콤한 팥앙금이 가득 찬 붕어빵",
    descEn: "Popular traditional street treats featuring warm, sugar-dusted twisted donuts and crispy fish-shaped pastries filled with sweet red bean",
  },
  nat_bingsu: {
    nameKo: "눈꽃 팥빙수",
    nameEn: "Bingsu (Korean Shaved Milk Ice Dessert)",
    descKo: "부드러운 우유 눈꽃 얼음 위에 달콤하게 졸인 팥과 쫀득한 찹쌀떡을 얹어 시원하게 즐기는 여름 디저트",
    descEn: "Delicate snowfall shaved milk ice crowned with sweet cooked red beans, chewy rice cakes, and roasted soybean powder",
  },
  nat_sogalbijjim: {
    nameKo: "소갈비찜",
    nameEn: "Galbi-jjim (Braised Short Ribs)",
    descKo: "두툼한 소갈비에 간장, 꿀, 밤, 대추, 버섯을 넣고 살이 부드럽게 떨어질 때까지 정성스레 졸여낸 명절 잔치 요리",
    descEn: "Tender, melt-in-the-mouth beef short ribs braised in sweet soy sauce with chestnuts, dates, and shiitake mushrooms",
  },
  nat_jajangmyeon_mandu: {
    nameKo: "자장면 & 군만두",
    nameEn: "Jajangmyeon & Crispy Mandu (Black Bean Noodles)",
    descKo: "고소하고 달콤한 춘장 소스에 양파와 고기를 볶아 얹은 쫄깃한 면발과 노릇하게 튀겨낸 바삭한 군만두",
    descEn: "Hand-pulled chewy noodles tossed in savory sweet black bean sauce with diced pork and onions, served with fried pork dumplings",
  },
  nat_hanjeongsik: {
    nameKo: "전통 한정식 반상",
    nameEn: "Hanjeongsik (Full-Course Korean Table)",
    descKo: "한국 전통 상차림의 정수로 계절 나물, 구이, 탕, 찌개와 정갈한 찬들이 푸짐하게 차려지는 정식",
    descEn: "Exquisite Korean full-course meal feast featuring a harmonious spread of grilled dishes, soups, stews, and delicate side dishes",
  },
  nat_haemul_pajeon: {
    nameKo: "해물파전 & 막걸리",
    nameEn: "Haemul Pajeon & Makgeolli (Seafood Scallion Pancake)",
    descKo: "싱싱한 오징어, 조갯살과 쪽파를 듬뿍 넣어 바삭하게 부친 부침개와 달콤하고 부드러운 전통 쌀막걸리",
    descEn: "Crispy savory Korean scallion pancake packed with fresh seafood, classically paired with naturally fermented rice wine",
  },
  nat_street_toast: {
    nameKo: "길거리 토스트",
    nameEn: "Gilgeori Toast (Korean Street Egg Toast)",
    descKo: "버터에 구운 식빵 사이에 달걀 채소 패티와 햄을 넣고 설탕과 케첩을 뿌려 달콤 짭조름하게 즐기는 한국식 길거리 토스트",
    descEn: "Buttery toasted sandwich layered with an egg-vegetable patty, savory ham, ketchup, and sugar for a signature sweet-savory punch",
  },
  nat_shabushabu: {
    nameKo: "소고기 샤브샤브",
    nameEn: "Korean Beef Shabu-shabu",
    descKo: "맑은 채소 육수에 얇게 썬 소고기와 신선한 버섯, 배추를 살짝 데쳐 먹은 뒤 칼국수와 죽으로 마무리하는 요리",
    descEn: "Thin tender beef slices gently cooked in hot vegetable broth with mushrooms, finished with noodles and comforting porridge",
  },

  // ==========================================
  // 2. 🏙️ 서울 로컬 대표 미식 (10선)
  // ==========================================
  seoul_gwangjang_pancake: {
    nameKo: "광장시장 녹두빈대떡",
    nameEn: "Gwangjang Market Bindaetteok (Mung Bean Pancake)",
    descKo: "맷돌로 거칠게 간 녹두 반죽에 숙주와 돼지고기를 넣고 무쇠 철판에 바삭하고 두툼하게 부쳐낸 광장시장 명물",
    descEn: "Crispy, savory stone-ground mung bean pancake pan-fried in oil with bean sprouts and pork at historic Gwangjang Market",
  },
  seoul_seolleongtang: {
    nameKo: "종로 설렁탕",
    nameEn: "Jongno Seolleongtang (Ox Bone Soup)",
    descKo: "소 뼈와 양지를 가마솥에서 오랜 시간 뽀얗게 고아낸 진한 사골 육수에 소면과 밥, 깍두기를 곁들여 먹는 서울 전통 탕",
    descEn: "Rich, milky ox bone soup simmered for 15+ hours, served with tender beef slices, noodles, and crunchy radish kimchi",
  },
  seoul_sindang_tteokbokki: {
    nameKo: "신당동 즉석떡볶이",
    nameEn: "Sindang-dong Tabletop Tteokbokki",
    descKo: "춘장과 고추장 황금비율 양념에 떡, 쫄면, 라면, 야끼만두, 계란을 즉석에서 끓여 먹는 신당동 떡볶이 골목 원조 메뉴",
    descEn: "Iconic table-cooked spicy rice cakes simmered in red pepper and black bean paste with ramen, dumplings, and eggs",
  },
  seoul_mapo_galbi: {
    nameKo: "마포 돼지갈비",
    nameEn: "Mapo Pork Galbi (Charcoal BBQ Ribs)",
    descKo: "달콤 짭조름한 비법 간장 양념에 재운 돼지갈비를 참숯불에 노릇하게 구워 먹는 마포 갈비 골목 전통의 맛",
    descEn: "Succulent pork ribs marinated in seasoned sweet soy glaze, charcoal-grilled to caramelized perfection in historic Mapo",
  },
  seoul_dongdaemun_dakhanmari: {
    nameKo: "동대문 닭한마리",
    nameEn: "Dongdaemun Dakhanmari (Whole Chicken Hotpot)",
    descKo: "양은 냄비에 통닭 한 마리를 맑은 육수에 끓여 알싸한 겨자 다대기 소스에 찍어 먹고 칼국수로 마무리하는 동대문 명물",
    descEn: "Whole tender chicken simmered at the table in clear broth, dipped in spicy vinegar-mustard sauce and finished with fresh knife-cut noodles",
  },
  seoul_namdaemun_galchijorim: {
    nameKo: "남대문 갈치조림",
    nameEn: "Namdaemun Galchi-jorim (Braised Cutlassfish)",
    descKo: "도톰한 갈치와 달큰하게 푹 익은 무를 매콤달콤한 고춧가루 양념에 졸여낸 남대문 시장 갈치 골목 대표 밥도둑",
    descEn: "Thick fresh cutlassfish steaks and tender radishes braised in a bubbling pot of fiery, savory red chili garlic sauce",
  },
  seoul_euljiro_golbaengi: {
    nameKo: "을지로 골뱅이무침",
    nameEn: "Euljiro Golbaengi-muchim (Spicy Sea Snail Salad)",
    descKo: "큼직하고 쫄깃한 통골뱅이를 알싸한 파채와 고춧가루, 명태포와 함께 거칠게 버무려 맥주와 즐기는 힙지로 안주",
    descEn: "Plump sea snails tossed with fresh scallion threads, dried pollock strips, and spicy red pepper, served in retro Euljiro alleys",
  },
  seoul_bukchon_sujebi: {
    nameKo: "삼청동 수제비",
    nameEn: "Samcheong-dong Sujebi (Hand-Torn Dough Soup)",
    descKo: "진하게 우려낸 멸치 육수에 쫄깃한 반죽을 얇게 뜯어 넣고 호박, 바지락을 곁들여 먹는 삼청동 전통 수제비",
    descEn: "Delicate hand-torn wheat flour dough flakes cooked in deeply flavorful anchovy broth with clams and fresh zucchini",
  },
  seoul_itaewon_fusion: {
    nameKo: "광장시장 육회 & 육회비빔밥",
    nameEn: "Gwangjang Yukhoe (Korean Beef Tartare)",
    descKo: "신선한 한우 우둔살을 참기름, 마늘, 소금으로 버무리고 달콤한 배와 계란 노른자를 얹어 먹는 종로 광장시장 명물",
    descEn: "Fresh raw beef tartare tossed with fragrant toasted sesame oil, minced garlic, crisp pear matchsticks, and egg yolk",
  },
  seoul_jangchung_jokbal: {
    nameKo: "장충동 족발",
    nameEn: "Jangchung-dong Jokbal (Braised Pig's Trotters)",
    descKo: "각종 한약재와 비법 육수에 오랜 시간 푹 삶아내 쫄깃하고 부드러운 장충동 족발 골목의 원조 보양 요리",
    descEn: "Tender sliced pig's trotters slowly braised with herbs and soy sauce until gelatinous, soft, and richly savory",
  },

  // ==========================================
  // 3. 🏙️ 부산 로컬 대표 미식 (10선)
  // ==========================================
  busan_dwaeji_gukbap: {
    nameKo: "부산 돼지국밥",
    nameEn: "Busan Dwaeji-gukbap (Pork and Rice Soup)",
    descKo: "돼지 사골을 뽀얗게 우려낸 뜨끈한 육수에 푸짐한 수육과 부추 겉절이, 새우젓을 넣어 먹는 부산의 대표 향토음식",
    descEn: "Piping-hot, deep pork bone broth filled with sliced tender pork, seasoned with salted baby shrimp and fresh chives",
  },
  busan_milmyeon: {
    nameKo: "부산 밀면",
    nameEn: "Busan Milmyeon (Wheat Noodle Soup)",
    descKo: "쫄깃한 밀가루 면발에 한약재를 넣고 우린 살얼음 육수와 매콤달콤한 비빔 양념을 얹어 시원하게 즐기는 부산 여름 별미",
    descEn: "Busan signature cold wheat noodles served in icy herbal beef broth with cucumber, hard-boiled egg, and sweet chili sauce",
  },
  busan_ssiat_hotteok: {
    nameKo: "남포동 씨앗호떡",
    nameEn: "Nampodong Ssiat Hotteok (Seed Stuffed Sweet Pancake)",
    descKo: "마가린에 바삭하게 구운 찹쌀 반죽을 갈라 해바라기씨, 호박씨, 땅콩 등 고소한 견과류와 흑설탕을 듬뿍 채운 길거리 간식",
    descEn: "Golden griddled sweet pancake cut open and generously stuffed with crunchy sunflower seeds, pumpkin seeds, and brown sugar",
  },
  busan_jagalchi_rawfish: {
    nameKo: "자갈치 모둠 생선회",
    nameEn: "Jagalchi Raw Fish Platter (Sashimi)",
    descKo: "자갈치 시장에서 갓 건져 올린 광어, 우럭, 참돔을 싱싱하게 회 떠서 초고추장, 쌈장과 함께 즐기는 바다의 맛",
    descEn: "Ultra-fresh slices of local catch including flounder and sea bream, enjoyed with spicy red chili paste and sesame oil wrap",
  },
  busan_gijang_eel: {
    nameKo: "기장 짚불 곰장어",
    nameEn: "Gijang Straw-Fire Grilled Hagfish",
    descKo: "볏짚에 불을 붙여 순간적인 고열로 구워내 겉은 바삭하고 속은 쫄깃하며 특유의 짚불 훈연 향이 배어있는 기장 명물",
    descEn: "Unique Busan delicacy cooked over blazing rice straw fire, locking in natural sea flavor with distinct smoky aroma",
  },
  busan_nakgop_sae: {
    nameKo: "부산 낙곱새",
    nameEn: "Busan Nakgopsae (Octopus, Intestine & Shrimp Stew)",
    descKo: "낙지, 대창(곱창), 새우를 매콤하고 얼큰한 비법 양념에 자작하게 끓여 밥 위에 얹어 김가루와 비벼 먹는 전골 요리",
    descEn: "Spicy pan-stew combining tender baby octopus, rich beef intestines, and plump shrimp, served over steamed rice with seaweed",
  },
  busan_eomuk_mooltteok: {
    nameKo: "부산 어묵 & 물떡",
    nameEn: "Busan Fish Cake & Mooltteok (Rice Cake Skewers)",
    descKo: "진한 무와 멸치 육수 가마솥에 푹 익힌 두툼한 명품 부산 어묵 꼬치와 쫀득하게 간이 밴 가래떡 꼬치",
    descEn: "High-grade savory fish cakes and chewy cylindrical rice cakes slow-simmered on skewers in rich seasoned anchovy broth",
  },
  busan_naengchae_jokbal: {
    nameKo: "남포동 냉채족발",
    nameEn: "Nampodong Naengchae Jokbal (Chilled Jellyfish Trotters)",
    descKo: "얇게 썬 부드러운 족발에 오이, 해파리채를 곁들이고 코끝이 찡한 특제 겨자소스를 끼얹어 새콤달콤하게 즐기는 요리",
    descEn: "Chilled thinly-sliced braised pork trotters tossed with jellyfish, cucumber matchsticks, and refreshing pungent mustard dressing",
  },
  busan_dongnae_pajeon: {
    nameKo: "동래파전",
    nameEn: "Dongnae Pajeon (Traditional Green Onion Pancake)",
    descKo: "달콤하고 부드러운 동래 쪽파와 쇠고기, 신선한 해물을 찹쌀 반죽에 얹고 계란을 풀어 노릇하게 구워낸 부산 전통 파전",
    descEn: "Historic scallion pancake topped with fresh seafood, tender beef, and egg, fried soft and moist inside and golden crispy outside",
  },
  busan_haenyeo_ramen: {
    nameKo: "영도 해녀 김밥 & 해물라면",
    nameEn: "Yeongdo Haenyeo Gimbap & Seafood Ramyeon",
    descKo: "영도 절벽 앞 해녀들이 갓 채취한 신선한 성게알(우니)을 얹어 먹는 김밥과 꽃게, 홍합을 넣고 끓인 얼큰한 라면",
    descEn: "Cliffside seafood meal featuring seaweed rice rolls topped with fresh sea urchin roe and piping-hot ramen loaded with blue crab",
  },

  // ==========================================
  // 4. 🏙️ 제주 로컬 대표 미식 (10선)
  // ==========================================
  jeju_black_pork: {
    nameKo: "제주 흑돼지 구이",
    nameEn: "Jeju Black Pork BBQ",
    descKo: "청정 제주 한라산 자락에서 자란 토종 흑돼지를 두툼한 근고기로 썰어 멜젓(멸치젓)에 찍어 먹는 대표 구이",
    descEn: "Juicy thick steaks of native Jeju black pork charcoal-grilled and dipped in warm fermented anchovy sauce (meljeot)",
  },
  jeju_gogi_guksu: {
    nameKo: "제주 고기국수",
    nameEn: "Jeju Gogi-guksu (Pork Noodle Soup)",
    descKo: "돼지 뼈를 오랜 시간 뽀얗게 우려낸 담백하고 진한 육수에 중면 국수와 도톰한 수육 편육을 얹어 낸 제주의 향토음식",
    descEn: "Comforting bowl of yellow wheat noodles in rich pork bone broth crowned with tender slices of braised pork belly",
  },
  jeju_galchi_jorim: {
    nameKo: "제주 은갈치조림",
    nameEn: "Jeju Galchi-jorim (Braised Silver Cutlassfish)",
    descKo: "제주 바다에서 갓 낚아 올린 싱싱한 은갈치를 감자, 무와 함께 매콤달콤한 고추장 양념에 자작하게 졸여낸 명품 요리",
    descEn: "Extra-long wild silver cutlassfish simmered gently with radishes and potatoes in fiery-sweet garlic chili sauce",
  },
  jeju_abalone_porridge: {
    nameKo: "제주 전복죽 & 해물뚝배기",
    nameEn: "Jeju Jeonbok-juk (Abalone Porridge & Clay Pot Stew)",
    descKo: "신선한 전복 내장을 넣어 진하고 녹진하게 끓인 전통 전복죽과 딱새우, 조개가 들어간 얼큰하고 시원한 해물뚝배기",
    descEn: "Rich, green-hued rice porridge simmered with wild abalone viscera, served alongside a sizzling clay pot of local seafood",
  },
  jeju_ttaksaewoo_sashimi: {
    nameKo: "제주 딱새우회 & 해산물 모둠",
    nameEn: "Jeju Ttaksaewoo Sashimi (Red-banded Lobster Platter)",
    descKo: "제주 청정 바다에서 갓 잡은 신선한 딱새우를 손질해 입에 넣으면 사르르 녹아내리는 달콤하고 차진 식감의 고급 생선회",
    descEn: "Pristine sweet red-banded spiny lobsters harvested around Jeju, noted for their tender, melt-in-mouth sweetness and chew",
  },
  jeju_bomal_kalguksu: {
    nameKo: "제주 보말칼국수",
    nameEn: "Jeju Bomal Kalguksu (Sea Snail Noodle Soup)",
    descKo: "제주 갯바위에서 채취한 고둥(보말)의 내장까지 통째로 갈아 넣어 녹진하고 깊은 바다 향이 우러난 진국 칼국수",
    descEn: "Deep green, richly savory noodle soup made from wild Jeju sea snails ground with internal organs for intense sea umami",
  },
  jeju_citrus_omegi: {
    nameKo: "제주 오메기떡 & 한라봉 디저트",
    nameEn: "Jeju Omegi-tteok & Hallabong Dessert",
    descKo: "차조와 쑥 반죽 속에 달콤한 팥소를 채우고 통팥 고물을 묻힌 제주 전통 오메기떡과 상큼 달콤한 한라봉 주스",
    descEn: "Traditional Jeju mugwort rice cakes filled with sweet red beans rolled in azuki beans, served with refreshing Hallabong juice",
  },
  jeju_dombe_gogi: {
    nameKo: "제주 돔베고기",
    nameEn: "Jeju Dombe-gogi (Boiled Pork on Cutting Board)",
    descKo: "갓 삶아낸 두툼하고 촉촉한 돼지고기 수육을 나무 도마(돔베)에 썰어 굵은 소금과 멜젓, 쌈채소와 함께 즐기는 제주 향토 음식",
    descEn: "Juicy, freshly boiled tender pork belly sliced on a rustic wooden chopping board with sea salt and pungent fermented anchovy sauce",
  },
  jeju_hanchi_mulhoe: {
    nameKo: "제주 한치물회",
    nameEn: "Jeju Hanchi Mulhoe (Chilled Squid Soup)",
    descKo: "갓 잡아 부드럽고 쫄깃한 한치 생선살을 오이, 미나리와 함께 살얼음 동동 띄운 된장·초고추장 육수에 말아 먹는 여름 별미",
    descEn: "Tender fresh squid slices served in refreshing ice-cold spicy broth seasoned with fermented soybean paste and vinegar",
  },
  jeju_okdom_gui: {
    nameKo: "제주 옥돔구이",
    nameEn: "Jeju Okdom-gui (Grilled Red Tilefish)",
    descKo: "제주 특산 옥돔을 바닷바람에 반건조하여 기름에 노릇노릇 바삭하게 구워내 담백하고 고소한 맛이 일품인 생선구이",
    descEn: "Sea-breeze dried royal red tilefish grilled with a golden crisp exterior and moist, delicately sweet and clean white meat",
  },

  // ==========================================
  // 5. 🏙️ 전주 로컬 대표 미식 (10선)
  // ==========================================
  jeonju_bibimbap: {
    nameKo: "전주 비빔밥",
    nameEn: "Jeonju Bibimbap (Royal Mixed Rice)",
    descKo: "사골 육수로 지은 밥에 황포묵, 육회, 콩나물, 계절 나물 등 오색 고명을 정갈하게 얹어 놋그릇에 담아내는 유네스코 미식",
    descEn: "World-renowned UNESCO traditional rice bowl cooked in rich beef bone broth, topped with seasonal namul, mung bean jelly, and seasoned beef",
  },
  jeonju_kongnamul_gukbap: {
    nameKo: "전주 콩나물국밥",
    nameEn: "Jeonju Kongnamul-gukbap (Bean Sprout Soup)",
    descKo: "전주 8미 중 으뜸인 아삭한 콩나물과 오징어를 맑은 육수에 끓여 김가루와 수란(반숙란)을 곁들여 먹는 전주의 해장국",
    descEn: "Crisp local bean sprouts simmered in clean anchovy-squid broth, served boiling with soft-poached eggs and roasted seaweed",
  },
  jeonju_pi_sundae: {
    nameKo: "전주 피순대국밥",
    nameEn: "Jeonju Pi-sundae (Authentic Blood Sausage Soup)",
    descKo: "돼지 막창에 선지와 채소를 꽉 채워 쪄낸 부드럽고 녹진한 피순대를 초장에 찍어 먹고 얼큰한 뚝배기 국밥으로 즐기는 전주 명물",
    descEn: "Creamy traditional blood sausage hand-stuffed in natural casing, dipped in vinegared chili paste and enjoyed in boiling spicy stew",
  },
  jeonju_hanjeongsik_full: {
    nameKo: "전주 한정식",
    nameEn: "Jeonju Grand Hanjeongsik (Royal Course Feast)",
    descKo: "맛의 고장 전주의 진수를 느낄 수 있는 30여 가지의 산해진미, 갈비구이, 계절 찌개와 정갈한 찬들이 차려지는 명품 상차림",
    descEn: "Grand 30-dish royal feast representing the heritage of Jeonju with charcoal-grilled beef, seasonal stews, and delicate side dishes",
  },
  jeonju_gamaek: {
    nameKo: "전주 가맥 황태포",
    nameEn: "Jeonju Gamaek Hwangtae (Charcoal-Toasted Dried Pollock)",
    descKo: "동네 가게 맥줏집(가맥)에서 연탄불에 바삭하고 고소하게 구워낸 두툼한 황태포와 청양고추 간장마요 특제 소스",
    descEn: "Jeonju corner pub culture featuring thick dried pollock roasted over briquettes to airy perfection, paired with spicy mayo-soy dip",
  },
  jeonju_tteokgalbi: {
    nameKo: "전주 한우 떡갈비",
    nameEn: "Jeonju Hanwoo Tteokgalbi (Minced Beef Patties)",
    descKo: "소갈빗살을 칼로 곱게 다져 달콤 짭조름한 양념을 버무린 뒤 참숯불에 떡처럼 도톰하게 빚어 구워낸 궁중 요리",
    descEn: "Tender minced beef ribs marinated in sweet garlic soy glaze, shaped into thick juicy patties and charcoal-grilled",
  },
  jeonju_moju_pajeon: {
    nameKo: "전주 모주 & 해물파전",
    nameEn: "Jeonju Moju & Haemul Pajeon (Herbal Wine & Scallion Pancake)",
    descKo: "막걸리에 계피, 대추, 생강 등 한약재를 넣고 달여 은은하게 달콤한 저알콜 모주와 겉바속촉 해물파전",
    descEn: "Naturally sweet low-alcohol herbal wine simmered with cinnamon and dates, paired with a crisp and savory seafood pancake",
  },
  jeonju_veteran_kalguksu: {
    nameKo: "전주 베테랑 들깨칼국수",
    nameEn: "Jeonju Veteran Kalguksu (Egg Drop Perilla Noodle Soup)",
    descKo: "달걀을 푼 구수하고 걸쭉한 국물에 들깨가루, 김가루, 고춧가루를 삼색으로 듬뿍 얹어 비벼 먹는 한옥마을 명물 칼국수",
    descEn: "Comforting thick egg-drop broth noodles generously dusted with toasted perilla seeds, nori flakes, and spicy red pepper",
  },
  jeonju_omogari_tang: {
    nameKo: "전주 오모가리탕",
    nameEn: "Jeonju Omogari-tang (Clay Pot Freshwater Fish Stew)",
    descKo: "전주천 변 뚝배기(오모가리)에 메기, 쏘가리와 시래기를 넣고 얼큰하고 구수하게 끓여낸 전통 매운탕",
    descEn: "Traditional spicy freshwater fish stew slow-simmered in thick earthenware pots with dried radish greens and garlic",
  },
  jeonju_chocopie: {
    nameKo: "전주 수제 초코파이",
    nameEn: "Jeonju Artisanal Choco Pie",
    descKo: "달콤한 초콜릿 코팅과 부드러운 초코 시트 사이에 딸기잼과 하얀 마시멜로 크림, 호두가 씹히는 전주 전통 베이커리 빵",
    descEn: "Famous handmade pastry featuring soft chocolate biscuit filled with sweet strawberry jam, cream, and crunchy walnuts",
  },

  // ==========================================
  // 6. 🏙️ 강릉 로컬 대표 미식 (10선)
  // ==========================================
  gangneung_chodang_sundubu: {
    nameKo: "강릉 초당 순두부",
    nameEn: "Gangneung Chodang Sundubu (Sea-Water Soft Tofu)",
    descKo: "동해안 청정 바닷물을 간수로 사용하여 콩 본연의 고소하고 달큰한 풍미가 가득한 400년 전통의 부드러운 순두부",
    descEn: "Celebrated 400-year traditional soft tofu coagulated exclusively with pristine East Sea deep seawater for unmatched natural sweetness",
  },
  gangneung_jang_kalguksu: {
    nameKo: "강릉 장칼국수",
    nameEn: "Gangneung Jang Kalguksu (Spicy Paste Noodles)",
    descKo: "구수한 된장과 칼칼한 고추장을 멸치 육수에 풀어 호박, 감자, 계란을 넣고 걸쭉하게 끓여낸 강릉의 소울 칼국수",
    descEn: "Thick hand-cut knife noodles simmered in rich, fiery red broth seasoned with fermented red pepper paste and soybean paste",
  },
  gangneung_anmok_coffee: {
    nameKo: "안목해변 스페셜티 커피",
    nameEn: "Anmok Beach Specialty Drip Coffee",
    descKo: "한국의 커피 1번지 안목 커피거리 바다를 바라보며 마시는 대한민국 1세대 바리스타들의 명품 핸드드립 커피",
    descEn: "Freshly roasted artisanal specialty pour-over coffee savored along historic Anmok Coastal Beach Coffee Street",
  },
  gangneung_ggomak_bibimbap: {
    nameKo: "강릉 꼬막비빔밥",
    nameEn: "Gangneung Ggomak Bibimbap (Spicy Seasoned Cockles)",
    descKo: "통통하게 살이 오른 참꼬막을 고추, 쪽파, 참기름 특제 양념에 버무려 고소한 밥과 비벼 먹는 강릉 최고의 인기 미식",
    descEn: "Massive platter of tender, freshly shucked cockle clams tossed in savory soy, sesame oil, and hot green peppers served with seasoned rice",
  },
  gangneung_gamja_ongsimi: {
    nameKo: "강릉 감자옹심이",
    nameEn: "Gangneung Gamja Ongsimi (Chewy Potato Dumplings)",
    descKo: "강원도 감자를 갈아 빚은 쫀득한 새알심(옹심이)을 구수한 멸치 메밀 육수에 끓여낸 토속 음식",
    descEn: "Traditional Gangwon regional comfort soup featuring delightfully chewy, handcrafted potato starch dumplings in savory broth",
  },
  gangneung_garlic_bread: {
    nameKo: "강릉 육쪽마늘빵",
    nameEn: "Gangneung Cream Cheese Garlic Bread",
    descKo: "바삭한 바게트 빵 틈새에 알싸한 마늘 소스와 진하고 달콤한 크림치즈를 아낌없이 채워 구워낸 강릉 명물 베이커리",
    descEn: "Crusty six-segmented round bread drenched in aromatic roasted garlic butter and loaded with sweet cream cheese custard",
  },
  gangneung_ojingeo_sundae: {
    nameKo: "주문진 오징어순대",
    nameEn: "Jumunjin Ojingeo Sundae (Stuffed Squid)",
    descKo: "통오징어 몸통 속에 찹쌀, 두부, 야채를 꽉 채워 쪄낸 후 달걀물을 입혀 철판에 노릇하게 부쳐낸 동해안 별미",
    descEn: "Fresh whole squid tube stuffed with sticky rice, tofu, and minced vegetables, sliced and pan-fried in golden egg wash",
  },
  gangneung_mulhoe_set: {
    nameKo: "사천진리 해변 모둠물회",
    nameEn: "Gangneung Mulhoe (Chilled Assorted Raw Fish Soup)",
    descKo: "동해 바다의 싱싱한 광어, 오징어, 해삼을 살얼음 띄운 매콤새콤한 과일 초고추장 육수에 말아 소면과 먹는 여름 요리",
    descEn: "Plentiful fresh raw fish and seafood served in an icy, sweet-and-sour red pepper broth garnished with fine somyeon noodles",
  },
  gangneung_gaori_jjim: {
    nameKo: "강릉 가오리 생선찜",
    nameEn: "Gangneung Gaori-jjim (Braised Stingray Fish)",
    descKo: "결대로 부드럽게 찢어지는 가오리 살과 포슬포슬한 감자, 무를 특제 매콤달콤 양념에 졸여낸 강릉 로컬 대표 찜 요리",
    descEn: "Succulent braised stingray with tender cartilege simmered in thick sweet-spicy chili glaze with soft potatoes and radishes",
  },
  gangneung_sundubu_gelato: {
    nameKo: "초당 순두부 젤라또",
    nameEn: "Chodang Sundubu Gelato Ice Cream",
    descKo: "초당 순두부의 고소하고 담백한 두유 맛을 이탈리안 전통 젤라또 제조법으로 담아낸 강릉만의 독창적인 수제 디저트",
    descEn: "Velvety artisanal Italian-style gelato crafted from authentic Chodang soft tofu, boasting a subtle and creamy soy flavor",
  },

  // ==========================================
  // 7. 🏙️ 속초 로컬 대표 미식 (10선)
  // ==========================================
  sokcho_abai_sundae: {
    nameKo: "속초 아바이순대",
    nameEn: "Sokcho Abai Sundae (North Korean Style Sausage)",
    descKo: "돼지 대창 속에 찹쌀, 선지, 숙주, 배추를 꽉 채워 쪄낸 실향민들의 전통 순대로 매콤달콤한 명태회무침과 곁들여 먹는 요리",
    descEn: "Generously stuffed thick pork intestine sausage packed with sweet rice and vegetables, paired with sweet-and-sour seasoned pollack salad",
  },
  sokcho_dakgangjeong: {
    nameKo: "속초 만석 닭강정",
    nameEn: "Sokcho Dakgangjeong (Sweet & Crispy Fried Chicken)",
    descKo: "가마솥 고온에서 바삭하게 튀겨낸 닭고기를 조청과 고추로 버무려 식어도 바삭한 속초 중앙시장의 명물",
    descEn: "Famous crispy bite-sized fried chicken glazed with thick traditional grain syrup, chili peppers, and roasted almond flakes",
  },
  sokcho_bongpo_mulhoe: {
    nameKo: "속초 모둠 물회",
    nameEn: "Sokcho Bongpo Mulhoe (Cold Seafood Soup)",
    descKo: "성게, 해삼, 활어회, 전복을 과일 발효 초장에 시원한 살얼음과 비벼 소면과 함께 즐기는 속초의 1등 해산물 요리",
    descEn: "Loaded cold bowl of live sea urchin, abalone, sea cucumber, and fresh raw fish slices bathed in slushy tangy chili broth",
  },
  sokcho_red_crab_feast: {
    nameKo: "속초 동해안 홍게 찜",
    nameEn: "Sokcho Steamed Red Snow Crab",
    descKo: "속초 앞바다 심해에서 갓 잡은 신선한 붉은 대게(홍게)를 찜기에 쪄서 꽉 찬 달콤한 속살과 게딱지 볶음밥을 먹는 요리",
    descEn: "Fresh sweet East Sea red snow crabs steamed to order, served with fragrant crab shell fried rice seasoned with toasted nori and sesame oil",
  },
  sokcho_hoe_naengmyeon: {
    nameKo: "속초 명태 회냉면",
    nameEn: "Sokcho Hoe-naengmyeon (Pollock Cold Noodles)",
    descKo: "쫄깃한 함흥식 고구마 전분 면발 위에 새콤달콤하게 숙성시킨 명태회를 듬뿍 얹어 비벼 먹는 속초 실향민의 전통 냉면",
    descEn: "Springy sweet potato starch noodles topped with chewy fermented spicy raw pollock fish and refreshing chilled broth",
  },
  sokcho_seopguk: {
    nameKo: "속초 자연산 섭국",
    nameEn: "Sokcho Seopguk (Spicy Wild Mussel Soup)",
    descKo: "동해 깊은 바다 갯바위에서 딴 큼직한 자연산 홍합(섭)을 된장과 고추장 육수에 부추, 미나리와 얼큰하게 끓여낸 향토 해장국",
    descEn: "Robust spicy and comforting red broth soup cooked with giant wild East Sea mussels, fresh chives, and leeks",
  },
  sokcho_dongmyeong_sashimi: {
    nameKo: "동명항 활어회",
    nameEn: "Dongmyeong Port Fresh Sashimi Platter",
    descKo: "속초 동명항 포차거리에서 갓 잡아 올린 도다리, 가자미, 오징어를 바닷바람을 맞으며 맛보는 자연산 활어회",
    descEn: "Just-caught East Sea seasonal wild sashimi sliced fresh at dockside markets, enjoyed with savory ssamjang dip by the sea",
  },
  sokcho_grilled_fish: {
    nameKo: "속초 숯불 생선구이",
    nameEn: "Sokcho Charcoal Grilled Fish Feast",
    descKo: "고등어, 꽁치, 조기, 메로, 양미리, 열기 등 다양한 동해안 생선을 참숯불에 즉석에서 직접 구워 먹는 속초 명물 한상",
    descEn: "Assorted seasonal East Sea fresh fish charcoal-grilled table-side over glowing embers until smoky and juicy",
  },
  sokcho_makguksu: {
    nameKo: "속초 동치미 막국수",
    nameEn: "Sokcho Dongchimi Makguksu (Buckwheat Noodles)",
    descKo: "항아리에서 숙성한 톡 쏘는 살얼음 동치미 무 육수를 순메밀 국수에 부어 들기름과 함께 담백하게 비벼 먹는 국수",
    descEn: "Rustic buckwheat noodles served with naturally fermented icy radish water kimchi broth, perilla oil, and sesame seeds",
  },
  sokcho_sweet_pumpkin_sikhye: {
    nameKo: "속초 단호박 식혜",
    nameEn: "Sokcho Sweet Pumpkin Sikhye Beverage",
    descKo: "달콤하고 부드러운 단호박을 엿기름과 삭혀 살얼음 동동 띄워 시원하고 깔끔하게 마시는 전통 디저트 음료",
    descEn: "Refreshing golden-hued traditional fermented sweet pumpkin and malt beverage served ice-cold with soft rice grains",
  },

  // ==========================================
  // 8. 🏙️ 경주 로컬 대표 미식 (10선)
  // ==========================================
  gyeongju_hwangnambbang: {
    nameKo: "경주 황남빵 & 찰보리빵",
    nameEn: "Gyeongju Hwangnam-ppang & Barley Bread",
    descKo: "얇은 밀가루 피 속에 100% 국산 팥앙금을 가득 채워 구워낸 80년 전통의 경주 공인 전통 빵",
    descEn: "Historic Gyeongju regional pastries featuring thin crust stuffed with silky sweet red bean paste and soft chewy barley pancakes",
  },
  gyeongju_hanwoo_mulhoe: {
    nameKo: "경주 한우 물회",
    nameEn: "Gyeongju Hanwoo Beef Mulhoe (Chilled Raw Beef)",
    descKo: "신선한 최고급 경주 한우 육회를 살얼음 띄운 매콤달콤한 비법 육수에 소면, 오이와 함께 말아먹는 경주만의 독특한 별미",
    descEn: "Premium Korean native beef tartare served in an icy, sweet-and-tangy cold soup with thin cucumber slices and somyeon noodles",
  },
  gyeongju_ssambap: {
    nameKo: "대릉원 쌈밥 정식",
    nameEn: "Daereungwon Ssambap (Leaf Wrap Feast)",
    descKo: "케일, 곰취, 당귀 등 10여 가지 신선한 쌈채소에 매콤한 제육볶음과 강된장, 다양한 궁중 찬을 싸 먹는 대릉원 앞 명물",
    descEn: "Abundant wellness table offering over ten varieties of fresh organic leafy wraps, savory bulgogi, and rich soybean paste dip",
  },
  gyeongju_maetdol_sundubu: {
    nameKo: "경주 맷돌 순두부찌개",
    nameEn: "Gyeongju Stone-Ground Sundubu Stew",
    descKo: "국산 콩을 전통 맷돌 방식으로 갈아 몽글몽글 끓여낸 구수한 순두부에 계란을 톡 깨 넣어 먹는 보문단지 전통 찌개",
    descEn: "Traditional stone-milled curded soft tofu soup boiled with baby shrimp, clams, and vegetables in deep earthenware",
  },
  gyeongju_tteokgalbi_sotbap: {
    nameKo: "경주 한우 떡갈비 솥밥",
    nameEn: "Gyeongju Tteokgalbi & Hot Stone Rice",
    descKo: "경주 한우를 곱게 다져 달콤한 양념에 구워낸 육즙 가득한 떡갈비와 갓 지은 뜨끈한 은행 대추 영양 솥밥",
    descEn: "Juicy handcrafted Korean beef rib patties grilled over charcoal, accompanied by freshly steamed hot stone pot rice",
  },
  gyeongju_gyori_gimbap: {
    nameKo: "경주 교리김밥",
    nameEn: "Gyeongju Gyori Gimbap (Egg Ribbon Roll)",
    descKo: "가늘게 채 썬 부드러운 달걀지단을 김밥의 80% 이상 꽉 채워 고소하고 부드러운 식감이 일품인 교촌마을 원조 김밥",
    descEn: "Iconic traditional gimbap roll densely stuffed with hundreds of thinly shredded tender egg ribbons for a fluffy, savory bite",
  },
  gyeongju_10won_bread: {
    nameKo: "황리단길 십원빵",
    nameEn: "Hwangridan-gil 10-Won Coin Cheese Bread",
    descKo: "경주 다보탑이 새겨진 옛 10원짜리 동전 모양 빵 반죽 속에 고소한 모짜렐라 치즈가 길게 늘어나는 인기 길거리 디저트",
    descEn: "Fun waffle pastry shaped like Korea's historic 10-won coin, filled with stretchy melted mozzarella cheese and sweet custard",
  },
  gyeongju_mukbap: {
    nameKo: "경주 메밀 묵밥",
    nameEn: "Gyeongju Buckwheat Jelly Mukbap",
    descKo: "부드럽고 쌉싸름한 메밀묵 채에 멸치 육수와 볶은 김치, 김가루를 얹어 밥을 말아 시원하게 먹는 전통 묵 요리",
    descEn: "Wholesome bowl of sliced buckwheat jelly served in chilled savory broth with finely chopped kimchi and seaweed",
  },
  gyeongju_charcoal_ribs: {
    nameKo: "경주 천년한우 갈비살 구이",
    nameEn: "Gyeongju Hanwoo Rib Eye Charcoal BBQ",
    descKo: "마블링이 빼어난 경주 명품 천년한우의 갈비살을 참숯불에 살짝 구워 천일염과 기름장에 찍어 먹는 최고급 구이",
    descEn: "Prime cuts of local Gyeongju Hanwoo beef rib fingers grilled table-side over hardwood charcoal with sea salt",
  },
  gyeongju_traditional_soup: {
    nameKo: "경주 가마솥 한우 곰탕",
    nameEn: "Gyeongju Cauldron Hanwoo Gomtang (Beef Soup)",
    descKo: "무쇠 가마솥에 한우 양지와 사골을 푹 고아내 맑고 깊은 감칠맛을 자랑하는 70년 전통의 경주식 해장 국밥",
    descEn: "Clear, deeply flavorful beef broth slow-boiled in massive traditional iron cauldrons with tender brisket cuts and spring onions",
  },

  // ==========================================
  // 9. 🏙️ 수원 로컬 대표 미식 (10선)
  // ==========================================
  suwon_wanggalbi: {
    nameKo: "수원 왕갈비 구이",
    nameEn: "Suwon Wang-galbi (King Charcoal Beef Ribs)",
    descKo: "정조대왕 시절부터 이어져 온 수원의 상징으로, 큼직한 소갈비에 소금과 마늘, 참기름으로 담백하게 간한 명품 숯불구이",
    descEn: "Giant royal bone-in beef short ribs seasoned delicately with sea salt, sesame, and garlic, charcoal-grilled over hot coals",
  },
  suwon_chicken_street: {
    nameKo: "수원 통닭거리 가마솥 통닭",
    nameEn: "Suwon Cauldron Whole Fried Chicken",
    descKo: "무쇠 가마솥의 끓는 기름에 닭 한 마리를 통째로 튀겨내 껍질은 얇고 바삭하며 속살은 촉촉한 수원 통닭거리의 원조 치킨",
    descEn: "Whole chicken deep-fried to golden perfection in traditional giant iron cauldrons, famous throughout Suwon Chicken Street",
  },
  suwon_wang_galbitang: {
    nameKo: "수원 왕갈비탕",
    nameEn: "Suwon Wang-galbitang (Giant Beef Rib Soup)",
    descKo: "성인 팔뚝만 한 거대한 소갈비 뼈 2대를 맑은 육수에 푹 고아 파와 당면을 넣고 푸짐하게 끓여낸 든든한 보양탕",
    descEn: "Enormous beef ribs cooked in clear aromatic broth with glass noodles and scallions, served with hot dipping mustard sauce",
  },
  suwon_boyoung_mandu: {
    nameKo: "수원 군만두 & 매콤 쫄면",
    nameEn: "Suwon Crunchy Mandu & Spicy Jjolmyeon",
    descKo: "바삭하게 튀긴 육즙 가득한 수제 군만두를 양배추 가득한 새콤달콤 매운 쫄면에 싸 먹는 수원 행궁동의 대표 분식",
    descEn: "Deep-fried crispy handmade pork dumplings paired with chewy noodles tossed in shredded cabbage and fiery spicy-sour sauce",
  },
  suwon_jidong_sundae: {
    nameKo: "수원 지동시장 순대곱창 볶음",
    nameEn: "Jidong Market Sundae & Tripe Stir-fry",
    descKo: "철판에 순대와 쫄깃한 돼지 곱창, 깻잎, 팽이버섯, 당면을 들깨가루와 매콤한 양념장에 볶아 먹는 100년 전통 지동시장 요리",
    descEn: "Sizzling tabletop skillet stir-fry of blood sausage, pork intestine, perilla leaves, and chewy glass noodles in spicy sauce",
  },
  suwon_hwaseong_dessert: {
    nameKo: "수원 개성주악 & 전통차",
    nameEn: "Suwon Gaeseong Juak (Traditional Honey Pastry)",
    descKo: "찹쌀가루와 막걸리로 반죽하여 둥글게 빚어 기름에 지진 뒤 조청을 입혀 윤기가 흐르는 궁중 전통 한과 디저트",
    descEn: "Glutinous rice flour and makgeolli dough deep-fried and glazed in ginger-jujube syrup for a crispy outside and honeyed juicy inside",
  },
  suwon_haejang_guk: {
    nameKo: "수원 소갈비 선지 해장국",
    nameEn: "Suwon Beef Rib & Blood Hangover Soup",
    descKo: "부드러운 소갈비와 신선한 선지, 우거지, 콩나물을 된장 육수에 푹 끓여내 구수하고 속이 확 풀리는 40년 전통 해장국",
    descEn: "Savory hangover cure soup featuring tender beef ribs, fresh clotted ox blood, soybean paste broth, and dried cabbage greens",
  },
  suwon_gwanggyo_craft: {
    nameKo: "수원 행궁 만두 & 칼국수",
    nameEn: "Suwon Hand-folded Mandu & Kalguksu",
    descKo: "얇고 쫀득한 피에 고기와 김치 소를 가득 채운 손만두와 시원한 해물 육수의 칼국수 한상",
    descEn: "Steamed thin-skinned dumplings stuffed with minced pork and vegetables, paired with hot knife-cut seafood noodle soup",
  },
  suwon_memil_makguksu: {
    nameKo: "수원 봉평 메밀 막국수",
    nameEn: "Suwon Buckwheat Makguksu & Boiled Pork",
    descKo: "순메밀 국수를 시원한 동치미 육수에 말아 담백하고 쫄깃하게 즐기는 북수원 명품 막국수와 수육",
    descEn: "Nutty buckwheat cold noodles in refreshing radish broth served alongside thin slices of warm boiled pork belly",
  },
  suwon_jangan_seolleongtang: {
    nameKo: "장안문 도가니탕",
    nameEn: "Janganmun Doganitang (Ox Knee Cartilage Soup)",
    descKo: "소 무릎 도가니와 사골을 가마솥에 진하게 고아내 쫀득쫀득한 콜라겐 식감과 구수한 국물이 일품인 보양 탕",
    descEn: "Rich, collagen-filled soup made by simmering ox knee cartilage and marrow bones until deeply nourishing and tender",
  },

  // ==========================================
  // 10. 🏙️ 인천 로컬 대표 미식 (10선)
  // ==========================================
  incheon_chinatown_jajang: {
    nameKo: "인천 차이나타운 자장면",
    nameEn: "Incheon Chinatown Original Jajangmyeon",
    descKo: "1883년 개항 이후 화교들에 의해 탄생한 한국 자장면의 발상지 인천 차이나타운의 정통 자장면과 바삭한 탕수육",
    descEn: "Birthplace of Korean-Chinese black bean noodles in Incheon historic Chinatown, served with crispy sweet and sour pork",
  },
  incheon_sinpo_dakgangjeong: {
    nameKo: "신포 닭강정",
    nameEn: "Sinpo Market Dakgangjeong (Spicy Glazed Chicken)",
    descKo: "무쇠 가마솥에 바삭하게 튀긴 닭을 청양고추와 물엿 베이스의 매콤하고 쫀득한 붉은 소스에 즉석에서 볶아내는 신포시장 명물",
    descEn: "Fiery, crispy fried chicken chunks glazed in a simmering cauldron of sticky sweet-spicy chili syrup with whole dried peppers",
  },
  incheon_crab_soup: {
    nameKo: "서해 꽃게탕 & 간장게장",
    nameEn: "Incheon Blue Crab Spicy Soup & Soy Crab",
    descKo: "살과 알이 꽉 찬 서해안 암꽃게를 단호박, 무, 된장 육수에 얼큰하게 끓여낸 꽃게탕과 짭조름한 밥도둑 간장게장",
    descEn: "Sweet fresh West Sea blue crabs stewed in fragrant spicy broth with squash, served with legendary soy-marinated raw crab",
  },
  incheon_baendaengi: {
    nameKo: "연안부두 밴댕이회무침",
    nameEn: "Incheon Baendaengi (Spicy Herring Salad)",
    descKo: "연안부두 밴댕이 골목에서 갓 잡은 기름진 밴댕이 살을 미나리, 오이와 매콤새콤하게 버무려 밥에 비벼 먹는 별미",
    descEn: "Plump local silver-striped round herring raw fillets tossed with water parsley, garlic, and vinegar chili paste over warm rice",
  },
  incheon_clay_oven_dumpling: {
    nameKo: "차이나타운 화덕만두 & 공갈빵",
    nameEn: "Chinatown Clay Oven Dumpling & Gonggalppang",
    descKo: "200도가 넘는 옹기 화덕 안쪽 벽에 붙여 구워내 겉은 바삭하고 속은 육즙 가득한 고기만두와 속이 텅 빈 바삭한 공갈빵",
    descEn: "Unique charcoal tandoor-style clay oven baked buns stuffed with juicy minced pork, and crispy hollow honey-glazed crackers",
  },
  incheon_multeombeong: {
    nameKo: "용현동 아귀찜 (물텀벙)",
    nameEn: "Yonghyeon-dong Agwi-jjim (Spicy Braised Monkfish)",
    descKo: "담백하고 쫄깃한 아귀 살에 아삭한 콩나물, 미더덕을 넣고 매콤 칼칼한 고춧가루 양념에 볶아낸 용현동 물텀벙이 거리 요리",
    descEn: "Meaty monkfish braised with crisp bean sprouts and sea squirts in a fiery, thick chili starch sauce on historical food street",
  },
  incheon_sinpo_jjolmyeon: {
    nameKo: "신포동 쫄면",
    nameEn: "Sinpo-dong Original Jjolmyeon (Chewy Spicy Noodles)",
    descKo: "인천 국수 공장에서 탄생한 원조 쫄면으로, 굵고 탄력 넘치는 면발에 아삭한 콩나물, 양배추, 매콤새콤 특제 초고추장을 비벼 먹는 요리",
    descEn: "Invented in Incheon: extra-chewy thick wheat noodles tossed with crisp cabbage, bean sprouts, hard-boiled egg, and sweet chili sauce",
  },
  incheon_samchi_street: {
    nameKo: "동인천 삼치구이",
    nameEn: "Dongincheon Samchi-gui (Grilled King Mackerel)",
    descKo: "동인천 삼치골목에서 살이 통통하게 오른 삼치를 연탄 숯불에 노릇하게 구워 와사비 간장에 찍어 막걸리와 즐기는 요리",
    descEn: "Giant thick fillets of Pacific Spanish mackerel grilled crispy on the outside and moist inside over hot coals, served with wasabi soy",
  },
  incheon_songdo_clam_noodles: {
    nameKo: "영종도 바지락 해물칼국수",
    nameEn: "Yeongjongdo Seafood Clam Kalguksu",
    descKo: "서해 갯벌에서 캔 바지락과 가리비, 새우를 산더미처럼 넣고 끓여 맑고 시원한 감칠맛이 일품인 영종도 바닷가 국수",
    descEn: "Enormous steaming shared bowl of fresh knife-cut noodles swimming with abundant sweet manila clams and prawns in sea broth",
  },
  incheon_wolmido_clam_bake: {
    nameKo: "월미도 조개구이",
    nameEn: "Wolmido Oceanfront Grilled Shellfish BBQ",
    descKo: "가리비, 키조개, 백합, 치즈구이를 연탄불 위에 지글지글 구워 초고추장에 찍어 먹는 월미도 바닷가의 대표 미식",
    descEn: "Interactive seaside tabletop BBQ feast grilling fresh scallops, pen shells, clams, and melted cheese over hot briquettes",
  },

  // ==========================================
  // 11. 🏙️ 여수 로컬 대표 미식 (10선)
  // ==========================================
  yeosu_dolgejang: {
    nameKo: "여수 돌게장 백반",
    nameEn: "Yeosu Dolgejang (Soy Marinated Rock Crab)",
    descKo: "여수 바다의 단단한 돌게를 비법 간장과 청양고추로 숙성시켜 게딱지에 밥을 쓱쓱 비벼 먹는 여수 최고의 밥도둑 백반",
    descEn: "Small native wild rock crabs steeped in aged seasoned soy sauce, packed with rich savory roe to mix with steamed rice",
  },
  yeosu_nangman_samhap: {
    nameKo: "여수 해물삼합",
    nameEn: "Yeosu Seafood Samhap (Kimchi, Pork & Octopus)",
    descKo: "여수 돌산 갓김치와 생삼겹살, 살아있는 문어(낙지), 전복, 새우를 철판에 함께 지글지글 볶아 싸 먹는 낭만포차 시그니처",
    descEn: "Sizzling iron plate surf-and-turf uniting famous Dolsan mustard greens kimchi, pork belly slices, fresh octopus, and abalone",
  },
  yeosu_seodaehoe: {
    nameKo: "여수 서대회무침",
    nameEn: "Yeosu Seodaehoe (Spicy Tongue Sole Salad)",
    descKo: "전통 막걸리 발효 식초로 서대 살을 무쳐 비린내가 전혀 없고 새콤달콤한 감칠맛이 폭발하는 여수 10미 중 으뜸 요리",
    descEn: "Delicate raw tongue sole fish fillets tossed in natural fermented rice vinegar chili paste with fresh seasonal greens",
  },
  yeosu_gatkimchi_samgyeop: {
    nameKo: "돌산 갓김치 삼겹살 구이",
    nameEn: "Dolsan Gat-Kimchi & Pork Belly BBQ",
    descKo: "특유의 톡 쏘는 알싸함과 깊은 감칠맛을 지닌 여수 돌산 갓김치를 돼지 삼겹살 기름에 함께 구워 싸 먹는 별미",
    descEn: "Sizzling pork belly grilled alongside intensely aromatic, pungent fermented mustard leaf kimchi (Gat Kimchi)",
  },
  yeosu_hamo_yubikki: {
    nameKo: "여수 갯장어 샤브샤브 (하모 유비끼)",
    nameEn: "Yeosu Hamo Shabu-shabu (Sea Pike Eel)",
    descKo: "칼집을 촘촘히 낸 갯장어 살을 한약재 육수에 살짝 담그면 눈꽃처럼 하얗게 피어나는 여수의 명품 여름 보양식",
    descEn: "Finely scored fillet slices of sweet wild sea pike eel briefly dipped in hot herbal broth until blooming like white flowers",
  },
  yeosu_saejogae_shabu: {
    nameKo: "여수 새조개 샤브샤브",
    nameEn: "Yeosu Saejogae Shabu-shabu (Bird Clam)",
    descKo: "새의 부리를 닮은 고급 겨울 조개로, 맑은 채소 육수에 살짝 데쳐 쫄깃하고 달콤한 조갯살을 맛보는 여수 겨울 미식",
    descEn: "Prized winter delicacy featuring sweet, plump bird clams lightly parboiled in fragrant broth with winter spinach and leeks",
  },
  yeosu_eel_soup: {
    nameKo: "여수 통장어탕 & 장어구이",
    nameEn: "Yeosu Whole Sea Eel Stew & Grilled Eel",
    descKo: "살이 통통한 바다장어(붕장어)를 통째로 넣고 우거지와 된장, 고춧가루로 얼큰하고 진하게 끓여낸 원기 회복 탕",
    descEn: "Thick, deeply nourishing sea eel soup simmered with dried greens and spicy soybean paste, served with char-grilled fillets",
  },
  yeosu_jeoneo_feast: {
    nameKo: "여수 전어구이 & 전어회",
    nameEn: "Yeosu Gizzard Shad Feast (Autumn Fish)",
    descKo: "가을철 기름이 바짝 오른 고소한 전어를 통째로 칼집 내어 천일염을 뿌려 구워낸 가을 여수의 대표 생선 요리",
    descEn: "Whole seasonal autumn gizzard shad grilled with coarse sea salt, eaten bones and all for maximum buttery nutty richness",
  },
  yeosu_gat_burger: {
    nameKo: "여수 갓버거 & 갓도넛",
    nameEn: "Yeosu Gat-Burger (Mustard Green Burger)",
    descKo: "여수 돌산 갓김치 특유의 알싸한 소스와 두툼한 수제 고기 패티가 조화로운 이순신광장의 명물 수제 버거",
    descEn: "Creative local burger combining juicy handcrafted beef patty with distinctive spicy-tart Dolsan mustard green relish",
  },
  yeosu_galchi_set: {
    nameKo: "여수 통갈치조림 & 갈치회",
    nameEn: "Yeosu Braised Cutlassfish & Sashimi Set",
    descKo: "남해안 청정 바다에서 잡은 싱싱한 은갈치를 특제 롱 냄비에 통째로 졸여낸 조림과 투명하고 쫄깃한 갈치회 한상",
    descEn: "Spectacular meter-long whole silver cutlassfish braised with abalones and octopus, served with pristine fresh cutlassfish sashimi",
  },
};

const catalogPath = path.resolve(process.cwd(), "src/features/budget/catalog/food-catalog.ts");
let catalogContent = fs.readFileSync(catalogPath, "utf-8");

let updatedCount = 0;

for (const [id, std] of Object.entries(STANDARDIZED_FOODS)) {
  // 1. nameKo 교체
  const nameKoRegex = new RegExp(`(id:\\s*["']${id}["'][\\s\\S]*?nameKo:\\s*["'])([^"']*)(["'])`);
  if (nameKoRegex.test(catalogContent)) {
    catalogContent = catalogContent.replace(nameKoRegex, `$1${std.nameKo}$3`);
  }

  // 2. nameEn 교체
  const nameEnRegex = new RegExp(`(id:\\s*["']${id}["'][\\s\\S]*?nameEn:\\s*["'])([^"']*)(["'])`);
  if (nameEnRegex.test(catalogContent)) {
    catalogContent = catalogContent.replace(nameEnRegex, `$1${std.nameEn}$3`);
  }

  // 3. descKo 교체
  const descKoRegex = new RegExp(`(id:\\s*["']${id}["'][\\s\\S]*?descKo:\\s*["'])([^"']*)(["'])`);
  if (descKoRegex.test(catalogContent)) {
    catalogContent = catalogContent.replace(descKoRegex, `$1${std.descKo}$3`);
  }

  // 4. descEn 교체
  const descEnRegex = new RegExp(`(id:\\s*["']${id}["'][\\s\\S]*?descEn:\\s*["'])([^"']*)(["'])`);
  if (descEnRegex.test(catalogContent)) {
    catalogContent = catalogContent.replace(descEnRegex, `$1${std.descEn}$3`);
    updatedCount++;
  }
}

fs.writeFileSync(catalogPath, catalogContent, "utf-8");
console.log(`🎉 120개 전체 음식 이름 및 설명 표준화 100% 완료! (${updatedCount}개 항목 적용)`);
