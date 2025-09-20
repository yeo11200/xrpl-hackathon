// components/CategoryDropdown.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./CategoryDropdown.css";

interface SubCategory {
  label: string;
  path: string;
}

interface Category {
  label: string;
  
}

const categoryData: Category[] = [
  {
    label: "Electronics",
    
  },
  {
    label: "Fashoin",
    
  },
  {
    label: "Home & Living",
   
  },
  {
    label: "Beauty",
    
  },
  {
    label: "Sports",
   
  }, 
  {
    label: "Books",
   
  },
];

const CategoryDropdown: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="category-dropdown-menu-2col">
      {/* 왼쪽 대분류 */}
      <div className="category-menu-left">
        {categoryData.map((cat, index) => (
          <div
            key={cat.label}
            className={`category-left-item ${
              activeIndex === index ? "active" : ""
            }`}
            onMouseEnter={() => setActiveIndex(index)}
          >
            {cat.label}
          </div>
        ))}
      </div>

      
        
      
    </div>
  );
};

export default CategoryDropdown;
