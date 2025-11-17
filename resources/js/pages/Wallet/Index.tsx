import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  IconEye,
  IconEyeOff,
  IconPlus,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconCreditCard,
  IconRefresh,
  IconSparkles,
  IconClock,
  IconShield,
  IconCopy,
  IconCheck,
  IconTrendingUp,
  IconWallet,
  IconHistory,
  IconDownload
} from '@tabler/icons-react';

interface Balance {
  currency: string;
  balance: number;
  reserved: number;
  available: number;
  token_balance: number;
}

interface Wallet {
  id: number;
  chain: string;
  symbol: string;
  address: string;
  is_primary: boolean;
  logo?: string | null;
  balance: number;
}

interface Transaction {
  id: number;
  type: string;
  currency: string;
  amount: number;
  reference: string;
  created_at: string;
  date: string;
  time: string;
  status: string;
  chain_name: string | null;
  chain_logo: string | null;
  explorer_url: string | null;
  tx_hash: string | null;
  meta: any;
}

interface Props {
  balances: Balance[];
  wallets: Wallet[];
  recentTransactions: Transaction[];
}

export default function WalletIndex({ balances, wallets, recentTransactions }: Props) {
  const [showBalance, setShowBalance] = useState(true);
  const [showWalletBalance, setShowWalletBalance] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState<number | null>(null);
  const { flash } = usePage().props as any;

  const copyToClipboard = (text: string, walletId: number) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(walletId);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <IconArrowDownLeft className="h-4 w-4" />;
      case 'withdrawal':
        return <IconArrowUpRight className="h-4 w-4" />;
      case 'purchase':
        return <IconCreditCard className="h-4 w-4" />;
      default:
        return <IconRefresh className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600 bg-green-50';
      case 'withdrawal':
        return 'text-red-600 bg-red-50';
      case 'purchase':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
    };
    return variants[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'NGN') {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
      }).format(amount);
    }
    return `${amount} ${currency}`;
  };

  const formatTokenBalance = (balance: number, symbol: string) => {
    if (balance === 0) return '0.00';
    if (balance < 0.000001) return '< 0.000001';
    const decimals = balance < 1 ? 6 : 2;
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const totalNGNBalance = balances
    .filter(b => b.currency === 'NGN')
    .reduce((sum, b) => sum + b.available, 0);

  return (
    <AppLayout breadcrumbs={[
      { title: 'My Wallet', href: '/wallet' }
    ]}>
      <Head title="My Wallet" />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

            {/* Success Message */}
            {flash?.success && (
              <Alert className="mx-4 lg:mx-6 border-green-200 bg-green-50">
                <IconCheck className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {flash.success}
                </AlertDescription>
              </Alert>
            )}

            {/* Header with Quick Stats */}
            <div className="px-4 lg:px-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3">
                    <IconWallet className="h-8 w-8 text-emerald-600" />
                    My Wallet
                  </h1>
                  <p className="text-muted-foreground mt-1">Manage your balances and transactions</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20">
                    <a href="/topup">
                      <IconPlus className="mr-2 h-5 w-5" />
                      Top Up
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                    <a href="/withdraw">
                      <IconArrowUpRight className="mr-2 h-5 w-5" />
                      Withdraw
                    </a>
                  </Button>
                </div>
              </div>

              {/* Security Alert */}
              <Alert className="mb-6 border-emerald-200 bg-emerald-50">
                <IconShield className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-900">
                  <strong>Bank-Grade Security:</strong> All fiat funds are held with CBN-licensed partners. Your crypto is never custodied—you maintain full control.
                </AlertDescription>
              </Alert>

              {/* Overview Cards */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card className="border-l-4 border-l-emerald-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Total Balance</p>
                        <p className="text-2xl font-bold mt-1">
                          {showBalance ? formatCurrency(totalNGNBalance, 'NGN') : '••••••'}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <IconWallet className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Crypto Wallets</p>
                        <p className="text-2xl font-bold mt-1">{wallets.length}</p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <IconSparkles className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Recent Transactions</p>
                        <p className="text-2xl font-bold mt-1">{recentTransactions.length}</p>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <IconHistory className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Growth</p>
                        <p className="text-2xl font-bold mt-1 text-green-600">+0.0%</p>
                      </div>
                      <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <IconTrendingUp className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="px-4 lg:px-6">
              <Tabs defaultValue="fiat" className="w-full">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto">
                  <TabsTrigger value="fiat" className="flex items-center gap-2 py-3">
                    <IconCreditCard className="h-4 w-4" />
                    Fiat (NGN)
                    <Badge variant="secondary" className="ml-1">Secured</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="gasify" className="flex items-center gap-2 py-3">
                    <IconSparkles className="h-4 w-4" />
                    Gasify Wallet
                    <Badge variant="secondary" className="ml-1">Q1 2026</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="connected" className="flex items-center gap-2 py-3">
                    <IconWallet className="h-4 w-4" />
                    Connected Wallets
                    <Badge variant="secondary" className="ml-1">Connect</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="fiat" className="mt-6">
                  <div className="space-y-6">
                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                      {/* Balance Card */}
                      <Card className="lg:col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                          <CardTitle className="text-lg">NGN Balance</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowBalance(!showBalance)}
                          >
                            {showBalance ? (
                              <IconEyeOff className="h-4 w-4" />
                            ) : (
                              <IconEye className="h-4 w-4" />
                            )}
                          </Button>
                        </CardHeader>
                        <CardContent>
                          {balances.filter(balance => balance.currency === 'NGN').map((balance) => (
                            <div key={balance.currency} className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
                                <div className="text-4xl font-bold text-emerald-600">
                                  {showBalance
                                    ? formatCurrency(balance.available, balance.currency)
                                    : '••••••'
                                  }
                                </div>
                              </div>
                              {showBalance && (
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
                                    <p className="font-semibold">{formatCurrency(balance.balance, balance.currency)}</p>
                                  </div>
                                  {balance.reserved > 0 && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Reserved</p>
                                      <p className="font-semibold">{formatCurrency(balance.reserved, balance.currency)}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Recent Transactions */}
                      <Card className="lg:col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-lg">Recent Activity</CardTitle>
                          <Button variant="ghost" size="sm" asChild>
                            <a href="/transactions">
                              View All
                            </a>
                          </Button>
                        </CardHeader>
                        <CardContent>
                          {recentTransactions.length === 0 ? (
                            <div className="text-center py-8">
                              <IconHistory className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                              <p className="text-sm text-muted-foreground">No transactions yet</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {recentTransactions.slice(0, 5).map((tx) => (
                                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getTransactionColor(tx.type)}`}>
                                    {getTransactionIcon(tx.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm capitalize">{tx.type}</p>
                                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`font-semibold text-sm ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                      {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                                    </p>
                                    <Badge variant="outline" className={`text-xs ${getStatusBadge(tx.status)}`}>
                                      {tx.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        🔒 Fiat held securely with CBN-licensed partners
                      </p>
                      <div className="flex gap-4 justify-center flex-wrap">
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 shadow-lg shadow-emerald-600/20" size="lg">
                          <a href="/topup">
                            <IconPlus className="mr-2 h-5 w-5" />
                            Top Up Wallet
                          </a>
                        </Button>
                        <Button asChild variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-3 px-6" size="lg">
                          <a href="/withdraw">
                            <IconArrowUpRight className="mr-2 h-5 w-5" />
                            Withdraw Funds
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                          <a href="/transactions">
                            <IconDownload className="mr-2 h-5 w-5" />
                            Export History
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="gasify" className="mt-6">
                  <Alert className="mb-6 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
                    <IconSparkles className="h-5 w-5 text-emerald-600" />
                    <AlertTitle className="text-lg font-semibold">Gasify Wallet – Launching Q1 2026</AlertTitle>
                    <AlertDescription className="mt-2">
                      Your blockchain addresses are reserved and ready. Full sending, receiving, staking, and P2P features coming soon. Be among the first to experience seamless multi-chain transactions.
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <IconSparkles className="h-5 w-5 text-emerald-600" />
                        Your Blockchain Wallets
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowWalletBalance(!showWalletBalance)}
                      >
                        {showWalletBalance ? (
                          <IconEyeOff className="h-4 w-4" />
                        ) : (
                          <IconEye className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <TooltipProvider>
                        {wallets.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                              <IconWallet className="h-8 w-8 text-emerald-600" />
                            </div>
                            <p className="text-sm text-muted-foreground">No wallets created yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Wallets will be automatically created when you start trading</p>
                          </div>
                        ) : (
                          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {wallets.map((wallet) => (
                              <Card
                                key={wallet.id}
                                className="border-2 hover:border-emerald-200 transition-colors hover:shadow-lg"
                              >
                                <CardContent className="pt-6">
                                  <div className="flex items-start gap-3 mb-4">
                                    {wallet.logo ? (
                                      <img
                                        src={wallet.logo}
                                        alt={wallet.chain}
                                        className="w-10 h-10 rounded-full flex-shrink-0 ring-2 ring-gray-100"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center flex-shrink-0 ring-2 ring-gray-100">
                                        <span className="text-sm font-bold text-white">
                                          {wallet.chain.charAt(0)}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-base flex items-center gap-2 flex-wrap">
                                        {wallet.chain}
                                        {wallet.is_primary && (
                                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">{wallet.symbol}</p>
                                    </div>
                                  </div>

                                  <div className="mb-4">
                                    {showWalletBalance ? (
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Balance</p>
                                        <p className="text-xl font-bold">
                                          {formatTokenBalance(wallet.balance, wallet.symbol)} {wallet.symbol}
                                        </p>
                                      </div>
                                    ) : (
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Balance</p>
                                        <p className="text-xl font-bold">
                                          •••••• {wallet.symbol}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground font-medium">Wallet Address</p>
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <code className="text-xs font-mono flex-1 truncate">
                                            {wallet.address}
                                          </code>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p className="font-mono text-xs break-all">{wallet.address}</p>
                                          <p className="text-xs text-muted-foreground mt-2">
                                            Full functionality coming Q1 2026
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => copyToClipboard(wallet.address, wallet.id)}
                                      >
                                        {copiedAddress === wallet.id ? (
                                          <IconCheck className="h-3 w-3 text-green-600" />
                                        ) : (
                                          <IconCopy className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TooltipProvider>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="connected" className="mt-6">
                  <Card className="border-2 border-dashed">
                    <CardContent className="pt-12 pb-12 text-center">
                      <div className="mx-auto h-20 w-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mb-6">
                        <IconShield className="h-10 w-10 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Connect Your External Wallet</h3>
                      <p className="text-muted-foreground mb-2 max-w-md mx-auto">
                        Connect Phantom, Trust Wallet, MetaMask, or any WalletConnect-compatible wallet
                        to trade P2P, stake, or use dApps seamlessly.
                      </p>
                      <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
                        Your keys, your crypto—we never custody your connected wallets.
                      </p>
                      <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 px-8 shadow-lg shadow-emerald-600/20">
                        <IconWallet className="mr-2 h-5 w-5" />
                        Connect Wallet
                      </Button>

                      <div className="mt-8 pt-8 border-t">
                        <p className="text-xs text-muted-foreground mb-4">Popular wallet providers</p>
                        <div className="flex justify-center gap-4 flex-wrap">
                          {['Phantom', 'MetaMask', 'Trust Wallet', 'Coinbase'].map((wallet) => (
                            <div key={wallet} className="px-4 py-2 bg-gray-50 rounded-full text-sm font-medium text-gray-700">
                              {wallet}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
