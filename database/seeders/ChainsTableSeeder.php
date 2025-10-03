<?php

namespace Database\Seeders;

use App\Models\Chains;
use Illuminate\Database\Seeder;

class ChainsTableSeeder extends Seeder
{
    public function run(): void
    {
        $chains = [
            [
                'slug' => 'ethereum',
                'name' => 'Ethereum',
                'symbol' => 'ETH',
                'decimals' => 18,
                'logo' => 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
            ],
            [
                'slug' => 'solana',
                'name' => 'Solana',
                'symbol' => 'SOL',
                'decimals' => 9,
                'logo' => 'https://cryptologos.cc/logos/solana-sol-logo.png',
            ],
            [
                'slug' => 'pi',
                'name' => 'Pi Network',
                'symbol' => 'PI',
                'decimals' => 8,
                'logo' => 'https://cryptologos.cc/logos/pi-coin-pi-logo.png',
            ],
            [
                'slug' => 'sidra',
                'name' => 'Sidra Chain',
                'symbol' => 'SIDRA',
                'decimals' => 18,
                'logo' => null, // update when you get official logo
            ],
        ];

        foreach ($chains as $chain) {
            Chains::firstOrCreate(['slug' => $chain['slug']], $chain);
        }
    }
}
