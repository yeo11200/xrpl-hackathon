const express = require("express");
const router = express.Router();
const paymentService = require("../services/paymentService");
const accountService = require("../services/accountService");
const cryptoPriceService = require("../services/cryptoPriceService");
const shopService = require("../services/shopService"); // 추가
const logger = require("../utils/logger");

// 예시 상품 데이터 (실제로는 데이터베이스에서 관리)
// 상품 객체 구조:
// - id: 상품 고유 식별자 (number)
// - name: 상품명 (string)
// - description: 상품 설명 (string)
// - price: 상품 가격 - KRW 단위 (number)
// - image: 상품 이미지 URL (string)
// - category: 상품 카테고리 (string: "NFT", "Apparel", "Accessories")
// - stock: 재고 수량 (number)
// - createdAt: 상품 생성일시 (ISO string)
const products = [
  {
    id: 1,
    name: "iPhone 17 Pro",
    description: [
      "6.3인치 Super Retina XDR 디스플레이",
      "A19 Pro 칩셋",
      "트리플 카메라 시스템",
      "티타늄 소재 디자인",
    ],
    price: 0.447, // KRW
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-model-unselect-gallery-2-202509?wid=5120&hei=2880&fmt=webp&qlt=90&.v=dU9qRExIQUlQTzVKeDd1V1dtUE1MUWFRQXQ2R0JQTk5udUZxTkR3ZVlpTEVqWElVVkRpc1V5YU5kb3VzUVZndzBoUVhuTWlrY2hIK090ZGZZbk9HeEJWb1BiTjRORlc1Y1lKU3JWempySktQVFcxaWdDV1ZRTjhLQ2h5TEk5bUxmbW94YnYxc1YvNXZ4emJGL0IxNFp3&traceId=1",
    category: "iPhone",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "iPhone 17",
    description: [
      "6.1인치 Super Retina XDR 디스플레이",
      "A19 칩셋",
      "듀얼 카메라 시스템",
      "경량 알루미늄 프레임",
    ],
    price: 0.322, // KRW,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-finish-select-202509-6-3inch?wid=5120&hei=2880&fmt=webp&qlt=90&.v=NUNzdzNKR0FJbmhKWm5YamRHb05tUzkyK3hWak1ybHhtWDkwUXVINFc0SGxMd2pTV2lzd1JWWVByckE3ZkZ2T2d2S3NaRzcrU0dmYjNHTUFiMnlsWFUxSlgrVWMrMzU1OXo2c2JyNjJZTGlVWUdBNW8yNGVMT200dXdIeFVYVFU&traceId=1",
    category: "iPhone",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "iPhone 17 Pro Max",
    description: [
      "6.9인치 Super Retina XDR 디스플레이",
      "A19 Pro 칩셋",
      "최대 5배 망원 줌 카메라",
      "대용량 배터리",
    ],
    price: 0.497, // KRW,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-finish-select-202509-6-9inch?wid=5120&hei=2880&fmt=webp&qlt=90&.v=NUNzdzNKR0FJbmhKWm5YamRHb05tUzkyK3hWak1ybHhtWDkwUXVINFc0RU9WT2libVhHSFU1bzRZekIyYTl6VWd2S3NaRzcrU0dmYjNHTUFiMnlsWFUxSlgrVWMrMzU1OXo2c2JyNjJZTGlnU1lRd2Fub0FrT1h0QkhlNEh1OFY&traceId=1",
    category: "iPhone",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "iPhone Air",
    description: [
      "초경량 디자인",
      "6.1인치 OLED 디스플레이",
      "A18 칩셋",
      "얇은 베젤 디자인",
    ],
    price: 0.397,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-air-finish-unselect-gallery-1-202509?wid=5120&hei=2880&fmt=webp&qlt=90&.v=NUpaQVl1bitSNmJWZUdKdi9QZHhsR3J2UHBBV3orM3VMYVQ4cFJXZmQxV3pMQytuUEM4Wm5vMWRha0N0RzdPQ3F2TWlpSzUzejRCZGt2SjJUNGl1VEE4bm1RcmlWRWp2eDN1WHNkSjNmUllkbVpNWnluMHFQejlPZEhiemdDMFA&traceId=1",
    category: "iPhone",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: "iPhone 16",
    description: [
      "6.1인치 OLED 디스플레이",
      "A18 칩셋",
      "듀얼 카메라",
      "가성비 좋은 모델",
    ],
    price: 0.287,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch?wid=5120&hei=2880&fmt=webp&qlt=90&.v=UXp1U3VDY3IyR1hNdHZwdFdOLzg1V0tFK1lhSCtYSGRqMUdhR284NTN4K2k2SkpnN3c0VXdqTFlOQWw0ako4Z0JQYkhSV3V1dC9oa0s5K3lqMGtUaFlJd01NRTBFU2ZiV2d6YkZCU2Z3bUt4ZUNtWkFZZEcvcU12TFRUUVhVdDU&traceId=1",
    category: "iPhone",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    name: "iPhone 16 plus",
    description: [
      "6.7인치 OLED 디스플레이",
      "A18 칩셋",
      "대화면 몰입감",
      "긴 배터리 수명",
    ],
    price: 0.322,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-finish-select-202409-6-7inch?wid=5120&hei=2880&fmt=webp&qlt=90&.v=UXp1U3VDY3IyR1hNdHZwdFdOLzg1V0tFK1lhSCtYSGRqMUdhR284NTN4OXFUUjFQRi8xeS9GaE1NRXBGeExZWUJQYkhSV3V1dC9oa0s5K3lqMGtUaFlJd01NRTBFU2ZiV2d6YkZCU2Z3bUwyTFI1VUdhb1kvV3ZwZnBMciswYVA&traceId=1",
    category: "iPhone",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 7,
    name: "iPhone 16e",
    description: [
      "6.1인치 OLED 디스플레이",
      "A17 칩셋",
      "가성비 중심 모델",
      "다양한 색상 제공",
    ],
    price: 0.247,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16e-finish-unselect-gallery-1-202502?wid=5120&hei=2880&fmt=webp&qlt=90&.v=bGxrMXRYSllVRTZGbi82ZklwWis2MnJ2UHBBV3orM3VMYVQ4cFJXZmQxVy9IbW1seHEzWFVmQzNncWxCTDlmWXF2TWlpSzUzejRCZGt2SjJUNGl1VEE4bm1RcmlWRWp2eDN1WHNkSjNmUmFUckxxVUVhL2tKOUVJckdsem5seUU&traceId=1",
    category: "iPhone",
    stock: 1,
    createdAt: new Date().toISOString(),
  },

  // === 여기서부터 8 ~ 32번 ===

  {
    id: 8,
    name: "MacBook Air 13",
    description: [
      "13인치 Retina 디스플레이",
      "Apple M3 칩셋",
      "얇고 가벼운 디자인",
      "최대 18시간 배터리",
    ],
    price: 0.397,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/macbook-air-13-digitalmat-gallery-1-202503?wid=728&hei=666&fmt=png-alpha&.v=RWZDcE1Pa2MvREpxR2hwendCZFpRa2EvQmI5ZjZseVhPSEJZVkYxZ09JdFpUdXE4MkhYYjRLTVptRHE3NGNZdHhaVXN2UmVLZWxyY01GTDZmcDYxbitZbnd2dEloRUI0QkxmQVJESllzWlN5ekw2b3VPdnZLWU14ZXc2aDkvRXI",
    category: "Mac",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 9,
    name: "MacBook Air 15",
    description: [
      "15인치 Retina 디스플레이",
      "Apple M3 칩셋",
      "슬림한 대화면 노트북",
      "최대 18시간 배터리",
    ],
    price: 0.472,
    image: "",
    category: "Mac",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 10,
    name: "MacBook Pro 14",
    description: [
      "14인치 Liquid Retina XDR 디스플레이",
      "Apple M3 Pro 칩셋",
      "고성능 그래픽 처리",
      "프로급 스피커 시스템",
    ],
    price: 0.597,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mbp-14-digitalmat-gallery-1-202410?wid=728&hei=666&fmt=png-alpha&.v=dmVFbEEyUXJ6Q0hEd1FjMFY3bE5FczNWK01TMHBhR0pZcm42OHQ2ODBjVVZYRUFzTnU5dXpMeUpXTHdIdkp5VDRob044alBIMUhjRGJwTW1yRE1oUG9oQ20zUjdkYWFQM0VDcG9EZ0J2dDMrNmVjbmk5c1V4VVk2VEt3TGcxekg",
    category: "Mac",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 11,
    name: "MacBook Pro 16",
    description: [
      "16인치 Liquid Retina XDR 디스플레이",
      "Apple M3 Max 칩셋",
      "최고 수준의 성능",
      "대화면 프로 노트북",
    ],
    price: 0.922,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mbp-16-digitalmat-gallery-1-202410?wid=728&hei=666&fmt=jpeg&qlt=90&.v=MEZVZW13NFE5V2Zqa2RkTS8yRndVTTNWK01TMHBhR0pZcm42OHQ2ODBjVVZYRUFzTnU5dXpMeUpXTHdIdkp5VE1lSHdvOTh6OTZzV3lxaDVoZmhFbGVaZU1aODlOQjRhUGhEVUlmOWhBNE9jMjlVY0l1R3ArenAzSUxNRFZhcXY",
    category: "Mac",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 12,
    name: "iMac",
    description: [
      "24인치 4.5K Retina 디스플레이",
      "Apple M3 칩셋",
      "슬림한 올인원 디자인",
      "다양한 색상 옵션",
    ],
    price: 0.497,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/imac-digitalmat-gallery-1-202410?wid=728&hei=666&fmt=png-alpha&.v=OURsbmhReXErU1E1S050OGsrUXJyUlZPdGZ2Y3FoT3BUVkM4Z3kzUVduWVRDMFgyWE5CaGc1dHIrSkVKb1NNV1M0TjRWdzF2UjRGVEY0c3dBQVZ6VFVqQWdNY05TRWdPUkxEb0txeGVrSms",
    category: "Mac",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 13,
    name: "Mac mini",
    description: [
      "컴팩트 데스크톱 디자인",
      "Apple M3 칩셋",
      "다양한 포트 구성",
      "합리적인 가격",
    ],
    price: 0.222,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mac-mini-digitalmat-gallery-1-202410?wid=728&hei=666&fmt=png-alpha&.v=d0pHanlhcjRCaXUzUWJNdzlDWFl6cU41dXh2MUpWOGFNK2V6eVg1VGV3L0xyVWdwdXczZ2hTbmhFYVc4TEtFUTJSWWg0TDRLSXM4czBZQjZvUHdsVEZNdkRTZUYyWlBxSW9LWmVtWmhFbGFYbXhZZFVXMlNNVTB5d3V2cTB1K3k",
    category: "Mac",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 14,
    name: "Mac Studio",
    description: [
      "초고성능 데스크톱",
      "Apple M3 Ultra 칩셋",
      "다양한 포트 구성",
      "전문가용 성능",
    ],
    price: 0.822,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mac-studio-digitalmat-gallery-1-202503?wid=728&hei=666&fmt=png-alpha&.v=QzEyV0dJWlhXQnhCQVZWR1lsdnBRRzYrc3EwZ1VoVGgyY0J1bS9COCtuaDFicUdTcmc0Qlg4aGNhblJZMmF6dGt6cS95dmlBOWw0UXFnT0NPVW5rUi9OL2FuQWl2RDY3cCtVcEh2Vmh1cmYrQ2NKb0hINDBwYnNoTU1MSWFmTGU",
    category: "Mac",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 15,
    name: "Studio Display",
    description: [
      "27인치 5K Retina 디스플레이",
      "True Tone 기술",
      "600니트 밝기",
      "프로급 색재현율",
    ],
    price: 0.522,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/studio-display-digitalmat-gallery-1-202203?wid=728&hei=666&fmt=png-alpha&.v=eHlKZk4xMFRaTnVqRExtOHhhVk5YVWEvQmI5ZjZseVhPSEJZVkYxZ09Jc0d5Zms5NUIvNWFKZjRmM2RZQ1Z6SHhaVXN2UmVLZWxyY01GTDZmcDYxbnlxU2Z4VUtObzJUamx6d3hTcm5UNHBGUjVtSmRkZFlCOTN4R2Fpamw5b28",
    category: "Mac",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 16,
    name: "Mac Pro",
    description: [
      "모듈형 디자인",
      "Apple M3 Ultra 칩셋",
      "극한의 성능",
      "확장성 지원",
    ],
    price: 2.622,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mac-pro-digitalmat-gallery-3-202306?wid=728&hei=666&fmt=png-alpha&.v=SkNyNnJzckt4MGZGL2xWSzcrVk5NVGFTK1NUc21XRkxTcDlJVXRMU0hCMUFOQm0vTFRpVDhGcHQzSUxYYm5XaGdhdWg2SHVtQXhuSC9FaU1OWEMrMG9ZVlRjVWRkZlNXcEVVM05CWTlQQXkrMGx1Q25JQkNxd1JGSU5VN3RGS0M",
    category: "Mac",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 17,
    name: "Pro Display XDR",
    description: [
      "32인치 6K Retina 디스플레이",
      "HDR 지원",
      "1600니트 밝기",
      "전문가용 모니터",
    ],
    price: 1.624,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mac-pro-digitalmat-gallery-3-202306?wid=728&hei=666&fmt=png-alpha&.v=SkNyNnJzckt4MGZGL2xWSzcrVk5NVGFTK1NUc21XRkxTcDlJVXRMU0hCMUFOQm0vTFRpVDhGcHQzSUxYYm5XaGdhdWg2SHVtQXhuSC9FaU1OWEMrMG9ZVlRjVWRkZlNXcEVVM05CWTlQQXkrMGx1Q25JQkNxd1JGSU5VN3RGS0M",
    category: "Mac",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 18,
    name: "iPad Pro 11",
    description: [
      "11인치 Liquid Retina 디스플레이",
      "Apple M3 칩셋",
      "Apple Pencil Pro 지원",
      "프로급 성능",
    ],
    price: 0.399,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipadpro11-digitalmat-gallery-1-202404?wid=728&hei=666&fmt=jpeg&qlt=90&.v=UXVFY3VaaTg1Y0ZJTnlIMXY0b1VhZlRhSXFkOFhqdTgvUmc4VitXa2VzZFJ4eU1GZzRtNm5oQnN2QW1zUW9UeFl1V3dXQmdJWnFRbkcraVFaYnkzVFd5T3RkT0J1ZUFOQnovVVk3R3dLM0ltbzVCSGtEbW9RaTNsbTM2bmdVY3g",
    category: "ipad",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 19,
    name: "iPad Pro 13",
    description: [
      "13인치 Liquid Retina 디스플레이",
      "Apple M3 칩셋",
      "프로급 멀티태스킹",
      "Apple Pencil Pro 지원",
    ],
    price: 0.524,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipadpro13-digitalmat-gallery-1-202404?wid=728&hei=666&fmt=png-alpha&.v=cmVndzVraElDT2IwR1hxL1FWWUYxUFRhSXFkOFhqdTgvUmc4VitXa2VzZFJ4eU1GZzRtNm5oQnN2QW1zUW9UeFRnWXNaUGkzWFF6Q0FVUXZLQlA2QVJzajl1Z3B2NFRSeldmSW5hQ2dEQTBqdUY2Q0VBYjZyaUpzV0tFQnNKcVc",
    category: "ipad",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 20,
    name: "iPad Air 11",
    description: [
      "11인치 Liquid Retina 디스플레이",
      "Apple M2 칩셋",
      "경량 태블릿",
      "Apple Pencil 지원",
    ],
    price: 0.237,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipadair11-digitalmat-gallery-1-202404?wid=728&hei=666&fmt=jpeg&qlt=90&.v=VS9YcytCQzBPQkZDTTZaK2ZJcVRudlRhSXFkOFhqdTgvUmc4VitXa2VzZFJ4eU1GZzRtNm5oQnN2QW1zUW9UeFl1V3dXQmdJWnFRbkcraVFaYnkzVFd5T3RkT0J1ZUFOQnovVVk3R3dLM0tOSU9kS0NoY0dpYTVVSjVmNlZNQU0",
    category: "ipad",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 21,
    name: "iPad Air 13",
    description: [
      "13인치 Liquid Retina 디스플레이",
      "Apple M2 칩셋",
      "대화면 멀티태스킹",
      "Apple Pencil 지원",
    ],
    price: 0.312,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipadair13-digitalmat-gallery-1-202404?wid=728&hei=666&fmt=p-jpg&qlt=95&.v=akNNS3d4NGRNYkZmT2JMQmlTVE1NdlRhSXFkOFhqdTgvUmc4VitXa2VzZFJ4eU1GZzRtNm5oQnN2QW1zUW9UeEZGMGUwb1Y3aUJoOFNtZnEvQXJFMFBTbVJaZE1KcjZWb280ODhEa2FMMVh6QnQ1QjQvNXF4YktXcy9lMTkxY0E",
    category: "ipad",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 22,
    name: "iPad",
    description: [
      "10.9인치 Liquid Retina 디스플레이",
      "A15 Bionic 칩셋",
      "합리적인 가격",
      "다양한 교육용 활용",
    ],
    price: 0.132,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-digitalmat-gallery-1-202210?wid=728&hei=666&fmt=png-alpha&.v=b09yUUVmdlhWdlN1cWxTVitvUG5xTmxsTzVKU05XZEpBL0Y1VXhvbVNlb1RDMFgyWE5CaGc1dHIrSkVKb1NNV1M0TjRWdzF2UjRGVEY0c3dBQVZ6VFFYbnBWVlpIWWpSZ1ZkR3BYRlE3REE",
    category: "ipad",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 23,
    name: "iPad mini",
    description: [
      "8.3인치 Liquid Retina 디스플레이",
      "A16 Bionic 칩셋",
      "컴팩트한 휴대성",
      "Apple Pencil 지원",
    ],
    price: 0.187,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-mini-digitalmat-gallery-1-202410?wid=730&hei=666&fmt=png-alpha&.v=MjNRcUJZaFJGdW5OWDBkalpxVnNQUFRhSXFkOFhqdTgvUmc4VitXa2VzY0oreFIyRDYzVHo4MlBaaCtwNWFVeVRnWXNaUGkzWFF6Q0FVUXZLQlA2QVN3OGVzU1dkUnRJb0hLQzFZczd4VDRsVTBjODR4eEZBUHl6NkVFbUdjekQ",
    category: "ipad",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 24,
    name: "Apple Watch Series 11",
    description: [
      "Always-On Retina 디스플레이",
      "혈중 산소 측정",
      "심전도 앱",
      "방수 기능",
    ],
    price: 0.149,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/watch-s11-digitalmat-gallery-2-202509_GEO_KR?wid=728&hei=666&fmt=png-alpha&.v=T1pyYVFWN3pudWliRWQ0WTl3UmJXdHp0bzhwRTZxYVNNMnVRTXVpMUZESW52Z2RFZHdQVDFNaytXYkpCekVPZldwS3BmOE5lS0dKc1dRREcrSXh5V01lcC9qYU9xUXZmS1NmbGxtTVBCNU5Bb21majhQOUlpb1NTNmdBVE1Qekk",
    category: "Apple Watch",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 25,
    name: "Apple Watch SE 3",
    description: [
      "Retina 디스플레이",
      "핵심 피트니스 기능",
      "심박수 알림",
      "가성비 좋은 모델",
    ],
    price: 0.092,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/watch-se-digitalmat-gallery-1-202509_GEO_KR?wid=728&hei=666&fmt=png-alpha&.v=OENuMjYwZFNXbVduWHRoSkRoR3pUS041dXh2MUpWOGFNK2V6eVg1VGV3OGMraE5idTQwSEVYam1jdG03V2pEbHpGbHdxTU5oSkkwKzZZOXF0cVNPL1dEbG02UTA1WVduVEpGbUMyTTJuNVVKTkRpQ2VUMXh2UkNTOVZFSXZubjc",
    category: "Apple Watch",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 26,
    name: "Apple Watch Ultra 3",
    description: [
      "티타늄 케이스",
      "듀얼 주파수 GPS",
      "최대 36시간 배터리",
      "극한 스포츠용 설계",
    ],
    price: 0.312,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/watch-ultra-digitalmat-gallery-1-202509_GEO_KR?wid=728&hei=666&fmt=png-alpha&.v=Z1hvTnZGMTVLTmdOS1Q2clJKMzNiOVRBZjJveUdyMFM0Z0dEYTB4Rzh1QzFabjNsYXRQeWxjdVUraVgvM2xWemVkZGptNUJaWitJZ3gyOURkSTlZQ3ROL1VCcUxMZGhIeWpHS1Y3Y0ZmQnBwc0M5M25FTDNMWkdFZmZDRFNZckw",
    category: "Apple Watch",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 27,
    name: "Apple Watch Hermès Series 11",
    description: [
      "Hermès 전용 스트랩",
      "프리미엄 마감",
      "Always-On Retina 디스플레이",
      "심전도 앱 지원",
    ],
    price: 0.494,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/watch-s11-hermes-digitalmat-gallery-1-202509?wid=728&hei=666&fmt=png-alpha&.v=SUtNdTFmSlN6ZGtCM29YVkVQVWZPUkRra3VCZXB0SmZOOHB6NFd4c1Y0VjFIaENjb0RzNUhHZzh2b2JYN25Ob1dwS3BmOE5lS0dKc1dRREcrSXh5V01lcC9qYU9xUXZmS1NmbGxtTVBCNU5XQStSTVRzQ3pqVUVvY3lIVzZHdzI",
    category: "Apple Watch",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 28,
    name: "Apple Watch Hermès Ultra 3",
    description: [
      "Hermès 전용 스트랩",
      "티타늄 케이스",
      "듀얼 주파수 GPS",
      "극한 스포츠용 설계",
    ],
    price: 0.537,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/watch-hermes-ultra-digitalmat-gallery-1-202509_GEO_KR?wid=728&hei=666&fmt=png-alpha&.v=OFlDdDc4cmVqVndMYTR6RzI0QWt3QWExdks3UGdOVGViclAzTTVPNWtlekU0Q1NYcTc2dU4wbEh5RFk5QVYvRnVqNUJaSGdBZm90cXdnNm5rNC96UTA0R0xHVDR0MTBNd2dGRUx5Z1QrZ0YvZE5xZGhZenpPWlVpa0pBK2l1N1dUa0xlRlp1bGl4K09xVlg4SitnejNB",
    category: "Apple Watch",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 29,
    name: "Apple Vision Pro",
    description: [
      "공간 컴퓨팅 디바이스",
      "micro-OLED 디스플레이",
      "손·눈·음성 제어",
      "몰입형 AR/VR 경험",
    ],
    price: 1.247,
    image:
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/vision-pro-gallery-measure-dual-loop-202401?wid=5120&hei=2880&fmt=p-jpg&qlt=95&.v=eDVwb1h3eE5DQmx2RnhFenBtbjB4MCsyQVE0K3V5YzhHbWV1TjRxbDUraFY3K0Z2dldtZ0YyMUJMeFdIdnVxRHF2TWlpSzUzejRCZGt2SjJUNGl1VE5rb3YwRE90eklmVkIwdHovcEFheWc3czE5Q2ZmeDA4OWdkZkN0VGliSzM",
    category: "Apple Vision Pro",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 30,
    name: "AirPods Pro 3",
    description: [
      "액티브 노이즈 캔슬링",
      "투명 모드",
      "적응형 오디오",
      "H2 칩셋",
    ],
    price: 0.092,
    image:
      "https://www.apple.com/v/airpods/y/images/overview/hero_endframe__calpooy4ucr6_large_2x.jpg",
    category: "AirPods",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 31,
    name: "AirPods 4",
    description: [
      "개선된 착용감",
      "공간 음향 지원",
      "긴 배터리 수명",
      "향상된 음질",
    ],
    price: 0.049,
    image:
      "https://www.apple.com/v/airpods-4/g/images/overview/bento-gallery/bento_case_open__63kccmu775u6_xlarge_2x.jpg",
    category: "AirPods",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 32,
    name: "AirPods Max",
    description: [
      "오버이어 디자인",
      "액티브 노이즈 캔슬링",
      "공간 음향 지원",
      "프리미엄 오디오",
    ],
    price: 0.192,
    image:
      "https://www.apple.com/v/airpods/y/images/overview/airpods_max_blue__fsfaleh1smuu_large_2x.png",
    category: "AirPods",
    stock: 1,
    createdAt: new Date().toISOString(),
  },
];


