import React from "react";
import QpayMinimalShopping from "../components/QpayMinimalShopping";

export const QpayMinimalShoppingPage: React.FC = () => {
  console.log("QpayMinimalShoppingPage");
  return (
    <div className="page-container bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QpayMinimalShopping />
      </div>
    </div>
  );
};
