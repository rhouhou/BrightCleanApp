import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../redux/user/userSlice";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { error, loading } = useSelector(
    (state) => state.user
  );

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      dispatch(loginStart());

      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        dispatch(
          loginFailure(
            data.message || "Login failed"
          )
        );
        return;
      }

      dispatch(loginSuccess(data));

      navigate("/staff");
    } catch (error) {
      dispatch(loginFailure(error.message));
    }
  };

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl text-center font-semibold my-7">
        BrightClean Staff Login
      </h1>

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <input
          type="email"
          id="email"
          value={formData.email}
          placeholder="Email"
          required
          autoComplete="username"
          className="border p-3 rounded-lg"
          onChange={handleChange}
        />

        <input
          type="password"
          id="password"
          value={formData.password}
          placeholder="Password"
          required
          autoComplete="current-password"
          className="border p-3 rounded-lg"
          onChange={handleChange}
        />

        <button
          disabled={loading}
          className="bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {error && (
        <div className="text-red-500 text-center mt-4">
          {error}
        </div>
      )}
    </div>
  );
}