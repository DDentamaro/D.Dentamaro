import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import commandResult from '../schemas/command-result.schema.json' with { type: 'json' };
import defs from '../schemas/defs.schema.json' with { type: 'json' };
import gameAction from '../schemas/game-action.schema.json' with { type: 'json' };
import tableSnapshot from '../schemas/table-snapshot.schema.json' with { type: 'json' };

export const PROTOCOL_VERSION = 1;

export const ERROR_CODES = defs.$defs.errorCode.enum as readonly string[];
export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'ACCOUNT_RESTRICTED'
  | 'INVALID_PAYLOAD'
  | 'NOT_YOUR_TURN'
  | 'STALE_HAND'
  | 'STALE_TURN'
  | 'STALE_STATE'
  | 'ILLEGAL_ACTION'
  | 'INSUFFICIENT_FUNDS'
  | 'IDEMPOTENCY_CONFLICT'
  | 'RATE_LIMITED'
  | 'MATCH_PAUSED'
  | 'MATCH_ALREADY_STARTED'
  | 'MATCH_FINISHED'
  | 'SERVICE_UNAVAILABLE';

export const schemas = { defs, gameAction, commandResult, tableSnapshot } as const;

export interface ContractValidators {
  readonly gameAction: ValidateFunction;
  readonly commandResult: ValidateFunction;
  readonly tableSnapshot: ValidateFunction;
}

/** Validatori stretti (enum chiusi, additionalProperties=false) per gateway e test di contratto. */
export function createValidators(): ContractValidators {
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats.default(ajv);
  ajv.addSchema(defs);
  return {
    gameAction: ajv.compile(gameAction),
    commandResult: ajv.compile(commandResult),
    tableSnapshot: ajv.compile(tableSnapshot),
  };
}

/** Frame client massimo proposto (§11.7). */
export const MAX_CLIENT_FRAME_BYTES = 8 * 1024;
