export type TcgdexCardBrief = {
  id?: string;
  image?: string;
  localId?: string | number;
  name?: string;
};

export type TcgdexSetBrief = {
  id?: string;
  name?: string;
};

export type TcgdexErrorKind =
  | "MALFORMED_QUERY"
  | "NETWORK_FAILURE"
  | "NO_MATCH"
  | "PROVIDER_OFFLINE"
  | "RATE_LIMITED";
