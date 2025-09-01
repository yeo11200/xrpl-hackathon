import React from "react";
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export const Transactions: React.FC = () => {
  // 임시 트랜잭션 데이터
  const transactions = [
    {
      id: "1",
      type: "Payment",
      amount: "100 XRP",
      from: "rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      to: "rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      status: "confirmed",
      timestamp: "2024-01-15 14:30:00",
      hash: "0x1234567890abcdef...",
    },
    {
      id: "2",
      type: "Payment",
      amount: "50 XRP",
      from: "rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      to: "rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      status: "pending",
      timestamp: "2024-01-15 15:45:00",
      hash: "0xabcdef1234567890...",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link
                to="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Transaction History
              </h1>
            </div>
            <div></div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Transactions
            </h2>
            <div className="flex space-x-2">
              <button className="btn-secondary">Filter</button>
              <button className="btn-primary">Export</button>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No transactions yet
              </h3>
              <p className="text-gray-500">
                Start using your wallet to see transaction history here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                        <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{tx.type}</h4>
                        <p className="text-sm text-gray-500">{tx.timestamp}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{tx.amount}</p>
                      <p className="text-sm text-gray-500">
                        {tx.status === "confirmed" ? "Confirmed" : "Pending"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">From:</span>
                        <p className="font-mono text-gray-900 break-all">
                          {tx.from}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">To:</span>
                        <p className="font-mono text-gray-900 break-all">
                          {tx.to}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">Hash:</span>
                      <p className="font-mono text-xs text-gray-900 break-all">
                        {tx.hash}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

