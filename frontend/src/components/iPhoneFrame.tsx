import { type ReactNode } from "react";

type iPhoneFrameProps = {
  children: ReactNode;
  variant?: "notch" | "dynamic-island";
};

export function iPhoneFrame({ children, variant = "dynamic-island" }: iPhoneFrameProps) {
  return (
    <div
      style={{
        width: "375px",
        height: "812px",
        maxWidth: "100%",
        maxHeight: "90vh",
        aspectRatio: "375 / 812",
        backgroundColor: "#000",
        borderRadius: "40px",
        padding: "8px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Screen */}
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#000",
          borderRadius: "32px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Notch or Dynamic Island */}
        {variant === "notch" ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "150px",
              height: "30px",
              backgroundColor: "#000",
              borderBottomLeftRadius: "20px",
              borderBottomRightRadius: "20px",
              zIndex: 10,
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "126px",
              height: "37px",
              backgroundColor: "#000",
              borderRadius: "20px",
              zIndex: 10,
              boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.1)",
            }}
          />
        )}

        {/* Content */}
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            zIndex: 1,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}


