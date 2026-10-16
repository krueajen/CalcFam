import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import {
  calculateSurname,
  isValidRussianSurname,
  LETTER_VALUE_GROUPS,
  type SurnameCalculation,
  type SurnameDeclension,
  type SurnameGender,
} from '@/lib/surname-calculation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Choice<T extends string> = {
  value: T;
  label: string;
};

const GENDER_CHOICES: Choice<SurnameGender>[] = [
  { value: 'female', label: 'Женская' },
  { value: 'male', label: 'Мужская' },
];

const DECLENSION_CHOICES: Choice<SurnameDeclension>[] = [
  { value: 'declinable', label: 'Склоняется' },
  { value: 'indeclinable', label: 'Не склоняется' },
];

function ChoiceButton<T extends string>({
  choice,
  selected,
  onPress,
  testID,
}: {
  choice: Choice<T>;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choiceButton,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
      testID={testID}
    >
      {selected ? (
        <Feather
          name="check"
          size={15}
          color={colors.primaryForeground}
          style={styles.choiceIcon}
        />
      ) : null}
      <Text
        style={[
          styles.choiceText,
          { color: selected ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {choice.label}
      </Text>
    </Pressable>
  );
}

function ResultCard({
  result,
  gender,
  declension,
}: {
  result: SurnameCalculation;
  gender: SurnameGender;
  declension: SurnameDeclension;
}) {
  const colors = useColors();

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.resultCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      testID="calculation-result"
    >
      <View style={styles.resultHeading}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>
            ИТОГ РАСЧЁТА
          </Text>
          <Text style={[styles.resultTitle, { color: colors.foreground }]}>
            Число фамилии
          </Text>
        </View>
        <View style={[styles.numberBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.finalNumber, { color: colors.accentForeground }]}>
            {result.finalNumber}
          </Text>
        </View>
      </View>

      <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
        Цифра для каждой буквы
      </Text>
      <View style={styles.letterValues}>
        {result.letters.map((letter, index) => (
          <View
            key={`${letter}-${index}`}
            style={[
              styles.letterValue,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.letterValueLetter, { color: colors.foreground }]}>
              {letter}
            </Text>
            <Text style={[styles.letterValueDigit, { color: colors.primary }]}>
              {result.digits[index]}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.resultDivider, { backgroundColor: colors.border }]} />
      <View style={styles.sumRow}>
        <Text style={[styles.sumLabel, { color: colors.mutedForeground }]}>
          Сумма цифр
        </Text>
        <Text style={[styles.sumValue, { color: colors.foreground }]}>
          {result.rawSum}
        </Text>
      </View>

      {result.baseReductionSteps.map((step, index) => (
        <Text
          key={`base-${index}`}
          style={[styles.calculationStep, { color: colors.mutedForeground }]}
        >
          {step}
        </Text>
      ))}

      {result.adjustmentApplied ? (
        <View style={[styles.ruleNote, { backgroundColor: colors.muted }]}>
          <Feather name="plus-circle" size={16} color={colors.primary} />
          <Text style={[styles.ruleNoteText, { color: colors.foreground }]}>
            Несклоняемая женская фамилия: {result.baseNumber} + 1 ={' '}
            {result.adjustedNumber}
          </Text>
        </View>
      ) : (
        <Text style={[styles.ruleContext, { color: colors.mutedForeground }]}>
          {gender === 'female' && declension === 'declinable'
            ? 'Женская фамилия склоняется — без дополнительной единицы.'
            : gender === 'male'
              ? 'Для мужской фамилии дополнительная единица не добавляется.'
              : ''}
        </Text>
      )}

      {result.finalReductionSteps.map((step, index) => (
        <Text
          key={`final-${index}`}
          style={[styles.calculationStep, { color: colors.mutedForeground }]}
        >
          {step}
        </Text>
      ))}
      <Text style={[styles.rangeNote, { color: colors.mutedForeground }]}>
        Итог от 1 до 22
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [surname, setSurname] = useState('');
  const [gender, setGender] = useState<SurnameGender | null>(null);
  const [declension, setDeclension] = useState<SurnameDeclension | null>(null);
  const [result, setResult] = useState<SurnameCalculation | null>(null);
  const [error, setError] = useState('');
  const [showTable, setShowTable] = useState(false);

  const clearCalculation = () => {
    setResult(null);
    setError('');
  };

  const handleCalculate = () => {
    Keyboard.dismiss();
    if (!isValidRussianSurname(surname)) {
      setError('Введите фамилию русскими буквами. Пробел и дефис можно оставить.');
      setResult(null);
      return;
    }
    if (!gender || !declension) {
      setError('Выберите род фамилии и укажите, склоняется ли она.');
      setResult(null);
      return;
    }

    setError('');
    setResult(calculateSurname(surname, gender, declension));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const topPadding =
    Platform.OS === 'web' ? 67 : Math.max(insets.top, 12) + 10;
  const bottomPadding =
    Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 18);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        bottomOffset={24}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding, paddingBottom: bottomPadding + 28 },
        ]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
        testID="calculator-scroll"
      >
        <View style={styles.content}>
          <View style={styles.brandRow}>
            <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
              <Feather name="hash" size={19} color={colors.primaryForeground} />
            </View>
            <Text style={[styles.brandName, { color: colors.mutedForeground }]}>
              ЧИСЛО ФАМИЛИИ
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Фамилия{'\n'}в цифрах
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Введите фамилию — я переведу её буквы в цифры и посчитаю итог.
          </Text>

          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Фамилия
            </Text>
            <TextInput
              accessibilityLabel="Введите фамилию"
              autoCapitalize="characters"
              autoCorrect={false}
              onChangeText={(value) => {
                setSurname(value);
                clearCalculation();
              }}
              onSubmitEditing={handleCalculate}
              placeholder="Например, Иванова"
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="done"
              selectionColor={colors.primary}
              spellCheck={false}
              style={[
                styles.surnameInput,
                {
                  backgroundColor: colors.background,
                  borderColor: error ? colors.destructive : colors.input,
                  color: colors.foreground,
                },
              ]}
              testID="surname-input"
              value={surname}
            />

            <Text style={[styles.fieldLabel, styles.firstSectionLabel, { color: colors.foreground }]}>
              Род фамилии
            </Text>
            <View style={styles.choiceRow}>
              {GENDER_CHOICES.map((choice) => (
                <ChoiceButton
                  key={choice.value}
                  choice={choice}
                  onPress={() => {
                    setGender(choice.value);
                    clearCalculation();
                  }}
                  selected={gender === choice.value}
                  testID={`gender-${choice.value}`}
                />
              ))}
            </View>

            <Text style={[styles.fieldLabel, styles.sectionLabel, { color: colors.foreground }]}>
              Фамилия склоняется?
            </Text>
            <View style={styles.choiceRow}>
              {DECLENSION_CHOICES.map((choice) => (
                <ChoiceButton
                  key={choice.value}
                  choice={choice}
                  onPress={() => {
                    setDeclension(choice.value);
                    clearCalculation();
                  }}
                  selected={declension === choice.value}
                  testID={`declension-${choice.value}`}
                />
              ))}
            </View>

            {error ? (
              <View
                accessibilityLiveRegion="polite"
                style={styles.errorRow}
                testID="validation-error"
              >
                <Feather name="alert-circle" size={16} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={handleCalculate}
              style={({ pressed }) => [
                styles.calculateButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.84 : 1,
                },
              ]}
              testID="calculate-button"
            >
              <Text
                style={[
                  styles.calculateButtonText,
                  { color: colors.primaryForeground },
                ]}
              >
                Рассчитать
              </Text>
              <Feather
                name="arrow-right"
                size={18}
                color={colors.primaryForeground}
              />
            </Pressable>

            <Text style={[styles.privacyNote, { color: colors.mutedForeground }]}>
              Фамилия используется только для расчёта на этом устройстве.
            </Text>
          </View>

          {result ? (
            <ResultCard
              result={result}
              gender={gender as SurnameGender}
              declension={declension as SurnameDeclension}
            />
          ) : (
            <View style={[styles.emptyHint, { borderColor: colors.border }]}>
              <Feather name="info" size={17} color={colors.primary} />
              <Text style={[styles.emptyHintText, { color: colors.mutedForeground }]}>
                Сначала введите фамилию и выберите оба пункта.
              </Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showTable }}
            onPress={() => setShowTable((current) => !current)}
            style={({ pressed }) => [
              styles.tableToggle,
              { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
            ]}
            testID="letter-table-toggle"
          >
            <View style={styles.tableToggleCopy}>
              <Feather name="grid" size={17} color={colors.primary} />
              <Text style={[styles.tableToggleText, { color: colors.foreground }]}>
                Таблица букв и цифр
              </Text>
            </View>
            <Feather
              name={showTable ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>

          {showTable ? (
            <View
              style={[
                styles.letterTable,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              testID="letter-table"
            >
              {LETTER_VALUE_GROUPS.map((group) => (
                <View
                  key={group.value}
                  style={[styles.letterGroup, { borderBottomColor: colors.border }]}
                >
                  <View style={[styles.groupNumber, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.groupNumberText, { color: colors.primary }]}>
                      {group.value}
                    </Text>
                  </View>
                  <Text style={[styles.groupLetters, { color: colors.foreground }]}>
                    {group.letters}
                  </Text>
                </View>
              ))}
              <Text style={[styles.tableFootnote, { color: colors.mutedForeground }]}>
                Заглавные и строчные буквы считаются одинаково.
              </Text>
            </View>
          ) : null}

          <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
            Если сумма больше 22, вычитаем 22, пока не останется число от 1 до 22.
            Для несклоняемой женской фамилии прибавляется 1.
          </Text>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 4,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 38,
    lineHeight: 43,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: -7,
    maxWidth: 390,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    marginTop: 3,
  },
  fieldLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 9,
  },
  surnameInput: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    fontSize: 17,
    fontWeight: '500',
  },
  firstSectionLabel: {
    marginTop: 19,
  },
  sectionLabel: {
    marginTop: 17,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 9,
  },
  choiceButton: {
    flex: 1,
    minHeight: 47,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  choiceIcon: {
    marginLeft: -2,
  },
  choiceText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 13,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  calculateButton: {
    minHeight: 54,
    borderRadius: 16,
    marginTop: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  privacyNote: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
  },
  emptyHint: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 17,
    paddingVertical: 14,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyHintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 13,
  },
  resultHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sectionEyebrow: {
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1.4,
    fontWeight: '700',
  },
  resultTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    marginTop: 3,
  },
  numberBadge: {
    width: 62,
    height: 62,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalNumber: {
    fontSize: 31,
    fontWeight: '700',
    lineHeight: 38,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  letterValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  letterValue: {
    minWidth: 42,
    height: 48,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
  },
  letterValueLetter: {
    fontSize: 14,
    fontWeight: '600',
  },
  letterValueDigit: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultDivider: {
    height: 1,
    marginVertical: 2,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sumLabel: {
    fontSize: 14,
  },
  sumValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  calculationStep: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -9,
  },
  ruleNote: {
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ruleNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  ruleContext: {
    fontSize: 12,
    lineHeight: 17,
  },
  rangeNote: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: -7,
  },
  tableToggle: {
    minHeight: 53,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableToggleCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tableToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  letterTable: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  letterGroup: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  groupNumber: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  groupLetters: {
    fontSize: 14,
    letterSpacing: 1,
  },
  tableFootnote: {
    fontSize: 11,
    lineHeight: 16,
    paddingVertical: 12,
  },
  footerNote: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 2,
  },
});
