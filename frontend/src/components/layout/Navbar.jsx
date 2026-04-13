import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    [
      "rounded-xl border border-transparent px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ss-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ss-navbar",
      isActive
        ? "border-ss-border/80 bg-ss-surface-soft/55 text-ss-neutral-100"
        : "text-ss-neutral-300 hover:bg-ss-surface-soft/30 hover:text-ss-neutral-100",
    ]
      .filter(Boolean)
      .join(" ");

  const navItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/subjects", label: "Subjects" },
    { to: "/planning", label: "Planning" },
    { to: "/calendar", label: "Calendar" },
    { to: "/statistics", label: "Statistics" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ss-navbar-border/70 bg-ss-navbar/95 backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="hidden md:block" aria-hidden="true" />

          <nav aria-label="Main navigation" className="hidden items-center justify-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center justify-end gap-3 md:flex">
            <span className="rounded-xl border border-ss-navbar-border/70 bg-ss-surface/30 px-3 py-2 text-sm text-ss-neutral-300">
              {user?.username || "User"}
            </span>
            <Button variant="secondary" size="sm" type="button" onClick={handleLogout}>
              Sign out
            </Button>
          </div>

          <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-ss-navbar-border/70 bg-ss-surface/20 text-ss-neutral-200 transition-colors hover:bg-ss-surface-soft/30 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          aria-controls="main-navigation"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="text-lg leading-none">{isOpen ? "X" : "="}</span>
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-ss-navbar-border/70 bg-ss-navbar px-4 py-4 md:hidden">
          <nav id="main-navigation" aria-label="Mobile navigation" className="flex flex-col gap-2.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navLinkClass}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-1 rounded-xl border border-ss-navbar-border/70 bg-ss-surface/35 px-3 py-2 text-sm text-ss-neutral-300">
              {user?.username || "User"}
            </div>
            <Button variant="secondary" size="sm" type="button" onClick={handleLogout}>
              Sign out
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
