import React, { useEffect, useState } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import calculators from '../assets/data/calculators.json';
import { createCalculationsStyles } from '../components/calculations/styles';
import { PickerPopover } from '../components/calculations/PickerPopover';
import { useAnchoredPicker } from '../components/calculations/useAnchoredPicker';
import { useCurrencyCode } from '../components/calculations/useCurrencyCode';
import { CalculatorTypeStrip } from '../components/calculations/CalculatorTypeStrip';
import { CalculationsFormSection } from '../components/calculations/CalculationsFormSection';
import { CalculationResultsPanel } from '../components/calculations/CalculationResultsPanel';
import type { CalculationResults } from '../components/calculations/types';

const CalculationsScreen = () => {
  const theme = useTheme();
  const styles = createCalculationsStyles(theme);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { t } = useI18n();
  const calcT = t.calculator;
  const [selectedCalcId, setSelectedCalcId] = useState<number | null>(null);
  const [dims, setDims] = useState<any>({});
  const [qty, setQty] = useState<number>(1);
  const [price, setPrice] = useState<number | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);

  const currencyCode = useCurrencyCode()

  const { picker, openPickerFromNode, closePicker } = useAnchoredPicker({
    screenWidth,
    screenHeight,
  })

  const selectedCalc = calculators.find((c) => c.id === selectedCalcId);

  useEffect(() => {
    if (calculators.length > 0) {
      setSelectedCalcId(calculators[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedCalcId == null) return
    setDims({})
    setQty(1)
    setPrice(null)
    setResults(null)
    closePicker()
  }, [selectedCalcId])

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CalculatorTypeStrip
        calculators={calculators}
        selectedCalcId={selectedCalcId}
        onSelect={setSelectedCalcId}
        styles={styles}
        theme={theme}
      />
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {selectedCalc && (
          <CalculationsFormSection
            key={selectedCalcId}
            selectedCalc={selectedCalc}
            dims={dims}
            setDims={setDims}
            qty={qty}
            setQty={setQty}
            price={price}
            setPrice={setPrice}
            setResults={setResults}
            openPickerFromNode={openPickerFromNode}
            closePicker={closePicker}
            styles={styles}
            theme={theme}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
            calcT={calcT}
            currencyCode={currencyCode}
          />
        )}
        <CalculationResultsPanel
          results={results}
          styles={styles}
          theme={theme}
          calcT={calcT}
          currencyCode={currencyCode}
        />
      </ScrollView>

      <PickerPopover
        picker={picker}
        theme={theme}
        styles={styles}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
        onClose={closePicker}
      />
    </View>
  );
};

export default CalculationsScreen;
