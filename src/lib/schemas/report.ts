import { z } from 'zod';
import { MAX_REPORT_DETAILS, REPORT_REASON_KEYS } from '@/constants/moderation';

export const reportFormSchema = z.object({
  reason: z.enum(REPORT_REASON_KEYS, { error: 'Choose a reason for your report.' }),
  details: z.string().trim().max(MAX_REPORT_DETAILS).optional(),
});
export type ReportFormValues = z.infer<typeof reportFormSchema>;
