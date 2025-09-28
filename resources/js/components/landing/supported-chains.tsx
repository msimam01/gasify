import { Cpu, HardDrive, Server, Network, Zap, Database, CpuIcon, HardDriveIcon } from "lucide-react"

const chains = [
  { name: 'Ethereum', icon: Cpu },
  { name: 'Solana', icon: HardDrive },
  { name: 'Polygon', icon: Server },
  { name: 'BNB Chain', icon: Network },
  { name: 'Avalanche', icon: Zap },
  { name: 'Optimism', icon: CpuIcon },
  { name: 'Arbitrum', icon: HardDriveIcon },
]

export function SupportedChains() {
  return (
    <section className="bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold text-muted-foreground">
            Supported Blockchains
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
            {chains.map((chain) => (
              <div key={chain.name} className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm">
                  <chain.icon className="h-8 w-8 text-foreground/80" />
                </div>
                <span className="mt-2 text-sm font-medium text-muted-foreground">
                  {chain.name}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            And many more chains supported. We're constantly adding new networks.
          </p>
        </div>
      </div>
    </section>
  )
}
