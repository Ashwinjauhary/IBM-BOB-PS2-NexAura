"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  Compass,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/auth";
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Compass },
    { href: "/matches", label: "Matches", icon: Search },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(10, 10, 11, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "var(--text-primary)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-md)",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🔍
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: "1.1rem",
              letterSpacing: "-0.02em",
            }}
          >
            LostFound
          </span>
        </Link>

        {/* Desktop Nav */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
          className="desktop-nav"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  color: isActive(link.href)
                    ? "var(--accent-blue)"
                    : "var(--text-secondary)",
                  background: isActive(link.href)
                    ? "var(--accent-blue-glow)"
                    : "transparent",
                  transition: "all 0.2s ease",
                }}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right section */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {user ? (
            <>
              <Link
                href="/matches"
                style={{
                  padding: 8,
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-secondary)",
                  display: "flex",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
                title="Notifications"
              >
                <Bell size={20} />
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  padding: 8,
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-secondary)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  transition: "all 0.2s ease",
                }}
                title="Sign out"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="btn-primary"
              style={{
                textDecoration: "none",
                padding: "8px 20px",
                fontSize: "0.85rem",
              }}
            >
              Sign In
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              padding: 8,
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "none",
            }}
            className="mobile-menu-btn"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          style={{
            padding: "8px 16px 16px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  color: isActive(link.href)
                    ? "var(--accent-blue)"
                    : "var(--text-secondary)",
                  background: isActive(link.href)
                    ? "var(--accent-blue-glow)"
                    : "transparent",
                }}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
