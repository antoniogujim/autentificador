import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#537b50",
        }}
      >
        <div style={{ width: 80, height: 16, background: "#ffffff" }} />
        <div style={{ width: 24, height: 68, background: "#ffffff" }} />
        <div style={{ width: 80, height: 16, background: "#ffffff" }} />
      </div>
    ),
    { ...size }
  );
}
