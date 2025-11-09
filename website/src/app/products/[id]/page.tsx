import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Package, Calendar, Shield, FileText, Download, ExternalLink, Edit } from 'lucide-react';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const session = await getSession();
  const resolvedParams = await params;

  if (!session) {
    redirect('/login');
  }

  // Mock data - in production, fetch from database using params.id
  const product = {
    id: resolvedParams.id,
    productName: 'KitchenAid Stand Mixer',
    manufacturerName: 'KitchenAid',
    modelNumber: 'KSM150PSER',
    serialNumber: 'W123456789',
    category: 'APPLIANCE',
    purchaseDate: '2024-01-15',
    purchasePrice: 379.99,
    retailer: 'Best Buy',
    warrantyDuration: 12,
    warrantyStartDate: '2024-01-15',
    warrantyExpiry: '2025-01-15',
    warrantyType: 'Limited',
    status: 'REGISTERED',
    registrationDate: '2024-01-16',
    imageUrls: [],
    documents: [
      { type: 'RECEIPT', fileName: 'receipt_bestbuy.pdf', uploadDate: '2024-01-16' },
      { type: 'WARRANTY_CARD', fileName: 'warranty_card.pdf', uploadDate: '2024-01-16' },
      { type: 'USER_MANUAL', fileName: 'user_manual.pdf', uploadDate: '2024-01-16' },
    ],
  };

  if (!product) {
    notFound();
  }

  const warrantyActive = product.warrantyExpiry && new Date(product.warrantyExpiry) > new Date();
  const daysUntilExpiry = product.warrantyExpiry
    ? Math.floor((new Date(product.warrantyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <DashboardLayout user={session}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/products">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
            </Link>
          </div>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
        </div>

        {/* Product Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{product.productName}</CardTitle>
                <CardDescription className="text-lg">{product.manufacturerName}</CardDescription>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Warranty Status */}
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Shield className={`h-5 w-5 ${warrantyActive ? 'text-green-600' : 'text-red-600'}`} />
                  <span className="font-semibold">Warranty Status</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  warrantyActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {warrantyActive ? 'Active' : 'Expired'}
                </span>
              </div>
              {warrantyActive && daysUntilExpiry !== null && (
                <p className="text-sm text-gray-600">
                  Expires in {daysUntilExpiry} days ({new Date(product.warrantyExpiry).toLocaleDateString()})
                </p>
              )}
              {!warrantyActive && product.warrantyExpiry && (
                <p className="text-sm text-gray-600">
                  Expired on {new Date(product.warrantyExpiry).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Product Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Model Number</span>
                    <span className="font-medium">{product.modelNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Serial Number</span>
                    <span className="font-medium font-mono">{product.serialNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Registration Status</span>
                    <span className="font-medium text-green-600">{product.status}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Registration Date</span>
                    <span className="font-medium">
                      {product.registrationDate
                        ? new Date(product.registrationDate).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Purchase Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Purchase Date</span>
                    <span className="font-medium">
                      {product.purchaseDate
                        ? new Date(product.purchaseDate).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Purchase Price</span>
                    <span className="font-medium">
                      {product.purchasePrice ? `$${product.purchasePrice}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Retailer</span>
                    <span className="font-medium">{product.retailer || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Warranty Type</span>
                    <span className="font-medium">{product.warrantyType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Warranty Duration</span>
                    <span className="font-medium">
                      {product.warrantyDuration ? `${product.warrantyDuration} months` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Receipts, warranties, and manuals</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {product.documents.length > 0 ? (
              <div className="space-y-2">
                {product.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-sm">{doc.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {doc.type.replace('_', ' ')} • Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                No documents uploaded yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage this product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button>
                <Shield className="h-4 w-4 mr-2" />
                Extend Warranty
              </Button>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Manufacturer Site
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Download Registration
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                Delete Product
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}