// 장바구니 데이터 구조 (실제로는 세션이나 데이터베이스에서 관리)
// Map<sessionId, CartObject>
// CartObject 구조:
// - items: Array<CartItem> - 장바구니 상품들
//   - productId: number - 상품 ID
//   - name: string - 상품명
//   - price: number - 상품 가격 (KRW)
//   - quantity: number - 수량
//   - image: string - 상품 이미지 URL
// - createdAt: string - 장바구니 생성일시
// - updatedAt: string - 장바구니 수정일시
const carts = new Map();

// 주문 데이터 구조 (실제로는 데이터베이스에서 관리)
// Map<orderId, OrderObject>
// OrderObject 구조:
// - id: string - 주문 ID
// - customerAddress: string - 고객 XRPL 주소
// - customerName: string - 고객명
// - customerEmail: string - 고객 이메일
// - items: Array<CartItem> - 주문 상품들
// - totalAmountKRW: number - 주문 총액 (KRW)
// - totalAmountXRP: number - 결제 총액 (XRP)
// - xrpPrice: number - 주문 시점 XRP 가격
// - xrpPriceInfo: Object - XRP 상세 시세 정보
// - status: string - 주문 상태 ("pending", "paid", "cancelled")
// - paymentHash: string - 결제 트랜잭션 해시 (결제 완료 시)
// - paymentId: string - 결제 요청 ID (결제 완료 시)
// - paidAmountXRP: number - 실제 결제된 XRP 금액
// - createdAt: string - 주문 생성일시
// - updatedAt: string - 주문 수정일시
// - paidAt: string - 결제 완료일시
const orders = new Map();

