import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, Flame, LogOut, Menu, X, ShieldAlert, Award, Code2, Users2 } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Problems', icon: Code2 },
    { to: '/contests', label: 'Contests', icon: Award },
    { to: '/leaderboard', label: 'Leaderboard', icon: Users2 },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5 bg-[#080c14]/75 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <span className="text-white font-extrabold text-lg font-heading">C</span>
              </div>
              <span className="text-xl font-extrabold font-heading tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Code<span className="text-indigo-400">Arena</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 text-sm font-medium transition-all duration-200 py-1 border-b-2 ${
                      isActive
                        ? 'text-indigo-400 border-indigo-500'
                        : 'text-gray-400 border-transparent hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* User Stats and Profile Actions */}
          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <>
                {/* Stats */}
                <div className="flex items-center space-x-4">
                  {/* Streak */}
                  <div className="flex items-center space-x-1 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-sm font-semibold select-none shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                    <Flame className="w-4 h-4 fill-amber-500 animate-pulse text-amber-500" />
                    <span>{user.streak || 0} Days</span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center space-x-1 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-indigo-400 text-sm font-semibold select-none shadow-[0_0_15px_rgba(99,102,241,0.05)]">
                    <Trophy className="w-4 h-4 text-indigo-400" />
                    <span>{user.score || 0} pts</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-4 w-px bg-white/10" />

                {/* Admin Portal Link */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-sm font-medium px-3 py-1 rounded-lg transition-all"
                  >
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>Admin</span>
                  </Link>
                )}

                {/* Profile Avatar / Logout */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm uppercase shadow-md shadow-indigo-500/20 select-none">
                      {user.username.charAt(0)}
                    </div>
                    <span className="text-gray-300 text-sm font-medium">{user.username}</span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-all"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-card border-b border-white/5 bg-[#080c14]/95 animate-in slide-in-from-top duration-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-400 border-l-4 border-indigo-500'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2.5 rounded-lg text-base font-medium text-red-400 hover:bg-red-500/10"
              >
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span>Admin Portal</span>
              </Link>
            )}
          </div>

          {user && (
            <div className="pt-4 pb-3 border-t border-white/5 px-4 bg-[#05080f]/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold uppercase select-none">
                    {user.username.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{user.username}</div>
                    <div className="text-gray-400 text-xs">{user.email}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-1.5 border border-rose-500/25 bg-rose-500/10 text-rose-400 text-sm font-medium rounded-lg hover:bg-rose-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Mobile Stats display */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-center space-x-2 bg-amber-500/10 border border-amber-500/20 py-2 rounded-xl text-amber-400 font-semibold text-sm">
                  <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>{user.streak || 0} Day Streak</span>
                </div>
                <div className="flex items-center justify-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 py-2 rounded-xl text-indigo-400 font-semibold text-sm">
                  <Trophy className="w-4 h-4 text-indigo-400" />
                  <span>{user.score || 0} Points</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
