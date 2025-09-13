# XRPL Payment System

XRPL(XRP Ledger) 기반 결제 시스템입니다. 해커톤을 위한 Express.js 보일러플레이트로 구성되어 있습니다.

## 🚀 주요 기능

- **지갑 관리**: XRPL 지갑 생성 및 관리
- **결제 처리**: XRP를 이용한 결제 시스템
- **거래 내역**: 결제 내역 조회 및 통계
- **환불 처리**: 결제 환불 기능
- **실시간 검증**: 주소 및 시드 검증

## 📋 요구사항

- Node.js 16.x 이상
- npm 또는 yarn

## 🛠 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp env.example .env
```

`.env` 파일을 편집하여 필요한 설정을 입력하세요:

```env
PORT=3000
NODE_ENV=development
XRPL_SERVER=wss://s.altnet.rippletest.net:51233
XRPL_NETWORK=testnet
```

### 3. 서버 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 📚 API 문서

### 기본 엔드포인트

#### Health Check

```
GET /health
```

### XRPL 관련 API

#### 서버 정보 조회

```
GET /api/xrpl/server-info
```

#### 지갑 생성

```
POST /api/xrpl/wallet
Content-Type: application/json

{
  "fund": true
}
```

#### 계정 정보 조회

```
GET /api/xrpl/account/{address}
```

#### 잔액 조회

```
GET /api/xrpl/account/{address}/balance
```

#### 결제 전송

```
POST /api/xrpl/send-payment
Content-Type: application/json

{
  "toAddress": "rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "amount": 10,
  "fromWalletSeed": "sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

#### 거래 정보 조회

```
GET /api/xrpl/transaction/{hash}
```

#### 지갑 자금 지원 (테스트넷만)

```
POST /api/xrpl/fund-wallet/{address}
```

#### 주소 검증

```
GET /api/xrpl/validate-address/{address}
```

#### 시드 검증

```
POST /api/xrpl/validate-seed
Content-Type: application/json

{
  "seed": "sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

### 결제 관련 API

#### 결제 요청 생성

```
POST /api/payment/request
Content-Type: application/json

{
  "amount": 10,
  "description": "상품 구매",
  "merchantAddress": "rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

#### 결제 처리

```
POST /api/payment/process
Content-Type: application/json

{
  "paymentId": "uuid-string",
  "customerWalletSeed": "sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "customerAddress": "rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

#### 결제 상태 조회

```
GET /api/payment/status/{paymentId}
```

#### 결제 환불

```
POST /api/payment/refund
Content-Type: application/json

{
  "paymentId": "uuid-string",
  "merchantWalletSeed": "sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

#### 결제 내역 조회

```
GET /api/payment/history?address={address}&type={type}
```

#### 결제 통계

```
GET /api/payment/stats?address={address}
```

## 🔧 개발 가이드

### 프로젝트 구조

```
src/
├── server.js          # 메인 서버 파일
├── routes/            # API 라우터
│   ├── account.js           # 개인 계정 관리
│   ├── xrpl.js       # XRPL 관련 API
│   └── payment.js    # 결제 관련 API
├── services/          # 비즈니스 로직
│   ├── accountService.js    # 계정 관리 서비스
│   ├── cryptoPriceService.js # XRP 시세 조회
│   ├── xrplClient.js # XRPL 클라이언트
│   └── paymentService.js # 결제 서비스
├── middleware/        # 미들웨어
│   ├── errorHandler.js # 에러 처리
│   └── validation.js  # 요청 검증
└── utils/            # 유틸리티
    └── logger.js     # 로깅 시스템
```

### 테스트

```bash
npm test
```

### 로그 확인

로그는 `logs/` 디렉토리에 저장됩니다:

- `combined.log`: 모든 로그
- `error.log`: 에러 로그만

## 🔒 보안 고려사항

- **프로덕션 환경에서는 반드시 환경 변수를 안전하게 관리하세요**
- **지갑 시드는 절대 코드에 하드코딩하지 마세요**
- **HTTPS를 사용하여 API 통신을 암호화하세요**
- **Rate limiting을 적절히 설정하세요**

## 🌐 네트워크 설정

### 테스트넷 (기본)

- 서버: `wss://s.altnet.rippletest.net:51233`
- 자금 지원: 가능
- 용도: 개발 및 테스트

### 메인넷

- 서버: `wss://xrplcluster.com`
- 자금 지원: 불가능
- 용도: 실제 거래

## 📝 라이선스

MIT License

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.
