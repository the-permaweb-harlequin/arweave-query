#!/usr/bin/env tsx

import { waddler } from '@atticusofsparta/waddler/duckdb-neo';
import { writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import process from 'process';

interface ColumnInfo {
  column_name: string;
  column_type: string;
  null: string;
  key: string;
  default: string;
  extra: string;
}

interface ParquetFile {
  name: string;
  path: string;
  tableName: string;
}

/**
 * Convert DuckDB types to TypeScript types
 */
function duckdbTypeToTypeScript(duckdbType: string): string {
  const type = duckdbType.toLowerCase();

  // Handle arrays
  if (type.includes('[]')) {
    const baseType = type.replace('[]', '');
    return `${duckdbTypeToTypeScript(baseType)}[]`;
  }

  // Handle structs
  if (type.startsWith('struct(') || type.startsWith('struct<')) {
    // For now, return generic object - we'll handle this more sophisticatedly later
    return 'Record<string, any>';
  }

  // Handle decimal with precision/scale
  if (type.startsWith('decimal(')) {
    return 'string'; // Decimals are often returned as strings to preserve precision
  }

  // Basic type mappings
  switch (type) {
    // String types
    case 'varchar':
    case 'text':
    case 'string':
      return 'string';

    // Binary types (buffers)
    case 'blob':
      return 'Uint8Array';

    // Large integer types (use BigInt for precision)
    case 'bigint':
    case 'ubigint':
      return 'bigint';

    // Regular integer types
    case 'integer':
    case 'int':
    case 'uinteger':
    case 'smallint':
    case 'usmallint':
    case 'tinyint':
    case 'utinyint':
      return 'number';

    // Floating point types
    case 'double':
    case 'float':
    case 'real':
      return 'number';

    // Decimal/numeric types (preserve precision as string)
    case 'decimal':
    case 'numeric':
      return 'string';

    // Boolean types
    case 'boolean':
    case 'bool':
      return 'boolean';

    // Date/time types
    case 'timestamp':
    case 'timestamptz':
    case 'timestamp with time zone':
    case 'timestamp without time zone':
      return 'Date | string';
    case 'date':
      return 'Date | string';
    case 'time':
    case 'timetz':
      return 'string';

    // JSON types
    case 'json':
    case 'jsonb':
      return 'any';

    // UUID type
    case 'uuid':
      return 'string';

    // Interval type
    case 'interval':
      return 'string';

    // Binary types
    case 'bytea':
    case 'binary':
    case 'varbinary':
      return 'Uint8Array';

    default:
      console.warn(`Unknown DuckDB type: ${duckdbType}, defaulting to 'any'`);
      return 'any';
  }
}

/**
 * Analyze null values in a column
 */
async function analyzeColumnNulls(
  sql: any,
  viewName: string,
  columnName: string
): Promise<{ hasNulls: boolean; nullCount: number; totalCount: number }> {
  try {
    // Quote column name to handle reserved keywords like 'offset'
    const quotedColumn = `"${columnName}"`;
    const query = `SELECT ${quotedColumn} IS NULL as is_null, COUNT(*)::INTEGER as count FROM ${viewName} GROUP BY 1`;
    const results = (await sql.unsafe(query)) as Array<{
      is_null: boolean;
      count: number;
    }>;

    let nullCount = 0;
    let totalCount = 0;

    for (const row of results) {
      // Convert to number to avoid BigInt issues
      const count = Number(row.count);
      totalCount += count;
      if (row.is_null) {
        nullCount = count;
      }
    }

    return {
      hasNulls: nullCount > 0,
      nullCount,
      totalCount,
    };
  } catch (error) {
    console.warn(
      chalk.yellow(
        `    Warning: Could not analyze nulls for ${columnName}:`,
        error
      )
    );
    return { hasNulls: false, nullCount: 0, totalCount: 0 };
  }
}

/**
 * Determine if a field should be optional based on its name and blockchain context
 */
function isFieldOptional(columnName: string): boolean {
  const optionalFields = [
    'target', // Transactions don't always have targets
    'content_type', // May not be set
    'anchor', // Optional field
    'parent', // Only for data items
    'data_root', // May not be present
    'root_transaction_id', // Only for data items
    'root_parent_offset', // Only for data items
  ];

  return optionalFields.includes(columnName);
}

/**
 * Generate SQL query templates for a table
 */
function generateSqlQueries(
  tableName: string,
  columns: ColumnInfo[],
  parquetPath: string
): string {
  // Convert snake_case or kebab-case to PascalCase
  const pascalCaseName = tableName
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  const columnList = columns.map((col) => `  ${col.column_name}`).join(',\n');

  let queries = `// SQL query templates for ${tableName}\n`;
  queries += `export const ${pascalCaseName}Queries = {\n`;

  // Select all query
  queries += `  selectAll: (sql: any, parquetUrl: string) => sql\`\n`;
  queries += `    SELECT\n${columnList}\n`;
  queries += `    FROM read_parquet(\${parquetUrl})\n`;
  queries += `  \`,\n\n`;

  // Select by ID query (if id column exists)
  const hasId = columns.some((col) => col.column_name === 'id');
  if (hasId) {
    queries += `  selectById: (sql: any, parquetUrl: string, id: string) => sql\`\n`;
    queries += `    SELECT\n${columnList}\n`;
    queries += `    FROM read_parquet(\${parquetUrl})\n`;
    queries += `    WHERE id = \${id}\n`;
    queries += `    LIMIT 1\n`;
    queries += `  \`,\n\n`;
  }

  // Select by height query (if height column exists)
  const hasHeight = columns.some((col) => col.column_name === 'height');
  if (hasHeight) {
    queries += `  selectByHeight: (sql: any, parquetUrl: string, height: bigint) => sql\`\n`;
    queries += `    SELECT\n${columnList}\n`;
    queries += `    FROM read_parquet(\${parquetUrl})\n`;
    queries += `    WHERE height = \${height}\n`;
    queries += `  \`,\n\n`;

    queries += `  selectByHeightRange: (sql: any, parquetUrl: string, minHeight: bigint, maxHeight: bigint) => sql\`\n`;
    queries += `    SELECT\n${columnList}\n`;
    queries += `    FROM read_parquet(\${parquetUrl})\n`;
    queries += `    WHERE height >= \${minHeight} AND height <= \${maxHeight}\n`;
    queries += `    ORDER BY height DESC\n`;
    queries += `  \`,\n\n`;
  }

  // Count query
  queries += `  count: (sql: any, parquetUrl: string) => sql\`\n`;
  queries += `    SELECT COUNT(*) as total\n`;
  queries += `    FROM read_parquet(\${parquetUrl})\n`;
  queries += `  \`,\n\n`;

  queries += `} as const;\n\n`;

  return queries;
}

/**
 * Generate column names object for type-safe column references
 */
function generateColumnNames(tableName: string, columns: ColumnInfo[]): string {
  // Convert snake_case or kebab-case to PascalCase
  const pascalCaseName = tableName
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  let columnNames = `// Column names for ${tableName}\n`;
  columnNames += `export const ${pascalCaseName}Columns = {\n`;

  for (const col of columns) {
    // Use the column name as both key and value for type safety
    columnNames += `  ${col.column_name}: '${col.column_name}' as const,\n`;
  }

  columnNames += `} as const;\n\n`;

  // Also generate a type for the column names
  columnNames += `export type ${pascalCaseName}ColumnName = keyof typeof ${pascalCaseName}Columns;\n\n`;

  return columnNames;
}

/**
 * Generate TypeScript interface from column info
 */
function generateInterface(tableName: string, columns: ColumnInfo[]): string {
  // Convert snake_case or kebab-case to PascalCase
  const pascalCaseName = tableName
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  const interfaceName = `${pascalCaseName}Row`;

  let interfaceStr = `export interface ${interfaceName} {\n`;

  for (const col of columns) {
    const tsType = duckdbTypeToTypeScript(col.column_type);
    // For blockchain data, most fields should be required
    // Only make fields optional if they're clearly optional based on domain knowledge
    const optional = isFieldOptional(col.column_name) ? '?' : '';
    interfaceStr += `  ${col.column_name}${optional}: ${tsType};\n`;
  }

  interfaceStr += '}\n\n';
  return interfaceStr;
}

/**
 * Find all parquet files in fixtures directory
 */
function findParquetFiles(fixturesDir: string): ParquetFile[] {
  if (!existsSync(fixturesDir)) {
    console.error(`Fixtures directory not found: ${fixturesDir}`);
    return [];
  }

  const files = readdirSync(fixturesDir, { recursive: true }) as string[];

  return files
    .filter((file) => file.endsWith('.parquet'))
    .map((file) => {
      const fullPath = join(fixturesDir, file);
      const name = file.replace('.parquet', '');
      const tableName = name.replace(/[^a-zA-Z0-9]/g, '_');

      return {
        name,
        path: fullPath,
        tableName,
      };
    });
}

/**
 * Main codegen function
 */
async function generateParquetTypes() {
  console.log(chalk.blue.bold('🦆 Starting Parquet Types Codegen...\n'));

  // Initialize DuckDB
  const sql = waddler({
    url: ':memory:',
    accessMode: 'read_write',
  });

  try {
    // Find parquet files
    const fixturesDir = join(process.cwd(), 'fixtures');
    const parquetFiles = findParquetFiles(fixturesDir);

    if (parquetFiles.length === 0) {
      console.log('No parquet files found in fixtures directory');
      return;
    }

    console.log(chalk.green(`Found ${parquetFiles.length} parquet files:`));
    parquetFiles.forEach((file) => {
      console.log(chalk.gray(`  - ${file.name}`));
    });
    console.log();

    let generatedTypes = `// Generated by codegen-parquet-types.ts
// Do not edit this file manually

`;

    // Process each parquet file
    for (const file of parquetFiles) {
      console.log(chalk.cyan(`\nProcessing ${chalk.bold(file.name)}...`));

      try {
        // Create a view from the parquet file using raw SQL (DDL can't use parameters)
        const viewName = `"${file.tableName}"`;
        const createViewQuery = `CREATE OR REPLACE VIEW ${viewName} AS SELECT * FROM read_parquet('${file.path}')`;
        await sql.unsafe(createViewQuery);

        // Describe the table to get column information
        const describeQuery = `DESCRIBE ${viewName}`;
        const columns = (await sql.unsafe(describeQuery)) as ColumnInfo[];

        console.log(chalk.green(`  Found ${columns.length} columns:`));

        // Analyze null values for each column
        for (const col of columns) {
          const tsType = duckdbTypeToTypeScript(col.column_type);
          const isOptional = isFieldOptional(col.column_name);
          const nullAnalysis = await analyzeColumnNulls(
            sql,
            viewName,
            col.column_name
          );

          const optionalIndicator = isOptional
            ? chalk.yellow(' (optional)')
            : '';
          const duckdbNullable =
            col.null === 'YES' ? chalk.gray(' [duckdb: nullable]') : '';

          let nullInfo = '';
          if (nullAnalysis.hasNulls) {
            const percentage = (
              (nullAnalysis.nullCount / nullAnalysis.totalCount) *
              100
            ).toFixed(1);
            nullInfo = chalk.red(
              ` [${nullAnalysis.nullCount}/${nullAnalysis.totalCount} nulls (${percentage}%)]`
            );
          } else if (nullAnalysis.totalCount > 0) {
            nullInfo = chalk.green(' [no nulls]');
          }

          console.log(
            chalk.gray(
              `    ${chalk.white(col.column_name)}: ${chalk.blue(col.column_type)} → ${chalk.magenta(tsType)}${optionalIndicator}${duckdbNullable}${nullInfo}`
            )
          );
        }

        // Generate column names object
        const columnNames = generateColumnNames(file.tableName, columns);
        generatedTypes += columnNames;

        // Generate TypeScript interface
        const interfaceCode = generateInterface(file.tableName, columns);
        generatedTypes += `// ${file.name} parquet schema\n${interfaceCode}`;

        // Generate SQL query templates
        const sqlQueries = generateSqlQueries(
          file.tableName,
          columns,
          file.path
        );
        generatedTypes += sqlQueries;

        // Drop the view using raw SQL
        const dropViewQuery = `DROP VIEW ${viewName}`;
        await sql.unsafe(dropViewQuery);
      } catch (error) {
        console.error(chalk.red(`  Error processing ${file.name}:`), error);
      }
    }

    // Write generated types to file
    const outputPath = join(
      process.cwd(),
      'packages/core/src/generated/parquet-types.ts'
    );
    writeFileSync(outputPath, generatedTypes);

    console.log(
      chalk.green.bold(
        `\n✅ Generated types written to: ${chalk.underline(outputPath)}`
      )
    );
  } catch (error) {
    console.error(chalk.red.bold('❌ Error during codegen:'), error);
    process.exit(1);
  }
}

// Run the codegen
generateParquetTypes().catch(console.error);
