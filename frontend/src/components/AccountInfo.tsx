import React, { useState, useEffect } from "react";
import { useXRPL } from "../hooks/useXRPL";
import {
  UserIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export const AccountInfo: React.FC = () => {
  const { wallet, getBalance, getAccountInfo } = useXRPL();
  const [balance, setBalance] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAccountData = async () => {
    if (!wallet?.address) return;

    setIsLoading(true);
    try {
      const [balanceData, accountData] = await Promise.all([
        getBalance(wallet.address),
        getAccountInfo(wallet.address),
      ]);

      if (balanceData !== null) {
        setBalance(balanceData);
      }
      if (accountData !== null) {
        setAccountInfo(accountData);
      }
    } catch (error) {
      console.error("Failed to fetch account data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (wallet?.address) {
      fetchAccountData();
    }
  }, [wallet?.address]);

  if (!wallet) {
    return (
      <div className="card">
        <div className="text-center text-gray-500">
          Please connect a wallet first
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <UserIcon className="h-5 w-5 mr-2" />
          Account Information
        </h3>
        <button
          onClick={fetchAccountData}
          disabled={isLoading}
          className="btn-secondary p-2"
        >
          <ArrowPathIcon
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="space-y-4">
        {/* 잔액 정보 */}
        <div className="bg-gradient-to-r from-xrpl-blue to-xrpl-purple rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="h-6 w-6" />
              <span className="text-lg font-semibold">Balance</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <ArrowPathIcon className="h-6 w-6 animate-spin" />
                ) : balance ? (
                  `${parseFloat(balance).toFixed(6)} XRP`
                ) : (
                  "Loading..."
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 계정 상세 정보 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Account Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-mono text-gray-900 break-all">
                {wallet.address}
              </span>
            </div>

            {accountInfo && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sequence:</span>
                  <span className="font-mono text-gray-900">
                    {accountInfo.result.account_data.Sequence}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Owner Count:</span>
                  <span className="font-mono text-gray-900">
                    {accountInfo.result.account_data.OwnerCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Flags:</span>
                  <span className="font-mono text-gray-900">
                    {accountInfo.result.account_data.Flags}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 지갑 시드 (주의: 실제 프로덕션에서는 숨겨야 함) */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="text-yellow-600 mt-0.5">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                Wallet Seed (Keep Secret!)
              </h4>
              <p className="text-sm text-yellow-700 mb-2">
                This is your private key. Never share it with anyone!
              </p>
              <div className="bg-white border border-yellow-300 rounded px-3 py-2">
                <span className="font-mono text-sm text-gray-900 break-all">
                  {wallet.seed}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

