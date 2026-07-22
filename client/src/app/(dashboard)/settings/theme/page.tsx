"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeSettingsPage() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const sections = [
    {
      title: "Brand Colors",
      colors: [
        { name: "Primary", value: "#7dd3fc" },
        { name: "Secondary", value: "#0284c7" },
        { name: "Tertiary", value: "#4f46e5" },
      ],
    },
    {
      title: "System Surfaces",
      colors: [
        { name: "Background", value: "#0a0e1a" },
        { name: "Surface", value: "#141c2e" },
        { name: "Container", value: "#1a2438" },
      ],
    },
    {
      title: "Functional Colors",
      colors: [
        { name: "Success", value: "#22c55e" },
        { name: "Warning", value: "#facc15" },
        { name: "Error", value: "#ef4444" },
      ],
    },
    {
      title: "Quotation PDF",
      colors: [
        { name: "Header", value: "#1f4e63" },
        { name: "Footer", value: "#899298" },
      ],
    },
    {
      title: "Invoice PDF",
      colors: [
        { name: "Accent", value: "#7dd3fc" },
        { name: "Highlight", value: "#a5f3fc" },
      ],
    },
  ];

  return (
    <main className="bg-background text-on-background min-h-screen w-full overflow-y-auto">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">

          <div>
            <h1 className="text-4xl font-bold">
              Theme Settings
            </h1>

            <p className="text-on-surface-variant mt-2">
              Customize your application's visual identity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">

            <input
              placeholder="Search..."
              className="glass-input rounded-xl px-4 py-2 w-full sm:w-64"
            />

            <button
              onClick={toggleTheme}
              className="btn-primary rounded-xl px-5 py-2 whitespace-nowrap"
            >
              {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
            </button>

            <button className="glass-button rounded-xl px-5 py-2">
              Support
            </button>

            <button className="btn-primary rounded-xl px-5 py-2">
              Save
            </button>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT PANEL */}

          <div className="col-span-1 lg:col-span-8 space-y-6">

            {sections.map((section) => (

              <div
                key={section.title}
                className="glass-panel rounded-2xl p-6"
              >

                <h2 className="text-2xl font-semibold mb-6">
                  {section.title}
                </h2>

                <div className="space-y-5">

                  {section.colors.map((item) => (

                    <div
                      key={item.name}
                      className="flex items-center justify-between"
                    >

                      <div>
                        <p className="font-medium">
                          {item.name}
                        </p>

                        <p className="text-sm text-on-surface-variant">
                          Theme Color
                        </p>
                      </div>

                      <div className="flex items-center gap-3">

                        <input
                          type="color"
                          defaultValue={item.value}
                          className="w-12 h-12 rounded-lg"
                        />

                        <input
                          defaultValue={item.value}
                          className="glass-input rounded-lg px-3 py-2 w-36"
                        />

                      </div>

                    </div>

                  ))}

                </div>

              </div>

            ))}

          </div>
          {/* RIGHT PANEL */}

          <div className="col-span-1 lg:col-span-4">

            <div className="glass-elevated rounded-2xl p-6 sticky top-8">

              <h2 className="text-2xl font-semibold mb-6">
                Live Preview
              </h2>

              <div className="rounded-xl bg-surface-container p-5">

                <div className="flex justify-between items-center mb-5">

                  <div>
                    <p className="text-sm text-on-surface-variant">
                      Monthly Revenue
                    </p>

                    <h3 className="text-3xl font-bold">
                      $48,250
                    </h3>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-primary text-on-primary text-sm">
                    +12.5%
                  </span>

                </div>

                {/* Simple Bar Chart */}

                <div className="flex items-end justify-between h-52 gap-3 mt-8">

                  {[45, 70, 95, 60, 120, 90, 140].map((height, index) => (

                    <div
                      key={index}
                      className="flex-1 rounded-t-lg bg-primary transition-all duration-300 hover:opacity-80"
                      style={{ height: `${height}px` }}
                    />

                  ))}

                </div>

              </div>

              {/* Preview Card */}

              <div className="glass-panel rounded-xl p-5 mt-6">

                <h3 className="text-lg font-semibold mb-4">
                  Card Preview
                </h3>

                <div className="rounded-xl bg-primary text-on-primary p-5">

                  <p className="text-sm opacity-80">
                    Active Users
                  </p>

                  <h2 className="text-4xl font-bold mt-2">
                    2,847
                  </h2>

                  <p className="mt-4 text-sm">
                    ▲ 18% from last month
                  </p>

                </div>

              </div>

              {/* Buttons */}

              <div className="grid gap-3 mt-6">

                <button className="btn-primary rounded-xl py-3">
                  Apply Theme
                </button>

                <button className="glass-button rounded-xl py-3">
                  Reset Defaults
                </button>

                <button className="glass-button rounded-xl py-3">
                  Export Theme
                </button>

              </div>

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="mt-12 border-t border-outline pt-6 flex justify-between items-center">

          <div>

            <h3 className="font-semibold">
              Theme Configuration
            </h3>

            <p className="text-sm text-on-surface-variant">
              Changes are saved globally across your application.
            </p>

          </div>

          <button className="btn-primary px-8 py-3 rounded-xl">
            Save Changes
          </button>

        </div>

      </div>
    </main>
  );
}