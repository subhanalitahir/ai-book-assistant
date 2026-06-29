import { z } from "zod";
import {
  MAX_FILE_SIZE,
  ACCEPTED_PDF_TYPES,
  MAX_IMAGE_SIZE,
  ACCEPTED_IMAGE_TYPES,
} from "./constants";

// Voice options
export const VOICE_OPTIONS = {
  male: [
    { id: "dave", name: "Dave", description: "Natural, warm male voice" },
    {
      id: "daniel",
      name: "Daniel",
      description: "Clear, professional male voice",
    },
    {
      id: "chris",
      name: "Chris",
      description: "Friendly, engaging male voice",
    },
  ],
  female: [
    {
      id: "rachel",
      name: "Rachel",
      description: "Engaging, expressive female voice",
    },
    {
      id: "sarah",
      name: "Sarah",
      description: "Clear, confident female voice",
    },
  ],
};

export const UploadSchema = z.object({
  pdfFile: z
    .instanceof(File)
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `PDF file must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    )
    .refine(
      (file) => ACCEPTED_PDF_TYPES.includes(file.type),
      "Only PDF files are accepted",
    ),

  coverImage: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size <= MAX_IMAGE_SIZE,
      `Cover image must be less than ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only JPEG, PNG, and WebP images are accepted",
    ),

  title: z
    .string()
    .min(1, "Title is required")
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be less than 200 characters"),

  author: z
    .string()
    .min(1, "Author name is required")
    .min(2, "Author name must be at least 2 characters")
    .max(200, "Author name must be less than 200 characters"),

  voiceId: z
    .enum(["dave", "daniel", "chris", "rachel", "sarah"])
    .refine((val) => val, "Please select a voice assistant"),
});

export type UploadFormData = z.infer<typeof UploadSchema>;
