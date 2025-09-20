# XRPL Hackathon Project

XRPL(XRP Ledger) 기반 해커톤 프로젝트입니다. 백엔드 API 서버와 프론트엔드 React 애플리케이션으로 구성된 풀스택 프로젝트입니다.

## 🏗️ 프로젝트 구조

```
hackathon/
├── .git/                    # Git 저장소 (루트 레벨)
├── .gitignore              # Git 무시 파일 설정
├── backend/                 # 백엔드 API 서버
│   ├── src/
│   │   ├── server.js       # Express 서버
│   │   ├── routes/         # API 라우터
│   │   ├── services/       # 비즈니스 로직
│   │   ├── middleware/     # 미들웨어
│   │   └── utils/          # 유틸리티
│   ├── package.json        # 백엔드 의존성
│   └── README.md           # 백엔드 상세 문서
├── frontend/               # 프론트엔드 React 앱
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   └── App.tsx         # 메인 앱
│   ├── package.json        # 프론트엔드 의존성
│   └── README.md           # 프론트엔드 상세 문서
└── README.md               # 이 파일 (프로젝트 개요)
```

## 🚀 주요 기능

### 백엔드 (Express.js)

- **XRPL 지갑 관리**: 지갑 생성, 계정 정보 조회
- **결제 시스템**: XRP 결제 처리 및 환불
- **거래 내역**: 결제 내역 조회 및 통계
- **실시간 검증**: 주소 및 시드 검증
- **RESTful API**: 완전한 REST API 제공
- **Credentials**: 사용자 생성 후 /api/credential/accept을 통한 자격 증명(자격 증명이 되지 않으면 결제 진행이 되지 않도록 처리)
- **PermissionedDEX Offer**: /api/account/:address/validation를 통해 검증 된 사용자만 결제 처리로 넘어가도록 처리

### 프론트엔드 (React + TypeScript)

- **지갑 연결**: XRPL 지갑 생성 및 연결
- **XRP 전송**: 실시간 XRP 거래 전송
- **계정 정보**: 잔액, 시퀀스 등 상세 정보
- **트랜잭션 히스토리**: 거래 내역 조회
- **NFT 관리**: NFT 생성 및 관리 (기본 구조)
- **현대적 UI**: Tailwind CSS 기반 아름다운 인터페이스

## 🛠️ 기술 스택

### 백엔드

- **Runtime**: Node.js 16.x+
- **Framework**: Express.js
- **XRPL SDK**: xrpl 2.14.0
- **Package Manager**: npm
- **Database**: 메모리 기반 (개발용)

### 프론트엔드

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4.1
- **XRPL SDK**: xrpl 4.4.0
- **Build Tool**: Vite 7.1
- **Package Manager**: pnpm
- **Node.js**: 22.x

## 📦 설치 및 실행

### 1. 저장소 클론

```bash
git clone <repository-url>
cd hackathon
```

### 2. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp env.example .env

# .env 파일 편집 (필요한 설정 입력)
# PORT=3000
# NODE_ENV=development
# XRPL_SERVER=wss://s.altnet.rippletest.net:51233
# XRPL_NETWORK=testnet

# 개발 서버 실행
npm run dev
```

백엔드 서버가 `http://localhost:3000`에서 실행됩니다.

### 3. 프론트엔드 설정

```bash
cd frontend

# Node.js 22 활성화 (nvm 사용 시)
nvm use 22

# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm run dev
```

프론트엔드 앱이 `http://localhost:5173`에서 실행됩니다.

## 🔧 개발 가이드

### 동시 실행

두 터미널에서 각각 실행:

```bash
# 터미널 1 - 백엔드
cd backend && npm run dev

# 터미널 2 - 프론트엔드
cd frontend && pnpm run dev
```

### 빌드

```bash
# 백엔드 빌드
cd backend && npm start

# 프론트엔드 빌드
cd frontend && pnpm run build
```

### 테스트

```bash
# 백엔드 테스트
cd backend && npm test

# 프론트엔드 린트
cd frontend && pnpm run lint
```

## 🌐 API 엔드포인트

### XRPL 관련

- `GET /api/xrpl/server-info` - 서버 정보
- `POST /api/xrpl/wallet` - 지갑 생성
- `GET /api/xrpl/account/{address}` - 계정 정보
- `POST /api/xrpl/send-payment` - XRP 전송
- `GET /api/xrpl/transaction/{hash}` - 거래 정보

### 결제 관련

- `POST /api/payment/request` - 결제 요청
- `POST /api/payment/process` - 결제 처리
- `GET /api/payment/status/{paymentId}` - 결제 상태
- `POST /api/payment/refund` - 결제 환불

## 🔒 보안 고려사항

⚠️ **중요**: 이 프로젝트는 개발/테스트 목적으로만 사용하세요.

- **테스트넷 사용**: 실제 자금이 아닌 테스트넷 XRP 사용
- **환경 변수**: 민감한 정보는 `.env` 파일에 저장
- **시드 보안**: 지갑 시드는 절대 코드에 하드코딩하지 마세요
- **HTTPS**: 프로덕션에서는 반드시 HTTPS 사용

## 🚀 해커톤 활용 방안

이 보일러플레이트를 기반으로 다음과 같은 기능들을 추가할 수 있습니다:

1. **고급 NFT 기능**: NFT 마켓플레이스, 메타데이터 관리
2. **DEX 통합**: 분산 거래소 기능 구현
3. **멀티시그 지갑**: 다중 서명 기능
4. **토큰 관리**: 커스텀 토큰 생성 및 거래
5. **스마트 컨트랙트**: XRPL Hooks 활용
6. **모바일 앱**: React Native 버전 개발
7. **실시간 알림**: WebSocket을 통한 실시간 업데이트

## 📚 상세 문서

- [백엔드 API 문서](./backend/README.md)
- [프론트엔드 가이드](./frontend/README.md)

## 🔗 유용한 링크

- [XRPL 공식 문서](https://xrpl.org/docs)
- [XRPL 테스트넷 Faucet](https://xrpl.org/xrp-testnet-faucet.html)
- [XRPL JavaScript SDK](https://github.com/XRPL-Labs/xrpl.js)
- [React 19 문서](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자유롭게 사용하고 수정하세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.

---

**해커톤 팀 여러분, 즐거운 코딩 되세요! 🚀**
