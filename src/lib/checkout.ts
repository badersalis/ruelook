import { z } from "zod";

export const COUNTRIES = ["Ghana", "Nigeria", "Liberia", "Sierra Leone", "The Gambia", "Other"] as const;

export const checkoutSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").max(254).email("Enter a valid email, like name@example.com"),
  phone: z
    .string()
    .trim()
    .min(5, "Enter a phone number")
    .max(40)
    .regex(/^[+()\d\s-]+$/, "Use digits, spaces, + or -"),
  full_name: z.string().trim().min(1, "Enter your full name").max(120),
  country: z.enum(COUNTRIES, { message: "Choose a country" }),
  city: z.string().trim().min(1, "Enter your city").max(80),
  address: z.string().trim().min(3, "Enter your street address").max(200),
});
export type CheckoutValues = z.infer<typeof checkoutSchema>;

/** Map Postgres RPC errors to plain language. */
export function checkoutErrorMessage(message: string): string {
  if (message.includes("not enough stock")) return "Some items just sold out in your size. Update your bag and try again.";
  if (message.includes("item unavailable")) return "An item in your bag is no longer available. Remove it and try again.";
  if (message.includes("too many orders")) return "You've placed several requests in the last hour. Try again later.";
  if (message.includes("cart is empty")) return "Your bag is empty.";
  return "We couldn't place your request. Check your connection and try again.";
}
