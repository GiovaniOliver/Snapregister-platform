'use client';

// Warranties Dashboard Client Component

import { useState, useEffect } from 'react';
import ExpiringWarrantiesWidget from '@/components/warranty/ExpiringWarrantiesWidget';
import WarrantyTimeline from '@/components/warranty/WarrantyTimeline';
import {
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Settings,
} from 'lucide-react';

interface DashboardStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  lifetime: number;
}

export default function WarrantiesDashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      const response = await fetch('/api/warranties/stats');

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching warranty stats:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-indigo-600" />
              Warranty Management
            </h1>
            <p className="text-gray-600 mt-2">
              Track and manage all your product warranties in one place
            </p>
          </div>
          <a
            href="/dashboard/warranties/settings"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-700">Settings</span>
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Warranties"
          value={stats?.total || 0}
          icon={Shield}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Active"
          value={stats?.active || 0}
          icon={CheckCircle}
          color="green"
          loading={loading}
        />
        <StatCard
          title="Expiring Soon"
          value={stats?.expiringSoon || 0}
          icon={AlertCircle}
          color="yellow"
          loading={loading}
        />
        <StatCard
          title="Expired"
          value={stats?.expired || 0}
          icon={AlertCircle}
          color="red"
          loading={loading}
        />
        <StatCard
          title="Lifetime"
          value={stats?.lifetime || 0}
          icon={TrendingUp}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Soon Widget */}
        <ExpiringWarrantiesWidget daysAhead={30} maxItems={5} showViewAll />

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <ActionButton
              title="Add New Warranty"
              description="Manually add a warranty for a product"
              href="/dashboard/warranties/new"
              icon="+"
            />
            <ActionButton
              title="Import Warranties"
              description="Bulk import warranties from CSV"
              href="/dashboard/warranties/import"
              icon="↑"
            />
            <ActionButton
              title="Export Data"
              description="Download your warranty data as CSV"
              href="/api/warranties/export"
              icon="↓"
            />
            <ActionButton
              title="Notification Settings"
              description="Customize your reminder preferences"
              href="/dashboard/warranties/settings"
              icon="⚙"
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <WarrantyTimeline timelineMonths={12} />
      </div>

      {/* Tips & Best Practices */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Warranty Management Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Tip
            title="Review Regularly"
            text="Check your warranties monthly to stay ahead of expirations"
          />
          <Tip
            title="Keep Documents"
            text="Store all warranty cards and receipts in one safe place"
          />
          <Tip
            title="Set Reminders"
            text="Enable notifications to never miss an expiration date"
          />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  icon: any;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  loading?: boolean;
}

function StatCard({ title, value, icon: Icon, color, loading }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// Action Button Component
interface ActionButtonProps {
  title: string;
  description: string;
  href: string;
  icon: string;
}

function ActionButton({ title, description, href, icon }: ActionButtonProps) {
  return (
    <a
      href={href}
      className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
    >
      <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
        <span className="text-xl text-indigo-600">{icon}</span>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </a>
  );
}

// Tip Component
interface TipProps {
  title: string;
  text: string;
}

function Tip({ title, text }: TipProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}
