import React, { useState } from "react"
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useTheme } from "../../contexts/ThemeContext"

export type BasicCalculatorModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function BasicCalculatorModal({ isOpen, onClose }: BasicCalculatorModalProps) {
  const theme = useTheme()
  const isDark = theme.isDark

  const [display, setDisplay] = useState("0")
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === "0" ? digit : display + digit)
    }
  }

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.")
      setWaitingForOperand(false)
    } else if (!display.includes(".")) {
      setDisplay(display + ".")
    }
  }

  const clear = () => {
    setDisplay("0")
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
  }

  const calculate = (firstValue: number, secondValue: number, op: string): number => {
    switch (op) {
      case "+":
        return firstValue + secondValue
      case "-":
        return firstValue - secondValue
      case "*":
        return firstValue * secondValue
      case "/":
        return firstValue / secondValue
      case "=":
        return secondValue
      default:
        return secondValue
    }
  }

  const performOperation = (nextOperation: string) => {
    const inputValue = Number.parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)
      setDisplay(String(newValue))
      setPreviousValue(newValue)
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
  }

  const buttons: string[][] = [
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["0", ".", "=", "+"],
  ]

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, isDark ? { backgroundColor: "rgba(0,0,0,0.55)" } : null]}>
        <View
          style={[
            styles.container,
            isDark
              ? {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }
              : null,
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrapper}>
              <Text style={[styles.headerIcon, isDark ? { color: theme.colors.secondary } : null]}>≡</Text>
              <Text style={[styles.headerTitle, isDark ? { color: theme.colors.text } : null]}>Calculator</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.headerCloseButton}>
              <Text style={[styles.headerCloseText, isDark ? { color: theme.colors.textSecondary } : null]}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.displayWrapper, isDark ? { backgroundColor: theme.colors.surface2 } : null]}>
            <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
              {display}
            </Text>
          </View>

          <TouchableOpacity style={styles.clearButton} onPress={clear}>
            <Text style={styles.clearButtonText}>C</Text>
          </TouchableOpacity>

          {buttons.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.buttonRow}>
              {row.map((btn) => {
                const isOperator = ["+", "-", "*", "/", "="].includes(btn)
                return (
                  <TouchableOpacity
                    key={btn}
                    style={[
                      styles.button,
                      isOperator
                        ? [
                            styles.opButton,
                            isDark ? { backgroundColor: theme.colors.secondary } : null,
                          ]
                        : [
                            styles.numButton,
                            isDark
                              ? {
                                  backgroundColor: theme.colors.surface2,
                                  borderColor: theme.colors.border,
                                  borderWidth: 1,
                                }
                              : null,
                          ],
                    ]}
                    onPress={() => {
                      if (btn === "=") {
                        performOperation("=")
                      } else if (["+", "-", "*", "/"].includes(btn)) {
                        performOperation(btn)
                      } else if (btn === ".") {
                        inputDecimal()
                      } else {
                        inputDigit(btn)
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isDark && !isOperator ? { color: theme.colors.text } : null,
                        isOperator && styles.opButtonText,
                      ]}
                    >
                      {btn}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  container: {
    width: "90%",
    maxWidth: 300,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIcon: {
    fontSize: 18,
    color: "#ff6a00",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  headerCloseButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  headerCloseText: {
    fontSize: 20,
    color: "#4b5563",
  },
  displayWrapper: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    alignItems: "flex-end",
  },
  displayText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "600",
  },
  clearButton: {
    backgroundColor: "#ef4444",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  clearButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  numButton: {
    backgroundColor: "#e5e7eb",
  },
  opButton: {
    backgroundColor: "#ff6a00",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  opButtonText: {
    color: "#ffffff",
  },
})
