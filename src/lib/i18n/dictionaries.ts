import type { Dictionary } from "./en";
import en from "./en";
import hi from "./hi";
import es from "./es";
import pt from "./pt";
import fr from "./fr";
import de from "./de";
import ja from "./ja";
import zh from "./zh";
import ar from "./ar";
import id from "./id";

export const DICTIONARIES: Record<string, Dictionary> = { en, hi, es, pt, fr, de, ja, zh, ar, id };

export type TranslationKey = keyof Dictionary;
