import { IsArray, IsBoolean, IsIn, IsISO8601, IsInt, IsNumber, IsObject, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ALL_ASPECTS, ALL_BODY_IDS } from '@natalna/ephemeris-core';
import type { AspectType, BodyId, HouseSystem, NatalChart, OrbConfigMap } from '@natalna/ephemeris-core';

export class NatalSnapshotDto implements NatalChart {
  @IsString() utc!: string;
  @IsNumber() jd!: number;
  @IsNumber() lat!: number;
  @IsNumber() lon!: number;
  @IsString() @IsIn(['P','K','R','C','O','E','W','B','T','M','X','G']) hsys!: HouseSystem;
  @IsArray() bodies!: NatalChart['bodies'];
  @IsObject() angles!: NatalChart['angles'];
  @IsArray() cusps!: number[];
  @IsString() @IsIn(['day','night']) sect!: 'day' | 'night';
}

export class TransitsChunkDto {
  @ValidateNested()
  @Type(() => NatalSnapshotDto)
  natal!: NatalSnapshotDto;

  @IsISO8601() startUtc!: string;
  @IsISO8601() endUtc!: string;

  @IsInt() @Min(1) @Max(86400 * 30)
  stepSeconds!: number;

  @IsArray() @IsIn(ALL_BODY_IDS, { each: true })
  sceneBodies!: BodyId[];

  @IsArray() @IsIn(ALL_BODY_IDS, { each: true })
  aspectBodies!: BodyId[];

  @IsArray() @IsIn(ALL_ASPECTS, { each: true })
  enabledAspects!: AspectType[];

  @IsObject()
  orbConfig!: OrbConfigMap;

  @IsBoolean()
  includeTransitToTransit!: boolean;
}
