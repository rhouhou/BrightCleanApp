import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";

export default function ProfileMenu() {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile avatar button */}
      <img
        src={currentUser.avatar || "/default-avatar.png"}
        alt="avatar"
        className="h-10 w-10 rounded-full cursor-pointer object-cover"
        onClick={() => setOpen((prev) => !prev)}
      />

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-200 p-4 z-50">
          <div className="flex items-center gap-3 border-b pb-3">
            <img
              src={currentUser.avatar || "/default-avatar.png"}
              alt="avatar"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">{currentUser.username}</p>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 text-sm">
            <button
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
              className="hover:bg-gray-100 p-2 rounded-lg text-left"
            >
              Edit Profile
            </button>

            <button
              onClick={() => {
                setOpen(false);
                navigate("/settings");
              }}
              className="hover:bg-gray-100 p-2 rounded-lg text-left"
            >
              Settings
            </button>

            <button
              onClick={handleLogout}
              className="text-red-600 hover:bg-red-50 p-2 rounded-lg text-left"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
