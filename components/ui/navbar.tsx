"use client";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
const navItems = [
  { label: "Library", href: "/" },
  { label: "Add New", href: "/books/new" },
];
const Navbar = () => {
  const pathname = usePathname();
  return (
    <div>
      <header className="w-full fixed z-50 bg('--bg-primary')">
        <div className="wrapper navbar-height py-4 flex justify-between items-center">
          <Link href={"/"} className="flex gap-0.5 items-center">
            <Image
              src="/assets/logo.png"
              alt="BookifyAi Logo"
              width={40}
              height={26}
            />
            <span className="logo-text">BookifyAi</span>
          </Link>
          <nav className="w-fit flex gap-7.5 items-center">
            {navItems.map(({ label, href }) => {
              const isActive =
                pathname === href ||
                (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  href={href}
                  key={label}
                  className={`nav-link-base ${isActive ? "nav-link-active" : "text-black hover:backdrop-opacity-70"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    </div>
  );
};

export default Navbar;
