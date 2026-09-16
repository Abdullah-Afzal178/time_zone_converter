import { ImageResponse } from "next/og";

import { PAGE_DESCRIPTION, SITE_NAME } from "@/lib/constants";

export const runtime = "edge";
export const alt = SITE_NAME;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const BAND = [
  "#1e1b4b", "#1e1b4b", "#312e81", "#fb923c", "#fbbf24", "#fde68a",
  "#fbbf24", "#a78bfa", "#4c1d95", "#1e1b4b",
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          width: "100%",
          background: "#140f21",
          color: "#f4f1ea",
          padding: "64px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              color: "#fbbf24",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              marginTop: "28px",
              fontSize: "66px",
              lineHeight: 1.05,
              fontWeight: 700,
              maxWidth: "900px",
            }}
          >
            Current time worldwide, and any conversion between zones.
          </div>
          <div
            style={{
              marginTop: "22px",
              fontSize: "26px",
              lineHeight: 1.4,
              color: "#b8b2c8",
              maxWidth: "860px",
            }}
          >
            {PAGE_DESCRIPTION}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {BAND.map((color, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                flex: 1,
                height: "64px",
                borderRadius: "8px",
                background: color,
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
