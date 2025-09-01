import React, { useState } from "react";
import { useXRPL } from "../hooks/useXRPL";
import {
  ArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export const XRPTransfer: React.FC = () => {
  const { wallet, sendXRP, getBalance } = useXRPL();
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet) {
      setError("Wallet not connected");
      return;
    }

    if (!destination || !amount) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const txResult = await sendXRP(destination, amount);
      if (txResult) {
        setResult(txResult);
        // 잔액 새로고침
        if (wallet.address) {
          await getBalance(wallet.address);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setDestination("");
    setAmount("");
    setResult(null);
    setError(null);
  };

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
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Send XRP</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="destination"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Destination Address
          </label>
          <input
            type="text"
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            className="input-field"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Amount (XRP)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10"
            step="0.000001"
            min="0.000001"
            className="input-field"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-800 mb-2">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="font-medium">Transaction Successful!</span>
            </div>
            <div className="text-sm text-green-700">
              <p>
                Hash:{" "}
                <span className="font-mono break-all">
                  {result.result.hash}
                </span>
              </p>
              <p>Ledger Index: {result.result.ledger_index}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading || !destination || !amount}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <ArrowUpIcon className="h-4 w-4 animate-bounce" />
                <span>Sending...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <ArrowUpIcon className="h-4 w-4" />
                <span>Send XRP</span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="btn-secondary"
            disabled={isLoading}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

