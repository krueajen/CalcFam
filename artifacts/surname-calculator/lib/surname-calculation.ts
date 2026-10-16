export type SurnameGender = 'female' | 'male';
export type SurnameDeclension = 'declinable' | 'indeclinable';

export const LETTER_VALUE_GROUPS = [
  { value: 1, letters: 'А И С Ъ' },
  { value: 2, letters: 'Б Й Т Ы' },
  { value: 3, letters: 'В К У Ь' },
  { value: 4, letters: 'Г Л Ф Э' },
  { value: 5, letters: 'Д М Х Ю' },
  { value: 6, letters: 'Е Н Ц Я' },
  { value: 7, letters: 'Ё О Ч' },
  { value: 8, letters: 'Ж П Ш' },
  { value: 9, letters: 'З Р Щ' },
] as const;

const LETTER_VALUES = new Map<string, number>(
  LETTER_VALUE_GROUPS.flatMap(({ value, letters }) =>
    letters.split(' ').map((letter) => [letter, value] as const),
  ),
);

export interface SurnameCalculation {
  letters: string[];
  digits: number[];
  rawSum: number;
  baseNumber: number;
  baseReductionSteps: string[];
  adjustmentApplied: boolean;
  adjustedNumber: number;
  finalReductionSteps: string[];
  finalNumber: number;
}

export function isValidRussianSurname(surname: string): boolean {
  const normalized = surname.trim().toLocaleUpperCase('ru-RU');
  return /^[А-ЯЁ]+(?:[ -]+[А-ЯЁ]+)*$/u.test(normalized);
}

function reduceByTwentyTwo(value: number): {
  result: number;
  steps: string[];
} {
  let result = value;
  const steps: string[] = [];

  while (result > 22) {
    const next = result - 22;
    steps.push(`${result} − 22 = ${next}`);
    result = next;
  }

  return { result, steps };
}

export function calculateSurname(
  surname: string,
  gender: SurnameGender,
  declension: SurnameDeclension,
): SurnameCalculation {
  if (!isValidRussianSurname(surname)) {
    throw new Error('Введите фамилию русскими буквами.');
  }

  const letters = [...surname.toLocaleUpperCase('ru-RU')].filter((letter) =>
    LETTER_VALUES.has(letter),
  );
  const digits = letters.map((letter) => LETTER_VALUES.get(letter) ?? 0);
  const rawSum = digits.reduce((sum, digit) => sum + digit, 0);
  const reducedBase = reduceByTwentyTwo(rawSum);
  const adjustmentApplied =
    gender === 'female' && declension === 'indeclinable';
  const adjustedNumber = reducedBase.result + (adjustmentApplied ? 1 : 0);
  const reducedFinal = reduceByTwentyTwo(adjustedNumber);

  return {
    letters,
    digits,
    rawSum,
    baseNumber: reducedBase.result,
    baseReductionSteps: reducedBase.steps,
    adjustmentApplied,
    adjustedNumber,
    finalReductionSteps: reducedFinal.steps,
    finalNumber: reducedFinal.result,
  };
}