/**
 * @route GET /api/shop/products
 * @desc 상품 목록 조회
 * @access Public
 */
/**
 * @api {get} /api/shop/products 01. 상품 목록 조회
 * @apiName GetProducts
 * @apiGroup Shop
 * @apiDescription 카테고리/검색/페이지네이션으로 상품 목록을 조회합니다. XRP 시세를 반영해 KRW→XRP 가격을 포함합니다.
 *
 * @apiParam {String} [category=all] 카테고리 (query)
 * @apiParam {String} [search] 검색어 (query)
 * @apiParam {Number} [page=1] 페이지 번호 (query)
 * @apiParam {Number} [limit=10] 페이지 당 개수 (query)
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object[]} products 상품 목록
 * @apiSuccess {Number} products.id 상품 ID
 * @apiSuccess {String} products.name 상품명
 * @apiSuccess {String} products.description 설명
 * @apiSuccess {String} products.category 카테고리
 * @apiSuccess {Number} products.priceKRW 가격(KRW)
 * @apiSuccess {String} products.priceXRP 가격(XRP, 소수 6자리 문자열)
 * @apiSuccess {String} [products.image] 이미지 URL
 * @apiSuccess {Number} [products.stock] 재고
 * @apiSuccess {Object} pagination 페이지네이션 정보
 * @apiSuccess {Number} pagination.currentPage 현재 페이지
 * @apiSuccess {Number} pagination.totalPages 전체 페이지 수
 * @apiSuccess {Number} pagination.totalProducts 전체 상품 수
 * @apiSuccess {Boolean} pagination.hasNext 다음 페이지 여부
 * @apiSuccess {Boolean} pagination.hasPrev 이전 페이지 여부
 * @apiSuccess {String[]} categories 사용 가능한 카테고리 목록
 */
