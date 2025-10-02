import { Command, Flags } from '@oclif/core';
import { ArweaveQueryClient, GraphQLProvider } from '@arweave-query/core';
import chalk from 'chalk';
import Table from 'cli-table3';

export default class Query extends Command {
  static description = 'Query Arweave transactions';

  static examples = [
    '<%= config.bin %> <%= command.id %> --owner 1234567890abcdef',
    '<%= config.bin %> <%= command.id %> --tag "App-Name:MyApp"',
    '<%= config.bin %> <%= command.id %> --limit 5',
  ];

  static flags = {
    owner: Flags.string({
      char: 'o',
      description: 'Filter by transaction owner',
      multiple: true,
    }),
    recipient: Flags.string({
      char: 'r',
      description: 'Filter by transaction recipient',
      multiple: true,
    }),
    tag: Flags.string({
      char: 't',
      description: 'Filter by tag (format: name:value)',
      multiple: true,
    }),
    'min-block': Flags.integer({
      description: 'Minimum block height',
    }),
    'max-block': Flags.integer({
      description: 'Maximum block height',
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of transactions to return',
      default: 10,
    }),
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
    const { flags } = await this.parse(Query);

    // Parse tags
    const tags = flags.tag?.map((tag) => {
      const [name, ...valueParts] = tag.split(':');
      const value = valueParts.join(':');
      return { name, values: [value] };
    });

    // Create client
    const provider = new GraphQLProvider(`${flags.gateway}/graphql`);
    const client = new ArweaveQueryClient({
      transactionProvider: provider,
    });

    try {
      const result = await client.getTransactions({
        owners: flags.owner,
        recipients: flags.recipient,
        tags,
        block: {
          min: flags['min-block'],
          max: flags['max-block'],
        },
        first: flags.limit,
      });

      if (flags.json) {
        this.log(JSON.stringify(result, null, 2));
        return;
      }

      if (result.data.length === 0) {
        this.log(chalk.yellow('No transactions found'));
        return;
      }

      const table = new Table({
        head: ['ID', 'Owner', 'Target', 'Block Height', 'Tags'],
        colWidths: [45, 45, 45, 15, 50],
      });

      result.data.forEach((tx) => {
        const tagsStr = tx.tags
          .slice(0, 2)
          .map((tag) => `${tag.name}:${tag.value}`)
          .join(', ');
        const moreTagsStr =
          tx.tags.length > 2 ? ` (+${tx.tags.length - 2} more)` : '';

        table.push([
          tx.id,
          tx.owner.address.slice(0, 20) + '...',
          tx.recipient ? tx.recipient.slice(0, 20) + '...' : '-',
          tx.block?.height?.toString() || '-',
          tagsStr + moreTagsStr,
        ]);
      });

      this.log(table.toString());
      this.log(
        chalk.green(
          `Found ${result.data.length} transactions${
            result.hasNextPage ? ' (more available)' : ''
          }`
        )
      );
    } catch (error) {
      this.error(`Query failed: ${error}`);
    }
  }
}
