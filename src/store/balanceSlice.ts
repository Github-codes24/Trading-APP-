import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import auth from "@react-native-firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface BalanceState {
  amount: number;
  pnL: number;
}

const initialState: BalanceState = {
  amount: 0,
  pnL: 0,
};

// Utility to format number as USD
const formatAsUSD = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

// Save balance and P&L for current user
const saveBalance = async (amount: number, pnL: number) => {
  try {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      console.warn("No user logged in, skipping saveBalance");
      return;
    }
    // Ensure amount and pnL are valid numbers and non-negative
    const safeAmount = isNaN(amount) ? 0 : Math.max(0, amount);
    const safePnL = isNaN(pnL) ? 0 : Math.max(0, Math.min(pnL, safeAmount));
    await AsyncStorage.setItem(`balance_${uid}`, JSON.stringify({ amount: safeAmount, pnL: safePnL }));
    console.log(`Saved balance: ${safeAmount}, pnL: ${safePnL} for user ${uid}`);
  } catch (e) {
    console.error("Error saving balance:", e);
  }
};

// Load balance and P&L for current user
export const loadBalance = async (): Promise<BalanceState> => {
  try {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      console.warn("No user logged in, returning default balance");
      return { amount: 0, pnL: 0 };
    }
    const value = await AsyncStorage.getItem(`balance_${uid}`);
    if (!value) {
      console.log(`No balance found for user ${uid}, returning default`);
      return { amount: 0, pnL: 0 };
    }

    try {
      const parsed = JSON.parse(value);
      // Validate that amount and pnL are numbers, default to 0 if invalid
      const safeAmount = typeof parsed.amount === "number" && !isNaN(parsed.amount) ? Math.max(0, parsed.amount) : 0;
      const safePnL = typeof parsed.pnL === "number" && !isNaN(parsed.pnL) ? Math.max(0, Math.min(parsed.pnL, safeAmount)) : 0;
      console.log(`Loaded balance: ${safeAmount}, pnL: ${safePnL} for user ${uid}`);
      return { amount: safeAmount, pnL: safePnL };
    } catch (parseError) {
      console.error("Error parsing balance:", parseError);
      return { amount: 0, pnL: 0 };
    }
  } catch (e) {
    console.error("Error loading balance:", e);
    return { amount: 0, pnL: 0 };
  }
};

const balanceSlice = createSlice({
  name: "balance",
  initialState,
  reducers: {
    setBalance: (state, action: PayloadAction<number>) => {
      // Ensure payload is a valid number, default to 0 if NaN
      const newAmount = isNaN(action.payload) ? 0 : Math.max(0, action.payload);
      state.amount = newAmount;
      state.pnL = Math.max(0, Math.min(state.pnL, state.amount)); // Adjust P&L
      console.log(`setBalance: amount=${state.amount}, pnL=${state.pnL}`);
      saveBalance(state.amount, state.pnL);
    },
    deposit: (state, action: PayloadAction<number>) => {
      // Ensure payload is a valid number, default to 0 if NaN
      const depositAmount = isNaN(action.payload) ? 0 : Math.max(0, action.payload);
      state.amount += depositAmount;
      state.pnL = Math.max(0, Math.min(state.pnL, state.amount)); // Adjust P&L
      console.log(`deposit: amount=${state.amount}, pnL=${state.pnL}, deposited=${depositAmount}`);
      saveBalance(state.amount, state.pnL);
    },
    withdraw: (state, action: PayloadAction<number>) => {
      // Ensure payload is a valid number, default to 0 if NaN
      const withdrawAmount = isNaN(action.payload) ? 0 : Math.max(0, action.payload);
      state.amount = Math.max(0, state.amount - withdrawAmount);
      state.pnL = Math.max(0, Math.min(state.pnL, state.amount)); // Adjust P&L
      console.log(`withdraw: amount=${state.amount}, pnL=${state.pnL}, withdrawn=${withdrawAmount}`);
      saveBalance(state.amount, state.pnL);
    },
    updatePnL: (state, action: PayloadAction<number>) => {
      // Ensure payload is a valid number, default to 0 if NaN
      const newPnL = isNaN(action.payload) ? 0 : action.payload;
      // Apply P&L to balance (positive increases, negative decreases)
      state.amount = Math.max(0, state.amount + newPnL);
      // Store P&L as non-negative, capped at balance
      state.pnL = Math.max(0, Math.min(Math.abs(newPnL), state.amount));
      console.log(`updatePnL: amount=${state.amount}, pnL=${state.pnL}, inputPnL=${newPnL}`);
      saveBalance(state.amount, state.pnL);
    },
    resetBalance: (state) => {
      state.amount = 0;
      state.pnL = 0;
      console.log("resetBalance: amount=0, pnL=0");
      saveBalance(0, 0);
    },
  },
});

export const { setBalance, deposit, withdraw, updatePnL, resetBalance } = balanceSlice.actions;
export default balanceSlice.reducer;

// Export USD formatter for use in components
export { formatAsUSD };