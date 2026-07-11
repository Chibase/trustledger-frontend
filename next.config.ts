import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard", destination: "/app/dashboard", permanent: false },
      { source: "/projects", destination: "/app/projects", permanent: false },
      { source: "/incidents", destination: "/app/incidents", permanent: false },
      {
        source: "/incidents/:id",
        destination: "/app/incidents/:id",
        permanent: false,
      },
      {
        source: "/issues/report",
        destination: "/app/issues/report",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/assessment",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://trustledger.co.za https://www.trustledger.co.za",
          },
        ],
      },
      {
        source: "/assessment/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://trustledger.co.za https://www.trustledger.co.za",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
