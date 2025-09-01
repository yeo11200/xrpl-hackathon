# XRPL Hackathon Frontend

XRPL 해커톤을 위한 현대적이고 최적화된 React 보일러플레이트입니다.

## 🚀 Features

- **XRPL Testnet 연결**: XRPL 테스트넷에 직접 연결
- **지갑 관리**: 지갑 생성, 연결, 해제
- **XRP 전송**: XRP 거래 전송 및 모니터링
- **계정 정보**: 잔액, 시퀀스, 계정 플래그 등 상세 정보
- **현대적 UI**: Tailwind CSS와 Heroicons를 사용한 아름다운 인터페이스
- **TypeScript**: 완전한 타입 안전성
- **성능 최적화**: React 19의 최신 기능 활용
- **페이지 라우팅**: React Router를 사용한 SPA 구조

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4.1
- **Icons**: Heroicons
- **Routing**: React Router DOM
- **XRPL SDK**: xrpl 4.4.0
- **Build Tool**: Vite 7.1
- **Package Manager**: pnpm
- **Node.js**: 22.x

## 📦 Installation

### Prerequisites

- Node.js 22.x (nvm 사용 권장)
- pnpm

### Setup

1. **Node.js 22 활성화**

   ```bash
   nvm use 22
   ```

2. **의존성 설치**

   ```bash
   pnpm install
   ```

3. **개발 서버 실행**

   ```bash
   pnpm run dev
   ```

4. **브라우저에서 확인**
   ```
   http://localhost:5173
   ```

## 🔧 Available Scripts

- `pnpm run dev` - 개발 서버 실행
- `pnpm run build` - 프로덕션 빌드
- `pnpm run preview` - 빌드된 앱 미리보기
- `pnpm run lint` - ESLint 실행

## 🏗️ Project Structure

```
src/
├── components/          # React 컴포넌트
│   ├── WalletConnection.tsx    # 지갑 연결 관리
│   ├── AccountInfo.tsx         # 계정 정보 표시
│   └── XRPTransfer.tsx         # XRP 전송 폼
├── pages/              # 페이지 컴포넌트
│   ├── Home.tsx               # 홈 페이지
│   ├── Transactions.tsx        # 트랜잭션 히스토리
│   └── NFT.tsx                # NFT 작업
├── hooks/              # 커스텀 훅
│   └── useXRPL.ts     # XRPL 연결 및 기능
├── App.tsx            # 메인 앱 컴포넌트 (라우터)
└── index.css          # Tailwind CSS 스타일
```

## 🗺️ Page Routes

- `/` - 홈 페이지 (지갑 연결, 계정 정보, XRP 전송)
- `/transactions` - 트랜잭션 히스토리
- `/nft` - NFT 생성 및 관리

## 🔌 XRPL Integration

### 연결된 기능들

1. **Testnet 연결**: `wss://s.altnet.rippletest.net:51233`
2. **지갑 생성**: XRPL 표준 지갑 생성
3. **잔액 조회**: 실시간 XRP 잔액 확인
4. **거래 전송**: XRP 전송 및 트랜잭션 모니터링
5. **계정 정보**: 계정 상세 정보 조회

### 사용된 XRPL API

- `Client.connect()` - 테스트넷 연결
- `xrpl.Wallet.generate()` - 새 지갑 생성
- `client.getXrpBalance()` - XRP 잔액 조회
- `client.autofill()` - 트랜잭션 자동 완성
- `client.submitAndWait()` - 트랜잭션 제출 및 대기

## 🎨 UI Components

### 커스텀 CSS 클래스

- `.btn-primary` - 주요 액션 버튼
- `.btn-secondary` - 보조 액션 버튼
- `.card` - 카드 컨테이너
- `.input-field` - 입력 필드

### 색상 테마

- `xrpl-blue`: `#1E3A8A`
- `xrpl-green`: `#059669`
- `xrpl-purple`: `#7C3AED`

## 🚨 Security Notes

⚠️ **중요**: 이 프로젝트는 개발/테스트 목적으로만 사용하세요.

- 테스트넷 지갑 시드는 실제 자금이 아닙니다
- 프로덕션 환경에서는 절대 시드를 노출하지 마세요
- 실제 거래에는 메인넷을 사용하세요

## 🔗 Useful Links

- [XRPL Documentation](https://xrpl.org/docs)
- [XRPL Testnet Faucet](https://xrpl.org/xrp-testnet-faucet.html)
- [XRPL JavaScript SDK](https://github.com/XRPL-Labs/xrpl.js)
- [Tailwind CSS](https://tailwindcss.com)
- [React 19](https://react.dev)
- [React Router](https://reactrouter.com)

## 🚀 Next Steps

해커톤에서 이 보일러플레이트를 기반으로 다음과 같은 기능들을 추가할 수 있습니다:

1. **NFT 기능**: NFT 발행, 전송, 거래 (기본 구조 완성)
2. **DEX 통합**: 분산 거래소 기능
3. **멀티시그**: 다중 서명 지갑
4. **토큰 관리**: 커스텀 토큰 생성 및 관리
5. **스마트 컨트랙트**: Hooks 기능 활용
6. **모바일 최적화**: PWA 기능 추가

## 🤝 Contributing

해커톤 팀원들과 협업하여 기능을 확장하고 개선해보세요!

## 📄 License

MIT License - 자유롭게 사용하고 수정하세요.
