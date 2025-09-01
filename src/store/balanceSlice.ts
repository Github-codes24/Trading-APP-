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
    if (!uid) return; // agar user logged out hai, skip
    await AsyncStorage.setItem(`balance_${uid}`, JSON.stringify(amount));
  } catch (e) {
    console.log("Error saving balance:", e);
  }
};

const balanceSlice = createSlice({
  name: "balance",
  initialState,
  reducers: {
    setBalance: (state, action: PayloadAction<number>) => {
      state.amount = action.payload;
    },
    deposit: (state, action: PayloadAction<number>) => {
      state.amount += action.payload;
      saveBalance(state.amount); // ✅ save per-user balance
    },
    withdraw: (state, action: PayloadAction<number>) => {
      state.amount -= action.payload;
      saveBalance(state.amount); // ✅ save per-user balance
    },
    resetBalance: (state) => {
      state.amount = 0;
      saveBalance(0); // ✅ reset per-user balance
    },
  },
});

export const { setBalance, deposit, withdraw, resetBalance } =
  balanceSlice.actions;
export default balanceSlice.reducer;
