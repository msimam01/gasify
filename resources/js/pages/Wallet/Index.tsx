import { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconEye,
  IconEyeOff,
  IconPlus,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconCreditCard,
  IconRefresh,
  IconCopy,
  IconCheck
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
  balance: number; // Added balance field from backend
}

interface Transaction {
  id: number;
  type: string;
  currency: string;
  amount: number;
  reference: string;
  created_at: string;
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
  const [copiedWalletId, setCopiedWalletId] = useState<number | null>(null);
  const { flash } = usePage().props as any;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <IconArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
        return <IconArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'purchase':
        return <IconCreditCard className="h-4 w-4 text-blue-600" />;
      default:
        return <IconRefresh className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      case 'purchase':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
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
    // Handle very small balances
    if (balance === 0) return '0.00';
    if (balance < 0.000001) return '< 0.000001';

    // Format with appropriate decimal places
    const decimals = balance < 1 ? 6 : 2;
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const copyToClipboard = async (address: string, walletId: number) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedWalletId(walletId);
      setTimeout(() => setCopiedWalletId(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

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
              <div className="mx-4 lg:mx-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                {flash.success}
              </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 lg:px-6">
              <div>
                <h1 className="text-2xl font-bold">My Wallet</h1>
                <p className="text-muted-foreground">Manage your balances and transactions</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <a href="/withdraw">
                    <IconArrowUpRight className="mr-2 h-4 w-4" />
                    Withdraw
                  </a>
                </Button>
                <Button asChild className="w-full sm:w-auto">
                  <a href="/topup">
                    <IconPlus className="mr-2 h-4 w-4" />
                    Top Up
                  </a>
                </Button>
              </div>
            </div>

            {/* Balance Cards */}
            <div className="px-4 lg:px-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {balances.map((balance) => (
                  <Card key={balance.currency}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {balance.currency} Balance
                      </CardTitle>
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
                      <div className="space-y-2">
                        <div className="text-2xl font-bold">
                          {showBalance
                            ? formatCurrency(balance.available, balance.currency)
                            : '••••••'
                          }
                        </div>
                        {showBalance && (
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Total:</span>
                              <span>{formatCurrency(balance.balance, balance.currency)}</span>
                            </div>
                            {balance.reserved > 0 && (
                              <div className="flex justify-between">
                                <span>Reserved:</span>
                                <span>{formatCurrency(balance.reserved, balance.currency)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Blockchain Wallets */}
            <div className="px-4 lg:px-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Blockchain Wallets</CardTitle>
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
                  {wallets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No wallets created yet</p>
                  ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {wallets.map((wallet) => (
                        <div
                          key={wallet.id}
                          className="p-4 border rounded-lg flex flex-col h-full"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            {wallet.logo ? (
                              <img
                                src={wallet.logo}
                                alt={wallet.chain}
                                className="w-6 h-6 rounded-full flex-shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-gray-600">
                                  {wallet.chain.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium flex items-center gap-2">
                                {wallet.chain} ({wallet.symbol})
                                {wallet.is_primary && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Primary</Badge>
                                )}
                              </div>
                              {showWalletBalance && (
                                <div className="text-sm font-bold mt-1">
                                  {formatTokenBalance(wallet.balance, wallet.symbol)} {wallet.symbol}
                                </div>
                              )}
                              {!showWalletBalance && (
                                <div className="text-sm font-bold mt-1">
                                  •••••• {wallet.symbol}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-auto">
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <div className="text-xs text-muted-foreground font-mono truncate flex-1">
                                {wallet.address}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-shrink-0 p-1 h-auto"
                                onClick={() => copyToClipboard(wallet.address, wallet.id)}
                                aria-label="Copy wallet address"
                              >
                                {copiedWalletId === wallet.id ? (
                                  <IconCheck className="h-4 w-4 text-green-600" />
                                ) : (
                                  <IconCopy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <div className="px-4 lg:px-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <IconCreditCard className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>No transactions yet</p>
                      <p className="text-sm">Your transaction history will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            {getTransactionIcon(transaction.type)}
                            <div className="min-w-0">
                              <div className="font-medium capitalize truncate">
                                {transaction.type.replace('_', ' ')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {transaction.created_at}
                              </div>
                              {transaction.reference && (
                                <div className="text-xs text-muted-foreground truncate max-w-xs">
                                  Ref: {transaction.reference}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <div className={`font-medium ${getTransactionColor(transaction.type)}`}>
                              {transaction.type === 'withdrawal' ? '-' : '+'}
                              {formatCurrency(transaction.amount, transaction.currency)}
                            </div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {transaction.currency}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
