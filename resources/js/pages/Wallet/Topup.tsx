import { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  IconCreditCard,
  IconBuildingBank,
  IconDeviceMobile,
  IconArrowLeft,
  IconWallet,
  IconCopy,
  IconCheck
} from '@tabler/icons-react';
import * as WalletController from '@/actions/App/Http/Controllers/WalletController';
import {QRCodeSVG} from 'qrcode.react';

interface Wallet {
  id: number;
  chain: string;
  symbol: string;
  address: string;
  logo?: string | null;
}

export default function WalletTopup({ wallets }: { wallets: Wallet[] }) {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedCryptoWallet, setSelectedCryptoWallet] = useState<Wallet | null>(wallets.length > 0 ? wallets[0] : null);
  const [copied, setCopied] = useState(false);

  // Inertia form state
  const { data, setData, post, processing, errors } = useForm({
    amount: '',
    currency: 'NGN',
    payment_method: '',
  });

  // Payment methods
  const paymentMethods = [
    {
      id: 'opay',
      name: 'Opay',
      icon: IconWallet,
      description: 'Pay with your Opay wallet',
      enabled: true,
    },
    {
      id: 'paystack',
      name: 'Paystack',
      icon: IconCreditCard,
      description: 'Pay with cards via Paystack',
      enabled: true,
    },
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      icon: IconBuildingBank,
      description: 'Pay with cards via Flutterwave',
      enabled: true,
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: IconDeviceMobile,
      description: 'Pay with cards via Stripe',
      enabled: false,
      comingSoon: true,
    },
  ];

  // Quick amounts
  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(WalletController.processTopup.url());
  };

  // Handle quick amount select
  const handleQuickAmount = (amount: number) => {
    setData('amount', amount.toString());
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    if (wallets.length > 0 && !selectedCryptoWallet) setSelectedCryptoWallet(wallets[0]);
  }, [wallets, selectedCryptoWallet]);

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
                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                      {/* Amount Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Enter Amount</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <div className="flex gap-2">
                              {/* Currency Select */}
                              <Select value={data.currency} onValueChange={(value) => setData('currency', value)}>
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NGN">NGN</SelectItem>
                                  <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                              </Select>
                              {/* Input field */}
                              <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                className="flex-1"
                                min="100"
                                step="0.01"
                              />
                            </div>
                            {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
                          </div>

                          {/* Quick Amounts */}
                          <div>
                            <Label className="text-sm text-muted-foreground">Quick amounts</Label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {quickAmounts.map((amount) => (
                                <Button
                                  key={amount}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickAmount(amount)}
                                  className="text-xs"
                                >
                                  ₦{amount.toLocaleString()}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Payment Method Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Select Payment Method</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {paymentMethods.map((method) => {
                              const Icon = method.icon;
                              const isDisabled = !method.enabled;
                              return (
                                <div
                                  key={method.id}
                                  className={`p-4 rounded-lg border transition-colors relative ${
                                    isDisabled
                                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                      : selectedMethod === method.id
                                      ? 'border-primary bg-primary/5 cursor-pointer'
                                      : 'border-border hover:border-primary/50 cursor-pointer'
                                  }`}
                                  onClick={() => {
                                    if (!isDisabled) {
                                      setSelectedMethod(method.id);
                                      setData('payment_method', method.id);
                                    }
                                  }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <Icon className={`h-5 w-5 ${isDisabled ? 'text-gray-400' : ''}`} />
                                    <div className="flex-1">
                                      <div className={`font-medium flex items-center gap-2 ${isDisabled ? 'text-gray-500' : ''}`}>
                                        {method.name}
                                        {method.comingSoon && (
                                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                                            Coming Soon
                                          </span>
                                        )}
                                      </div>
                                      <div className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-muted-foreground'}`}>
                                        {method.description}
                                      </div>
                                    </div>
                                    {!isDisabled && (
                                      <div className={`w-4 h-4 rounded-full border-2 ${
                                        selectedMethod === method.id
                                          ? 'border-primary bg-primary'
                                          : 'border-gray-300'
                                      }`}>
                                        {selectedMethod === method.id && (
                                          <div className="w-full h-full rounded-full bg-white scale-50" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {errors.payment_method && <p className="text-sm text-red-600 mt-2">{errors.payment_method}</p>}
                        </CardContent>
                      </Card>

                      {/* Transaction Summary */}
                      {data.amount && selectedMethod && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Transaction Summary</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Amount:</span>
                                <span className="font-medium">
                                  {data.currency} {parseFloat(data.amount || '0').toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Payment Method:</span>
                                <span className="font-medium">
                                  {paymentMethods.find(m => m.id === selectedMethod && m.enabled)?.name}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Processing Fee:</span>
                                <span className="font-medium">Free</span>
                              </div>
                              <hr className="my-2" />
                              <div className="flex justify-between font-medium">
                                <span>Total:</span>
                                <span>
                                  {data.currency} {parseFloat(data.amount || '0').toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={
                          processing ||
                          !data.amount ||
                          !selectedMethod ||
                          !paymentMethods.find(m => m.id === selectedMethod)?.enabled
                        }
                      >
                        {processing ? 'Processing...' : 'Proceed to Payment'}
                      </Button>
                    </form>
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
                            <Select
                              onValueChange={(value) => setSelectedCryptoWallet(wallets.find(w => w.id.toString() === value) || null)}
                              defaultValue={selectedCryptoWallet?.id.toString()}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a wallet to deposit to" />
                              </SelectTrigger>
                              <SelectContent>
                                {wallets.map(wallet => (
                                  <SelectItem key={wallet.id} value={wallet.id.toString()}>
                                    <div className="flex items-center gap-2">
                                      {wallet.logo && <img src={wallet.logo} alt={wallet.chain} className="w-5 h-5 rounded-full" />}
                                      <span>{wallet.chain} ({wallet.symbol})</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm text-muted-foreground">You have no crypto wallets. Please create one first.</p>
                          )}
                        </CardContent>
                      </Card>

                      {selectedCryptoWallet && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Deposit {selectedCryptoWallet.symbol}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col items-center gap-4">
                            <div className="p-2 bg-white rounded-lg border">
                              <QRCodeSVG value={selectedCryptoWallet.address} size={160} />
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Send only <span className="font-bold">{selectedCryptoWallet.symbol}</span> to this address.</p>
                              <p className="text-sm text-red-500">Sending any other coins may result in permanent loss.</p>
                            </div>
                            <div className="w-full p-3 bg-muted rounded-lg flex items-center justify-between gap-2">
                              <span className="font-mono text-sm truncate">{selectedCryptoWallet.address}</span>
                              <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(selectedCryptoWallet.address)}>
                                {copied ? <IconCheck className="h-4 w-4 text-green-500" /> : <IconCopy className="h-4 w-4" />}
                              </Button>
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
