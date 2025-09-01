import React from "react";
import { useXRPL } from "../hooks/useXRPL";
import {
  WalletIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export const WalletConnection: React.FC = () => {
  const {
    wallet,
    isConnected,
    isLoading,
    error,
    connectToTestnet,
    generateWallet,
    disconnect,
  } = useXRPL();

  const handleConnect = async () => {
    await connectToTestnet();
  };

  const handleGenerateWallet = async () => {
    await generateWallet();
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center space-x-2">
          <ArrowPathIcon className="h-5 w-5 animate-spin text-xrpl-blue" />
          <span className="text-gray-600">Connecting to XRPL...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 text-red-600">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span>{error}</span>
        </div>
        <button onClick={handleConnect} className="btn-primary mt-3">
          Retry Connection
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="card">
        <div className="text-center">
          <WalletIcon className="h-12 w-12 mx-auto text-xrpl-blue mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect to XRPL Testnet
          </h3>
          <p className="text-gray-600 mb-4">
            Connect to the XRPL testnet to start building your dApp
          </p>
          <button onClick={handleConnect} className="btn-primary">
            Connect to Testnet
          </button>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="card">
        <div className="text-center">
          <WalletIcon className="h-12 w-12 mx-auto text-xrpl-green mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connected to XRPL Testnet
          </h3>
          <p className="text-gray-600 mb-4">
            Generate a new wallet to start transacting
          </p>
          <button onClick={handleGenerateWallet} className="btn-primary">
            Generate Wallet
          </button>
          <button onClick={handleDisconnect} className="btn-secondary ml-3">
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="text-center">
        <WalletIcon className="h-12 w-12 mx-auto text-xrpl-green mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Wallet Connected
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-500">Address:</span>
            <p className="font-mono text-sm break-all">{wallet.address}</p>
          </div>
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-500">Seed:</span>
            <p className="font-mono text-sm break-all">{wallet.seed}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleDisconnect} className="btn-secondary">
            Disconnect
          </button>
          <button onClick={handleGenerateWallet} className="btn-primary">
            New Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

