import pg from 'pg';

// Les numeric (scores) sont renvoyes en nombres JS plutot qu'en chaines.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => Number(v));

export type Db = pg.Pool;

export function createPool(connectionString: string): Db {
  return new pg.Pool({ connectionString, max: 10 });
}
