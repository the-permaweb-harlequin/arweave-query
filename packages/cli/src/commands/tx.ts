import { Command, Args, Flags } from '@oclif/core';
import { ArweaveQueryClient, GraphQLProvider } from '@arweave-query/core';
import chalk from 'chalk';

export default class Tx extends Command {
  static description = 'Get transaction details';

  static examples = [
    '<%= config.bin %> <%= command.id %> 1234567890abcdef',
  ];

  static args = {
    id: Args.string({
      description: 'Transaction ID',
      required: true,
    }),
  };

  static flags = {
    provider: Flags.string({
      char: 'p',
      description: 'Query provider to use',
      default: 'graphql',
      options: ['graphql'],
    }),
    gateway: Flags.string({
      char: 'g',
      description: 'Gateway URL',
      default: 'https://arweave.net',
    }),
    json: Flags.boolean({
      description: 'Output as JSON',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Tx);

    // Create client
    const providers = [];
    if (flags.provider === 'graphql') {
      providers.push(new GraphQLProvider(\`\${flags.gateway}/graphql\`));
    }

    const client = new ArweaveQueryClient({ providers });

    try {
      const tx = await client.getTransaction(args.id);

      if (!tx) {
        this.log(chalk.yellow('Transaction not found'));
        return;
      }

      if (flags.json) {
        this.log(JSON.stringify(tx, null, 2));
        return;
      }

      this.log(chalk.bold('Transaction Details:'));
      this.log(\`ID: \${tx.id}\`);
      this.log(\`Owner: \${tx.owner}\`);
      this.log(\`Target: \${tx.target || 'None'}\`);
      this.log(\`Quantity: \${tx.quantity} winston\`);
      this.log(\`Reward: \${tx.reward} winston\`);
      this.log(\`Data Size: \${tx.data_size} bytes\`);

      if (tx.block) {
        this.log(\`Block Height: \${tx.block.height}\`);
        this.log(\`Block ID: \${tx.block.id}\`);
        this.log(\`Timestamp: \${new Date(tx.block.timestamp * 1000).toISOString()}\`);
      }

      if (tx.tags.length > 0) {
        this.log(chalk.bold('\\nTags:'));
        tx.tags.forEach((tag) => {
          this.log(\`  \${tag.name}: \${tag.value}\`);
        });
      }
    } catch (error) {
      this.error(\`Failed to get transaction: \${error}\`);
    }
  }
}
