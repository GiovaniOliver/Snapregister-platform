'use client';

import React, { useState } from 'react';
import { Copy, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface ProductData {
  productName?: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  retailer?: string;
  warrantyDuration?: string;
  warrantyType?: string;
}

interface ManufacturerLink {
  name: string;
  url: string;
  instructions: string;
}

// Common manufacturer warranty registration URLs
const manufacturerLinks: Record<string, ManufacturerLink> = {
  samsung: {
    name: 'Samsung',
    url: 'https://www.samsung.com/us/support/register/',
    instructions: 'Click to register on Samsung\'s website. Use the copy buttons below to quickly fill in the form.',
  },
  lg: {
    name: 'LG',
    url: 'https://www.lg.com/us/support/product-registration',
    instructions: 'Register your LG product and activate your warranty coverage.',
  },
  whirlpool: {
    name: 'Whirlpool',
    url: 'https://www.whirlpool.com/services/product-registration.html',
    instructions: 'Register your Whirlpool appliance for warranty tracking.',
  },
  ge: {
    name: 'GE Appliances',
    url: 'https://www.geappliances.com/ge/service-and-support/product-registration.htm',
    instructions: 'Register your GE appliance for warranty and service updates.',
  },
  kitchenaid: {
    name: 'KitchenAid',
    url: 'https://www.kitchenaid.com/product-registration.html',
    instructions: 'Register your KitchenAid product for warranty protection.',
  },
  sony: {
    name: 'Sony',
    url: 'https://www.sony.com/electronics/support/product-registration',
    instructions: 'Register your Sony electronics for warranty coverage.',
  },
  apple: {
    name: 'Apple',
    url: 'https://checkcoverage.apple.com/',
    instructions: 'Check and verify your Apple product warranty coverage.',
  },
};

interface Props {
  productData: ProductData;
  onComplete?: () => void;
}

export default function ManufacturerRegistrationHelper({ productData, onComplete }: Props) {
  const { toast } = useToast();
  const [copiedFields, setCopiedFields] = useState<Set<string>>(new Set());

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFields(new Set(copiedFields).add(fieldName));
      toast({
        title: 'Copied!',
        description: `${fieldName} copied to clipboard`,
      });

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fieldName);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const getManufacturerLink = (): ManufacturerLink | null => {
    if (!productData.manufacturer) return null;

    const manufacturerLower = productData.manufacturer.toLowerCase();

    for (const [key, link] of Object.entries(manufacturerLinks)) {
      if (manufacturerLower.includes(key)) {
        return link;
      }
    }

    return null;
  };

  const manufacturerLink = getManufacturerLink();

  const CopyButton = ({ text, label }: { text: string; label: string }) => {
    const isCopied = copiedFields.has(label);

    return (
      <button
        onClick={() => copyToClipboard(text, label)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-sm"
      >
        {isCopied ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 text-gray-600" />
            <span className="text-gray-700">Copy</span>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-blue-600" />
            Register with Manufacturer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            We've extracted your product information. Now you can easily register it with the manufacturer
            by copying the data below and pasting it into their registration form.
          </p>
        </CardContent>
      </Card>

      {/* Product Information with Copy Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Your Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productData.productName && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Product Name</div>
                  <div className="font-semibold text-gray-900">{productData.productName}</div>
                </div>
                <CopyButton text={productData.productName} label="Product Name" />
              </div>
            )}

            {productData.manufacturer && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Manufacturer</div>
                  <div className="font-semibold text-gray-900">{productData.manufacturer}</div>
                </div>
                <CopyButton text={productData.manufacturer} label="Manufacturer" />
              </div>
            )}

            {productData.modelNumber && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Model Number</div>
                  <div className="font-semibold text-gray-900 font-mono">{productData.modelNumber}</div>
                </div>
                <CopyButton text={productData.modelNumber} label="Model Number" />
              </div>
            )}

            {productData.serialNumber && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Serial Number</div>
                  <div className="font-semibold text-gray-900 font-mono">{productData.serialNumber}</div>
                </div>
                <CopyButton text={productData.serialNumber} label="Serial Number" />
              </div>
            )}

            {productData.purchaseDate && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Purchase Date</div>
                  <div className="font-semibold text-gray-900">
                    {new Date(productData.purchaseDate).toLocaleDateString()}
                  </div>
                </div>
                <CopyButton text={new Date(productData.purchaseDate).toLocaleDateString()} label="Purchase Date" />
              </div>
            )}

            {productData.retailer && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Retailer</div>
                  <div className="font-semibold text-gray-900">{productData.retailer}</div>
                </div>
                <CopyButton text={productData.retailer} label="Retailer" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manufacturer Registration Link */}
      {manufacturerLink ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Ready to Register with {manufacturerLink.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-blue-800">{manufacturerLink.instructions}</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={manufacturerLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full" size="lg">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Open {manufacturerLink.name} Registration
                </Button>
              </a>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2">Quick Steps:</h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Click the button above to open the manufacturer's registration page</li>
                <li>Use the copy buttons above to quickly fill in the form fields</li>
                <li>Complete any additional required information</li>
                <li>Submit the registration to activate your warranty</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">Manual Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-800 mb-4">
              We don't have a direct link for {productData.manufacturer || 'this manufacturer'}.
              Please search for "{productData.manufacturer} product registration" in your browser
              and use the copy buttons above to fill in the form.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                const searchQuery = `${productData.manufacturer || 'manufacturer'} product registration warranty`;
                window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Search for Registration Page
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Completion Button */}
      {onComplete && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={onComplete}
                className="flex-1"
              >
                I'll Register Later
              </Button>
              <Button
                onClick={onComplete}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Registration Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
