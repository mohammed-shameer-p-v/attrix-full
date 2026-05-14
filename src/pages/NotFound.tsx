import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="text-7xl font-bold tracking-tight">404</div>
      <p className="mt-3 text-muted-foreground">This page doesn't exist.</p>
      <Link to="/home" className="mt-6 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:scale-[1.03] transition-all">Go home</Link>
    </div>
  );
}
