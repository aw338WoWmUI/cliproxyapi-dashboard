import { z } from "zod";

const positiveInteger = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
const keyword = z.enum(["ultrawork", "team", "hyperplan", "hyperplan-ultrawork"]);

// Mirror the pinned upstream sections without runtime code generation in client bundles.
const sections: Record<string, z.ZodType<unknown>> = {
  goal: z.object({
    enabled: z.boolean().optional(),
    auto_start: z.boolean().optional(),
    default_max_iterations: z.number().min(1).max(1000).optional(),
  }).strict(),
  i18n: z.object({ locale: z.string().optional() }).strict(),
  monitor: z.object({
    enabled: z.boolean().optional(),
    live_mode_enabled: z.boolean().optional(),
    allowed_commands: z.array(z.string()).optional(),
    max_monitors_per_session: positiveInteger.max(16).optional(),
    max_runtime_ms: positiveInteger.min(1000).optional(),
    batch_max_lines: positiveInteger.optional(),
    batch_max_bytes: positiveInteger.min(1024).optional(),
    flush_interval_ms: positiveInteger.min(250).optional(),
    ring_max_lines: positiveInteger.optional(),
    line_max_bytes: positiveInteger.min(256).optional(),
    pattern_max_length: positiveInteger.optional(),
  }).strict(),
  team_mode: z.object({
    enabled: z.boolean().optional(),
    tmux_visualization: z.boolean().optional(),
    max_parallel_members: positiveInteger.max(8).optional(),
    max_members: positiveInteger.max(8).optional(),
    max_messages_per_run: positiveInteger.optional(),
    max_wall_clock_minutes: positiveInteger.optional(),
    max_member_turns: positiveInteger.optional(),
    base_dir: z.string().optional(),
    message_payload_max_bytes: positiveInteger.min(1024).optional(),
    recipient_unread_max_bytes: positiveInteger.min(1024).optional(),
    mailbox_poll_interval_ms: positiveInteger.min(500).optional(),
  }).strict(),
  keyword_detector: z.object({
    enabled_expansions: z.array(keyword).optional(),
    disabled_keywords: z.array(keyword).optional(),
  }).strict(),
  tui: z.object({
    sidebar: z.object({ enabled: z.boolean().optional() }).strict().optional(),
  }).strict(),
  ulw_execute: z.object({ auto_commit: z.boolean().optional() }).strict(),
  default_mode: z.object({
    ultrawork: z.boolean().optional(),
    goal: z.boolean().optional(),
  }).strict(),
};

export function isValidOmoSection(key: string, value: unknown): boolean {
  return sections[key]?.safeParse(value).success ?? false;
}
