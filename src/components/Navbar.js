// OneFoodDialer - Enhanced Navbar with Authentication
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import { signOutWithSupabase, getCurrentUserWithBusiness } from "../lib/auth";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await loadUserProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        localStorage.removeItem("user");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      const userWithBusiness = await getCurrentUserWithBusiness(userId);
      setUser(userWithBusiness);

      // Update localStorage
      if (userWithBusiness) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: userWithBusiness.id,
            email: userWithBusiness.email,
            role: userWithBusiness.role,
            businessId: userWithBusiness.businessId,
            businesses: userWithBusiness.businesses,
            currentBusiness: userWithBusiness.currentBusiness,
          })
        );
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutWithSupabase();
      setUser(null);
      localStorage.removeItem("user");
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const switchBusiness = (businessId) => {
    // Update current business in user state
    const updatedUser = {
      ...user,
      businessId,
      currentBusiness: user.businesses.find((b) => b.id === businessId),
    };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setShowBusinessMenu(false);

    // Refresh the page to update data
    window.location.reload();
  };

  const getNavLinks = () => {
    if (!user) return [];

    const baseLinks = [{ href: "/", label: "Home" }];

    switch (user.role) {
      case "SUPER_ADMIN":
        return [
          ...baseLinks,
          { href: "/dashboard/admin", label: "Admin Dashboard" },
          { href: "/businesses", label: "Businesses" },
          { href: "/users", label: "Users" },
        ];
      case "BUSINESS_OWNER":
        return [
          ...baseLinks,
          { href: "/dashboard/admin", label: "Dashboard" },
          { href: "/admin", label: "Management" },
          { href: "/billing", label: "Billing" },
          { href: "/analytics", label: "Analytics" },
        ];
      case "KITCHEN_MANAGER":
      case "STAFF":
        return [
          ...baseLinks,
          { href: "/dashboard/kitchen", label: "Kitchen Dashboard" },
          { href: "/orders", label: "Orders" },
          { href: "/inventory", label: "Inventory" },
        ];
      case "CUSTOMER":
        return [
          ...baseLinks,
          { href: "/customer", label: "My Dashboard" },
          { href: "/subscriptions", label: "Subscriptions" },
          { href: "/orders", label: "Orders" },
          { href: "/wallet", label: "Wallet" },
        ];
      default:
        return baseLinks;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-100 text-red-800";
      case "BUSINESS_OWNER":
        return "bg-purple-100 text-purple-800";
      case "KITCHEN_MANAGER":
        return "bg-orange-100 text-orange-800";
      case "STAFF":
        return "bg-blue-100 text-blue-800";
      case "CUSTOMER":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="text-xl font-bold text-blue-600">
                OneFoodDialer
              </div>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              OneFoodDialer
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Navigation Links */}
                {getNavLinks().map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      router.pathname === link.href
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Business Selector (for multi-business users) */}
                {user.businesses && user.businesses.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowBusinessMenu(!showBusinessMenu)}
                      className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                    >
                      <span className="truncate max-w-32">
                        {user.currentBusiness?.name || "Select Business"}
                      </span>
                      <svg
                        className="ml-1 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {showBusinessMenu && (
                      <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1">
                          {user.businesses.map((business) => (
                            <button
                              key={business.id}
                              onClick={() => switchBusiness(business.id)}
                              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                business.id === user.businessId
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-700"
                              }`}
                            >
                              {business.name}
                              {business.id === user.businessId && (
                                <span className="ml-2 text-blue-500">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {user.profile?.firstName?.[0]}
                          {user.profile?.lastName?.[0]}
                        </span>
                      </div>
                      <div className="hidden md:block">
                        <div className="text-sm font-medium">
                          {user.profile?.firstName} {user.profile?.lastName}
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role.replace("_", " ")}
                        </div>
                      </div>
                    </div>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Profile Settings
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Account Settings
                        </Link>
                        <hr className="my-1" />
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {(showUserMenu || showBusinessMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowBusinessMenu(false);
          }}
        />
      )}
    </nav>
  );
}