router.get("/products", async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    // shopService를 통해 상품 조회
    const { data: products, error: dbError, count } = await shopService.getProducts({
      category,
      search,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    if (dbError) {
      return res.status(500).json({
        success: false,
        message: "상품 목록을 불러오는데 실패했습니다.",
      });
    }

    // XRP 가격 정보 추가 (KRW -> XRP 변환)
    try {
      const xrpPriceInfo = await cryptoPriceService.getXrpPrice();
      const xrpPrice = xrpPriceInfo.currentPrice;
      
      products.forEach((product) => {
        product.priceXRP = (parseFloat(product.price) / xrpPrice).toFixed(6);
        product.priceKRW = parseFloat(product.price);
      });
      
      products.xrpPriceInfo = xrpPriceInfo;
    } catch (error) {
      logger.warn("XRP 가격 정보를 가져올 수 없습니다:", error.message);
      products.forEach((product) => {
        product.priceXRP = (parseFloat(product.price) / 1500).toFixed(6);
        product.priceKRW = parseFloat(product.price);
      });
    }

    // 카테고리 목록 조회
    const { data: categories } = await shopService.getCategories();

    res.json({
      success: true,
      products: products || [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
        totalProducts: count || 0,
        hasNext: (parseInt(page) * parseInt(limit)) < (count || 0),
        hasPrev: parseInt(page) > 1,
      },
      categories: categories || [],
    });
  } catch (error) {
    logger.error("상품 목록 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "상품 목록을 불러오는데 실패했습니다.",
    });
  }
});

