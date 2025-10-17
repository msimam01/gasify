import { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconArrowLeft, IconWallet, IconBuildingBank, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

// Simple debounce function to limit API calls
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface WalletBalance {
  currency: string;
  balance: number;
  available: number;
  reserved: number;
  token_balance: number;
}

interface NetworkInfo {
  id: string;
  name: string;
  chainType: 'evm' | 'solana' | 'bitcoin';
  currencies: string[];
}

export default function WalletWithdraw({ balances }: { balances: WalletBalance[] }) {
  const [selectedMethod, setSelectedMethod] = useState('bank');
  const [selectedCurrency, setSelectedCurrency] = useState(balances.length > 0 ? balances[0].currency : 'NGN');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<string>('pending');
  const [isPolling, setIsPolling] = useState(false);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [estimate, setEstimate] = useState<{
    usdAmount: number;
    ngnAmount: number;
    platformFee: number;
    usdPlatformFee: number;
    ngnPlatformFee: number;
    gasFee: number;
    usdGasFee: number;
    ngnGasFee: number;
    nativeCurrency: string;
    totalInCurrency: number;
    totalUsd: number;
    ngnTotal: number;
  } | null>(null);
  const [isFetchingEstimate, setIsFetchingEstimate] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    amount: '',
    currency: selectedCurrency,
    destination: '',
    bank_name: '',
    account_number: '',
    account_name: '',
    wallet_address: '',
    network: '',
    memo: '',
  });

  // Network configurations
  const networks: NetworkInfo[] = [
    { id: 'ethereum', name: 'Ethereum (ERC20)', chainType: 'evm', currencies: ['ETH', 'USDT', 'USDC'] },
    { id: 'binance', name: 'BNB Smart Chain (BEP20)', chainType: 'evm', currencies: ['BNB', 'USDT', 'USDC'] },
    { id: 'arbitrum', name: 'Arbitrum', chainType: 'evm', currencies: ['ETH', 'USDT', 'USDC'] },
    { id: 'optimism', name: 'Optimism', chainType: 'evm', currencies: ['ETH', 'USDT', 'USDC'] },
    { id: 'solana', name: 'Solana', chainType: 'solana', currencies: ['SOL', 'USDT', 'USDC'] },
  ];

  // Get available balance for selected currency
  const selectedBalance = balances.find(b => b.currency === selectedCurrency) || {
    currency: selectedCurrency,
    available: 0,
    balance: 0,
    reserved: 0,
    token_balance: 0,
  };

  // Check if currency is fiat
  const isFiat = ['NGN', 'USD'].includes(selectedCurrency);
  const isSolana = selectedCurrency === 'SOL';

  // Get available networks for selected currency
  const availableNetworks = networks.filter(n => n.currencies.includes(selectedCurrency));

  // Payment methods
  const withdrawalMethods = [
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: IconBuildingBank,
      description: 'Withdraw to your bank account',
      enabled: isFiat,
    },
    {
      id: 'crypto',
      name: 'Crypto Wallet',
      icon: IconWallet,
      description: 'Withdraw to external wallet',
      enabled: !isFiat,
    },
  ];

  // Quick amounts (adjusted for crypto)
  const getQuickAmounts = () => {
    if (isFiat) {
      return [5000, 10000, 20000, 50000, 100000];
    } else if (isSolana) {
      return [0.1, 0.5, 1, 5, 10];
    } else {
      return [0.001, 0.01, 0.1, 0.5, 1];
    }
  };

  // Fetch withdrawal estimate
  const fetchEstimate = useCallback(
    debounce(() => {
      if (selectedMethod === 'crypto' && data.amount && parseFloat(data.amount) > 0 && data.network) {
        setIsFetchingEstimate(true);
        axios
          .get('/api/withdrawal-estimate', {
            params: {
              amount: data.amount,
              currency: selectedCurrency,
              network: data.network,
            },
            headers: {
              Accept: 'application/json',
            },
          })
          .then(response => {
            setEstimate(response.data);
            setErrorMessage('');
          })
          .catch(error => {
            console.error('Failed to fetch withdrawal estimate:', error);
            let message = 'Unable to fetch fee estimates. Please try again.';
            if (error.response?.status === 404) {
              message = 'Withdrawal estimate service is unavailable. Please contact support.';
            } else if (error.response?.status === 401) {
              message = 'Please log in to fetch withdrawal estimates.';
            } else if (error.response?.data?.error) {
              message = error.response.data.error;
            }
            setErrorMessage(message);
            setEstimate(null);
          })
          .finally(() => {
            setIsFetchingEstimate(false);
          });
      } else {
        setEstimate(null);
        setErrorMessage('');
        setIsFetchingEstimate(false);
      }
    }, 500),
    [data.amount, selectedCurrency, data.network, selectedMethod]
  );

  // Trigger estimate fetch on amount, currency, network, or method change
  useEffect(() => {
    fetchEstimate();
  }, [fetchEstimate]);

  // Check if user can afford the withdrawal including fees
  const canWithdraw = useMemo(() => {
    if (!estimate || isFiat) return true;
    const available = isFiat ? selectedBalance.available : selectedBalance.token_balance;
    if (available < estimate.totalInCurrency) {
      return false;
    }
    if (selectedCurrency !== estimate.nativeCurrency) {
      const nativeBalance = balances.find(b => b.currency === estimate.nativeCurrency);
      const nativeAvailable = nativeBalance ? (nativeBalance.available || nativeBalance.token_balance) : 0;
      if (nativeAvailable < estimate.gasFee) {
        return false;
      }
    }
    return true;
  }, [estimate, selectedBalance, balances, selectedCurrency, isFiat]);

  // Poll for transaction status
  useEffect(() => {
    if (!transactionId || !isPolling) return;
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/withdrawal-status/${transactionId}`);
        const data = response.data;

        setTransactionStatus(data.status);
        setStatusMessage(data.message || '');

        if (data.explorer_url) {
          setExplorerUrl(data.explorer_url);
        }

        if (data.status === 'failed') {
          setErrorMessage(data.failure_reason || 'Withdrawal failed. Please try again.');
        }

        // Stop polling if completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Failed to fetch transaction status:', error);
        // Don't stop polling on network errors, keep trying
      }
    }, 3000); // Poll every 3 seconds
    return () => clearInterval(pollInterval);
  }, [transactionId, isPolling]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post('/wallet/withdraw/process', data, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const responseData = response.data;

      // Handle structured response
      if (responseData.transaction_id) {
        setTransactionId(responseData.transaction_id);
        setStatusMessage(responseData.message || 'Withdrawal initiated successfully. Transaction is being processed.');
        setTransactionStatus(responseData.status || 'processing');
        setExplorerUrl(responseData.explorer_url || null);
        setErrorMessage(responseData.error || '');
        setShowSuccessDialog(true);
        setIsPolling(responseData.status === 'processing');
        reset();
      }
    } catch (error: any) {
      console.error('Withdrawal submission failed:', error);

      // Handle error response
      if (error.response?.data) {
        const errorData = error.response.data;
        setErrorMessage(errorData.error || 'Failed to process withdrawal. Please try again.');

        if (errorData.transaction_id) {
          setTransactionId(errorData.transaction_id);
          setTransactionStatus('failed');
          setShowSuccessDialog(true);
          setIsPolling(false);
        }
      }
    }
  };

  // Handle quick amount select
  const handleQuickAmount = (amount: number) => {
    setData('amount', amount.toString());
  };

  // Update form data when currency changes
  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value);
    setData('currency', value);
    // Reset to bank transfer when switching to fiat
    if (['NGN', 'USD'].includes(value)) {
      setSelectedMethod('bank');
      setData('network', '');
    } else {
      setSelectedMethod('crypto');
      // Auto-select network for Solana
      if (value === 'SOL') {
        setData('network', 'solana');
      } else {
        setData('network', '');
      }
    }
  };

  // Format currency symbol
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'NGN': '₦',
      'USD': '$',
      'ETH': 'Ξ',
      'BTC': '₿',
      'SOL': '◎',
    };
    return symbols[currency] || currency;
  };

  // Get minimum amount for currency
  const getMinAmount = (currency: string) => {
    const minAmounts: Record<string, number> = {
      'NGN': 500,
      'USD': 10,
      'ETH': 0.000001,
      'USDT': 0.000001,
      'USDC': 0.000001,
      'BTC': 0.000001,
      'SOL': 0.000001,
    };
    return minAmounts[currency] || 0;
  };

  // Get step for input based on currency
  const getAmountStep = (currency: string) => {
    return ['NGN', 'USD'].includes(currency) ? '0.01' : '0.000001';
  };

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'My Wallet', href: 'wallet' },
        { title: 'Withdraw', href: 'withdraw' },
      ]}
    >
      <Head title="Withdraw Funds" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 lg:px-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href={route('wallet')}>
                  <IconArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Withdraw Funds</h1>
                <p className="text-muted-foreground">Transfer money to your bank or crypto wallet</p>
              </div>
            </div>
            <div className="px-4 lg:px-6">
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Available Balance */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Available Balance</CardDescription>
                      <CardTitle className="text-2xl">
                        {getCurrencySymbol(selectedBalance.currency)}
                        {(isFiat ? selectedBalance.available : selectedBalance.token_balance).toLocaleString(undefined, {
                          minimumFractionDigits: isFiat ? 2 : 6,
                          maximumFractionDigits: isFiat ? 2 : 9,
                        })}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  {/* Amount Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Withdrawal Amount</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <div className="flex gap-2">
                          {/* Currency Select */}
                          <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {balances.map(balance => (
                                <SelectItem key={balance.currency} value={balance.currency}>
                                  {getCurrencySymbol(balance.currency)} {balance.currency}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {/* Input field */}
                          <div className="relative flex-1">
                            <Input
                              id="amount"
                              name="amount"
                              type="number"
                              placeholder="0.00"
                              value={data.amount}
                              onChange={e => setData('amount', e.target.value)}
                              className="flex-1 pr-10"
                              min={getMinAmount(selectedCurrency)}
                              step={getAmountStep(selectedCurrency)}
                              required
                            />
                            {isFetchingEstimate && (
                              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 animate-spin text-muted-foreground -translate-y-1/2" />
                            )}
                          </div>
                        </div>
                        {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
                        {errors.currency && <p className="text-sm text-red-600">{errors.currency}</p>}
                        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
                        <p className="text-xs text-muted-foreground">
                          Minimum: {getCurrencySymbol(selectedCurrency)}
                          {getMinAmount(selectedCurrency).toLocaleString()}
                        </p>
                      </div>
                      {/* Quick Amounts */}
                      <div>
                        <Label className="text-sm text-muted-foreground">Quick amounts</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {getQuickAmounts().map(amount => (
                            <Button
                              key={amount}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickAmount(amount)}
                              className="text-xs"
                            >
                              {getCurrencySymbol(selectedCurrency)}
                              {amount.toLocaleString()}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Withdrawal Method */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Withdrawal Method</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Tabs value={selectedMethod} onValueChange={setSelectedMethod} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          {withdrawalMethods.map(method => (
                            <TabsTrigger key={method.id} value={method.id} disabled={!method.enabled}>
                              {method.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {/* Bank Transfer Method */}
                        <TabsContent value="bank" className="space-y-4 pt-4">
                          <Alert>
                            <IconAlertCircle className="h-4 w-4" />
                            <AlertDescription>Bank withdrawals are processed within 1-2 business days</AlertDescription>
                          </Alert>
                          <div className="space-y-2">
                            <Label htmlFor="bank_name">Bank Name</Label>
                            <Input
                              id="bank_name"
                              name="bank_name"
                              value={data.bank_name}
                              onChange={e => setData('bank_name', e.target.value)}
                              placeholder="Enter bank name"
                              required={selectedMethod === 'bank'}
                            />
                            {errors.bank_name && <p className="text-sm text-red-600">{errors.bank_name}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="account_number">Account Number</Label>
                            <Input
                              id="account_number"
                              name="account_number"
                              value={data.account_number}
                              onChange={e => setData('account_number', e.target.value)}
                              placeholder="Enter account number"
                              required={selectedMethod === 'bank'}
                            />
                            {errors.account_number && <p className="text-sm text-red-600">{errors.account_number}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="account_name">Account Name</Label>
                            <Input
                              id="account_name"
                              name="account_name"
                              value={data.account_name}
                              onChange={e => setData('account_name', e.target.value)}
                              placeholder="Account holder name"
                              required={selectedMethod === 'bank'}
                            />
                            {errors.account_name && <p className="text-sm text-red-600">{errors.account_name}</p>}
                          </div>
                        </TabsContent>
                        {/* Crypto Withdrawal Method */}
                        <TabsContent value="crypto" className="space-y-4 pt-4">
                          {/* Network Selection Alert for Solana */}
                          {isSolana && (
                            <Alert>
                              <IconAlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Solana withdrawals are fast and typically confirm within seconds. Make sure you're sending
                                to a Solana wallet address.
                              </AlertDescription>
                            </Alert>
                          )}
                          {!isSolana && availableNetworks.length > 0 && (
                            <Alert>
                              <IconAlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Make sure to select the correct network. Sending to the wrong network may result in loss of
                                funds.
                              </AlertDescription>
                            </Alert>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="wallet_address">{isSolana ? 'Solana Wallet Address' : 'Wallet Address'}</Label>
                            <Input
                              id="wallet_address"
                              name="wallet_address"
                              value={data.wallet_address}
                              onChange={e => setData('wallet_address', e.target.value)}
                              placeholder={isSolana ? 'Enter Solana wallet address (Base58)' : 'Enter wallet address'}
                              required={selectedMethod === 'crypto'}
                              className="font-mono text-sm"
                            />
                            {errors.wallet_address && <p className="text-sm text-red-600">{errors.wallet_address}</p>}
                            {isSolana && (
                              <p className="text-xs text-muted-foreground">
                                Example: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
                              </p>
                            )}
                          </div>
                          {/* Network Selection - Only show if not Solana */}
                          {!isSolana && availableNetworks.length > 0 && (
                            <div className="space-y-2">
                              <Label htmlFor="network">Network</Label>
                              <Select name="network" value={data.network} onValueChange={value => setData('network', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select network" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableNetworks.map(network => (
                                    <SelectItem key={network.id} value={network.id}>
                                      {network.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {errors.network && <p className="text-sm text-red-600">{errors.network}</p>}
                            </div>
                          )}
                          {/* Memo/Tag field (optional for all crypto) */}
                          <div className="space-y-2">
                            <Label htmlFor="memo">Memo/Tag (Optional)</Label>
                            <Input
                              id="memo"
                              name="memo"
                              value={data.memo}
                              onChange={e => setData('memo', e.target.value)}
                              placeholder="Enter memo or tag if required"
                            />
                            <p className="text-xs text-muted-foreground">
                              Some exchanges require a memo or tag. Leave blank if not needed.
                            </p>
                          </div>
                          {/* Transaction info */}
                          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Network</span>
                              <span className="font-medium">
                                {isSolana
                                  ? 'Solana'
                                  : availableNetworks.find(n => n.id === data.network)?.name || 'Not selected'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Estimated Time</span>
                              <span className="font-medium">{isSolana ? '~1-2 minutes' : '~5-15 minutes'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Network Fee</span>
                              <span className="font-medium">
                                {isSolana ? '~0.000005 SOL' : 'Variable (estimated on confirmation)'}
                              </span>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                  {/* Summary Card */}
                  {data.amount && parseFloat(data.amount) > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Withdrawal Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-semibold">
                            {getCurrencySymbol(selectedCurrency)}
                            {parseFloat(data.amount).toLocaleString(undefined, {
                              minimumFractionDigits: isFiat ? 2 : 6,
                              maximumFractionDigits: isFiat ? 2 : 9,
                            })}
                          </span>
                        </div>
                        {isFetchingEstimate && (
                          <div className="flex justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        {estimate && !isFetchingEstimate && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">NGN Equivalent</span>
                              <span className="font-medium">
                                ₦{estimate.ngnAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">USD Equivalent</span>
                              <span className="font-medium">
                                ${estimate.usdAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Platform Fee</span>
                              <span className="font-medium">
                                {estimate.platformFee.toLocaleString(undefined, { maximumFractionDigits: 6 })}{' '}
                                {selectedCurrency} (~₦{estimate.ngnPlatformFee.toLocaleString(undefined, { maximumFractionDigits: 2 })})
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Estimated Gas Fee</span>
                              <span className="font-medium">
                                {estimate.gasFee.toLocaleString(undefined, { maximumFractionDigits: 6 })}{' '}
                                {estimate.nativeCurrency} (~₦{estimate.ngnGasFee.toLocaleString(undefined, { maximumFractionDigits: 2 })})
                              </span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span className="text-muted-foreground">Total Cost</span>
                              <span className="font-medium">
                                {estimate.totalInCurrency.toLocaleString(undefined, { maximumFractionDigits: 6 })}{' '}
                                {selectedCurrency} (~₦{estimate.ngnTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })})
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Method</span>
                          <span className="font-medium">
                            {selectedMethod === 'bank'
                              ? 'Bank Transfer'
                              : isSolana
                              ? 'Solana Network'
                              : availableNetworks.find(n => n.id === data.network)?.name || 'Crypto Wallet'}
                          </span>
                        </div>
                        {selectedMethod === 'crypto' && data.wallet_address && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Destination</span>
                            <span className="font-mono text-xs truncate max-w-[200px]">{data.wallet_address}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  {/* Warning */}
                  {selectedMethod === 'crypto' && (
                    <Alert variant="destructive">
                      <IconAlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Important:</strong> Double-check your wallet address and network.
                        {isSolana
                          ? ' Sending SOL to a non-Solana address will result in permanent loss of funds.'
                          : ' Sending to the wrong address or network will result in permanent loss of funds.'}
                      </AlertDescription>
                    </Alert>
                  )}
                  {!canWithdraw && (
                    <Alert variant="destructive">
                      <IconAlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Insufficient balance to cover the withdrawal amount including platform and gas fees.
                      </AlertDescription>
                    </Alert>
                  )}
                  {/* Withdrawal Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full sm:w-auto"
                      disabled={
                        processing ||
                        !data.amount ||
                        (selectedMethod === 'crypto' && !data.wallet_address) ||
                        (!isSolana && selectedMethod === 'crypto' && !data.network) ||
                        !canWithdraw
                      }
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Confirm Withdrawal'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              {transactionStatus === 'completed' ? (
                <IconCheck className="h-6 w-6 text-green-600" />
              ) : transactionStatus === 'failed' ? (
                <IconAlertCircle className="h-6 w-6 text-red-600" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              )}
            </div>
            <DialogTitle className="text-center">
              {transactionStatus === 'completed'
                ? 'Withdrawal Successful!'
                : transactionStatus === 'failed'
                ? 'Withdrawal Failed'
                : 'Processing Withdrawal'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {transactionStatus === 'completed' ? (
                <>
                  {statusMessage || 'Your withdrawal has been completed successfully!'}
                  {explorerUrl && (
                    <div className="mt-2 text-sm text-muted-foreground">Transaction ID: #{transactionId}</div>
                  )}
                </>
              ) : transactionStatus === 'failed' ? (
                <>
                  <div className="text-red-600 font-medium">
                    {errorMessage || 'Your withdrawal could not be processed. Please try again.'}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">Transaction ID: #{transactionId}</div>
                </>
              ) : (
                <>
                  {statusMessage || 'Your withdrawal is being processed. This may take a few moments.'}
                  <div className="mt-4 text-sm text-muted-foreground">Transaction ID: #{transactionId}</div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {transactionStatus === 'completed' && explorerUrl && (
              <Button
                onClick={() => {
                  window.open(explorerUrl, '_blank');
                }}
                variant="outline"
              >
                View on Blockchain Explorer
              </Button>
            )}
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                setIsPolling(false);
                router.visit(route('wallet'));
              }}
            >
              {transactionStatus === 'completed' ? 'Back to Wallet' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
