import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { computeChunk } from '@natalna/ephemeris-core/node';
import type { ChunkRequest, ChunkResponse } from '@natalna/ephemeris-core';
import { createHash } from 'node:crypto';

@Injectable()
export class TransitsService {
  private readonly cache = new LRUCache<string, ChunkResponse>({ max: 50 });

  compute(req: ChunkRequest): ChunkResponse {
    const key = this.buildKey(req);
    const hit = this.cache.get(key);
    if (hit) return hit;
    const out = computeChunk(req);
    this.cache.set(key, out);
    return out;
  }

  private buildKey(req: ChunkRequest): string {
    const obj = {
      n: req.natal.utc + ':' + req.natal.lat.toFixed(4) + ':' + req.natal.lon.toFixed(4) + ':' + req.natal.hsys,
      s: req.startUtc, e: req.endUtc, st: req.stepSeconds,
      sb: [...req.sceneBodies].sort(),
      ab: [...req.aspectBodies].sort(),
      ea: [...req.enabledAspects].sort(),
      oc: req.orbConfig,
      tt: req.includeTransitToTransit,
    };
    return createHash('sha1').update(JSON.stringify(obj)).digest('hex');
  }
}