/**
 * @api {get} /api/shop/products/:id 02. 상품 상세 조회
 * @apiName GetProductDetail
 * @apiGroup Shop
 * @apiDescription 특정 상품의 상세 정보를 조회합니다. XRP 시세 기준 가격을 포함합니다.
 *
 * @apiParam {Number} id 상품 ID (URL path parameter)
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} product 상품 정보
 * @apiSuccess {Number} product.id 상품 ID
 * @apiSuccess {String} product.name 상품명
 * @apiSuccess {String} product.description 설명
 * @apiSuccess {String} product.category 카테고리
 * @apiSuccess {Number} product.priceKRW 가격(KRW)
 * @apiSuccess {String} product.priceXRP 가격(XRP, 소수 6자리 문자열)
 * @apiSuccess {String} [product.image] 이미지 URL
 * @apiSuccess {Number} [product.stock] 재고
 * @apiSuccess {Object} [product.xrpPriceInfo] XRP 시세 정보
 */
router.get("/products/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    // shopService를 통해 상품 상세 조회
    const { data: product, error: dbError } = await shopService.getProductById(productId);

    if (dbError || !product) {
      return res.status(404).json({
        success: false,
        message: "상품을 찾을 수 없습니다.",
      });
    }

    // XRP 가격 정보 추가
    try {
      const xrpPriceInfo = await cryptoPriceService.getXrpPrice();
      const xrpPrice = xrpPriceInfo.currentPrice;
      product.priceXRP = (parseFloat(product.price) / xrpPrice).toFixed(6);
      product.priceKRW = parseFloat(product.price);
      product.xrpPriceInfo = xrpPriceInfo;
    } catch (error) {
      logger.warn("XRP 가격 정보를 가져올 수 없습니다:", error.message);
      product.priceXRP = (parseFloat(product.price) / 1500).toFixed(6);
      product.priceKRW = parseFloat(product.price);
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    logger.error("상품 상세 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "상품 정보를 불러오는데 실패했습니다.",
    });
  }
});

