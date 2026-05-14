import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Chatbot } from "@/components/chatbot/Chatbot";

export const AppLayout = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <main className="flex-1 animate-fade-in">
      <Outlet />
    </main>
    <footer className="border-t border-border/60 py-6">
      <div className="container text-center text-xs text-muted-foreground tracking-wide">
        © 2026 Attrix. All rights reserved.
      </div>
    </footer>
    <Chatbot />
  </div>
);
