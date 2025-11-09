'use client';

// Warranty Timeline Component - Visual timeline showing all product warranties

import { useEffect, useState } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import WarrantyStatusBadge from './WarrantyStatusBadge';
import { WarrantyStatus } from '@/types/warranty';

interface Warranty {
  id: string;
  productName: string;
  manufacturer: string;
  startDate: Date | null;
  expiryDate: Date | null;
  warrantyType: string;
  status: WarrantyStatus;
  daysRemaining: number | null;
}

interface Props {
  timelineMonths?: number;
}

export default function WarrantyTimeline({ timelineMonths = 12 }: Props) {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarranties();
  }, []);

  async function fetchWarranties() {
    try {
      setLoading(true);
      const response = await fetch('/api/warranties');

      if (!response.ok) {
        throw new Error('Failed to fetch warranties');
      }

      const data = await response.json();
      setWarranties(data.warranties || []);
    } catch (err) {
      console.error('Error fetching warranties:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const startDate = startOfMonth(today);
  const endDate = endOfMonth(addMonths(today, timelineMonths));

  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  // Filter warranties that have dates within the timeline
  const timelineWarranties = warranties.filter(
    (w) =>
      w.expiryDate &&
      new Date(w.expiryDate) >= startDate &&
      new Date(w.expiryDate) <= endDate
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Warranty Timeline
      </h2>

      {timelineWarranties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No warranties expiring in the next {timelineMonths} months
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline axis */}
          <div className="flex border-b-2 border-gray-300 mb-8">
            {months.map((month, index) => (
              <div
                key={month.toISOString()}
                className="flex-1 text-center pb-2"
                style={{ minWidth: '80px' }}
              >
                <div className="text-xs font-semibold text-gray-700">
                  {format(month, 'MMM')}
                </div>
                <div className="text-xs text-gray-500">
                  {format(month, 'yyyy')}
                </div>
              </div>
            ))}
          </div>

          {/* Warranty items */}
          <div className="space-y-4">
            {timelineWarranties.map((warranty) => {
              const expiryDate = new Date(warranty.expiryDate!);
              const monthsDiff =
                (expiryDate.getFullYear() - today.getFullYear()) * 12 +
                expiryDate.getMonth() -
                today.getMonth();

              const position = (monthsDiff / timelineMonths) * 100;

              return (
                <div key={warranty.id} className="relative">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {warranty.productName}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        {warranty.manufacturer}
                      </p>
                    </div>
                    <WarrantyStatusBadge
                      status={warranty.status}
                      daysRemaining={warranty.daysRemaining}
                      size="sm"
                    />
                  </div>

                  {/* Timeline bar */}
                  <div className="relative h-2 bg-gray-100 rounded-full mt-2">
                    <div
                      className="absolute top-0 bottom-0 right-0 bg-gradient-to-r from-green-400 to-yellow-400 rounded-full"
                      style={{
                        left: `${Math.max(0, position - 5)}%`,
                        width: '10%',
                      }}
                    ></div>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md"
                      style={{
                        left: `${Math.min(100, Math.max(0, position))}%`,
                      }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-gray-700">
                        {format(expiryDate, 'MMM d')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-yellow-400 rounded-full"></div>
                <span>Coverage Period</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Expiration Date</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
