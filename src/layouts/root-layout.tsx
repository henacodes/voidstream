import { Outlet } from "react-router";

export default function RootLayout() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/*  <Navbar /> */}
      {/* Main Content Area */}
      <main className="pb-24">
        <Outlet />
      </main>
    </div>
  );
}
