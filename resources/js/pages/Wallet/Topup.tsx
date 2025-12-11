import { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  IconCreditCard,
  IconBuildingBank,
  IconArrowLeft,
  IconWallet,
  IconCopy,
  IconCheck,
  IconShield
} from '@tabler/icons-react';
import * as WalletController from '@/actions/App/Http/Controllers/WalletController';
import { QRCodeSVG } from 'qrcode.react';

interface Wallet {
  id: number;
  chain: string;
  symbol: string;
  address: string;
  logo?: string | null;
}

interface VirtualAccount {
  account_name: string;
  account_number: string;
  bank_name: string;
  provider: string;
  reference: string;
}

export default function WalletTopup({ wallets }: { wallets: Wallet[] }) {
  const [selectedCryptoWallet, setSelectedCryptoWallet] = useState<Wallet | null>(wallets.length > 0 ? wallets[0] : null);
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);
  const [loadingVirtualAccount, setLoadingVirtualAccount] = useState(false);

  // Fetch virtual account details
  useEffect(() => {
    setLoadingVirtualAccount(true);
    fetch('/api/virtual-account')
      .then(response => response.json())
      .then(data => {
        setVirtualAccount(data);
        setLoadingVirtualAccount(false);
      })
      .catch(error => {
        console.error('Error fetching virtual account:', error);
        setLoadingVirtualAccount(false);
      });
  }, []);

  useEffect(() => {
    if (wallets.length > 0 && !selectedCryptoWallet) setSelectedCryptoWallet(wallets[0]);
  }, [wallets, selectedCryptoWallet]);

  const handleCopyToClipboard = (text: string, field?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (field) {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      }
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyAllDetails = () => {
    if (virtualAccount) {
      const details = `${virtualAccount.account_name}\n${virtualAccount.bank_name}\n${virtualAccount.account_number}`;
      handleCopyToClipboard(details, 'all');
    }
  };

  return (
    <AppLayout breadcrumbs={[
      { title: 'My Wallet', href: WalletController.index.url() },
      { title: 'Top Up', href: '/topup' }
    ]}>
      <Head title="Top Up Wallet" />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

            {/* Header */}
            <div className="flex items-center gap-4 px-4 lg:px-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href={WalletController.index.url()}>
                  <IconArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Top Up Wallet</h1>
                <p className="text-muted-foreground">Add funds to your wallet</p>
              </div>
            </div>

            <div className="px-4 lg:px-6">
              <div className="max-w-2xl mx-auto">
                <Tabs defaultValue="fiat" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="fiat">Fiat Deposit</TabsTrigger>
                    <TabsTrigger value="crypto">Crypto Deposit</TabsTrigger>
                  </TabsList>

                  {/* Fiat Deposit Tab */}
                  <TabsContent value="fiat">
                    <div className="space-y-6 mt-4">
                      {loadingVirtualAccount ? (
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                              <p className="text-sm text-muted-foreground">Loading your virtual account...</p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : virtualAccount ? (
                        <>
                          <Alert className="border-emerald-200 bg-emerald-50">
                            <IconShield className="h-4 w-4 text-emerald-600" />
                            <AlertDescription className="text-emerald-800">
                              <strong>Secure Transfer:</strong> Use your personal NGN account details below. Funds appear instantly after transfer!
                            </AlertDescription>
                          </Alert>

                          <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-emerald-700">
                                <IconCreditCard className="h-5 w-5" />
                                Your Personal NGN Account
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-6">
                                <div className="bg-white p-6 rounded-lg border border-emerald-200 shadow-sm">
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-2 font-medium">Bank Name</p>
                                      <div className="flex items-center justify-between">
                                        <span className="text-lg font-semibold">{virtualAccount.bank_name}</span>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-2 font-medium">Account Name</p>
                                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                        <span className="text-lg font-semibold">{virtualAccount.account_name}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => handleCopyToClipboard(virtualAccount.account_name, 'name')}
                                        >
                                          {copiedField === 'name' ? (
                                            <IconCheck className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <IconCopy className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-2 font-medium">Account Number</p>
                                      <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                                        <span className="text-2xl font-bold tracking-widest font-mono">
                                          {virtualAccount.account_number}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => handleCopyToClipboard(virtualAccount.account_number, 'number')}
                                        >
                                          {copiedField === 'number' ? (
                                            <IconCheck className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <IconCopy className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <Alert className="border-emerald-200 bg-emerald-100">
                                  <IconBuildingBank className="h-4 w-4 text-emerald-600" />
                                  <AlertDescription className="text-emerald-800">
                                    <strong>How it works:</strong>
                                    <ul className="mt-2 space-y-1 text-sm">
                                      <li>• Transfer any amount from any Nigerian bank to this account</li>
                                      <li>• Funds appear instantly in your wallet</li>
                                      <li>• No minimum or maximum limits</li>
                                      <li>• Completely secure and CBN-compliant</li>
                                    </ul>
                                  </AlertDescription>
                                </Alert>

                                <Button 
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 shadow-lg shadow-emerald-600/20"
                                  onClick={copyAllDetails}
                                  disabled={copiedField === 'all'}
                                >
                                  {copiedField === 'all' ? (
                                    <>
                                      <IconCheck className="mr-2 h-5 w-5" />
                                      Copied Successfully!
                                    </>
                                  ) : (
                                    <>
                                      <IconCopy className="mr-2 h-5 w-5" />
                                      Copy All Account Details
                                    </>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center py-8">
                              <IconBuildingBank className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                              <p className="text-sm text-muted-foreground">Unable to load virtual account details</p>
                              <p className="text-xs text-muted-foreground mt-1">Please refresh the page or contact support</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  {/* Crypto Deposit Tab */}
                  <TabsContent value="crypto">
                    <div className="space-y-6 mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Select Wallet</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {wallets.length > 0 ? (
                            <div className="space-y-4">
                              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                {wallets.map((wallet) => (
                                  <div
                                    key={wallet.id}
                                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                      selectedCryptoWallet?.id === wallet.id
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => setSelectedCryptoWallet(wallet)}
                                  >
                                    <div className="flex items-center gap-3">
                                      {wallet.logo && (
                                        <img src={wallet.logo} alt={wallet.chain} className="w-8 h-8 rounded-full" />
                                      )}
                                      <div>
                                        <p className="font-medium">{wallet.chain}</p>
                                        <p className="text-sm text-muted-foreground">{wallet.symbol}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">You have no crypto wallets. Please create one first.</p>
                          )}
                        </CardContent>
                      </Card>

                      {selectedCryptoWallet && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <IconWallet className="h-5 w-5" />
                              Deposit {selectedCryptoWallet.symbol}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col items-center gap-6">
                            <div className="p-4 bg-white rounded-lg border shadow-sm">
                              <QRCodeSVG value={selectedCryptoWallet.address} size={180} />
                            </div>
                            <div className="text-center space-y-2">
                              <p className="text-sm text-muted-foreground">
                                Send only <span className="font-bold text-emerald-600">{selectedCryptoWallet.symbol}</span> to this address
                              </p>
                              <p className="text-xs text-red-500 font-medium">
                                ⚠️ Sending any other coins may result in permanent loss
                              </p>
                            </div>
                            <div className="w-full p-4 bg-gray-50 rounded-lg border flex items-center justify-between gap-3">
                              <span className="font-mono text-sm break-all flex-1">{selectedCryptoWallet.address}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleCopyToClipboard(selectedCryptoWallet.address)}
                                className="shrink-0"
                              >
                                {copied ? (
                                  <IconCheck className="h-4 w-4 text-green-500" />
                                ) : (
                                  <IconCopy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <div className="text-center text-xs text-muted-foreground">
                              <p>Network: {selectedCryptoWallet.chain}</p>
                              <p>Minimum: 0.001 {selectedCryptoWallet.symbol}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
