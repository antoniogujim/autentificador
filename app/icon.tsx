import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 6,
        }}
      >
        <div style={{ width: 14, height: 3, background: "#ffffff" }} />
        <div style={{ width: 4, height: 12, background: "#ffffff" }} />
        <div style={{ width: 14, height: 3, background: "#ffffff" }} />
      </div>
    ),
    { ...size }
  );
}
