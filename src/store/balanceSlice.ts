import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface BalanceState {
  amount: number;
}

const initialState: BalanceState = {
  amount: 0,
};

const balanceSlice = createSlice({
  name: "balance",
  initialState,
  reducers: {
    deposit: (state, action: PayloadAction<number>) => {
      state.amount += action.payload;
    },
    withdraw: (state, action: PayloadAction<number>) => {
      state.amount -= action.payload;
    },
  },
});

export const { deposit, withdraw } = balanceSlice.actions;
export default balanceSlice.reducer;
