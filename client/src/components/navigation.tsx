import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Dice6, Trophy, Eye, Key, LogOut, Users, Shuffle, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const [location] = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { data: stats = {} } = useQuery({ queryKey: ["/api/stats"] });
  const { isAuthenticated, adminDisplayName, adminKey, logout } = useAuth();

  // Navigation items based on authentication status
  const navItems = [
    { path: "/", label: "My Hunts", icon: Trophy },
    { path: "/live", label: "Live Hunts", icon: Users },
    { path: "/slot-picker", label: "Slot Picker", icon: Shuffle },
    { path: "/tournament", label: "Tournament", icon: Crown },
    ...(isAuthenticated ? [
      { path: "/latest-hunt-overlay", label: "OBS Overlay", icon: Eye },
      // Only show Admin Keys for GambiZard admin
      ...(adminKey === "GZ-239-2932-92302" ? [
        { path: "/admin-keys", label: "Admin Keys", icon: Key },
      ] : []),
    ] : []),
  ];

  return (
    <header className="bg-dark-purple/80 backdrop-blur-sm border-b border-purple-800/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <Dice6 className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BonusHunter Pro
              </h1>
            </Link>
            <nav className="hidden md:flex space-x-6">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} href={path}>
                  <button
                    className={`text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 ${
                      location === path ? "bg-primary/20 text-primary" : ""
                    }`}
                  >
                    <Icon className="w-4 h-4 inline mr-2" />
                    {label}
                  </button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              <span>{(stats as any)?.totalHunts || 0}</span> Hunts Created
            </div>
            
            {/* Authentication Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-300">
                  <span className="text-primary">{adminDisplayName}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowLoginModal(true)}
                className="bg-primary hover:bg-primary/90 text-white"
                data-testid="button-login"
              >
                <Key className="w-4 h-4 mr-2" />
                Admin Login
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
    </header>
  );
}