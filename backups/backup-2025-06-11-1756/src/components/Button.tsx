import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function Button({ children, onClick, className = "", style = {} }: ButtonProps) {
  const defaultStyle = {
    backgroundColor: "#0070f3",
    color: "white",
    padding: "0.5rem 1rem",
    borderRadius: "0.25rem",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
    ...style
  };
  
  return (
    <button
      onClick={onClick}
      style={defaultStyle}
      className={className}
    >
      {children}
    </button>
  );
}
