import { IsIn, IsISO8601, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class SaveBirthDataDto {
  @IsString() label!: string;
  @IsNumber() @Min(-90) @Max(90) lat!: number;
  @IsNumber() @Min(-180) @Max(180) lon!: number;
  @IsISO8601() utc!: string;
  @IsOptional() @IsString() @IsIn(['P','K','R','C','O','E','W','B','T','M','X','G'])
  hsys?: string;
}
