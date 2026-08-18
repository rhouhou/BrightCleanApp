import { useEffect, useState } from "react";
import {
  Outlet,
  Navigate,
} from "react-router-dom";

import {
  useDispatch,
} from "react-redux";

import {
  loginSuccess,
  logout,
} from "../redux/user/userSlice";

export default function PrivateRoute() {
  const dispatch = useDispatch();

  const [checking, setChecking] =
    useState(true);

  const [authorized, setAuthorized] =
    useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          dispatch(logout());
          setAuthorized(false);
          return;
        }

        const user = await response.json();

        dispatch(loginSuccess(user));
        setAuthorized(true);
      } catch (error) {
        console.error(
          "Session check failed:",
          error
        );

        dispatch(logout());
        setAuthorized(false);
      } finally {
        setChecking(false);
      }
    };

    checkSession();
  }, [dispatch]);

  if (checking) {
    return (
      <div className="p-5 text-center">
        Checking staff session...
      </div>
    );
  }

  return authorized ? (
    <Outlet />
  ) : (
    <Navigate
      to="/staff/login"
      replace
    />
  );
}