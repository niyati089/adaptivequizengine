import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAFC",
        foreground: "#0F172A",
        primary: {
          DEFAULT: "#7C3AED", // Purple
          foreground: "#FFFFFF",
          indigo: "#6366F1",
        },
        secondary: {
          DEFAULT: "#06B6D4", // Cyan
          foreground: "#FFFFFF",
          pink: "#EC4899",
        },
        accent: {
          success: "#10B981", // Emerald
          warning: "#F59E0B", // Amber
        },
        muted: {
          DEFAULT: "#F1F5F9", // Soft gray
          foreground: "#64748B",
        },
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.7)",
          border: "rgba(255, 255, 255, 0.4)",
        }
      },
      borderRadius: {
        lg: "16px",
        xl: "24px",
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
