import React from "react";

type DancingSquaresProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  inline?: boolean;
};

export const DancingSquares: React.FC<DancingSquaresProps> = ({ label, size = "md", inline = false }) => {
  const scale = size === "sm" ? 0.72 : size === "lg" ? 1.25 : 1;

  return (
    <div className={inline ? "dancing-loader dancing-loader-inline" : "dancing-loader"} style={{ ["--loader-scale" as string]: scale }}>
      <div className="dancing-squares" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      {label && <p className="dancing-loader-label">{label}</p>}
    </div>
  );
};
