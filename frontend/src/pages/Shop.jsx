import { Link } from "react-router-dom";

export default function Shop() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link to="/" className="text-sky-600">
          ← BrightClean
        </Link>

        <h1 className="text-3xl font-bold mt-6">
          Products
        </h1>

        <p className="text-gray-500 mt-3">
          Customer shop coming next.
        </p>
      </div>
    </div>
  );
}