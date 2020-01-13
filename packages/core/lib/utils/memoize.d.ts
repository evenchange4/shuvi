/**
 * Copyright (c) 2019 Alexander Reardon
 */
export declare type EqualityFn = (newArgs: any[], lastArgs: any[]) => boolean;
export declare function memoizeOne<ResultFn extends (this: any, ...newArgs: any[]) => ReturnType<ResultFn>>(resultFn: ResultFn, isEqual?: EqualityFn): ResultFn;
