import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import auth from "@react-native-firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface BalanceState {
  amount: number;
}

const initialState: BalanceState = {
  amount: 0,
};

// ✅ Save balance for current user
const saveBalance = async (amount: number) => {
  try {
    const uid = auth().currentUser?.uid;
    if (!uid) return;
    await AsyncStorage.setItem(`balance_${uid}`, JSON.stringify(amount));
  } catch (e) {
    console.log("Error saving balance:", e);
  }
};

// ✅ Load balance for current user
export const loadBalance = async () => {
  try {
    const uid = auth().currentUser?.uid;
    if (!uid) return 0;
    const value = await AsyncStorage.getItem(`balance_${uid}`);
    return value ? JSON.parse(value) : 0;
  } catch (e) {
    console.log("Error loading balance:", e);
    return 0;
  }
};

const balanceSlice = createSlice({
  name: "balance",
  initialState,
  reducers: {
    setBalance: (state, action: PayloadAction<number>) => {
      state.amount = action.payload;
      saveBalance(state.amount);
    },
    deposit: (state, action: PayloadAction<number>) => {
      state.amount += action.payload;
      saveBalance(state.amount);
    },
    withdraw: (state, action: PayloadAction<number>) => {
      state.amount -= action.payload;
      saveBalance(state.amount);
    },
    resetBalance: (state) => {
      state.amount = 0;
      saveBalance(0);
    },
    updateBalanceWithPnl: (state, action: PayloadAction<number>) => {
      state.amount = action.payload; // Directly set the balance with the new value including P/L
      saveBalance(state.amount); // Save the updated balance
    },
  },
});

export const { setBalance, deposit, withdraw, resetBalance, updateBalanceWithPnl } =
  balanceSlice.actions;
export default balanceSlice.reducer;