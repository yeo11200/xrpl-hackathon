import React, { useState } from "react";
import { ArrowLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export const NFT: React.FC = () => {
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");
  const [nftUrl, setNftUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // NFT 생성 로직 구현
    console.log("Creating NFT:", { nftName, nftDescription, nftUrl });
  };

  return (
    <div className="min-h-screen">
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
                NFT Operations
              </h1>
            </div>
            <div></div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* NFT 생성 폼 */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New NFT
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="nftName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  NFT Name
                </label>
                <input
                  type="text"
                  id="nftName"
                  value={nftName}
                  onChange={(e) => setNftName(e.target.value)}
                  className="input-field"
                  placeholder="My Awesome NFT"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="nftDescription"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="nftDescription"
                  value={nftDescription}
                  onChange={(e) => setNftDescription(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Describe your NFT..."
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="nftUrl"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Metadata URL
                </label>
                <input
                  type="url"
                  id="nftUrl"
                  value={nftUrl}
                  onChange={(e) => setNftUrl(e.target.value)}
                  className="input-field"
                  placeholder="https://example.com/metadata.json"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                Create NFT
              </button>
            </form>
          </div>

          {/* NFT 정보 */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                NFT Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total NFTs:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Network:</span>
                  <span className="font-medium">XRPL Testnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Standard:</span>
                  <span className="font-medium">XLS-20</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full btn-secondary text-left">
                  Mint NFT
                </button>
                <button className="w-full btn-secondary text-left">
                  Transfer NFT
                </button>
                <button className="w-full btn-secondary text-left">
                  Burn NFT
                </button>
                <button className="w-full btn-secondary text-left">
                  View Collection
                </button>
              </div>
            </div>

            <div className="card bg-gradient-to-r from-purple-50 to-pink-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                About XRPL NFTs
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• XLS-20 standard for NFTs</p>
                <p>• Low transaction fees</p>
                <p>• Fast settlement</p>
                <p>• Built-in royalty support</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
