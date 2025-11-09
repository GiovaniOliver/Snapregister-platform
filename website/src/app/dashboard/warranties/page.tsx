import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import WarrantiesDashboardClient from './WarrantiesDashboardClient';
import DashboardLayout from '@/components/DashboardLayout';

export default async function WarrantiesDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardLayout user={session}>
      <WarrantiesDashboardClient />
    </DashboardLayout>
  );
}
