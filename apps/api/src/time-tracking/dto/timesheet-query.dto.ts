import { IsDateString, IsNotEmpty } from 'class-validator';

/**
 * GET /api/v1/time-entries/timesheet
 * Date range query for the self timesheet summary.
 * Both parameters are required — frontend always knows the displayed month/week range.
 */
export class TimesheetQueryDto {
  /** Inclusive start date. YYYY-MM-DD. */
  @IsNotEmpty()
  @IsDateString()
  date_from!: string;

  /** Inclusive end date. YYYY-MM-DD. */
  @IsNotEmpty()
  @IsDateString()
  date_to!: string;
}
