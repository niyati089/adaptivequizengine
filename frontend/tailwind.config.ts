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
        // Map Tailwind colors to CSS variables for consistency
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-low": "var(--surface-low)",
        "surface-mid": "var(--surface-mid)",
        "surface-high": "var(--surface-high)",
        
        ink: "var(--ink)",
        "ink-secondary": "var(--ink-secondary)",
        muted: "var(--muted)",
        "muted-light": "var(--muted-light)",
        outline: "var(--outline)",
        
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          soft: "var(--primary-soft)",
          light: "var(--primary-light)",
        },
        
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
        },
        
        warning: {
          DEFAULT: "var(--warning)",
          soft: "var(--warning-soft)",
        },
        
        error: {
          DEFAULT: "var(--error)",
          soft: "var(--error-soft)",
        },
        
        info: {
          DEFAULT: "var(--info)",
          soft: "var(--info-soft)",
        },
        
        navy: "var(--navy)",
        coral: "var(--coral)",
        "pink-soft": "var(--pink-soft)",
        "blue-soft": "var(--blue-soft)",
        amber: "var(--amber)",
      },
      spacing: {
        // Map spacing scale to CSS variables
        0: "var(--space-0)",
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        16: "var(--space-16)",
        20: "var(--space-20)",
      },
      borderRadius: {
        none: "var(--radius-none)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        soft: "var(--shadow-soft)",
        glass: "var(--shadow-glass)",
        nav: "var(--shadow-nav)",
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        "4xl": "var(--text-4xl)",
        "5xl": "var(--text-5xl)",
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
