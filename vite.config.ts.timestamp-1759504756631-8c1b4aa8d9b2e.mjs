// vite.config.ts
import { wayfinder } from "file:///home/msimam/Gasify/node_modules/@laravel/vite-plugin-wayfinder/dist/index.mjs";
import tailwindcss from "file:///home/msimam/Gasify/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///home/msimam/Gasify/node_modules/@vitejs/plugin-react/dist/index.js";
import laravel from "file:///home/msimam/Gasify/node_modules/laravel-vite-plugin/dist/index.js";
import { defineConfig } from "file:///home/msimam/Gasify/node_modules/vite/dist/node/index.js";
var vite_config_default = defineConfig({
  plugins: [
    laravel({
      input: ["resources/css/app.css", "resources/js/app.tsx"],
      ssr: "resources/js/ssr.tsx",
      refresh: true
    }),
    react(),
    tailwindcss(),
    wayfinder({
      formVariants: true
    })
  ],
  esbuild: {
    jsx: "automatic"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9tc2ltYW0vR2FzaWZ5XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9tc2ltYW0vR2FzaWZ5L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL21zaW1hbS9HYXNpZnkvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyB3YXlmaW5kZXIgfSBmcm9tICdAbGFyYXZlbC92aXRlLXBsdWdpbi13YXlmaW5kZXInO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgbGFyYXZlbCBmcm9tICdsYXJhdmVsLXZpdGUtcGx1Z2luJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgbGFyYXZlbCh7XG4gICAgICAgICAgICBpbnB1dDogWydyZXNvdXJjZXMvY3NzL2FwcC5jc3MnLCAncmVzb3VyY2VzL2pzL2FwcC50c3gnXSxcbiAgICAgICAgICAgIHNzcjogJ3Jlc291cmNlcy9qcy9zc3IudHN4JyxcbiAgICAgICAgICAgIHJlZnJlc2g6IHRydWUsXG4gICAgICAgIH0pLFxuICAgICAgICByZWFjdCgpLFxuICAgICAgICB0YWlsd2luZGNzcygpLFxuICAgICAgICB3YXlmaW5kZXIoe1xuICAgICAgICAgICAgZm9ybVZhcmlhbnRzOiB0cnVlLFxuICAgICAgICB9KSxcbiAgICBdLFxuICAgIGVzYnVpbGQ6IHtcbiAgICAgICAganN4OiAnYXV0b21hdGljJyxcbiAgICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJPLFNBQVMsaUJBQWlCO0FBQ3JRLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sV0FBVztBQUNsQixPQUFPLGFBQWE7QUFDcEIsU0FBUyxvQkFBb0I7QUFFN0IsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUztBQUFBLElBQ0wsUUFBUTtBQUFBLE1BQ0osT0FBTyxDQUFDLHlCQUF5QixzQkFBc0I7QUFBQSxNQUN2RCxLQUFLO0FBQUEsTUFDTCxTQUFTO0FBQUEsSUFDYixDQUFDO0FBQUEsSUFDRCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixVQUFVO0FBQUEsTUFDTixjQUFjO0FBQUEsSUFDbEIsQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNMLEtBQUs7QUFBQSxFQUNUO0FBQ0osQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
