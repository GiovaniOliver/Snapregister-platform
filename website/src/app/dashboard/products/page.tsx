import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Package, Calendar, Shield, ExternalLink, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Helper function to safely parse JSON
function safeJsonParse<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}

export default async function ProductsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch products from database
  const rawProducts = await prisma.product.findMany({
    where: {
      userId: session.id
    },
    select: {
      id: true,
      productName: true,
      manufacturerName: true,
      category: true,
      modelNumber: true,
      serialNumber: true,
      sku: true,
      upc: true,
      purchaseDate: true,
      purchasePrice: true,
      retailer: true,
      warrantyDuration: true,
      warrantyStartDate: true,
      warrantyExpiry: true,
      warrantyType: true,
      imageUrls: true,
      confidenceScore: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      manufacturer: {
        select: {
          id: true,
          name: true,
          logo: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Parse JSON fields
  const products = rawProducts.map(product => ({
    ...product,
    imageUrls: safeJsonParse<string[]>(product.imageUrls, []),
  }));

  return (
    <DashboardLayout user={session}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
            <p className="text-gray-500 mt-1">
              Manage your registered products and warranties
            </p>
          </div>
          <Link href="/register">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Register New Product
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search by product name, brand, or serial number..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{product.productName}</CardTitle>
                      <CardDescription>{product.manufacturerName}</CardDescription>
                    </div>
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Model:</span>
                      <span className="font-medium">{product.modelNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Serial:</span>
                      <span className="font-medium font-mono text-xs">
                        {product.serialNumber ? `...${product.serialNumber.slice(-6)}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Purchase Date:</span>
                      <span className="font-medium">
                        {product.purchaseDate
                          ? new Date(product.purchaseDate).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Warranty:</span>
                      <span className={`font-medium ${
                        product.warrantyExpiry && new Date(product.warrantyExpiry) > new Date()
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {product.warrantyExpiry
                          ? new Date(product.warrantyExpiry) > new Date()
                            ? `Active until ${new Date(product.warrantyExpiry).toLocaleDateString()}`
                            : 'Expired'
                          : 'No warranty'}
                      </span>
                    </div>
                  </div>
                  <div className="pt-3 flex gap-2">
                    <Link href={`/products/${product.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    {product.warrantyExpiry && new Date(product.warrantyExpiry) > new Date() && (
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products registered yet
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Start registering your products to track warranties and never miss important dates.
              </p>
              <Link href="/register">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Register Your First Product
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}