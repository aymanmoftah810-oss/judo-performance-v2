/**
 * Age category logic — ported unchanged from the verified Excel/web engine
 * (same 7 buckets, same gender-dependent adult tier: رجال for 17+ males,
 * آنسات for 17+ females). Age itself is always computed from birth YEAR
 * only, per the hard "no full birth date" requirement.
 */
export const AGE_CATEGORIES = Object.freeze(["تحت 9", "تحت 11", "تحت 13", "تحت 15", "تحت 17", "رجال", "آنسات"]);

export function getAgeCategory(age, gender) {
  if (age === null || age === undefined) return null;
  if (age < 9) return "تحت 9";
  if (age < 11) return "تحت 11";
  if (age < 13) return "تحت 13";
  if (age < 15) return "تحت 15";
  if (age < 17) return "تحت 17";
  return gender === "ذكر" ? "رجال" : "آنسات";
}
