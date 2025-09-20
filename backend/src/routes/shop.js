const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");

// 예시 상품 데이터
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

/**
 * @api {get} /api/shop/products 01. 상품 목록 조회
 */
router.get("/products", (req, res) => {
  try {
    res.json({
      success: true,
      products: products,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalProducts: products.length,
        hasNext: false,
        hasPrev: false,
      },
      categories: ["iPhone"],
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
 */
router.get("/products/:id", (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "상품을 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      product: product,
    });
  } catch (error) {
    logger.error("상품 상세 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "상품 정보를 불러오는데 실패했습니다.",
    });
  }
});

module.exports = router;
