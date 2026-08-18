import { Link } from "react-router-dom";

export default function PublicHome() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-decoration-none">
            <h1 className="font-bold text-2xl m-0">
              <span className="text-sky-500">Bright</span>
              <span className="text-sky-700">Clean</span>
            </h1>
          </Link>

          <nav className="flex gap-4 items-center">
            <Link to="/" className="text-gray-700">
              Home
            </Link>

            <Link to="/shop" className="text-gray-700">
              Shop
            </Link>

            <Link
              to="/staff/login"
              className="text-gray-500 text-sm"
            >
              Staff
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold mb-4">
          BrightClean
        </h2>

        <p className="text-lg text-gray-600 mb-8">
          Locally produced cleaning products in Barja.
        </p>

        <Link
          to="/shop"
          className="inline-block bg-sky-600 text-white px-6 py-3 rounded-lg text-decoration-none"
        >
          Shop Products
        </Link>
      </main>
    </div>
  );
}