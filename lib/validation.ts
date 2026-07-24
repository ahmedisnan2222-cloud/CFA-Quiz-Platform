import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const quizFormSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional().or(z.literal("")),
    opensAt: z.string().min(1, "Opening time is required"),
    closesAt: z.string().min(1, "Closing time is required"),
    durationMinutes: z.coerce.number().int().min(1, "Duration must be at least 1 minute"),
    aikenText: z.string().min(1, "Paste or upload Aiken-format questions"),
  })
  .refine((data) => new Date(data.closesAt) > new Date(data.opensAt), {
    message: "Closing time must be after opening time",
    path: ["closesAt"],
  });

export const confidenceSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
