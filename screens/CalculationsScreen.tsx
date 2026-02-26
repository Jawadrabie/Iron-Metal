import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Share, View, ScrollView, useWindowDimensions, StyleSheet, TouchableOpacity, Text, InteractionManager } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { getFieldConfigForFormula } from '../components/calculations/fieldConfig';
import { DENSITY_GROUPS, DENSITY_UNITS } from '../components/calculations/constants';
import { convertFromKgM3, formatDensity } from '../components/calculations/utils';
import { normalizeNumericInput } from '../components/calculations/numeric';
import { generateEngineeringCalculatorPdf } from '../lib/pdf/generateEngineeringCalculatorPdf';
import { getCurrentUser } from '../lib/auth';

const BANNER_STRINGS = {
  en: {
    mustLoginDownloadPdf: 'You must sign in before downloading the PDF.',
  },
  ar: {
    mustLoginDownloadPdf: 'يجب تسجيل الدخول قبل تنزيل ملف PDF.',
  },
} as const;

const PINNED_CALC_KEY = '@ironmetal:engineering_calc_pinned_id_v1';
const SELECTED_CALC_KEY = '@ironmetal:engineering_calc_selected_id_v1';

const CalculationsScreen = () => {
  const theme = useTheme();
  const styles = useMemo(() => createCalculationsStyles(theme), [theme]);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t, language } = useI18n();
  const calcT = t.calculator;
  const [selectedCalcId, setSelectedCalcId] = useState<number | null>(() => (calculators.length ? calculators[0].id : null));
  const [pinnedCalcId, setPinnedCalcId] = useState<number | null>(null);
  const hydratedCalcSelectionRef = useRef(false);
  const [dims, setDims] = useState<any>({});
  const [qty, setQty] = useState<number>(1);
  const [price, setPrice] = useState<number | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const bannerT = BANNER_STRINGS[language === 'ar' ? 'ar' : 'en'];
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<'success' | 'error' | null>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBanner = useCallback((type: 'success' | 'error', message: string) => {
    setBannerType(type);
    setBannerMessage(message);

    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }

    bannerTimeoutRef.current = setTimeout(() => {
      setBannerMessage(null);
      setBannerType(null);
      bannerTimeoutRef.current = null;
    }, 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
    };
  }, []);

  const shareFailedTitle = language === 'ar' ? 'فشل المشاركة' : 'Share failed';
  const shareFailedBody = language === 'ar' ? 'تعذر فتح نافذة المشاركة.' : 'Unable to open share sheet.';
  const downloadFailedTitle = language === 'ar' ? 'فشل التحميل' : 'Download failed';
  const downloadFailedBody = language === 'ar' ? 'تعذر إنشاء ملف PDF. حاول مرة أخرى.' : 'Unable to generate PDF. Please try again.';

  const currencyCode = useCurrencyCode()

  const { picker, openPickerFromNode, closePicker } = useAnchoredPicker({
    screenWidth,
    screenHeight,
  })

  const selectedCalc = calculators.find((c) => c.id === selectedCalcId);

  // Handle Deep Link
  const deepLinkCalcId = route.params?.calcId;
  const deepLinkCalcInputs = route.params?.calcInputs;
  const deepLinkHandledRef = useRef(false);
  const skipResetRef = useRef(false);

  useEffect(() => {
    if (deepLinkCalcId != null && !deepLinkHandledRef.current) {
      deepLinkHandledRef.current = true;
      hydratedCalcSelectionRef.current = true; // Prevent storage overwrite

      const target = Number(deepLinkCalcId);
      if (Number.isFinite(target) && calculators.some((c) => c.id === target)) {
        skipResetRef.current = true;

        // Apply deep-link inputs BEFORE switching the calculator so the form
        // mounts with the right initial values.
        if (deepLinkCalcInputs && typeof deepLinkCalcInputs === 'object') {
          try {
            const nextDims: any = {}
            let nextQty: number | null = null
            let nextPrice: number | null = null

            for (const [key, raw] of Object.entries(deepLinkCalcInputs)) {
              if (key === 'qty') {
                const n = typeof raw === 'number' ? raw : Number(raw)
                if (Number.isFinite(n) && n > 0) nextQty = Math.floor(n)
                continue
              }

              if (key === 'price') {
                const n = typeof raw === 'number' ? raw : Number(raw)
                if (Number.isFinite(n) && n > 0) nextPrice = n
                continue
              }

              // TextInput expects strings. If we pass numbers, the field may render empty.
              if (typeof raw === 'number') {
                nextDims[key] = Number.isFinite(raw) ? String(raw) : ''
                continue
              }

              // Keep booleans/strings as-is (booleans are used for toggles like includeRadius)
              nextDims[key] = raw as any
            }

            if (nextQty != null) setQty(nextQty)
            if (nextPrice != null) setPrice(nextPrice)
            setDims(nextDims)
            console.log('[deep-link] engineering calculator prefill applied', {
              calcId: target,
              dimsKeys: Object.keys(nextDims),
              qty: nextQty,
              price: nextPrice,
            })
          } catch (e) {
            console.warn('[deep-link] failed to apply engineering calcInputs', e)
          }
        }

        setSelectedCalcId(target);
      }
      // clear params so we don't re-trigger on remount if unnecessary
      navigation.setParams({ calcId: undefined, calcInputs: undefined });
    }
  }, [deepLinkCalcId, deepLinkCalcInputs, navigation]);

  useEffect(() => {
    if (hydratedCalcSelectionRef.current) return;
    hydratedCalcSelectionRef.current = true;

    let isMounted = true;
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const entries = await AsyncStorage.multiGet([PINNED_CALC_KEY, SELECTED_CALC_KEY]);
        if (!isMounted) return;

        const pinnedRaw = entries.find(([key]) => key === PINNED_CALC_KEY)?.[1];
        const selectedRaw = entries.find(([key]) => key === SELECTED_CALC_KEY)?.[1];

        const exists = (id: number) => calculators.some((c) => c.id === id);

        if (pinnedRaw != null) {
          const parsed = Number(pinnedRaw);
          if (!Number.isNaN(parsed) && exists(parsed)) {
            setPinnedCalcId(parsed);
            if (parsed !== selectedCalcId) {
              setSelectedCalcId(parsed);
            }
            return;
          }

          setPinnedCalcId(null);
          AsyncStorage.removeItem(PINNED_CALC_KEY).catch(() => undefined);
        }

        if (selectedRaw != null) {
          const parsed = Number(selectedRaw);
          if (!Number.isNaN(parsed) && exists(parsed) && parsed !== selectedCalcId) {
            setSelectedCalcId(parsed);
          }
        }
      } catch {
        // ignore
      }
    });

    return () => {
      isMounted = false;
      task?.cancel?.();
    };
  }, []);

  useEffect(() => {
    if (selectedCalcId == null) return;

    const task = InteractionManager.runAfterInteractions(() => {
      AsyncStorage.setItem(SELECTED_CALC_KEY, String(selectedCalcId)).catch(() => undefined);
    });

    return () => {
      task?.cancel?.();
    };
  }, [selectedCalcId]);

  const togglePinnedCalc = useCallback(
    (calcId: number) => {
      setPinnedCalcId((current) => {
        const nextPinned = current === calcId ? null : calcId;

        InteractionManager.runAfterInteractions(() => {
          const action =
            nextPinned == null
              ? AsyncStorage.removeItem(PINNED_CALC_KEY)
              : AsyncStorage.setItem(PINNED_CALC_KEY, String(nextPinned));

          action.catch(() => undefined);
        });

        if (nextPinned != null && calcId !== selectedCalcId) {
          setSelectedCalcId(calcId);
        }

        return nextPinned;
      });
    },
    [selectedCalcId],
  );

  const selectedCalcLabelEn = useMemo(() => {
    if (!selectedCalc) return '';
    return String(selectedCalc.label || '').trim();
  }, [selectedCalc]);

  const getEnglishTitle = useCallback((raw: string) => {
    const s = String(raw || '').trim();
    if (!s) return '';
    const match = s.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
    if (!match) return s;
    const en = String(match[2] || '').trim();
    return en || s;
  }, []);

  const getDefaultUnitForKey = useCallback((key: string) => {
    if (!selectedCalc) return 'mm';
    if (key === 'h') return 'm';
    if (
      key === 'tf' &&
      (selectedCalc.formula === 'steel_grating' ||
        selectedCalc.formula === 'wire_mesh' ||
        selectedCalc.formula === 'expanded_metal')
    ) {
      return 'm';
    }
    return 'mm';
  }, [selectedCalc]);

  const getUnitForKey = useCallback(
    (key: string) => {
      const u = dims?.[`${key}_unit`];
      if (u === 'mm' || u === 'm' || u === 'ft' || u === 'in') return u;
      return getDefaultUnitForKey(key);
    },
    [dims, getDefaultUnitForKey],
  );

  const shouldShowUnitForKey = useCallback(
    (key: string) => {
      if (!selectedCalc) return true;
      if (selectedCalc.formula === 'flange_ring' && key === 'r') return false;
      if (
        (selectedCalc.formula === 'expanded_metal' &&
          dims.calcMode === 'weight' &&
          (key === 'tf' || key === 'h')) ||
        ((selectedCalc.formula === 'steel_grating' || selectedCalc.formula === 'wire_mesh') &&
          dims.calcMode === 'weight' &&
          key === 'tw')
      ) {
        return false;
      }
      return true;
    },
    [dims.calcMode, selectedCalc],
  );

  const getDensityDisplay = useCallback(() => {
    const groupLabel = String(dims?.densityGroup || 'Steel & Iron');
    const materialLabel = String(dims?.densityMaterial || 'Carbon Steel');
    const unit = String(dims?.densityUnit || 'kg_m3');

    const group = DENSITY_GROUPS.find((g) => g.label === groupLabel) || DENSITY_GROUPS[0];
    const material = group.items.find((m) => m.label === materialLabel) || group.items[0];
    const densityKgM3 = material?.value ?? 7850;

    const unitLabel = DENSITY_UNITS.find((u) => u.value === unit)?.label || 'kg/m³';
    const v = formatDensity(convertFromKgM3(densityKgM3, unit), unit);

    return {
      groupLabel: group.label,
      materialLabel: material.label,
      densityText: `${v} ${unitLabel}`.trim(),
    };
  }, [dims?.densityGroup, dims?.densityMaterial, dims?.densityUnit]);

  const shareMessage = useMemo(() => {
    if (!results) return '';

    const lines: string[] = [];

    if (selectedCalcLabelEn) {
      lines.push(selectedCalcLabelEn);
    }

    const density = getDensityDisplay();
    const fields = selectedCalc ? getFieldConfigForFormula(selectedCalc.formula, dims) : [];

    lines.push('Inputs:');
    lines.push(`- Material Group: ${density.groupLabel}`);
    lines.push(`- Material: ${density.materialLabel}`);
    lines.push(`- Density: ${density.densityText}`);

    fields.forEach((f) => {
      const rawVal = dims?.[f.key];
      const normalized = normalizeNumericInput(rawVal);
      const unitText = shouldShowUnitForKey(f.key) ? ` ${getUnitForKey(f.key)}` : '';
      const name = getEnglishTitle(f.title || f.label || f.key);
      const symbol = f.label ? ` (${String(f.label).trim()})` : '';
      lines.push(`- ${name}${symbol}: ${normalized}${unitText}`.trim());
    });

    lines.push(`- Quantity: ${qty}`);
    lines.push(
      `- Price / Kg: ${typeof price === 'number' ? price.toFixed(2) : '—'}${currencyCode ? ` ${currencyCode}` : ''}`,
    );

    lines.push('');
    lines.push('Results:');
    lines.push(`- 📏 Weight / Meter: ${results.unitWeightPerMeter} kg/m`);
    lines.push(`- 📦 Piece Weight: ${results.pieceWeight} kg`);
    lines.push(`- ⚖️ Total Weight: ${results.totalWeight} kg`);
    lines.push(`- $ Total Price: ${results.totalPrice}${currencyCode ? ` ${currencyCode}` : ''}`);

    return lines.join('\n');
  }, [
    currencyCode,
    dims,
    getDensityDisplay,
    getEnglishTitle,
    getUnitForKey,
    price,
    qty,
    results,
    selectedCalc,
    selectedCalcLabelEn,
    bannerT.mustLoginDownloadPdf,
    showBanner,
    shouldShowUnitForKey,
  ]);

  const handleShare = useCallback(async () => {
    if (!results) return;
    try {
      await Share.share({
        message: shareMessage,
        title: 'Calculator',
      });
    } catch {
      Alert.alert(shareFailedTitle, shareFailedBody);
    }
  }, [results, shareFailedBody, shareFailedTitle, shareMessage]);

  const handleDownloadPdf = useCallback(async () => {
    if (!results || !selectedCalc) return;
    if (isGeneratingPdf) return;

    try {
      const { user } = await getCurrentUser();
      if (!user) {
        showBanner('error', bannerT.mustLoginDownloadPdf);
        return;
      }
    } catch {
      showBanner('error', bannerT.mustLoginDownloadPdf);
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const density = getDensityDisplay();
      const fields = getFieldConfigForFormula(selectedCalc.formula, dims);

      const rows: any[] = [];
      rows.push({ type: 'section', label: 'Inputs' });
      rows.push({ type: 'row', label: 'Material Group', value: density.groupLabel });
      rows.push({ type: 'row', label: 'Material', value: density.materialLabel });
      rows.push({ type: 'row', label: 'Density', value: density.densityText });

      fields.forEach((f) => {
        const rawVal = dims?.[f.key];
        const normalized = normalizeNumericInput(rawVal);
        const unitText = shouldShowUnitForKey(f.key) ? ` ${getUnitForKey(f.key)}` : '';
        const name = getEnglishTitle(f.title || f.label || f.key);
        const symbol = f.label ? ` (${String(f.label).trim()})` : '';
        rows.push({ type: 'row', label: `${name}${symbol}`.trim(), value: `${normalized}${unitText}`.trim() });
      });

      rows.push({ type: 'row', label: 'Quantity', value: String(qty) });
      rows.push({
        type: 'row',
        label: 'Price / Kg',
        value: `${typeof price === 'number' ? price.toFixed(2) : '—'}${currencyCode ? ` ${currencyCode}` : ''}`,
      });

      rows.push({ type: 'section', label: 'Results' });
      rows.push({ type: 'row', label: 'Weight / Meter', value: `${results.unitWeightPerMeter} kg/m` });
      rows.push({ type: 'row', label: 'Piece Weight', value: `${results.pieceWeight} kg` });
      rows.push({ type: 'row', label: 'Total Weight', value: `${results.totalWeight} kg` });
      rows.push({
        type: 'row',
        label: 'Total Price',
        value: `${results.totalPrice}${currencyCode ? ` ${currencyCode}` : ''}`,
      });

      const uri = await generateEngineeringCalculatorPdf({
        title: selectedCalcLabelEn || 'Engineering Calculator',
        subtitle: 'Engineering Calculator',
        currencyCode,
        fileBaseName: selectedCalcLabelEn || 'Engineering_Calculator',
        sectorImg: selectedCalc.symbol ?? selectedCalc.svgImg ?? null,
        rows,
        calcId: selectedCalc.id,
        dims,
      });

      let canShare = false;
      try {
        canShare = await Sharing.isAvailableAsync();
      } catch {
        canShare = false;
      }

      if (canShare && !uri.startsWith('data:')) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share calculator PDF',
        } as any);
      } else {
        await Linking.openURL(uri);
      }
    } catch {
      Alert.alert(downloadFailedTitle, downloadFailedBody);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [
    currencyCode,
    dims,
    downloadFailedBody,
    downloadFailedTitle,
    getDensityDisplay,
    getEnglishTitle,
    getUnitForKey,
    isGeneratingPdf,
    price,
    qty,
    results,
    selectedCalc,
    selectedCalcLabelEn,
    shouldShowUnitForKey,
  ]);

  useEffect(() => {
    if (selectedCalcId == null) return
    if (skipResetRef.current) {
      skipResetRef.current = false
      return
    }
    setDims({})
    setQty(1)
    setPrice(null)
    setResults(null)
    closePicker()
  }, [selectedCalcId])

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {bannerMessage && (
        <View
          style={[
            bannerStyles.banner,
            bannerType === 'success' ? bannerStyles.bannerSuccess : bannerStyles.bannerError,
            theme.isDark
              ? {
                backgroundColor:
                  bannerType === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                borderColor: theme.colors.border,
                borderWidth: 1,
              }
              : null,
          ]}
        >
          <Feather
            name={bannerType === 'success' ? 'check-circle' : 'alert-circle'}
            size={16}
            color={
              bannerType === 'success'
                ? theme.isDark
                  ? theme.colors.success
                  : '#16A34A'
                : theme.isDark
                  ? theme.colors.error
                  : '#E50F0F'
            }
          />
          <Text
            style={[
              bannerStyles.bannerText,
              bannerType === 'error' && bannerStyles.bannerTextError,
              theme.isDark ? { color: theme.colors.text } : null,
            ]}
          >
            {bannerMessage}
          </Text>
        </View>
      )}
      <View style={[headerStyles.header, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
        <TouchableOpacity
          style={headerStyles.backButton}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather name="chevron-left" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[headerStyles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {calcT.engineeringTitle}
        </Text>
        <View style={headerStyles.spacer} />
      </View>

      <CalculatorTypeStrip
        calculators={calculators}
        selectedCalcId={selectedCalcId}
        pinnedCalcId={pinnedCalcId}
        onSelect={setSelectedCalcId}
        onTogglePin={togglePinnedCalc}
        styles={styles}
        theme={theme}
      />
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
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
          onShare={handleShare}
          onDownloadPdf={handleDownloadPdf}
          isGeneratingPdf={isGeneratingPdf}
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

const headerStyles = StyleSheet.create({
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'left',
  },
  spacer: {
    width: 40,
    height: 40,
  },
});

const bannerStyles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 32,
    alignSelf: 'center',
    zIndex: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    gap: 8,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(22,163,74,0.08)',
  },
  bannerError: {
    backgroundColor: 'rgba(231, 18, 18, 0.2)',
  },
  bannerText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
  },
  bannerTextError: {
    color: '#cc1717ff',
  },
});