/**
 * @api {post} /api/shop/cart/add 03. 장바구니에 상품 추가
 * @apiName AddToCart
 * @apiGroup Shop
 * @apiDescription 세션 장바구니에 상품을 추가합니다.
 *
 * @apiBody {String} sessionId 세션 ID
 * @apiBody {Number} productId 상품 ID
 * @apiBody {Number} [quantity=1] 수량
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {String} message 결과 메시지
 * @apiSuccess {Object} cart 장바구니 정보
 * @apiSuccess {Object[]} cart.items 장바구니 항목
 * @apiSuccess {Number} cart.items.productId 상품 ID
 * @apiSuccess {String} cart.items.name 상품명
 * @apiSuccess {Number} cart.items.price 가격(KRW)
 * @apiSuccess {Number} cart.items.quantity 수량
 * @apiSuccess {String} [cart.items.image] 이미지 URL
 * @apiSuccess {String} cart.createdAt 생성 시각
 * @apiSuccess {String} cart.updatedAt 갱신 시각
 */
router.post("/cart/add", async (req, res) => {
  try {
    const { productId, quantity = 1, sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "세션 ID가 필요합니다.",
      });
    }

    if (!productId || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "유효한 상품 ID와 수량이 필요합니다.",
      });
    }

    // shopService를 통해 장바구니에 상품 추가
    const { success, cart, error } = await shopService.addToCart(sessionId, productId, quantity);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: error?.message || "장바구니에 상품을 추가하는데 실패했습니다.",
      });
    }

    res.json({
      success: true,
      message: "상품이 장바구니에 추가되었습니다.",
      cart: cart,
    });
  } catch (error) {
    logger.error("장바구니 추가 실패:", error);
    res.status(500).json({
      success: false,
      message: "장바구니에 상품을 추가하는데 실패했습니다.",
    });
  }
});

/**
 * @api {get} /api/shop/cart/:sessionId 04. 장바구니 조회
 * @apiName GetCart
 * @apiGroup Shop
 * @apiDescription 세션 장바구니 정보를 조회합니다. 총액의 KRW/XRP 변환 정보를 포함합니다.
 *
 * @apiParam {String} sessionId 세션 ID
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} cart 장바구니 정보
 * @apiSuccess {Object[]} cart.items 항목 배열
 * @apiSuccess {Number} cart.totalItems 총 수량
 * @apiSuccess {Number} cart.totalAmountKRW 총액(KRW)
 * @apiSuccess {String} cart.totalAmountXRP 총액(XRP, 문자열)
 * @apiSuccess {Number} cart.xrpPrice 사용된 XRP 가격(KRW)
 * @apiSuccess {Object} [cart.xrpPriceInfo] XRP 시세 정보
 */
router.get("/cart/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    // shopService를 통해 장바구니 조회
    const { data: cart, error } = await shopService.getCartBySessionId(sessionId);

    if (error) {
      logger.error("장바구니 조회 실패:", error);
      return res.status(500).json({
        success: false,
        message: "장바구니를 불러오는데 실패했습니다.",
      });
    }

    // XRP 가격 정보 추가 (KRW -> XRP 변환)
    let xrpPriceInfo = null;
    let xrpPrice = null;
    let totalAmountXRP = null;
    
    try {
      xrpPriceInfo = await cryptoPriceService.getXrpPrice();
      xrpPrice = xrpPriceInfo.currentPrice;
      totalAmountXRP = (cart.totalAmountKRW / xrpPrice).toFixed(6);
    } catch (error) {
      logger.warn("XRP 가격 정보를 가져올 수 없습니다:", error.message);
      // 기본 변환율 사용 (1 XRP = 1500 KRW)
      totalAmountXRP = (cart.totalAmountKRW / 1500).toFixed(6);
      xrpPrice = 1500;
    }

    res.json({
      success: true,
      cart: {
        ...cart,
        totalAmountXRP, // 장바구니 총액 (XRP)
        xrpPrice, // 현재 XRP 가격
        xrpPriceInfo, // XRP 상세 시세 정보
      },
    });
  } catch (error) {
    logger.error("장바구니 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "장바구니를 불러오는데 실패했습니다.",
    });
  }
});

/**
 * @api {delete} /api/shop/cart/:sessionId/item/:productId 05. 장바구니 상품 제거
 * @apiName RemoveCartItem
 * @apiGroup Shop
 * @apiDescription 세션 장바구니에서 특정 상품을 제거합니다.
 *
 * @apiParam {String} sessionId 세션 ID
 * @apiParam {Number} productId 상품 ID
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {String} message 결과 메시지
 * @apiSuccess {Object} cart 장바구니 정보
 */
