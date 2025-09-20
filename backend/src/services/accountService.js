const logger = require("../utils/logger");
const {xrplClient, XRPLClient} = require("./xrplClient");
const { supabase } = require("./supabaseClient");
require("dotenv").config();

/**
 * 헬퍼 함수들
 */
const toHex = (str) => Buffer.from(str, "utf8").toString("hex").toUpperCase();
const fromHex = (hex) => {
  try {
    return Buffer.from(hex, 'hex').toString('utf8');
  } catch {
    return hex;
  }
};
const now = () => Math.floor(Date.now() / 1000);

/**
 * 계정 관리 서비스
 * React 훅에서 백엔드 서비스로 변환된 버전
 */
class AccountService {
  constructor(xrplClient = new XRPLClient()) {
    this.xrplClient = xrplClient;
    this.accounts = new Map(); // 메모리 기반 계정 저장소 (개발용)
  }

  validateAddress(address) {
    const clean = address?.trim();
    if (!clean) throw new Error("주소가 비어있습니다");
    if (!XRPLClient.isValidAddress(clean)) throw new Error("유효한 XRPL 주소 형식이 아닙니다");
    return clean;
  }

  validateSeed(seed) {
    if (!seed || typeof seed !== "string") {
      return { isValid: false, error: "시드값이 비어있거나 잘못된 형식입니다" };
    }

    try {
      const wallet = XRPLClient.walletFromSeed(seed);
      return { isValid: true, address: wallet.address };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  /**
   * 새 계정 생성 및 테스트넷 펀딩
   * @param {string} nickname - 사용자 닉네임
   * @returns {Promise<Object>} 생성 결과
   */
  async createAccount(nickname) {
    try {
      if (!nickname || typeof nickname !== "string") {
        throw new Error("닉네임은 필수이며 문자열이어야 합니다");
      }

      logger.info("새 계정 생성 시작...");
      const wallet = XRPLClient.generateWallet();
      logger.info(`지갑 생성 완료: ${wallet.address}`);

      // 1) DB에 계정 레코드 생성 (유니크 제약 활용)
      const { data: createdRow, error: createError } = await supabase
        .from('accounts')
        .insert({
          address: wallet.address,
          user_id: nickname,
          public_key: wallet.publicKey,
        })
        .select('address,user_id,public_key,created_at')
        .single();
      if (createError) {
        if (createError.code === '23505') {
          const msg = (createError.message || '').toLowerCase();
          if (msg.includes('user_id') || msg.includes('uq_accounts_user_id_ci')) {
            //다 가져오기
            const result = await this.getAccountInfoToNickName(nickname);

            if (result.success) {
              return { success: true, account: result.account };
            } else {
              return { success: false, message: "조회 실패", account: null };
            }
            // throw new Error('이미 사용 중인 닉네임입니다');
          }
          if (msg.includes('address')) {
            throw new Error('이미 존재하는 주소입니다');
          }
          throw new Error('중복된 데이터가 존재합니다');
        }
        throw new Error(createError.message || '계정 생성 중 오류가 발생했습니다');
      }

      //credential 관련 생성/수락

      // 2) 테스트넷 펀딩 진행
      const fundResult = await this.xrplClient.fundWallet(wallet);
      logger.info(`계정 펀딩 완료: ${fundResult.balance} XRP`);

      // 3) 메모리 저장 후 XRPL 최신 정보 로드
      const newAccount = {
        address: wallet.address,
        secret: wallet.seed,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        balance: parseFloat(XRPLClient.xrpToDrops(fundResult.balance))|| 0,
        balanceXRP: fundResult.balance,
        userId: nickname,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.accounts.set(wallet.address, newAccount);
      // 최신 XRPL 정보로 갱신
      await this.getAccountInfo(wallet.address);
      const newLoadedAccount = this.accounts.get(wallet.address);
      // 임시
      newLoadedAccount.secret = newAccount.secret;
      // 4) 잔액/시퀀스 등 최신 상태를 DB에도 반영 (테이블 upsert)
      try {
        await supabase
          .from('accounts')
          .upsert({
            address: newLoadedAccount.address,
            user_id: newLoadedAccount.userId,
            secret: newAccount.secret,
            public_key: newAccount.publicKey,
            private_key: newAccount.privateKey,
            balance_xrp: newLoadedAccount.balanceXRP,
            balance_drops: newLoadedAccount.balance,
            sequence: newLoadedAccount.sequence,
            owner_count: newLoadedAccount.ownerCount,
            flags: newLoadedAccount.flags,
            cred:1,
          }, { onConflict: 'address' });
      } catch (e) {
        logger.warn('accounts upsert 실패(무시 가능):', e?.message || e);
      }
      const issuerSeed = process.env.ADMIN_SEED;//'sEdVLjhbwKbyCBCBsz6iJamnbnfpzvN'
      const subjectAddress = newAccount.secret;
      const credentialType = process.env.CRED_TYPE;
      const uri = process.env.CRED_TYPE;

      const result = await this.createCredential({
        issuerSeed,
        subjectAddress,
        credentialType,
        expirationHours: 8760,  // 8760시간 = 1년
        uri
      });

      const statusCode = result.success ? 201 : 400;
      if(statusCode==400) {
        logger.error("계정 생성 실패");
        return { success: false, message: "credentail 실패", account: null };
      }

      logger.info(`계정 생성 완료: ${newLoadedAccount.address}`);

      return { success: true, account: newLoadedAccount };
    } catch (error) {
      logger.error("계정 생성 실패:", error);
      return { success: false, message: error.message, account: null };
    }
  }

  /**
   * 계정 정보 조회 및 업데이트 닉네임
   * @param {string} address - 조회할 계정 주소
   * @returns {Promise<Object>} 조회 결과
   */
  async getAccountInfoToNickName(nickname) {
    let storedRow = null;
    try {

      // 1) DB에서 기존 저장 레코드 조회
      try {
        const { data: row, error: dbError } = await supabase
          .from('accounts')
          .select('address,user_id,secret,public_key,private_key,balance_drops,balance_xrp,sequence,owner_count,flags,created_at,updated_at')
          .eq('user_id', nickname)
          .maybeSingle();
        if (dbError) {
          logger.warn('DB 조회 오류(getAccountInfo):', dbError.message);
        } else {
          storedRow = row;
        }
      } catch (e) {
        logger.warn('DB 조회 예외(getAccountInfo):', e?.message || e);
      }

      // 2) XRPL에서 최신 계정 상태 조회
      const response = await xrplClient.request({
        command: "account_info",
        account: storedRow.address,
        ledger_index: "validated",
      });

      const accountData = response.result.account_data;
      // 핵심 정보 구성
      const accountInfo = {
        address: storedRow.address,
        balance: parseFloat(accountData.Balance)|| 0,
        balanceXRP: parseFloat(XRPLClient.dropsToXrp(accountData.Balance))|| 0,
        sequence: accountData.Sequence,           // 트랜잭션 순서
        ownerCount: accountData.OwnerCount,      // 계정이 소유한 항목 수
        flags: accountData.Flags,                // 계정 설정 플래그
        updatedAt: new Date().toISOString(),
      };

      // 3) DB 레코드와 병합 (닉네임/생성시각 등)
      const merged = {
        ...accountInfo,
        userId: storedRow?.user_id || undefined,
        publicKey: storedRow?.public_key || accountInfo.publicKey,
        privateKey: storedRow?.private_key || accountInfo.privateKey,
        createdAt: storedRow?.created_at || accountInfo.createdAt,
        secret: storedRow?.secret || null,
      };

      // 메모리 캐시 갱신(옵션)
      this.accounts.set(storedRow.address, merged);

      // 4) DB 최신 상태 반영 (테이블 upsert)
      try {
        await supabase
          .from('accounts')
          .upsert({
            address: merged.address,
            user_id: merged.userId || null,
            public_key: merged.publicKey || null,
            balance_xrp: merged.balanceXRP,
            balance_drops: merged.balance,
            sequence: merged.sequence,
            owner_count: merged.ownerCount,
            flags: merged.flags,
          }, { onConflict: 'address' });
      } catch (e) {
        logger.warn('accounts upsert 실패(무시 가능):', e?.message || e);
      }

      logger.info(`계정 정보 조회 완료: ${storedRow.address}`);
      return {
        success: true,
        account: merged,
      };
    } catch (error) {
      const isNotFound = error.message?.includes("actNotFound");
      const errorType = isNotFound ? "ACCOUNT_NOT_FOUND" : "QUERY_ERROR";
      const message = isNotFound ? "존재하지 않는 계정입니다" : error.message;

      logger[isNotFound ? "warn" : "error"](`계정 정보 조회 실패 (${storedRow.address}):`, error);

      return {
        success: false,
        message,
        account: null,
        errorType,
      };
    }
  }

  /**
   * 계정 정보 조회 및 업데이트
   * @param {string} address - 조회할 계정 주소
   * @returns {Promise<Object>} 조회 결과
   */
  async getAccountInfo(address) {
    try {
      const validAddress = this.validateAddress(address);

      // 1) DB에서 기존 저장 레코드 조회
      let storedRow = null;
      try {
        const { data: row, error: dbError } = await supabase
          .from('accounts')
          .select('address,user_id,secret,public_key,private_key,balance_drops,balance_xrp,sequence,owner_count,flags,created_at,updated_at')
          .eq('address', validAddress)
          .maybeSingle();
        if (dbError) {
          logger.warn('DB 조회 오류(getAccountInfo):', dbError.message);
        } else {
          storedRow = row;
        }
      } catch (e) {
        logger.warn('DB 조회 예외(getAccountInfo):', e?.message || e);
      }

      // 2) XRPL에서 최신 계정 상태 조회
      const response = await xrplClient.request({
        command: "account_info",
        account: validAddress,
        ledger_index: "validated",
      });

      const accountData = response.result.account_data;
      // 핵심 정보 구성
      const accountInfo = {
        address: validAddress,
        balance: parseFloat(accountData.Balance)|| 0,
        balanceXRP: parseFloat(XRPLClient.dropsToXrp(accountData.Balance))|| 0,
        sequence: accountData.Sequence,           // 트랜잭션 순서
        ownerCount: accountData.OwnerCount,      // 계정이 소유한 항목 수
        flags: accountData.Flags,                // 계정 설정 플래그
        updatedAt: new Date().toISOString(),
      };
      logger.info(storedRow.secret);

      // 3) DB 레코드와 병합 (닉네임/생성시각 등)
      const merged = {
        ...accountInfo,
        userId: storedRow?.user_id || undefined,
        publicKey: storedRow?.public_key || accountInfo.publicKey,
        privateKey: storedRow?.private_key || accountInfo.privateKey,
        createdAt: storedRow?.created_at || accountInfo.createdAt,
        secret : storedRow?.secret || null,
      };

      // 메모리 캐시 갱신(옵션)
      this.accounts.set(validAddress, merged);

      // 4) DB 최신 상태 반영 (테이블 upsert)
      try {
        await supabase
          .from('accounts')
          .upsert({
            address: merged.address,
            user_id: merged.userId || null,
            public_key: merged.publicKey || null,
            balance_xrp: merged.balanceXRP,
            balance_drops: merged.balance,
            sequence: merged.sequence,
            owner_count: merged.ownerCount,
            flags: merged.flags,
          }, { onConflict: 'address' });
      } catch (e) {
        logger.warn('accounts upsert 실패(무시 가능):', e?.message || e);
      }

      logger.info(`계정 정보 조회 완료: ${validAddress}`);
      return {
        success: true,
        account: merged,
      };
    } catch (error) {
      const isNotFound = error.message?.includes("actNotFound");
      const errorType = isNotFound ? "ACCOUNT_NOT_FOUND" : "QUERY_ERROR";
      const message = isNotFound ? "존재하지 않는 계정입니다" : error.message;

      logger[isNotFound ? "warn" : "error"](`계정 정보 조회 실패 (${address}):`, error);

      return {
        success: false,
        message,
        account: null,
        errorType,
      };
    }
  }

  /**
   * XRP 잔액만 조회
   * @param {string} address - XRPL 주소
   * @returns {Promise<Object>} 잔액 조회 결과
   */
  async getBalance(address) {
    try {
      const validAddress = this.validateAddress(address);
      const balanceXRP = parseFloat(await xrplClient.getXrpBalance(validAddress)) || 0;
      const balance = parseFloat(XRPLClient.xrpToDrops(balanceXRP))|| 0;
      logger.error(`balanceXRP (${address}):`, parseFloat(await xrplClient.getXrpBalance(validAddress)));
      logger.error(`balance (${address}):`, parseFloat(XRPLClient.xrpToDrops(balanceXRP))|| 0);

      // DB에도 최신 잔액 반영 (upsert by address)
      try {
        await supabase
          .from('accounts')
          .upsert({
            address: validAddress,
            balance_xrp: balanceXRP,
            balance_drops: balance,
          }, { onConflict: 'address' });
      } catch (e) {
        logger.warn('accounts upsert(잔액) 실패(무시 가능):', e?.message || e);
      }

      return {
        success: true,
        data: {
          address: validAddress,
          balance,
          balanceXRP
        },
        message: "잔액 조회 성공"
      };
    } catch (error) {
      logger.error(`잔액 조회 실패 (${address}):`, error);
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * XRP 전송
   * @param {Object} txRequest - 트랜잭션 요청 정보
   * @param {string} txRequest.fromAddress - 송금자 주소
   * @param {string} txRequest.toAddress - 수금자 주소
   * @param {number} txRequest.amount - 전송 금액 (XRP)
   * @param {string} txRequest.secret - 송금자 시크릿
   * @returns {Promise<Object>} 전송 결과
   */
  async sendPayment(txRequest) {
    try {
      console.log(txRequest.toAddress)
      const validToAddress = this.validateAddress(txRequest.toAddress);
      const validFromAddress = this.validateAddress(txRequest.fromAddress);

      if (!txRequest.secret) throw new Error("시드값은 필수입니다");
      if (!txRequest.amount || txRequest.amount <= 0) {
        throw new Error("유효한 송금액이 필요합니다");
      }

      logger.info(`XRP 전송 시작: ${txRequest.amount} XRP (${validFromAddress} → ${validToAddress})`);

      const wallet = XRPLClient.walletFromSeed(txRequest.secret);

      // 트랜잭션 준비
      const prepared = await this.xrplClient.autofill({
        TransactionType: "Payment",
        Account: validFromAddress,
        Amount: XRPLClient.xrpToDrops(txRequest.amount),
        Destination: validToAddress,
        LastLedgerSequence: (await this.xrplClient.getLedgerIndex()) + 200,
      });

      // 서명 및 제출 (sign 생략 → wallet 넘김)
      const result = await this.xrplClient.submitAndWait(prepared, { wallet });

      const txResult = result.result;
      const transactionResult = txResult.meta?.TransactionResult;
      const isSuccess = transactionResult === "tesSUCCESS";

      logger.info(`XRP 전송 ${isSuccess ? "성공" : "실패"}: ${txResult.hash}`);

const transactionData = {
      hash: txResult.hash,
      amount: txRequest.amount,
      fromAddress: validFromAddress,
      toAddress: validToAddress,
      address: validFromAddress, // 추가 컬럼 (송신자 주소로 설정)
      timestamp: new Date().toISOString(),
      status: isSuccess ? "success" : "failed",
      txType: "Payment",
      fee: parseFloat(XRPLClient.dropsToXrp(prepared.Fee || "0"))
    };

    // ✅ 트랜잭션 DB에 저장
    if (isSuccess) {
      try {
        const { success: saveSuccess, error: saveError } = await this.saveTransactionToDB(transactionData);
        if (!saveSuccess) {
          logger.warn('트랜잭션 DB 저장 실패:', saveError);
        }
      } catch (dbError) {
        logger.warn('트랜잭션 DB 저장 중 예외:', dbError);
      }
    }

      // 계정 정보 업데이트
      // await this.getAccountInfo(txRequest.toAddress);
      await this.getAccountInfo(txRequest.fromAddress);

      return {
        success: isSuccess,
        message: isSuccess ? undefined : `트랜잭션 실패: ${transactionResult}`,
        transaction: {
          hash: txResult.hash,
          amount: txRequest.amount,
          fromAddress: validFromAddress,
          toAddress: validToAddress,
          timestamp: new Date().toISOString(),
          status: isSuccess ? "success" : "failed",
        },
      };
    } catch (error) {
      logger.error("XRP 전송 실패:", error);
      return {
        success: false,
        message: error.message,
        transaction: null,
      };
    }
  }

/**
 * 트랜잭션 내역 조회 (DB 기반)
 * @param {string} address - 계정 주소
 * @param {number} limit - 조회할 트랜잭션 수 (기본값: 20)
 * @returns {Promise<Object>} 트랜잭션 내역
 */
async getTransactionHistory(address, limit = 20) {
  try {
    const validAddress = this.validateAddress(address);

    logger.info(`DB 트랜잭션 내역 조회 시작: ${validAddress} (limit: ${limit})`);

    // Supabase에서 트랜잭션 조회
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`address.eq.${validAddress},from_address.eq.${validAddress},to_address.eq.${validAddress}`) // address, from_address, to_address 중 하나라도 매칭
      .order('timestamp', { ascending: false }) // 최신순 정렬
      .limit(limit);

    if (error) {
      logger.error(`트랜잭션 내역 조회 실패 (${validAddress}):`, error);
      return {
        success: false,
        message: error.message,
        transactions: [],
      };
    }

    // DB 데이터를 기존 형태로 변환
    const formattedTransactions = transactions.map(tx => ({
      hash: tx.hash,
      amount: parseFloat(tx.amount),
      fromAddress: tx.from_address,
      toAddress: tx.to_address,
      timestamp: tx.timestamp,
      status: tx.status,
      txType: tx.tx_type,
      fee: parseFloat(tx.fee || 0),
    }));

    logger.info(`DB 트랜잭션 내역 조회 성공: ${validAddress} (${formattedTransactions.length}건)`);

    return {
      success: true,
      transactions: formattedTransactions,
    };
  } catch (error) {
    logger.error(`트랜잭션 내역 조회 중 예외 발생 (${address}):`, error);

    return {
      success: false,
      message: error.message,
      transactions: [],
    };
  }
}


  /**
   * 저장된 계정 정보 조회
   * @param {string} address - XRPL 계정 주소
   * @returns {Object|null} 저장된 계정 정보
   */
  getStoredAccount(address) {
    const account = this.accounts.get(address) || null;
    logger.debug(`저장된 계정 조회: ${address} → ${account ? "존재함" : "없음"}`);
    return account;
  }

  /**
   * 모든 저장된 계정 목록 조회
   * @returns {Array<Object>} 저장된 계정 목록
   */
  async getAllStoredAccounts() {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('address,user_id,public_key,private_key,balance_drops,balance_xrp,sequence,owner_count,flags,created_at,updated_at')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const accounts = (data || []).map((row) => ({
        address: row.address,
        publicKey: row.public_key || undefined,
        privateKey: row.private_key || undefined,
        balance: Number(row.balance_drops) || 0,
        balanceXRP: Number(row.balance_xrp) || 0,
        userId: row.user_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        sequence: row.sequence,
        ownerCount: row.owner_count,
        flags: row.flags,
      }));

      logger.debug(`전체 저장된 계정 수: ${accounts.length}`);
      return accounts;
    } catch (e) {
      logger.error('계정 목록 조회 실패:', e);
      return [];
    }
  }

  /**
   * 계정 정보 삭제
   * @param {string} address - 삭제할 XRPL 계정 주소
   * @returns {boolean} 삭제 성공 여부
   */
  deleteAccount(address) {
    const deleted = this.accounts.delete(address);
    logger[deleted ? "info" : "warn"](`계정 삭제 ${deleted ? "완료" : "실패"}: ${address}`);
    return deleted;
  }

  // accountService.js 파일 끝부분에 추가


  /**
   * Credential 생성 - 발급자가 자격증명을 생성
   * @param {Object} credentialRequest
   * @param {string} credentialRequest.issuerSeed - 발급자 시드
   * @param {string} credentialRequest.subjectAddress - 피발급자 주소
   * @param {string} credentialRequest.credentialType - 자격증명 타입
   * @param {number} credentialRequest.expirationHours - 만료 시간(시간 단위, 기본 24시간)
   * @param {string} credentialRequest.uri - 자격증명 URI (선택사항)
   */
  async createCredential({ issuerSeed, subjectAddress, credentialType, expirationHours = 24, uri }) {
    try {
      if (!issuerSeed || !subjectAddress || !credentialType) {
        throw new Error("필수 파라미터가 누락되었습니다: issuerSeed, subjectAddress, credentialType");
      }

      logger.info(`Credential 생성 시작: ${credentialType} for ${subjectAddress}`);

      // 시드 유효성 검증
      const issuerValidation = this.validateSeed(issuerSeed);
      if (!issuerValidation.isValid) {
        throw new Error(`발급자 시드 오류: ${issuerValidation.error}`);
      }

      // 피발급자 주소 유효성 검증
      const validSubjectAddress = this.validateSeed(subjectAddress);

      // 발급자 지갑 생성
      const issuerWallet = XRPLClient.walletFromSeed(issuerSeed);

      // 자격증명 만료시간 계산
      const expiration = now() + (expirationHours * 3600);
      // CredentialCreate 트랜잭션 구성
      const transaction = {
        TransactionType: "CredentialCreate",
        Account: issuerWallet.classicAddress,           // 발급자가 서명하고 전송
        Subject: validSubjectAddress.address,            // 피발급자
        CredentialType: toHex(credentialType),
        Expiration: expiration,
        ...(uri && { URI: toHex(uri) })
      };

      logger.info("Credential 생성 트랜잭션:", JSON.stringify(transaction, null, 2));

      // 트랜잭션 실행
      const prepared = await this.xrplClient.autofill(transaction);
      const signed   = issuerWallet.sign(prepared);
      const result = await this.xrplClient.submitAndWait(signed.tx_blob);//prepared, { wallet: issuerWallet }

      const txResult = result.result;
      const transactionResult = txResult.meta?.TransactionResult;
      const isSuccess = transactionResult === "tesSUCCESS";

      logger.info(`Credential 생성 ${isSuccess ? "성공" : "실패"}: ${txResult.hash}`);

      return {
        success: isSuccess,
        message: isSuccess ? "자격증명 생성이 완료되었습니다" : `트랜잭션 실패: ${transactionResult}`,
        credential: {
          hash: txResult.hash,
          credentialType,
          issuerAddress: issuerWallet.address,
          subjectAddress: validSubjectAddress,
          expiration: new Date(expiration * 1000).toISOString(),
          uri,
          timestamp: new Date().toISOString(),
          status: isSuccess ? "created" : "failed",
          transactionResult
        }
      };

    } catch (error) {
      logger.error("Credential 생성 실패:", error);
      return {
        success: false,
        message: error.message,
        credential: null
      };
    }
  }

  /**
   * Credential 수락 - 피발급자가 자격증명을 수락
   */
  async acceptCredential({ subjectSeed, credentialType }) {
    try {
      if (!subjectSeed || !credentialType) {
        throw new Error("필수 파라미터가 누락되었습니다: subjectSeed, credentialType");
      }
      const issuerWallet = XRPLClient.walletFromSeed(process.env.ADMIN_SEED);
      const issuerAddress = issuerWallet.address;

      logger.info(`Credential 수락 시작: ${credentialType} from ${issuerAddress}`);

      const seedValidation = this.validateSeed(subjectSeed);
      if (!seedValidation.isValid) {
        throw new Error(seedValidation.error);
      }

      const validIssuerAddress = this.validateAddress(issuerAddress);
      const subjectWallet = XRPLClient.walletFromSeed(subjectSeed);

      const transaction = {
        TransactionType: "CredentialAccept",
        Account: subjectWallet.address,     // 피발급자가 서명하고 전송
        Issuer: validIssuerAddress,
        CredentialType: toHex(credentialType)
      };

      const prepared = await this.xrplClient.autofill(transaction);
      const result = await this.xrplClient.submitAndWait(prepared, { wallet: subjectWallet });

      const txResult = result.result;
      const transactionResult = txResult.meta?.TransactionResult;
      const isSuccess = transactionResult === "tesSUCCESS";

      logger.info(`Credential 수락 ${isSuccess ? "성공" : "실패"}: ${txResult.hash}`);

      if (isSuccess) {
        // 디비 고치기 - 자격증명 발급 완료 상태로 업데이트
        try {
          const { data: updateResult, error: updateError } = await supabase
            .from('accounts') // 테이블명 (실제 테이블명으로 변경)
            .update({ 
              cred: 2,
              updated_at: new Date().toISOString()
            })
            .eq('address', subjectWallet.address) // 피발급자 주소로 찾기
            .select(); // 업데이트된 데이터 반환

          if (updateError) {
            logger.error(`계정 cred 업데이트 실패 (${subjectWallet.address}):`, updateError);
          } else {
            logger.info(`계정 cred 업데이트 완료 (${subjectWallet.address}): cred = 2`);
            console.log('업데이트된 데이터:', updateResult);
          }
        } catch (dbError) {
          logger.error('데이터베이스 업데이트 중 예외 발생:', dbError);
        }
      }
     
      return {
        success: isSuccess,
        message: isSuccess ? "자격증명 수락이 완료되었습니다" : `트랜잭션 실패: ${transactionResult}`,
        transaction: {
          hash: txResult.hash,
          credentialType,
          issuerAddress: validIssuerAddress,
          subjectAddress: subjectWallet.address,
          timestamp: new Date().toISOString(),
          status: isSuccess ? "accepted" : "failed",
          transactionResult
        }
      };

    } catch (error) {
      logger.error("Credential 수락 실패:", error);
      return {
        success: false,
        message: error.message,
        transaction: null
      };
    }
  }

  /**
   * Credential 삭제 - 피발급자가 본인의 자격증명을 삭제
   */
  async deleteCredential({ subjectSeed, issuerAddress, credentialType }) {
    try {
      if (!subjectSeed || !issuerAddress || !credentialType) {
        throw new Error("필수 파라미터가 누락되었습니다: subjectSeed, issuerAddress, credentialType");
      }

      logger.info(`Credential 삭제 시작: ${credentialType} from ${issuerAddress}`);

      const seedValidation = this.validateSeed(subjectSeed);
      if (!seedValidation.isValid) {
        throw new Error(seedValidation.error);
      }

      const validIssuerAddress = this.validateAddress(issuerAddress);
      const subjectWallet = XRPLClient.walletFromSeed(subjectSeed);

      const transaction = {
        TransactionType: "CredentialDelete",
        Account: subjectWallet.address,       // 본인이 서명하고 전송
        Issuer: validIssuerAddress,           // 발급자 명시
        Subject: subjectWallet.address,       // 본인 명시
        CredentialType: toHex(credentialType)
      };

      const prepared = await this.xrplClient.autofill(transaction);
      const result = await this.xrplClient.submitAndWait(prepared, { wallet: subjectWallet });

      const txResult = result.result;
      const transactionResult = txResult.meta?.TransactionResult;
      const isSuccess = transactionResult === "tesSUCCESS";

      logger.info(`Credential 삭제 ${isSuccess ? "성공" : "실패"}: ${txResult.hash}`);

      return {
        success: isSuccess,
        message: isSuccess ? "자격증명 삭제가 완료되었습니다" : `트랜잭션 실패: ${transactionResult}`,
        transaction: {
          hash: txResult.hash,
          credentialType,
          issuerAddress: validIssuerAddress,
          subjectAddress: subjectWallet.address,
          timestamp: new Date().toISOString(),
          status: isSuccess ? "deleted" : "failed",
          transactionResult
        }
      };

    } catch (error) {
      logger.error("Credential 삭제 실패:", error);
      return {
        success: false,
        message: error.message,
        transaction: null
      };
    }
  }

  /**
   * Credential 조회 - 특정 계정의 모든 자격증명 조회
   */
  async checkCredentials({ accountSeed }) {
    try {
      if (!accountSeed) {
        throw new Error("필수 파라미터가 누락되었습니다: accountSeed");
      }

      logger.info("Credentials 조회 시작");

      const seedValidation = this.validateSeed(accountSeed);
      if (!seedValidation.isValid) {
        throw new Error(seedValidation.error);
      }

      const wallet = XRPLClient.walletFromSeed(accountSeed);
      
      // account_objects 요청으로 모든 Credential 조회
      const allCredentials = [];
      let marker = undefined;

      do {
        const requestParams = {
          command: "account_objects",
          account: wallet.address,
          limit: 400,
          ...(marker && { marker })
        };

        const response = await this.xrplClient.request(requestParams);
        const accountObjects = response.result.account_objects || [];
        
        // Credential 타입만 필터링
        const credentials = accountObjects.filter(
          obj => obj.LedgerEntryType === "Credential"
        );

        allCredentials.push(...credentials);
        marker = response.result.marker;

      } while (marker);

      logger.info(`${allCredentials.length}개의 Credentials 조회 완료`);

      // 자격증명 데이터 포맷팅
      const formattedCredentials = allCredentials.map(cred => ({
        credentialId: cred.PreviousTxnID || cred.index,
        credentialType: cred.CredentialType ? fromHex(cred.CredentialType) : 'Unknown',
        issuer: cred.Issuer,
        subject: cred.Subject,
        expiration: cred.Expiration ? new Date(cred.Expiration * 1000).toISOString() : null,
        uri: cred.URI ? fromHex(cred.URI) : null,
        flags: cred.Flags,
        ownerNode: cred.OwnerNode,
        ledgerEntryType: cred.LedgerEntryType
      }));

      return {
        success: true,
        message: `${allCredentials.length}개의 자격증명을 조회했습니다`,
        credentials: formattedCredentials,
        account: wallet.address,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error("Credentials 조회 실패:", error);
      return {
        success: false,
        message: error.message,
        credentials: [],
        account: null
      };
    }
  }

  /**
   * 계정 정보 조회 및 업데이트 닉네임
   * @returns {Promise<Object>} 조회 결과
   */
  async getAdminAddress() {
    let storedRow = null;
    try {
      const issuerWallet = XRPLClient.walletFromSeed(process.env.ADMIN_SEED);
      const issuerAddress = issuerWallet.address;
      return issuerAddress;
    } catch (error) {
      
    }
  }

  /**
 * 트랜잭션을 데이터베이스에 저장
 */
async saveTransactionToDB(transactionData) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        hash: transactionData.hash,
        amount: parseFloat(transactionData.amount),
        from_address: transactionData.fromAddress,
        to_address: transactionData.toAddress,
        address: transactionData.address,
        timestamp: transactionData.timestamp,
        status: transactionData.status,
        tx_type: transactionData.txType,
        fee: transactionData.fee
      })
      .select()
      .single();

    if (error) {
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

}

module.exports = { AccountService, accountService: new AccountService() };