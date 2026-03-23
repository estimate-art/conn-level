import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatOutletName = (name: string) => {
  if (!name.includes('.')) return name;

  const parts = name.split('.');
  if (parts.length < 2) return name;
  
  const firstPart = parts[0].substring(0, 5);
  const lastPart = parts[parts.length - 1].slice(-2);
  
  return `${firstPart}.${lastPart}`;
};

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