router.delete("/cart/:sessionId/item/:productId", async (req, res) => {
  try {
    const { sessionId, productId } = req.params;

    // shopService를 통해 장바구니에서 상품 제거
    const { success, cart, error } = await shopService.removeCartItem(sessionId, parseInt(productId));

    if (!success) {
      return res.status(404).json({
        success: false,
        message: error?.message || "장바구니에서 상품을 제거하는데 실패했습니다.",
      });
    }

    res.json({
      success: true,
      message: "상품이 장바구니에서 제거되었습니다.",
      cart: cart,
    });
  } catch (error) {
    logger.error("장바구니 상품 제거 실패:", error);
    res.status(500).json({
      success: false,
      message: "장바구니에서 상품을 제거하는데 실패했습니다.",
    });
  }
});

/**
 * @api {post} /api/shop/order/create 06. 주문 생성
 * @apiName CreateOrder
 * @apiGroup Shop
 * @apiDescription 장바구니 기반으로 주문을 생성합니다. 총액 KRW/XRP 및 당시 XRP 시세 정보를 포함합니다.
 *
 * @apiBody {String} sessionId 세션 ID
 * @apiBody {String} customerAddress 고객 XRPL 주소
 * @apiBody {String} [customerName] 고객 이름
 * @apiBody {String} [customerEmail] 고객 이메일
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {String} message 결과 메시지
 * @apiSuccess {Object} order 주문 요약
 * @apiSuccess {String} order.id 주문 ID
 * @apiSuccess {Number} order.totalAmountKRW 총액(KRW)
 * @apiSuccess {Number} order.totalAmountXRP 총액(XRP)
 * @apiSuccess {Number} order.xrpPrice 주문 시 XRP 가격(KRW)
 * @apiSuccess {Object} [order.xrpPriceInfo] 주문 시 XRP 시세 정보
 * @apiSuccess {String} order.status 주문 상태
 * @apiSuccess {String} order.createdAt 생성 시각
 */
