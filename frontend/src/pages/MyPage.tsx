import React from "react";
import MyPageComponent from "../components/MyPage";

export const MyPage: React.FC = () => {
  return (
    <div className="page-container bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MyPageComponent />
      </div>
    </div>
  );
};