router.post("/order/create", async (req, res) => {
  try {
    const { sessionId, customerAddress, customerName, customerEmail } =
      req.body;

    if (!sessionId || !customerAddress) {
      return res.status(400).json({
        success: false,
        message: "세션 ID와 고객 주소가 필요합니다.",
      });
    }

    const cart = carts.get(sessionId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "장바구니가 비어있습니다.",
      });
    }

    // 주소 유효성 검사
    const isValidAddress = await paymentService.validateAddress(
      customerAddress
    );
    if (!isValidAddress) {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 XRPL 주소입니다.",
      });
    }

    // 총 금액 계산 (KRW)
    const totalAmountKRW = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // KRW를 XRP로 변환
    let totalAmountXRP;
    let xrpPrice;
    let xrpPriceInfo;
    try {
      xrpPriceInfo = await cryptoPriceService.getXrpPrice();
      xrpPrice = xrpPriceInfo.currentPrice;
      totalAmountXRP = parseFloat((totalAmountKRW / xrpPrice).toFixed(6));
    } catch (error) {
      logger.warn(
        "XRP 가격 정보를 가져올 수 없어 기본 변환율을 사용합니다:",
        error.message
      );
      // 기본 변환율 사용 (1 XRP = 1500 KRW)
      xrpPrice = 1500;
      totalAmountXRP = parseFloat((totalAmountKRW / 1500).toFixed(6));
    }

    // 주문 생성
    const orderId = `ORDER_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const order = {
      id: orderId,
      customerAddress,
      customerName,
      customerEmail,
      items: [...cart.items],
      totalAmountKRW, // 원화 총액
      totalAmountXRP, // XRP 총액 (결제에 사용)
      xrpPrice, // 주문 시점의 XRP 가격
      xrpPriceInfo, // XRP 상세 시세 정보
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.set(orderId, order);

    // 장바구니 비우기
    carts.delete(sessionId);

    logger.info(
      `주문 생성 완료: ${orderId} (${totalAmountKRW} KRW = ${totalAmountXRP} XRP)`
    );

    res.json({
      success: true,
      message: "주문이 생성되었습니다.",
      order: {
        id: order.id,
        totalAmountKRW,
        totalAmountXRP,
        xrpPrice,
        xrpPriceInfo,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    logger.error("주문 생성 실패:", error);
    res.status(500).json({
      success: false,
      message: "주문을 생성하는데 실패했습니다.",
    });
  }
});

/**
 * @api {post} /api/shop/order/:orderId/pay 07. 주문 결제 처리
 * @apiName PayOrder
 * @apiGroup Shop
 * @apiDescription 주문 금액(XRP)으로 결제를 수행합니다. 내부적으로 결제 요청을 생성/처리합니다.
 *
 * @apiParam {String} orderId 주문 ID
 * @apiBody {String} customerWalletSeed 고객 지갑 시드
 * @apiBody {String} customerAddress 고객 XRPL 주소
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {String} message 결과 메시지
 * @apiSuccess {Object} order 주문 결제 결과 요약
 * @apiSuccess {String} order.id 주문 ID
 * @apiSuccess {String} order.status 주문 상태(paid)
 * @apiSuccess {String} order.paymentHash 결제 트랜잭션 해시
 * @apiSuccess {String} order.paymentId 결제 요청 ID
 * @apiSuccess {Number} order.totalAmountKRW 주문 총액(KRW)
 * @apiSuccess {Number} order.paidAmountXRP 결제 금액(XRP)
 * @apiSuccess {Number} order.xrpPrice 결제 시점 XRP 가격(KRW)
 * @apiSuccess {String} order.paidAt 결제 완료 시각
 */
router.post("/order/:orderId/pay", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { customerWalletSeed, customerAddress } = req.body;

    const order = orders.get(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "주문을 찾을 수 없습니다.",
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "이미 처리된 주문입니다.",
      });
    }

    // 결제 처리 (XRP 금액으로 결제)
    // 먼저 paymentService를 통해 결제 요청을 생성
    const paymentRequest = await paymentService.createPaymentRequest(
      order.totalAmountXRP, // XRP 금액 사용
      `쇼핑몰 주문 결제: ${orderId}`,
      "rMerchantAddressHere" // 실제로는 쇼핑몰 지갑 주소를 사용
    );

    // 결제 처리
    const paymentResult = await paymentService.processPayment(
      paymentRequest.id, // 생성된 결제 요청 ID 사용
      customerWalletSeed,
      customerAddress
    );

    if (paymentResult.status === "completed") {
      // 주문 상태 업데이트
      order.status = "paid";
      order.paymentHash = paymentResult.transactionHash;
      order.paymentId = paymentRequest.id; // 결제 요청 ID 저장
      order.paidAmountXRP = order.totalAmountXRP; // 실제 결제된 XRP 금액
      order.paidAt = new Date().toISOString();
      order.updatedAt = new Date().toISOString();
      orders.set(orderId, order);

      logger.info(
        `주문 결제 완료: ${orderId}, tx: ${paymentResult.transactionHash}`
      );

      res.json({
        success: true,
        message: "결제가 완료되었습니다.",
        order: {
          id: order.id,
          status: order.status,
          paymentHash: order.paymentHash,
          paymentId: order.paymentId,
          totalAmountKRW: order.totalAmountKRW,
          paidAmountXRP: order.paidAmountXRP,
          xrpPrice: order.xrpPrice,
          paidAt: order.paidAt,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "결제 처리에 실패했습니다.",
      });
    }
  } catch (error) {
    logger.error("주문 결제 실패:", error);
    res.status(500).json({
      success: false,
      message: error.message || "결제 처리에 실패했습니다.",
    });
  }
});

/**
 * @api {get} /api/shop/order/:orderId 08. 주문 상세 조회
 * @apiName GetOrderDetail
 * @apiGroup Shop
 * @apiDescription 주문 상세 정보를 조회합니다. 주문 생성 시의 XRP/KRW 가격 정보 포함.
 *
 * @apiParam {String} orderId 주문 ID
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} order 주문 전체 정보
 */
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders.get(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "주문을 찾을 수 없습니다.",
      });
    }

    // 주문에 이미 XRP/KRW 정보가 포함되어 있으므로 추가 계산 불필요
    res.json({
      success: true,
      order: {
        ...order,
        // 기존 주문에 저장된 가격 정보 사용
      },
    });
  } catch (error) {
    logger.error("주문 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "주문 정보를 불러오는데 실패했습니다.",
    });
  }
});

/**
 * @api {get} /api/shop/orders/:address 09. 주소별 주문 내역 조회
 * @apiName GetOrdersByAddress
 * @apiGroup Shop
 * @apiDescription 고객 주소 기준 주문 내역을 페이지네이션으로 조회합니다.
 *
 * @apiParam {String} address 고객 XRPL 주소
 * @apiParam {Number} [page=1] 페이지 번호 (query)
 * @apiParam {Number} [limit=10] 페이지 당 개수 (query)
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object[]} orders 주문 목록 (최신순)
 * @apiSuccess {Object} pagination 페이지네이션 정보
 */
router.get("/orders/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // 해당 주소의 주문들 필터링
    const userOrders = Array.from(orders.values())
      .filter((order) => order.customerAddress === address)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedOrders = userOrders.slice(startIndex, endIndex);

    // 주문에 이미 XRP/KRW 정보가 포함되어 있으므로 추가 계산 불필요
    // paginatedOrders는 이미 각 주문의 totalAmountKRW, totalAmountXRP 정보를 포함

    res.json({
      success: true,
      orders: paginatedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(userOrders.length / limit),
        totalOrders: userOrders.length,
        hasNext: endIndex < userOrders.length,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error("주문 내역 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "주문 내역을 불러오는데 실패했습니다.",
    });
  }
});

/**
 * @api {get} /api/shop/stats 10. 쇼핑몰 통계 정보
 * @apiName GetShopStats
 * @apiGroup Shop
 * @apiDescription 상품/주문/매출 등 기본 통계와 현재 XRP 시세 정보를 조회합니다.
 *
 * @apiSuccess {Boolean} success 요청 성공 여부
 * @apiSuccess {Object} stats 통계 정보
 * @apiSuccess {Number} stats.totalProducts 총 상품 수
 * @apiSuccess {Number} stats.totalOrders 총 주문 수
 * @apiSuccess {Number} stats.totalRevenueKRW 총 매출(KRW)
 * @apiSuccess {Number} stats.totalRevenueXRP 총 매출(XRP)
 * @apiSuccess {String[]} stats.categories 카테고리 목록
 * @apiSuccess {Object} [stats.currentXrpPriceInfo] 현재 XRP 시세 정보
 */
router.get("/stats", async (req, res) => {
  try {
    // shopService를 통해 통계 조회
    const { data: shopStats, error: statsError } = await shopService.getShopStats();
    
    if (statsError) {
      throw statsError;
    }

    const totalOrders = orders.size;

    // 매출 계산 (기존 주문 데이터 기반)
    const paidOrders = Array.from(orders.values()).filter(
      (order) => order.status === "paid"
    );
    const totalRevenueKRW = paidOrders.reduce(
      (sum, order) => sum + (order.totalAmountKRW || 0),
      0
    );
    const totalRevenueXRP = paidOrders.reduce(
      (sum, order) => sum + (order.totalAmountXRP || 0),
      0
    );

    // 현재 XRP 가격 정보
    let currentXrpPriceInfo = null;
    try {
      currentXrpPriceInfo = await cryptoPriceService.getXrpPrice();
    } catch (error) {
      logger.warn("XRP 가격 정보를 가져올 수 없습니다:", error.message);
    }

    res.json({
      success: true,
      stats: {
        totalProducts: shopStats?.totalProducts || 0,
        totalOrders,
        totalRevenueKRW,
        totalRevenueXRP,
        categories: shopStats?.categories || [],
        currentXrpPriceInfo,
      },
    });
  } catch (error) {
    logger.error("통계 정보 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "통계 정보를 불러오는데 실패했습니다.",
    });
  }
});

module.exports = router;
